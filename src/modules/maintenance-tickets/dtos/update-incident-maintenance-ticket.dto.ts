import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { TicketPriority } from '../enums/ticket-priority.enum';

export class UpdateIncidentMaintenanceTicketDto {
  @ApiPropertyOptional({
    example: 'Máy bơm kêu to bất thường - Cập nhật',
    description: 'Updated ticket title',
  })
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Nghe thấy tiếng rít lớn - đã kiểm tra lại',
    description: 'Updated description',
  })
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: TicketPriority.URGENT,
    enum: TicketPriority,
    description: 'Updated priority level',
  })
  @IsEnum(TicketPriority, { message: 'Mức độ ưu tiên không hợp lệ' })
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({
    example: 105,
    description:
      'Updated asset ID (blockId and floor will be auto-extracted from asset)',
  })
  @IsInt({ message: 'Asset ID phải là số nguyên' })
  @IsOptional()
  assetId?: number;
}
