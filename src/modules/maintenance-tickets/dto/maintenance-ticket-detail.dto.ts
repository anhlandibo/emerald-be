import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class MaintenanceTicketDetailDto {
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
  @ApiPropertyOptional({ example: 'Kiểm tra định kỳ...' })
  description?: string;

  @Expose()
  @ApiProperty({ example: 'ASSIGNED' })
  status: string;

  // Location
  @Expose()
  @ApiProperty({ example: 1 })
  blockId: number;

  @Expose()
  @ApiPropertyOptional({ example: 'Block A' })
  blockName?: string;

  @Expose()
  @ApiProperty({ example: 1 })
  floor: number;

  @Expose()
  @ApiPropertyOptional({ example: 101 })
  apartmentId?: number;

  @Expose()
  @ApiPropertyOptional({ example: 'A-101' })
  apartmentNumber?: string;

  @Expose()
  @ApiPropertyOptional({ example: 105 })
  assetId?: number;

  @Expose()
  @ApiPropertyOptional({ example: 'Thang máy Mitsubishi A1' })
  assetName?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Camera an ninh' })
  assetTypeName?: string;

  // Technician
  @Expose()
  @ApiPropertyOptional({ example: 50 })
  technicianId?: number;

  @Expose()
  @ApiPropertyOptional({ example: 'Nguyễn Văn Kỹ Thuật' })
  technicianName?: string;

  @Expose()
  @ApiPropertyOptional({ example: '0901234567' })
  technicianPhone?: string;

  // Progress
  @Expose()
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  checklistItems?: Array<{ task: string; isChecked: boolean }>;

  @Expose()
  @ApiPropertyOptional({ type: Date })
  @Type(() => Date)
  assignedDate?: Date;

  @Expose()
  @ApiPropertyOptional({ type: Date })
  @Type(() => Date)
  startedDate?: Date;

  @Expose()
  @ApiPropertyOptional({ type: Date })
  @Type(() => Date)
  completedDate?: Date;

  // Result
  @Expose()
  @ApiPropertyOptional({ example: 'GOOD' })
  result?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Đã thay tụ điện...' })
  resultNote?: string;

  @Expose()
  @ApiProperty({ example: false })
  hasIssue: boolean;

  @Expose()
  @ApiPropertyOptional({ example: null })
  issueDetail?: string;

  // Cost
  @Expose()
  @ApiPropertyOptional({ example: 500000 })
  materialCost?: number;

  @Expose()
  @ApiPropertyOptional({ example: 200000 })
  laborCost?: number;

  @Expose()
  @ApiPropertyOptional({ example: 700000 })
  totalCost?: number;

  @Expose()
  @ApiPropertyOptional({ example: 800000 })
  estimatedCost?: number;

  @Expose()
  @ApiPropertyOptional({ example: 700000 })
  actualCost?: number;

  @Expose()
  @ApiProperty({ type: Date })
  @Type(() => Date)
  createdAt: Date;
}
