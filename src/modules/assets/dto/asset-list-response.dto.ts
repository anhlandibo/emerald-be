import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { AssetStatus } from '../enums/asset-status.enum';

@Exclude()
export class AssetListResponseDto {
  @ApiProperty({
    example: 105,
    description: 'The unique identifier of the asset',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Camera HK-01 Sảnh Chính',
    description: 'Name of the asset',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'Camera giám sát',
    description: 'Asset type name',
  })
  @Expose()
  typeName: string;

  @ApiProperty({
    example: 'Emerald A',
    description: 'Block name',
  })
  @Expose()
  blockName: string;

  @ApiProperty({
    example: 0,
    description: 'Floor number',
  })
  @Expose()
  floor: number;

  @ApiProperty({
    example: 'Góc phải sảnh lễ tân',
    description: 'Detailed location',
  })
  @Expose()
  locationDetail: string;

  @ApiProperty({
    example: AssetStatus.ACTIVE,
    description: 'Asset status',
    enum: AssetStatus,
  })
  @Expose()
  status: AssetStatus;

  @ApiProperty({
    example: '2026-07-10',
    description: 'Next maintenance date',
  })
  @Expose()
  nextMaintenanceDate: string;

  @ApiProperty({
    example: true,
    description: 'Whether warranty is still valid',
  })
  @Expose()
  isWarrantyValid: boolean;
}
