import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { AssetStatus } from '../enums/asset-status.enum';

export class CreateAssetDto {
  @ApiProperty({
    example: 'Camera HK-01 Sảnh Chính',
    description: 'Name of the asset',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 3,
    description: 'ID from asset_types table',
  })
  @IsInt()
  @IsNotEmpty()
  typeId: number;

  @ApiProperty({
    example: 1,
    description: 'ID from blocks table',
  })
  @IsInt()
  @IsNotEmpty()
  blockId: number;

  @ApiProperty({
    example: 0,
    description: 'Floor number (0 for ground floor, negative for basement)',
  })
  @IsInt()
  @IsNotEmpty()
  floor: number;

  @ApiProperty({
    example: 'Góc phải sảnh lễ tân',
    description: 'Detailed location description',
    required: false,
  })
  @IsString()
  @IsOptional()
  locationDetail?: string;

  @ApiProperty({
    example: AssetStatus.ACTIVE,
    description: 'Status of the asset',
    enum: AssetStatus,
    default: AssetStatus.ACTIVE,
  })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiProperty({
    example: '2026-01-10',
    description: 'Installation date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  installationDate?: string;

  @ApiProperty({
    example: '2028-01-10',
    description: 'Warranty expiration date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  warrantyExpirationDate?: string;

  @ApiProperty({
    example: '2026-07-10',
    description: 'Next maintenance date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  nextMaintenanceDate?: string;

  @ApiProperty({
    example: 'Model Hikvision 2025, quay đêm hồng ngoại',
    description: 'Additional notes about the asset',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}
