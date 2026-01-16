import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum DateRangeType {
  DAY = 'day',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class QueryReportDto {
  @ApiProperty({
    enum: DateRangeType,
    default: DateRangeType.MONTH,
    description: 'Loại khoảng thời gian',
    example: DateRangeType.MONTH,
  })
  @IsEnum(DateRangeType)
  @IsOptional()
  rangeType?: DateRangeType = DateRangeType.MONTH;

  @ApiProperty({
    type: String,
    description: 'Ngày bắt đầu (ISO format)',
    required: false,
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    type: String,
    description: 'Ngày kết thúc (ISO format)',
    required: false,
    example: '2025-01-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
