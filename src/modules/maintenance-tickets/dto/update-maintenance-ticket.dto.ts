import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { ChecklistItemDto } from './create-maintenance-ticket.dto';

export class UpdateMaintenanceTicketDto {
  @ApiPropertyOptional({
    example: 'Máy bơm kêu to bất thường - Cập nhật',
    description: 'Updated ticket title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Nghe thấy tiếng rít lớn - đã kiểm tra lại',
    description: 'Updated description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: TicketPriority.URGENT,
    enum: TicketPriority,
    description: 'Updated priority level',
  })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({
    example: 1,
    description: 'Updated block ID',
  })
  @IsInt()
  @IsOptional()
  blockId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated floor number',
  })
  @IsInt()
  @IsOptional()
  floor?: number;

  @ApiPropertyOptional({
    example: 105,
    description: 'Updated asset ID',
  })
  @IsInt()
  @IsOptional()
  assetId?: number;

  @ApiPropertyOptional({
    type: [ChecklistItemDto],
    description: 'Updated checklist items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  @IsOptional()
  checklistItems?: ChecklistItemDto[];
}
