import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
} from 'class-validator';
import { SystemNotificationType } from '../entities/system-notification.entity';

export class SendSystemNotificationDto {
  @ApiProperty({
    example: 'Thông báo bảo trì hệ thống',
    description: 'System notification title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Hệ thống sẽ bảo trì vào lúc 2h sáng ngày mai',
    description: 'System notification content',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: SystemNotificationType.INFO,
    enum: SystemNotificationType,
    description: 'System notification type',
    default: SystemNotificationType.INFO,
  })
  @IsEnum(SystemNotificationType)
  @IsOptional()
  type?: SystemNotificationType;

  @ApiProperty({
    example: [1, 2, 3],
    description:
      'User IDs to send notification to (empty or null = broadcast to all online users)',
    required: false,
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  targetUserIds?: number[];

  @ApiProperty({
    example: { orderId: 123, action: 'created', module: 'invoices' },
    description: 'Additional metadata for the notification',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
