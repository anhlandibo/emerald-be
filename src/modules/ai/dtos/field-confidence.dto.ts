import { ApiProperty } from '@nestjs/swagger';

export class FieldConfidenceDto {
  @ApiProperty({
    example: 0.95,
    description: 'Confidence score for name field',
  })
  name: number;

  @ApiProperty({ example: 0.99, description: 'Confidence score for ID number' })
  id_number: number;

  @ApiProperty({
    example: 0.98,
    description: 'Confidence score for date of birth',
  })
  date_of_birth: number;

  @ApiProperty({
    example: 0.95,
    description: 'Confidence score for expiration date',
  })
  date_expiration: number;

  @ApiProperty({ example: 0.99, description: 'Confidence score for gender' })
  gender: number;

  @ApiProperty({
    example: 0.99,
    description: 'Confidence score for nationality',
  })
  nationality: number;

  @ApiProperty({
    example: 0.9,
    description: 'Confidence score for native place',
  })
  native_place: number;

  @ApiProperty({
    example: 0.9,
    description: 'Confidence score for place of residence',
  })
  place_of_residence: number;
}
