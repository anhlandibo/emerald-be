import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChecklistItemDto } from './create-scheduled-maintenance-ticket.dto';

export class UpdateScheduledMaintenanceTicketDto {
  @ApiPropertyOptional({
    example: 'Bảo trì định kỳ thang máy A1 - Cập nhật',
    description: 'Updated maintenance title',
  })
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Kiểm tra, bôi trơn, thay thế các bộ phận hỏng - Cập nhật',
    description: 'Updated maintenance description',
  })
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 105,
    description:
      'Updated asset ID (blockId and floor will be auto-extracted from asset)',
  })
  @IsInt({ message: 'Asset ID phải là số nguyên' })
  @IsOptional()
  assetId?: number;

  @ApiPropertyOptional({
    type: [ChecklistItemDto],
    description: 'Updated checklist items',
  })
  @IsArray({ message: 'Checklist phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  @IsOptional()
  checklistItems?: ChecklistItemDto[];
}
