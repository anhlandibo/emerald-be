import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AssetTypeResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the asset type',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Camera giám sát',
    description: 'Name of the asset type',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'Camera an ninh cho hành lang và khu vực chung',
    description: 'Description of the asset type',
  })
  @Expose()
  description: string;

  @ApiProperty({
    example: '2026-01-10T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2026-01-10T10:00:00.000Z',
    description: 'Last update timestamp',
  })
  @Expose()
  updatedAt: Date;
}
