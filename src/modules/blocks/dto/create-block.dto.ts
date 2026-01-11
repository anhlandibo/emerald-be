import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlockStatus } from '../enums/block-status.enum';
import { CreateBlockApartmentDto } from './create-block-apartment.dto';

export class CreateBlockDto {
  @ApiProperty({
    example: 'Tòa A - Sakura',
    description: 'Name of the block',
  })
  @IsString()
  @IsNotEmpty()
  buildingName: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Manager name',
  })
  @IsString()
  @IsNotEmpty()
  managerName: string;

  @ApiProperty({
    example: '0901234567',
    description: 'Manager phone number',
  })
  @IsString()
  @IsNotEmpty()
  managerPhone: string;

  @ApiProperty({
    example: BlockStatus.OPERATING,
    description: 'Status of the block',
    enum: BlockStatus,
    required: false,
  })
  @IsEnum(BlockStatus)
  @IsOptional()
  status?: BlockStatus;

  @ApiProperty({
    type: [CreateBlockApartmentDto],
    description: 'Array of apartments to create with the block',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlockApartmentDto)
  @IsOptional()
  apartments?: CreateBlockApartmentDto[];
}
