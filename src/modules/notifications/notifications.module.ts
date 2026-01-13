import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { TargetBlock } from './entities/target-block.entity';
import { Block } from '../blocks/entities/block.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UserNotification } from './entities/user-notification.entity';
import { Resident } from '../residents/entities/resident.entity';
import { ApartmentResident } from '../apartments/entities/apartment-resident.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      TargetBlock,
      Block,
      UserNotification,
      Resident,
      ApartmentResident,
    ]),
    CloudinaryModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
