import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';
import { TicketType } from '../enums/ticket-type.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';

export class CreateIncidentMaintenanceTicketDto {
  @ApiProperty({
    example: 'Máy bơm kêu to bất thường',
    description: 'Ticket title',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @ApiPropertyOptional({
    example: 'Nghe thấy tiếng rít lớn khi máy hoạt động vào ban đêm',
    description: 'Detailed description of the incident',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: TicketType.INCIDENT,
    enum: TicketType,
    description: 'Ticket type - must be INCIDENT',
    default: TicketType.INCIDENT,
  })
  @IsEnum(TicketType)
  @IsNotEmpty({ message: 'Loại ticket không được để trống' })
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

  @ApiProperty({
    example: 105,
    description:
      'Asset ID (required) - blockId and floor will be auto-extracted from asset',
  })
  @IsInt({ message: 'Asset ID phải là số nguyên' })
  @IsNotEmpty({ message: 'Asset ID không được để trống' })
  assetId: number;
}
