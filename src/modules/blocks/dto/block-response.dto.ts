import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { BlockStatus } from '../enums/block-status.enum';

@Exclude()
export class BlockResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the block',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Emerald A',
    description: 'Name of the block',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Manager name',
  })
  @Expose()
  managerName: string;

  @ApiProperty({
    example: '0901234567',
    description: 'Manager phone number',
  })
  @Expose()
  managerPhone: string;

  @ApiProperty({
    example: 30,
    description: 'Total floors',
  })
  @Expose()
  totalFloors: number;

  @ApiProperty({
    example: BlockStatus.OPERATING,
    description: 'Status of the block',
    enum: BlockStatus,
  })
  @Expose()
  status: BlockStatus;

  @ApiProperty({
    example: true,
    description: 'Whether the block is active',
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'The creation date of the block',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'The last update date of the block',
  })
  @Expose()
  updatedAt: Date;
}
