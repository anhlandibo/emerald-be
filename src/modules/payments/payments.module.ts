import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { MoMoService } from './services/momo.service';
import { VNPayService } from './services/vnpay.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransaction, Invoice, Booking])],
  controllers: [PaymentsController],
  providers: [PaymentsService, MoMoService, VNPayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
