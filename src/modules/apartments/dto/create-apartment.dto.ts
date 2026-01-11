import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApartmentType } from '../enums/apartment-type.enum';
import { RelationshipType } from '../enums/relationship-type.enum';

export class ResidentRelationshipDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the resident',
  })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    example: 'SPOUSE',
    description: 'Relationship type',
    enum: RelationshipType,
  })
  @IsEnum(RelationshipType)
  @IsNotEmpty()
  relationship: RelationshipType;
}

export class CreateApartmentDto {
  @ApiProperty({
    example: 'A.12-01',
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
    example: 1,
    description: 'Block ID',
  })
  @IsInt()
  @IsNotEmpty()
  blockId: number;

  @ApiProperty({
    example: 12,
    description: 'Floor number',
  })
  @IsInt()
  @IsNotEmpty()
  floor: number;

  @ApiProperty({
    example: 400,
    description: 'Area in square meters',
  })
  @IsNumber()
  @IsOptional()
  area?: number;

  @ApiProperty({
    example: 1,
    description: 'Owner resident ID',
  })
  @IsInt()
  @IsNotEmpty()
  owner_id: number;

  @ApiProperty({
    type: [ResidentRelationshipDto],
    description: 'Array of residents with their relationships',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResidentRelationshipDto)
  @IsOptional()
  residents?: ResidentRelationshipDto[];
}
