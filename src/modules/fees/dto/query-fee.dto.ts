import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { FeeType } from '../enums/fee-type.enum';

export class QueryFeeDto {
  @ApiProperty({
    example: 'Tiền điện',
    description: 'Search by name',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    example: FeeType.METERED,
    description: 'Filter by fee type',
    enum: FeeType,
    required: false,
  })
  @IsEnum(FeeType)
  @IsOptional()
  type?: FeeType;
}
