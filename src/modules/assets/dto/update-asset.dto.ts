import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAssetDto } from './create-asset.dto';
import { IsInt, IsOptional, Min, IsDateString } from 'class-validator';

/**
 * Update Asset DTO - extends CreateAssetDto with additional update-specific fields
 * Allows updating all create fields + lastMaintenanceDate
 */
export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @ApiProperty({
    example: '2025-12-20',
    description:
      'Last maintenance date (when updated, nextMaintenanceDate will be recalculated)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  lastMaintenanceDate?: string;

  @ApiProperty({
    example: 3,
    description:
      'Maintenance interval in months (calculated from last maintenance date or installation date)',
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maintenanceIntervalMonths?: number;
}
