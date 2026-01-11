import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { AssetStatus } from '../enums/asset-status.enum';

class AssetTypeInfoDto {
  @ApiProperty({
    example: 5,
    description: 'Asset type ID',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Hệ thống điện nguồn',
    description: 'Asset type name',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'Máy phát điện, Tủ điện tổng',
    description: 'Asset type description',
  })
  @Expose()
  description: string;
}

class AssetLocationDto {
  @ApiProperty({
    example: 1,
    description: 'Block ID',
  })
  @Expose()
  blockId: number;

  @ApiProperty({
    example: 'Emerald A',
    description: 'Block name',
  })
  @Expose()
  blockName: string;

  @ApiProperty({
    example: -1,
    description: 'Floor number',
  })
  @Expose()
  floor: number;

  @ApiProperty({
    example: 'Hầm B1',
    description: 'Floor display label',
  })
  @Expose()
  floorDisplay: string;

  @ApiProperty({
    example: 'Phòng kỹ thuật điện khu vực phía Bắc',
    description: 'Detailed location',
  })
  @Expose()
  detail: string;
}

class AssetTimelineDto {
  @ApiProperty({
    example: '2023-01-15',
    description: 'Installation date',
  })
  @Expose()
  installationDate: string;

  @ApiProperty({
    example: '2028-01-15',
    description: 'Warranty expiration date',
  })
  @Expose()
  warrantyExpirationDate: string;

  @ApiProperty({
    example: '2025-12-20',
    description: 'Last maintenance date',
  })
  @Expose()
  lastMaintenanceDate: string;

  @ApiProperty({
    example: '2026-06-20',
    description: 'Next maintenance date',
  })
  @Expose()
  nextMaintenanceDate: string;
}

class AssetComputedDto {
  @ApiProperty({
    example: true,
    description: 'Whether warranty is still valid',
  })
  @Expose()
  isWarrantyValid: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether maintenance is overdue',
  })
  @Expose()
  isOverdueMaintenance: boolean;

  @ApiProperty({
    example: 162,
    description: 'Days until next maintenance',
  })
  @Expose()
  daysUntilMaintenance: number;
}

@Exclude()
export class AssetDetailResponseDto {
  @ApiProperty({
    example: 105,
    description: 'The unique identifier of the asset',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Máy phát điện dự phòng Cummins - G1',
    description: 'Name of the asset',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example:
      'Máy hoạt động ổn định. Lưu ý: Cần kiểm tra kỹ mức nhiên liệu trước khi test định kỳ.',
    description: 'Additional notes',
  })
  @Expose()
  note: string;

  @ApiProperty({
    example: AssetStatus.ACTIVE,
    description: 'Asset status',
    enum: AssetStatus,
  })
  @Expose()
  status: AssetStatus;

  @ApiProperty({
    type: AssetTypeInfoDto,
    description: 'Asset type information',
  })
  @Expose()
  @Type(() => AssetTypeInfoDto)
  type: AssetTypeInfoDto;

  @ApiProperty({
    type: AssetLocationDto,
    description: 'Location information',
  })
  @Expose()
  @Type(() => AssetLocationDto)
  location: AssetLocationDto;

  @ApiProperty({
    type: AssetTimelineDto,
    description: 'Timeline information',
  })
  @Expose()
  @Type(() => AssetTimelineDto)
  timeline: AssetTimelineDto;

  @ApiProperty({
    type: AssetComputedDto,
    description: 'Computed fields',
  })
  @Expose()
  @Type(() => AssetComputedDto)
  computed: AssetComputedDto;
}
