import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MeterReadingUpdateDto {
  @ApiProperty({
    example: 1,
    description: 'Fee Type ID (e.g., 1 for water, 2 for electricity)',
  })
  @IsInt()
  @IsNotEmpty()
  feeTypeId: number;

  @ApiProperty({
    example: 150.5,
    description: 'New meter reading index',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  newIndex: number;

  @ApiPropertyOptional({
    example: 120.3,
    description:
      'Old meter reading index (optional, uses current last reading if not provided)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  oldIndex?: number;
}

export class VerifyInvoiceReadingsDto {
  @ApiProperty({
    example: 1,
    description: 'Invoice ID to verify and recalculate',
  })
  @IsInt()
  @IsNotEmpty()
  invoiceId: number;

  @ApiProperty({
    type: [MeterReadingUpdateDto],
    description: 'Array of meter readings to verify and update',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeterReadingUpdateDto)
  meterReadings: MeterReadingUpdateDto[];
}
