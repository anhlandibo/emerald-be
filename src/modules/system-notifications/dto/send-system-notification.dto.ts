import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import {
  SystemNotificationType,
  SystemNotificationPriority,
} from '../entities/system-notification.entity';

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
    example: SystemNotificationPriority.NORMAL,
    enum: SystemNotificationPriority,
    description: 'System notification priority',
    default: SystemNotificationPriority.NORMAL,
  })
  @IsEnum(SystemNotificationPriority)
  @IsOptional()
  priority?: SystemNotificationPriority;

  @ApiProperty({
    example: [1, 2, 3],
    description:
      'User IDs to send notification to. Leave empty or null to broadcast to ALL active users. User notification records will be automatically created.',
    required: false,
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  targetUserIds?: number[];

  @ApiProperty({
    example: { invoiceId: 12345, amount: 5000000 },
    description: 'Additional metadata for the notification',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    example: '/invoices/12345',
    description: 'Action URL when user clicks notification',
    required: false,
  })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiProperty({
    example: 'Xem chi tiết',
    description: 'Action button text',
    required: false,
  })
  @IsString()
  @IsOptional()
  actionText?: string;

  @ApiProperty({
    example: false,
    description: 'Keep notification until user dismisses it manually',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPersistent?: boolean;

  @ApiProperty({
    example: '2026-01-20T10:00:00Z',
    description: 'Schedule notification for later (ISO 8601 format)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;

  @ApiProperty({
    example: '2026-01-25T10:00:00Z',
    description: 'Notification expiration time (ISO 8601 format)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
