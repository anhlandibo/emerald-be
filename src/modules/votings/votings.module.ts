import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotingsController } from './votings.controller';
import { VotingsService } from './votings.service';
import { Voting } from './entities/voting.entity';
import { Option } from './entities/option.entity';
import { ResidentOption } from './entities/resident-option.entity';
import { TargetBlock } from '../notifications/entities/target-block.entity';
import { Block } from '../blocks/entities/block.entity';
import { Apartment } from '../apartments/entities/apartment.entity';
import { ApartmentResident } from '../apartments/entities/apartment-resident.entity';
import { Resident } from '../residents/entities/resident.entity';
import { SupabaseStorageModule } from '../supabase-storage/supabase-storage.module';
import { Account } from '../accounts/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Voting,
      Option,
      ResidentOption,
      TargetBlock,
      Block,
      Apartment,
      ApartmentResident,
      Resident,
      Account,
    ]),
    SupabaseStorageModule,
  ],
  controllers: [VotingsController],
  providers: [VotingsService],
  exports: [VotingsService],
})
export class VotingsModule {}
