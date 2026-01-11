import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ApartmentType } from '../enums/apartment-type.enum';

@Exclude()
export class ApartmentListResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the apartment',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'A.12-01',
    description: 'Room name',
  })
  @Expose()
  roomName: string;

  @ApiProperty({
    example: 'STUDIO',
    description: 'Apartment type',
    enum: ApartmentType,
  })
  @Expose()
  type: ApartmentType;

  @ApiProperty({
    example: 'A',
    description: 'Block name',
  })
  @Expose()
  block: string;

  @ApiProperty({
    example: 12,
    description: 'Floor number',
  })
  @Expose()
  floor: number;

  @ApiProperty({
    example: 400,
    description: 'Area in square meters',
  })
  @Expose()
  area: number;

  @ApiProperty({
    example: 'Phuc Nguyen',
    description: 'Owner full name',
  })
  @Expose()
  owner: string;

  @ApiProperty({
    example: 'Trống',
    description: 'Apartment status (Trống or Đang ở)',
  })
  @Expose()
  status: string;
}
