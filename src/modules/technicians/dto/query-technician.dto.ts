import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TechnicianStatus } from '../enums/technician-status.enum';

export class QueryTechnicianDto {
  @ApiProperty({
    example: 'Nguyen',
    description: 'Search by full name',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    example: TechnicianStatus.AVAILABLE,
    description: 'Filter by status',
    enum: TechnicianStatus,
    required: false,
  })
  @IsEnum(TechnicianStatus)
  @IsOptional()
  status?: TechnicianStatus;
}
