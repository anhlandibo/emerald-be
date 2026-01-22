import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { Issue } from './entities/issue.entity';
import { Resident } from '../residents/entities/resident.entity';
import { Block } from '../blocks/entities/block.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SystemNotificationsModule } from '../system-notifications/system-notifications.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, Resident, Block]),
    CloudinaryModule,
    SystemNotificationsModule,
    AccountsModule,
  ],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}
