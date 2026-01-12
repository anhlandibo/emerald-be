/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateInvoiceClientDto {
  @ApiProperty({
    example: 100,
    description: 'Chỉ số nước mới',
  })
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber()
  @IsNotEmpty()
  waterIndex: number;

  @ApiProperty({
    example: 200,
    description: 'Chỉ số điện mới',
  })
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber()
  @IsNotEmpty()
  electricityIndex: number;

  @ApiProperty({
    example: '2024-01-05T10:15:30Z',
    description: 'Kỳ thanh toán',
  })
  @IsDateString()
  @IsNotEmpty()
  period: string;
}
