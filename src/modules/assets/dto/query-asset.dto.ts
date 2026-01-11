import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AssetStatus } from '../enums/asset-status.enum';

export class QueryAssetDto {
  @ApiProperty({
    example: 'Camera',
    description: 'Search by asset name',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    example: 1,
    description: 'Filter by block ID',
    required: false,
  })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  blockId?: number;

  @ApiProperty({
    example: 3,
    description: 'Filter by asset type ID',
    required: false,
  })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  typeId?: number;

  @ApiProperty({
    example: AssetStatus.ACTIVE,
    description: 'Filter by status',
    enum: AssetStatus,
    required: false,
  })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiProperty({
    example: 0,
    description: 'Filter by floor',
    required: false,
  })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  floor?: number;
}
