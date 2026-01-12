/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  ArrayMinSize,
  Allow,
} from 'class-validator';
import { NotiType } from '../enums/noti-type.enum';
import { ScopeType } from '../enums/scope-type.enum';
import { ChannelType } from '../enums/channel-type.enum';

export class TargetBlockDto {
  @ApiProperty({
    example: 1,
    description: 'Block ID',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  @IsInt()
  @IsNotEmpty()
  blockId: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Target floor numbers (null or empty for all floors in block)',
    required: false,
  })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.map((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
          : [parseInt(String(parsed), 10)];
      } catch {
        return undefined;
      }
    }
    if (Array.isArray(value)) {
      return value.map((v) => (typeof v === 'string' ? parseInt(v, 10) : v));
    }
    return value;
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  targetFloorNumbers?: number[];
}

export class CreateNotificationDto {
  @ApiProperty({
    example: 'Thông báo bảo trì hệ thống điện',
    description: 'Notification title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      'Kính gửi quý cư dân, chúng tôi sẽ tiến hành bảo trì hệ thống điện...',
    description: 'Notification content',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: NotiType.MAINTENANCE,
    enum: NotiType,
    description: 'Notification type',
  })
  @IsEnum(NotiType)
  @IsNotEmpty()
  type: NotiType;

  @ApiProperty({
    example: false,
    description: 'Is urgent notification',
    default: false,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @ApiProperty({
    example: ScopeType.ALL,
    enum: ScopeType,
    description: 'Target scope',
    default: ScopeType.ALL,
  })
  @IsEnum(ScopeType)
  @IsNotEmpty()
  targetScope: ScopeType;

  @ApiProperty({
    example: [ChannelType.APP, ChannelType.EMAIL],
    enum: ChannelType,
    isArray: true,
    description: 'Notification channels',
  })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Ignored
      }
      if (value.includes(',')) {
        return value.split(',').map((v) => v.trim());
      }
      return [value];
    }

    return [value];
  })
  @IsArray()
  @IsEnum(ChannelType, { each: true })
  @ArrayMinSize(1)
  channels: ChannelType[];

  @ApiProperty({
    type: [TargetBlockDto],
    description: 'Target blocks (required if scope is BLOCK or FLOOR)',
    required: false,
  })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return undefined;
      }
    }
    return Array.isArray(value) ? value : [value];
  })
  @Type(() => TargetBlockDto)
  @IsArray()
  @IsOptional()
  targetBlocks?: TargetBlockDto[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Files to attach (max 10 files)',
    required: false,
  })
  @IsOptional()
  files?: Express.Multer.File[];
}
