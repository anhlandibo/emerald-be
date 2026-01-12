import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { TechnicianStatus } from '../enums/technician-status.enum';

export class UpdateTechnicianDto {
  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'Full name of the technician',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  fullName?: string;

  @ApiProperty({
    example: '0912345678',
    description: 'Phone number of the technician',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{10}$/, {
    message: 'Phone number must be 10 digits',
  })
  phoneNumber?: string;

  @ApiProperty({
    example: TechnicianStatus.AVAILABLE,
    description: 'Status of the technician',
    enum: TechnicianStatus,
    required: false,
  })
  @IsEnum(TechnicianStatus)
  @IsOptional()
  status?: TechnicianStatus;

  @ApiProperty({
    example: 'Updated description',
    description: 'Description of the technician',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
