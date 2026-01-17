import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemNotificationsService } from './system-notifications.service';
import { SystemNotificationsController } from './system-notifications.controller';
import { SystemNotification } from './entities/system-notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemNotification])],
  controllers: [SystemNotificationsController],
  providers: [SystemNotificationsService],
  exports: [SystemNotificationsService],
})
export class SystemNotificationsModule {}
