import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { Backup } from './entities/backup.entity';
import { RestoreJob } from './entities/restore-job.entity';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { SupabaseStorageModule } from '../supabase-storage/supabase-storage.module';
import { BackupStorageService } from './backup-storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Backup, RestoreJob]),
    ScheduleModule.forRoot(),
    SupabaseStorageModule,
  ],
  controllers: [BackupController],
  providers: [BackupService, BackupStorageService],
})
export class BackupModule {}
