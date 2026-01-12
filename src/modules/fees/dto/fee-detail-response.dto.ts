import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { FeeType } from '../enums/fee-type.enum';

class FeeTierDto {
  @ApiProperty({
    example: 1,
    description: 'Tier ID',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Bậc 1',
    description: 'Tier name',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 0,
    description: 'From value',
  })
  @Expose()
  fromValue: number;

  @ApiProperty({
    example: 50,
    description: 'To value (null for infinity)',
  })
  @Expose()
  toValue: number;

  @ApiProperty({
    example: 1806,
    description: 'Unit price',
  })
  @Expose()
  unitPrice: number;
}

@Exclude()
export class FeeDetailResponseDto {
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
    type: [FeeTierDto],
    description: 'Tiers list',
  })
  @Expose()
  @Type(() => FeeTierDto)
  tiers: FeeTierDto[];

  @ApiProperty({
    example: '2026-01-10T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2026-01-10T10:00:00.000Z',
    description: 'Last update timestamp',
  })
  @Expose()
  updatedAt: Date;
}
