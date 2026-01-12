import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { NotiType } from '../enums/noti-type.enum';
import { ScopeType } from '../enums/scope-type.enum';
import { Type } from 'class-transformer';

export class QueryNotificationDto {
  @ApiProperty({
    required: false,
    description: 'Search by title or content',
    example: 'bảo trì',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    enum: NotiType,
    description: 'Filter by notification type',
  })
  @IsOptional()
  @IsEnum(NotiType)
  type?: NotiType;

  @ApiProperty({
    required: false,
    enum: ScopeType,
    description: 'Filter by target scope',
  })
  @IsOptional()
  @IsEnum(ScopeType)
  targetScope?: ScopeType;

  @ApiProperty({
    required: false,
    description: 'Filter by urgent status',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isUrgent?: boolean;
}
