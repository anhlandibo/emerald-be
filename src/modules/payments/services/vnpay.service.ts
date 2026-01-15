import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface VNPayPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
  returnUrl: string;
  ipnUrl: string;
  ipAddr: string;
}

export interface VNPayPaymentResponse {
  payUrl: string;
}

@Injectable()
export class VNPayService {
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly endpoint: string;

  constructor() {
    this.tmnCode = process.env.VNPAY_TMN_CODE || '';
    this.hashSecret = process.env.VNPAY_HASH_SECRET || '';
    this.endpoint =
      process.env.VNPAY_ENDPOINT ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  }

  createPayment(request: VNPayPaymentRequest): VNPayPaymentResponse {
    const { orderId, amount, orderInfo, returnUrl, ipAddr } = request;

    const createDate = this.formatDate(new Date());
    const expireDate = this.formatDate(new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes

    let vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPay requires amount in smallest unit (VND * 100)
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Sort params
    vnpParams = this.sortObject(vnpParams);

    const signData = new URLSearchParams(vnpParams).toString();
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams.vnp_SecureHash = signed;

    const payUrl =
      this.endpoint + '?' + new URLSearchParams(vnpParams).toString();

    return { payUrl };
  }

  verifySignature(vnpParams: any): boolean {
    // Deep clone to avoid modifying original
    const params = { ...vnpParams };

    const secureHash = params.vnp_SecureHash;
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const sortedParams = this.sortObject(params);

    // Build sign data manually to avoid double encoding
    // URLSearchParams will re-encode already-encoded values
    const signDataArray = Object.keys(sortedParams).map(
      (key) => `${key}=${sortedParams[key]}`,
    );
    const signData = signDataArray.join('&');

    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Debug logging
    const isValid = secureHash === signed;
    if (!isValid) {
      console.log('[VNPay Debug] Signature verification failed');
      console.log(
        '[VNPay] Hash Secret:',
        this.hashSecret?.substring(0, 10) + '...',
      );
      console.log(
        '[VNPay] Received Hash:',
        secureHash?.substring(0, 20) + '...',
      );
      console.log('[VNPay] Calculated Hash:', signed?.substring(0, 20) + '...');
      console.log('[VNPay] Sign Data:', signData);
    }
    return isValid;
  }

  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}
