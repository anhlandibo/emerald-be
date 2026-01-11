import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ApartmentType } from '../../apartments/enums/apartment-type.enum';

class BlockApartmentDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'A-10.01' })
  @Expose()
  roomName: string;

  @ApiProperty({ example: 'STUDIO', enum: ApartmentType })
  @Expose()
  type: string;

  @ApiProperty({ example: 100 })
  @Expose()
  area: number;

  @ApiProperty({ example: 10 })
  @Expose()
  floor: number;
}

@Exclude()
export class BlockDetailResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the block',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Tòa A - Sakura',
    description: 'Name of the block',
  })
  @Expose()
  buildingName: string;

  @ApiProperty({
    example: 'Đang vận hành',
    description: 'Status of the block',
  })
  @Expose()
  status: string;

  @ApiProperty({
    example: 10,
    description: 'Total floors',
  })
  @Expose()
  totalFloors: number;

  @ApiProperty({
    example: 'Tú Lê',
    description: 'Manager name',
  })
  @Expose()
  managerName: string;

  @ApiProperty({
    example: '0838764532',
    description: 'Manager phone number',
  })
  @Expose()
  managerPhone: string;

  @ApiProperty({
    example: 91,
    description: 'Total number of apartments',
  })
  @Expose()
  totalRooms: number;

  @ApiProperty({
    type: [BlockApartmentDto],
    description: 'List of apartments in this block',
  })
  @Expose()
  apartments: BlockApartmentDto[];
}
