import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { Resident } from './entities/resident.entity';
import { Account } from '../accounts/entities/account.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { PaymentTransaction } from '../payments/entities/payment-transaction.entity';
import { ApartmentResident } from '../apartments/entities/apartment-resident.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Resident,
      Account,
      Invoice,
      Booking,
      PaymentTransaction,
      ApartmentResident,
    ]),
    CloudinaryModule,
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService],
  exports: [ResidentsService],
})
export class ResidentsModule {}
