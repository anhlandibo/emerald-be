import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { BlockStatus } from '../enums/block-status.enum';

class RoomDetailsDto {
  @ApiProperty({ example: 90 })
  @Expose()
  studio: number;

  @ApiProperty({ example: 1 })
  @Expose()
  oneBedroom: number;

  @ApiProperty({ example: 0 })
  @Expose()
  twoBedroom: number;

  @ApiProperty({ example: 0 })
  @Expose()
  penthouse: number;
}

@Exclude()
export class BlockListResponseDto {
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
    type: RoomDetailsDto,
    description: 'Breakdown of apartment types',
  })
  @Expose()
  roomDetails: RoomDetailsDto;
}
