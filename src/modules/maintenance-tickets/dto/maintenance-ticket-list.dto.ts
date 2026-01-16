import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class MaintenanceTicketListItemDto {
  @Expose()
  @ApiProperty({ example: 1001 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'Bảo trì thang máy A1' })
  title: string;

  @Expose()
  @ApiProperty({ example: 'MAINTENANCE' })
  type: string;

  @Expose()
  @ApiProperty({ example: 'MEDIUM' })
  priority: string;

  @Expose()
  @ApiProperty({ example: 'ASSIGNED' })
  status: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Thang máy Mitsubishi A1' })
  assetName?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Block A' })
  blockName?: string;

  @Expose()
  @ApiProperty({ example: 1 })
  floor: number;

  @Expose()
  @ApiPropertyOptional({ example: 'Nguyễn Văn Kỹ Thuật' })
  technicianName?: string;

  @Expose()
  @ApiPropertyOptional({ example: 1500000 })
  estimatedCost?: number;

  @Expose()
  @ApiPropertyOptional({ example: 1500000 })
  actualCost?: number;

  @Expose()
  @ApiProperty({ example: '2026-01-12T08:00:00Z' })
  @Type(() => Date)
  createdAt: Date;
}
