import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketType } from '../enums/ticket-type.enum';

export class ChecklistItemDto {
  @ApiProperty({
    example: 'Kiểm tra điện áp',
    description: 'Task description',
  })
  @IsString()
  @IsNotEmpty()
  task: string;

  @ApiProperty({
    example: false,
    description: 'Whether the task is completed',
  })
  @IsOptional()
  isChecked?: boolean;
}

export class CreateScheduledMaintenanceTicketDto {
  @ApiProperty({
    example: 'Bảo trì định kỳ thang máy A1',
    description: 'Maintenance title',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @ApiPropertyOptional({
    example: 'Kiểm tra định kỳ, bôi trơn, thay thế các bộ phận hỏng',
    description: 'Maintenance description and plan',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: TicketType.MAINTENANCE,
    enum: TicketType,
    description: 'Ticket type - must be MAINTENANCE',
    default: TicketType.MAINTENANCE,
  })
  @IsEnum(TicketType)
  @IsNotEmpty({ message: 'Loại ticket không được để trống' })
  type: TicketType;

  @ApiProperty({
    example: 105,
    description:
      'Asset ID (required) - blockId and floor will be auto-extracted from asset',
  })
  @IsInt({ message: 'Asset ID phải là số nguyên' })
  @IsNotEmpty({ message: 'Asset ID không được để trống' })
  assetId: number;

  @ApiPropertyOptional({
    type: [ChecklistItemDto],
    description: 'Checklist items for scheduled maintenance',
  })
  @IsArray({ message: 'Checklist phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  @IsOptional()
  checklistItems?: ChecklistItemDto[];
}
