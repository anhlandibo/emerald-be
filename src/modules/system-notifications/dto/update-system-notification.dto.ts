import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsInt,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import {
  SystemNotificationType,
  SystemNotificationPriority,
} from '../entities/system-notification.entity';

export class UpdateSystemNotificationDto {
  @ApiProperty({
    example: 'Thông báo bảo trì hệ thống (Updated)',
    description: 'System notification title',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'Nội dung đã được cập nhật',
    description: 'System notification content',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    example: SystemNotificationType.INFO,
    enum: SystemNotificationType,
    description: 'System notification type',
    required: false,
  })
  @IsEnum(SystemNotificationType)
  @IsOptional()
  type?: SystemNotificationType;

  @ApiProperty({
    example: SystemNotificationPriority.HIGH,
    enum: SystemNotificationPriority,
    description: 'System notification priority',
    required: false,
  })
  @IsEnum(SystemNotificationPriority)
  @IsOptional()
  priority?: SystemNotificationPriority;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'User IDs to send notification to',
    required: false,
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  targetUserIds?: number[];

  @ApiProperty({
    example: { key: 'value' },
    description: 'Additional metadata',
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
    example: true,
    description: 'Keep notification until user dismisses it',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPersistent?: boolean;

  @ApiProperty({
    example: '2026-01-20T10:00:00Z',
    description: 'Schedule notification for later',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;

  @ApiProperty({
    example: '2026-01-25T10:00:00Z',
    description: 'Notification expiration time',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
