import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RelationshipType } from 'src/modules/apartments/enums/relationship-type.enum';

export class ResidenceApartmentDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: '101' })
  @Expose()
  roomNumber: string;

  @ApiProperty({ example: 'A' })
  @Expose()
  blockName: string;

  @ApiProperty({ example: 75.5 })
  @Expose()
  area: number;
}

export class ResidenceInfoDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 1 })
  @Expose()
  apartmentId: number;

  @ApiProperty({ type: ResidenceApartmentDto })
  @Expose()
  @Type(() => ResidenceApartmentDto)
  apartment: ResidenceApartmentDto;

  @ApiProperty({ enum: RelationshipType, example: RelationshipType.OWNER })
  @Expose()
  relationship: RelationshipType;
}

export class ResidentResidencesResponseDto {
  @ApiProperty({ type: [ResidenceInfoDto] })
  @Expose()
  @Type(() => ResidenceInfoDto)
  residences: ResidenceInfoDto[];
}
