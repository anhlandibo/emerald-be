import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsDateString,
  IsObject,
  IsOptional,
  Allow,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Gender } from '../enums/gender.enum';

class HometownDto {
  @ApiProperty({
    example: 'Hồ Chí Minh',
    description: 'Province/City',
  })
  @IsString()
  @IsNotEmpty()
  @Allow()
  province: string;

  @ApiProperty({
    example: 'Quận 1',
    description: 'District',
  })
  @IsString()
  @IsNotEmpty()
  @Allow()
  district: string;

  @ApiProperty({
    example: 'Phường Bến Nghé',
    description: 'Ward',
  })
  @IsString()
  @IsNotEmpty()
  @Allow()
  ward: string;
}

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
    example: {
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
    },
    description: 'Hometown information',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as HometownDto;
      } catch {
        return value as unknown as HometownDto;
      }
    }
    return value as HometownDto;
  })
  @Type(() => HometownDto)
  @IsObject()
  @IsNotEmpty()
  hometown: HometownDto;

  @ApiProperty({
    description: 'Image file for resident (optional)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  image?: any;
}
