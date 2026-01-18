import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  SystemNotificationType,
  SystemNotificationPriority,
} from '../entities/system-notification.entity';

export class QuerySystemNotificationDto {
  @ApiProperty({
    example: 1,
    description: 'Page number',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Items per page',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({
    example: SystemNotificationType.INFO,
    enum: SystemNotificationType,
    description: 'Filter by notification type',
    required: false,
  })
  @IsOptional()
  @IsEnum(SystemNotificationType)
  type?: SystemNotificationType;

  @ApiProperty({
    example: SystemNotificationPriority.HIGH,
    enum: SystemNotificationPriority,
    description: 'Filter by notification priority',
    required: false,
  })
  @IsOptional()
  @IsEnum(SystemNotificationPriority)
  priority?: SystemNotificationPriority;

  @ApiProperty({
    example: true,
    description: 'Filter by sent status',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSent?: boolean;

  @ApiProperty({
    example: 'bảo trì',
    description: 'Search in title and content',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryUserNotificationDto {
  @ApiProperty({
    example: 1,
    description: 'Page number',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Items per page',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({
    example: false,
    description: 'Filter by read status',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRead?: boolean;

  @ApiProperty({
    example: SystemNotificationType.INFO,
    enum: SystemNotificationType,
    description: 'Filter by notification type',
    required: false,
  })
  @IsOptional()
  @IsEnum(SystemNotificationType)
  type?: SystemNotificationType;
}
