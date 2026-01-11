import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { FeeType } from '../enums/fee-type.enum';

@Exclude()
export class FeeListResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the fee',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Tiền điện',
    description: 'Name of the fee',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'kwh',
    description: 'Unit',
  })
  @Expose()
  unit: string;

  @ApiProperty({
    example: FeeType.METERED,
    description: 'Fee type',
    enum: FeeType,
  })
  @Expose()
  type: FeeType;

  @ApiProperty({
    example: 'Phí tiền điện theo bậc thang EVN',
    description: 'Description',
  })
  @Expose()
  description: string;

  @ApiProperty({
    example: 6,
    description: 'Number of tiers',
  })
  @Expose()
  tierCount: number;

  @ApiProperty({
    example: '2026-01-10T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  @Expose()
  createdAt: Date;
}
