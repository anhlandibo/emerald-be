import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { Fee } from './entities/fee.entity';
import { FeeTier } from './entities/fee-tier.entity';
import { InvoiceDetail } from '../invoices/entities/invoice-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fee, FeeTier, InvoiceDetail])],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
