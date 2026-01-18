import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemNotificationsService } from './system-notifications.service';
import { SystemNotificationsController } from './system-notifications.controller';
import { SystemNotification } from './entities/system-notification.entity';
import { SystemUserNotification } from './entities/user-notification.entity';
import { AccountsModule } from 'src/modules/accounts/accounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemNotification, SystemUserNotification]),
    AccountsModule,
  ],
  controllers: [SystemNotificationsController],
  providers: [SystemNotificationsService],
  exports: [SystemNotificationsService],
})
export class SystemNotificationsModule {}
