/* eslint-disable prefer-const */
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface MoMoPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  requestId: string;
}

export interface MoMoPaymentResponse {
  payUrl: string;
  qrCodeUrl?: string;
}

@Injectable()
export class MoMoService {
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly endpoint: string;
  private readonly isConfigured: boolean;

  constructor() {
    this.partnerCode = process.env.MOMO_PARTNER_CODE || '';
    this.accessKey = process.env.MOMO_ACCESS_KEY || '';
    this.secretKey = process.env.MOMO_SECRET_KEY || '';
    this.endpoint =
      process.env.MOMO_ENDPOINT ||
      'https://test-payment.momo.vn/v2/gateway/api/create';

    // Check if MoMo is properly configured
    this.isConfigured = !!(
      this.partnerCode &&
      this.accessKey &&
      this.secretKey
    );
  }

  /**
   * Check if MoMo gateway is available (credentials configured)
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  async createPayment(
    request: MoMoPaymentRequest,
  ): Promise<MoMoPaymentResponse> {
    if (!this.isConfigured) {
      throw new Error(
        'MoMo chưa được cấu hình. Vui lòng thêm MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY vào file .env',
      );
    }

    const { orderId, amount, orderInfo, redirectUrl, ipnUrl, requestId } =
      request;

    const requestType = 'payWithMethod';
    const extraData = '';
    const orderGroupId = '';
    const autoCapture = true;
    const lang = 'vi';

    // Create signature
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: 'Emerald Building',
      storeId: 'EmeraldStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      orderGroupId,
      signature,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      // Debug logging
      console.log('[MoMo] Request:', {
        partnerCode: this.partnerCode,
        accessKey: this.accessKey?.substring(0, 10) + '...',
        secretKey: this.secretKey?.substring(0, 10) + '...',
        orderId,
        amount,
      });
      console.log('[MoMo] Response:', result);

      if (result.resultCode !== 0) {
        throw new Error(
          `MoMo payment creation failed: ${result.message || 'Unknown error'}`,
        );
      }

      return {
        payUrl: result.payUrl,
        qrCodeUrl: result.qrCodeUrl,
      };
    } catch (error) {
      console.error('MoMo API Error:', error);
      throw error;
    }
  }

  verifySignature(data: any): boolean {
    // Destructure directly from data (doesn't modify original)
    let {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = data;

    // MoMo calculates signature using DECODED values
    // If we received URL-encoded values, we must decode them first
    const decodeIfEncoded = (str: string) => {
      if (typeof str !== 'string') return str;
      // Check if it's URL-encoded (contains % or +)
      if (str.includes('%') || str.includes('+')) {
        try {
          // Replace + with space (URL encoding) then decode
          return decodeURIComponent(str.replace(/\+/g, ' '));
        } catch (e) {
          return str;
        }
      }
      return str;
    };

    // Decode all values
    orderInfo = decodeIfEncoded(orderInfo);
    message = decodeIfEncoded(message);
    extraData = extraData ? decodeIfEncoded(extraData) : '';

    // Convert undefined/null to empty string for extraData
    const safeExtraData =
      extraData === undefined || extraData === null ? '' : extraData;

    // Now use DECODED values for signature calculation (as MoMo did)
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${safeExtraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const calculatedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Debug logging
    const isValid = signature === calculatedSignature;
    console.log('[MoMo] Signature Verification:', {
      isValid,
      receivedSignature: signature?.substring(0, 20) + '...',
      calculatedSignature: calculatedSignature?.substring(0, 20) + '...',
      decodedOrderInfo: orderInfo,
      decodedMessage: message,
    });

    if (!isValid) {
      console.log(
        '[MoMo] SIGNATURE MISMATCH - Full Raw Signature (with DECODED values):',
      );
      console.log(rawSignature);
      console.log('[MoMo] Received Signature:', signature);
      console.log('[MoMo] Calculated Signature:', calculatedSignature);
    }

    return isValid;
  }
}
