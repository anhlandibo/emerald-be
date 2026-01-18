import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoiceDetail } from '../invoices/entities/invoice-detail.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { MaintenanceTicket } from '../maintenance-tickets/entities/maintenance-ticket.entity';
import { ApartmentResident } from '../apartments/entities/apartment-resident.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceDetail,
      Asset,
      Booking,
      Service,
      MaintenanceTicket,
      ApartmentResident,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
