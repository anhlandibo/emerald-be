import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { TicketPriority } from '../enums/ticket-priority.enum';

export class AssignTechnicianDto {
  @ApiProperty({
    example: 50,
    description: 'Technician ID to assign',
  })
  @IsInt()
  @IsNotEmpty()
  technicianId: number;

  @ApiPropertyOptional({
    example: TicketPriority.HIGH,
    enum: TicketPriority,
    description: 'Update priority if needed',
  })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({
    example: '2026-01-12T09:00:00Z',
    description: 'Scheduled date for the assignment',
  })
  @IsDateString()
  @IsOptional()
  assignedDate?: string;
}
