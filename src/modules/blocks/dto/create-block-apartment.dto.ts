import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApartmentType } from '../../apartments/enums/apartment-type.enum';

export class CreateBlockApartmentDto {
  @ApiProperty({
    example: 'A-10.01',
    description: 'Room name/number',
  })
  @IsString()
  @IsNotEmpty()
  roomName: string;

  @ApiProperty({
    example: 'STUDIO',
    description: 'Apartment type',
    enum: ApartmentType,
  })
  @IsEnum(ApartmentType)
  @IsNotEmpty()
  type: ApartmentType;

  @ApiProperty({
    example: 100,
    description: 'Area in square meters',
  })
  @IsNumber()
  @IsOptional()
  area?: number;

  @ApiProperty({
    example: 10,
    description: 'Floor number',
  })
  @IsInt()
  @IsNotEmpty()
  floor: number;
}
