import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Gender } from '../enums/gender.enum';

export class CreateResidentDto {
  @ApiProperty({
    example: 'nguyenvana@example.com',
    description: 'Email address for account',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Full name of the resident',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: '079203001234',
    description: 'Citizen ID (CCCD)',
  })
  @IsString()
  @IsNotEmpty()
  citizenId: string;

  @ApiProperty({
    example: '2000-01-01',
    description: 'Date of birth (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @ApiProperty({
    example: Gender.MALE,
    description: 'Gender of the resident',
    enum: Gender,
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({
    example: '0901234567',
    description: 'Phone number',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    example: 'Việt Nam',
    description: 'Nationality',
  })
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @ApiProperty({
    example: 'Hồ Chí Minh',
    description: 'Province/City',
  })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({
    example: 'Quận 1',
    description: 'District',
  })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({
    example: 'Phường Bến Nghé',
    description: 'Ward',
  })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({
    example: '123 Đường Nguyễn Huệ',
    description: 'Detailed address',
    required: false,
  })
  @IsString()
  @IsOptional()
  detailAddress?: string;

  @ApiProperty({
    description: 'Image file for resident (optional)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  image?: any;
}
