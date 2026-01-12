import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Invoice } from './entities/invoice.entity';
import { InvoiceDetail } from './entities/invoice-detail.entity';
import { MeterReading } from './entities/meter-reading.entity';
import { Fee } from '../fees/entities/fee.entity';
import { FeeTier } from '../fees/entities/fee-tier.entity';
import { Apartment } from '../apartments/entities/apartment.entity';
import { ApartmentResident } from '../apartments/entities/apartment-resident.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Resident } from '../residents/entities/resident.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceDetail,
      MeterReading,
      Fee,
      FeeTier,
      Apartment,
      ApartmentResident,
      Resident,
    ]),
    CloudinaryModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
