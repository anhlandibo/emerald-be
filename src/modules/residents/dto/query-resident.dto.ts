import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Gender } from '../enums/gender.enum';

export class QueryResidentDto {
  @ApiProperty({
    description: 'Search by full name or citizen ID',
    required: false,
    example: 'Nguyễn',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by gender',
    required: false,
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Filter by nationality',
    required: false,
    example: 'Việt Nam',
  })
  @IsOptional()
  @IsString()
  nationality?: string;
}
