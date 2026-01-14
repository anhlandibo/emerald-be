/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  ArrayMinSize,
  Allow,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ScopeType } from '../../notifications/enums/scope-type.enum';

export class OptionDto {
  @ApiProperty({ example: 'Phương án A - Cải tạo cơ bản' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Chi phí dự kiến: 120 triệu VNĐ. Sơn lại tường, thay đèn LED.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class TargetBlockDto {
  @ApiProperty({ example: 1 })
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  @IsInt()
  blockId: number;

  @ApiPropertyOptional({ example: [2, 3, 4] })
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

export class CreateVotingDto {
  @ApiProperty({ example: 'Bảo trì hệ thống nước tháng 11' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Kính gửi quý cư dân, BQL đề xuất cải tạo...' })
  @IsString()
  content: string;

  @ApiProperty({ example: true, default: false })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({ example: '2025-11-24T11:30:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2025-11-26T11:30:00Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: ScopeType.BLOCK, enum: ScopeType })
  @IsEnum(ScopeType)
  targetScope: ScopeType;

  @ApiPropertyOptional({ type: [TargetBlockDto] })
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
  @IsArray()
  @IsOptional()
  targets?: TargetBlockDto[];

  @ApiProperty({ type: [OptionDto] })
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'At least 2 options are required' })
  options: OptionDto[];

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
  @Allow()
  files?: Express.Multer.File[];
}
