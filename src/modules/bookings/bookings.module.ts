import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { BookingPayment } from './entities/booking-payment.entity';
import { SlotAvailability } from '../services/entities/slot-availability.entity';
import { Resident } from '../residents/entities/resident.entity';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingPayment,
      SlotAvailability,
      Resident,
    ]),
    forwardRef(() => ServicesModule),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
