/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ScopeType } from '../../notifications/enums/scope-type.enum';
import { OptionDto, TargetBlockDto } from './create-voting.dto';

export class UpdateVotingDto {
  @ApiPropertyOptional({ example: 'Bảo trì hệ thống nước tháng 11 - Cập nhật' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: '2025-11-24T11:30:00Z' })
  @Transform(({ value }) => {
    if (!value) return undefined;
    return value;
  })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: '2025-11-26T11:30:00Z' })
  @Transform(({ value }) => {
    if (!value) return undefined;
    return value;
  })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: ScopeType.BLOCK, enum: ScopeType })
  @Transform(({ value }) => {
    if (!value) return undefined;
    return value;
  })
  @IsEnum(ScopeType)
  @IsOptional()
  targetScope?: ScopeType;

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

  @ApiPropertyOptional({ type: [OptionDto] })
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
  options?: OptionDto[];

  @ApiPropertyOptional({
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
