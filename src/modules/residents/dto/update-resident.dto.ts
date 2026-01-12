import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { Gender } from '../enums/gender.enum';

export class UpdateResidentDto {
  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Full name of the resident',
    required: false,
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    example: '079203001234',
    description: 'Citizen ID (CCCD)',
    required: false,
  })
  @IsString()
  @IsOptional()
  citizenId?: string;

  @ApiProperty({
    example: '2000-01-01',
    description: 'Date of birth (YYYY-MM-DD)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiProperty({
    example: Gender.MALE,
    description: 'Gender of the resident',
    enum: Gender,
    required: false,
  })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({
    example: '0901234567',
    description: 'Phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: 'Việt Nam',
    description: 'Nationality',
    required: false,
  })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({
    example: 'Hồ Chí Minh',
    description: 'Province/City',
    required: false,
  })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({
    example: 'Quận 1',
    description: 'District',
    required: false,
  })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({
    example: 'Phường Bến Nghé',
    description: 'Ward',
    required: false,
  })
  @IsString()
  @IsOptional()
  ward?: string;

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
