/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString, IsInt, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateInvoiceAdminDto {
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
    example: 1,
    description: 'ID căn hộ',
  })
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt()
  @IsNotEmpty()
  apartmentId: number;

  @ApiProperty({
    example: '2024-01-05T10:15:30Z',
    description:
      'Kỳ thanh toán (ngày bất kỳ trong tháng). Backend sẽ tự normalize về ngày 1st của tháng đó. Ví dụ: 2024-01-05, 2024-01-15, 2024-01-31 đều sẽ thành 2024-01-01. KHÔNG được là ngày trong tương lai.',
  })
  @IsDateString()
  @IsNotEmpty()
  period: string;
}
