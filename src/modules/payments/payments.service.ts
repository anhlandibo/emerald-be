import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentTargetType } from './enums/payment-target-type.enum';
import { PaymentGateway } from './enums/payment-gateway.enum';
import { MoMoService } from './services/momo.service';
import { VNPayService } from './services/vnpay.service';
import { InvoiceStatus } from '../invoices/enums/invoice-status.enum';
import { BookingStatus } from '../bookings/enums/booking-status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentRepository: Repository<PaymentTransaction>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly momoService: MoMoService,
    private readonly vnpayService: VNPayService,
  ) {}

  async createPayment(accountId: number, createPaymentDto: CreatePaymentDto) {
    const { targetType, targetId, paymentMethod } = createPaymentDto;

    // Validate target exists and get amount
    let amount: number;
    let description: string;

    if (targetType === PaymentTargetType.INVOICE) {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: targetId },
        relations: ['apartment'],
      });

      if (!invoice) {
        throw new NotFoundException('Hóa đơn không tồn tại');
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new BadRequestException('Hóa đơn đã được thanh toán');
      }

      amount = Number(invoice.totalAmount);
      description = `Thanh toan hoa don ${invoice.invoiceCode} - ${invoice.apartment?.name || 'Can ho'}`;
    } else if (targetType === PaymentTargetType.BOOKING) {
      const booking = await this.bookingRepository.findOne({
        where: { id: targetId },
        relations: ['service'],
      });

      if (!booking) {
        throw new NotFoundException('Booking khong ton tai');
      }

      if (
        booking.status === BookingStatus.PAID ||
        booking.status === BookingStatus.COMPLETED
      ) {
        throw new BadRequestException('Booking da duoc thanh toan');
      }

      amount = Number(booking.totalPrice);
      description = `Thanh toan booking ${booking.code} - ${booking.service?.name || 'Dich vu'}`;
    } else {
      throw new BadRequestException('Loại thanh toán không hợp lệ');
    }

    // Generate unique txnRef
    const txnRef = this.generateTxnRef(targetType, targetId);

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: { txnRef },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Đã có giao dịch thanh toán thành công');
    }

    // Create payment record
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const payment = this.paymentRepository.create({
      txnRef,
      targetType,
      targetId,
      accountId,
      amount,
      currency: 'VND',
      paymentMethod,
      status: PaymentStatus.PENDING,
      description,
      expiresAt,
      retryCount: existingPayment ? existingPayment.retryCount + 1 : 0,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Generate payment URL based on gateway
    let paymentUrl: string;

    try {
      if (paymentMethod === PaymentGateway.MOMO) {
        if (!this.momoService.isAvailable()) {
          throw new BadRequestException(
            'Cổng thanh toán MoMo chưa được cấu hình. Vui lòng sử dụng VNPay hoặc liên hệ quản trị viên.',
          );
        }
        const momoResult = await this.momoService.createPayment({
          orderId: txnRef,
          amount: amount,
          orderInfo: description,
          redirectUrl: `${process.env.FRONTEND_URL}/payments/result`,
          ipnUrl: `${process.env.BACKEND_URL}/api/v1/payments/webhook/momo`,
          requestId: `${txnRef}_${Date.now()}`,
        });
        paymentUrl = momoResult.payUrl;
      } else if (paymentMethod === PaymentGateway.VNPAY) {
        const ipnUrl = `${process.env.BACKEND_URL}/api/v1/payments/webhook/vnpay`;
        console.log('[Payment] Creating VNPay payment with IPN URL:', ipnUrl);

        const vnpayResult = this.vnpayService.createPayment({
          orderId: txnRef,
          amount: amount,
          orderInfo: description,
          returnUrl: `${process.env.FRONTEND_URL}/payments/result`,
          ipnUrl: ipnUrl,
          ipAddr: '127.0.0.1',
        });
        paymentUrl = vnpayResult.payUrl;
        console.log('[Payment] VNPay payment URL created:', paymentUrl);
      } else {
        throw new BadRequestException('Payment gateway không được hỗ trợ');
      }

      // Update payment with URL
      savedPayment.paymentUrl = paymentUrl;
      await this.paymentRepository.save(savedPayment);

      return {
        transactionId: savedPayment.id,
        txnRef: savedPayment.txnRef,
        paymentUrl,
        amount: savedPayment.amount,
        expiresAt: savedPayment.expiresAt,
      };
    } catch (error) {
      // Update payment status to FAILED
      savedPayment.status = PaymentStatus.FAILED;
      savedPayment.rawLog = { error: error.message };
      await this.paymentRepository.save(savedPayment);

      throw new HttpException(
        `Tạo link thanh toán thất bại: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }

    return payment;
  }

  async findByTxnRef(txnRef: string) {
    const payment = await this.paymentRepository.findOne({
      where: { txnRef },
    });

    if (!payment) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }

    return payment;
  }

  async findByInvoice(invoiceId: number) {
    return this.paymentRepository.find({
      where: {
        targetType: PaymentTargetType.INVOICE,
        targetId: invoiceId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByBooking(bookingId: number) {
    return this.paymentRepository.find({
      where: {
        targetType: PaymentTargetType.BOOKING,
        targetId: bookingId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async handleMoMoWebhook(data: any) {
    // Deep clone to avoid modifying original data
    const dataCopy = { ...data };

    // Verify signature
    const isValid = this.momoService.verifySignature(dataCopy);
    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    const { orderId, resultCode, transId, message, responseTime } = data;

    const payment = await this.paymentRepository.findOne({
      where: { txnRef: orderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment
    payment.gatewayTxnId = transId;
    payment.gatewayResponseCode = String(resultCode);
    payment.rawLog = data;
    payment.updatedAt = new Date();

    if (resultCode === 0) {
      payment.status = PaymentStatus.SUCCESS;
      payment.payDate = new Date(responseTime);
      await this.paymentRepository.save(payment);

      // Update target status
      await this.updateTargetStatus(payment);
    } else {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
    }

    return { message: 'Webhook processed successfully' };
  }

  async handleVNPayWebhook(data: any) {
    // Deep clone to avoid modifying original data
    const dataCopy = { ...data };

    console.log('[VNPay Webhook] Received:', {
      vnp_TxnRef: data.vnp_TxnRef,
      vnp_ResponseCode: data.vnp_ResponseCode,
      vnp_Amount: data.vnp_Amount,
    });

    // Verify signature
    const isValid = this.vnpayService.verifySignature(dataCopy);
    console.log('[VNPay Webhook] Signature valid:', isValid);

    if (!isValid) {
      console.error('[VNPay Webhook] Signature verification failed');
      throw new BadRequestException('Invalid signature');
    }

    const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_PayDate } =
      data;

    console.log('[VNPay Webhook] Looking for payment:', vnp_TxnRef);

    const payment = await this.paymentRepository.findOne({
      where: { txnRef: vnp_TxnRef },
    });

    if (!payment) {
      console.error('[VNPay Webhook] Payment not found:', vnp_TxnRef);
      throw new NotFoundException('Payment not found');
    }

    console.log('[VNPay Webhook] Found payment:', {
      id: payment.id,
      txnRef: payment.txnRef,
      currentStatus: payment.status,
    });

    // Update payment
    payment.gatewayTxnId = vnp_TransactionNo;
    payment.gatewayResponseCode = vnp_ResponseCode;
    payment.rawLog = data;
    payment.updatedAt = new Date();

    if (vnp_ResponseCode === '00') {
      payment.status = PaymentStatus.SUCCESS;
      payment.payDate = this.parseVNPayDate(vnp_PayDate);
      await this.paymentRepository.save(payment);

      console.log('[VNPay Webhook] Payment marked SUCCESS:', payment.id);

      // Update target status
      await this.updateTargetStatus(payment);

      console.log('[VNPay Webhook] Target status updated:', {
        targetType: payment.targetType,
        targetId: payment.targetId,
      });
    } else {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
      console.log('[VNPay Webhook] Payment marked FAILED:', payment.id);
    }

    return { message: 'Webhook processed successfully' };
  }

  private async updateTargetStatus(payment: PaymentTransaction) {
    if (payment.targetType === PaymentTargetType.INVOICE) {
      await this.invoiceRepository.update(payment.targetId, {
        status: InvoiceStatus.PAID,
      });
    } else if (payment.targetType === PaymentTargetType.BOOKING) {
      await this.bookingRepository.update(payment.targetId, {
        status: BookingStatus.PAID,
      });
    }
  }

  private generateTxnRef(
    targetType: PaymentTargetType,
    targetId: number,
  ): string {
    const prefix = targetType === PaymentTargetType.INVOICE ? 'INV' : 'BKG';
    const timestamp = Date.now();
    return `${prefix}_${targetId}_${timestamp}`;
  }

  private parseVNPayDate(vnpPayDate: string): Date {
    // Format: yyyyMMddHHmmss
    const year = parseInt(vnpPayDate.substring(0, 4));
    const month = parseInt(vnpPayDate.substring(4, 6)) - 1;
    const day = parseInt(vnpPayDate.substring(6, 8));
    const hour = parseInt(vnpPayDate.substring(8, 10));
    const minute = parseInt(vnpPayDate.substring(10, 12));
    const second = parseInt(vnpPayDate.substring(12, 14));
    return new Date(year, month, day, hour, minute, second);
  }
}
