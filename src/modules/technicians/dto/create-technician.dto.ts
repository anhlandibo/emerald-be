import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { TechnicianStatus } from '../enums/technician-status.enum';

export class CreateTechnicianDto {
  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'Full name of the technician',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  fullName: string;

  @ApiProperty({
    example: '0912345678',
    description: 'Phone number of the technician',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/, {
    message: 'Phone number must be 10 digits',
  })
  phoneNumber: string;

  @ApiProperty({
    example: TechnicianStatus.AVAILABLE,
    description: 'Status of the technician',
    enum: TechnicianStatus,
    default: TechnicianStatus.AVAILABLE,
  })
  @IsEnum(TechnicianStatus)
  @IsOptional()
  status?: TechnicianStatus;

  @ApiProperty({
    example: 'Experienced in plumbing and electrical work',
    description: 'Description of the technician',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
