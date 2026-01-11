import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApartmentsService } from './apartments.service';
import { ApartmentsController } from './apartments.controller';
import { Apartment } from './entities/apartment.entity';
import { ApartmentResident } from './entities/apartment-resident.entity';
import { Block } from '../blocks/entities/block.entity';
import { Resident } from '../residents/entities/resident.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Apartment, ApartmentResident, Block, Resident]),
  ],
  controllers: [ApartmentsController],
  providers: [ApartmentsService],
  exports: [ApartmentsService],
})
export class ApartmentsModule {}
