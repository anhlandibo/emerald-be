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
import { TicketPriority } from '../enums/ticket-priority.enum';

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

export class CreateMaintenanceTicketDto {
  @ApiProperty({
    example: 'Máy bơm kêu to bất thường',
    description: 'Ticket title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Nghe thấy tiếng rít lớn khi máy hoạt động vào ban đêm',
    description: 'Detailed description of the issue or maintenance',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: TicketType.INCIDENT,
    enum: TicketType,
    description: 'Ticket type: INCIDENT or MAINTENANCE',
  })
  @IsEnum(TicketType)
  @IsNotEmpty()
  type: TicketType;

  @ApiProperty({
    example: TicketPriority.HIGH,
    enum: TicketPriority,
    description: 'Priority level: LOW, MEDIUM, HIGH, URGENT',
    default: TicketPriority.MEDIUM,
  })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  // Vị trí (bắt buộc)
  @ApiProperty({
    example: 1,
    description: 'Block ID where the issue/maintenance is located',
  })
  @IsInt()
  @IsNotEmpty()
  blockId: number;

  @ApiProperty({
    example: 1,
    description: 'Floor number (0 for ground, negative for basement)',
  })
  @IsInt()
  @IsNotEmpty()
  floor: number;

  // Tùy chọn: Link tới đối tượng cụ thể
  @ApiPropertyOptional({
    example: null,
    description: 'Apartment ID if the issue is in a specific apartment',
  })
  @IsInt()
  @IsOptional()
  apartmentId?: number;

  @ApiPropertyOptional({
    example: 105,
    description: 'Asset ID if the issue is with a specific public asset',
  })
  @IsInt()
  @IsOptional()
  assetId?: number;

  // Checklist (cho bảo trì định kỳ)
  @ApiPropertyOptional({
    type: [ChecklistItemDto],
    description: 'Checklist items for scheduled maintenance',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  @IsOptional()
  checklistItems?: ChecklistItemDto[];
}
