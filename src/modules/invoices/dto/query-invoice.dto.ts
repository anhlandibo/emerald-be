import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '../enums/invoice-status.enum';

export class QueryInvoiceDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Limit per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by apartment ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  apartmentId?: number;

  @ApiProperty({
    description: 'Filter by status',
    enum: InvoiceStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({
    description: 'Filter by period (YYYY-MM)',
    example: '2024-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  period?: string;
}
