import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { MaintenanceTicket } from '../maintenance-tickets/entities/maintenance-ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      Asset,
      Booking,
      Service,
      MaintenanceTicket,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
