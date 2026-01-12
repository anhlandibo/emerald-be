import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { MaintenanceResult } from '../enums/maintenance-result.enum';

export class CompleteMaintenanceDto {
  @ApiProperty({
    example: MaintenanceResult.GOOD,
    enum: MaintenanceResult,
    description: 'Maintenance result: GOOD, NEEDS_REPAIR, or MONITORING',
  })
  @IsEnum(MaintenanceResult)
  @IsNotEmpty()
  result: MaintenanceResult;

  @ApiPropertyOptional({
    example: 'Đã thay tụ điện, máy chạy êm.',
    description: 'Notes about the maintenance result',
  })
  @IsString()
  @IsOptional()
  resultNote?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether any additional issues were discovered',
  })
  @IsBoolean()
  @IsOptional()
  hasIssue?: boolean;

  @ApiPropertyOptional({
    example: null,
    description: 'Description of any additional issues found',
  })
  @IsString()
  @IsOptional()
  issueDetail?: string;

  @ApiPropertyOptional({
    example: 500000,
    description: 'Cost of materials used',
  })
  @IsNumber()
  @IsOptional()
  materialCost?: number;

  @ApiPropertyOptional({
    example: 200000,
    description: 'Labor cost',
  })
  @IsNumber()
  @IsOptional()
  laborCost?: number;
}
