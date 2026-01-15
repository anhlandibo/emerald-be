import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';
import { StringOptional } from 'src/decorators/dto.decorator';

export class PayBookingDto {
  @ApiProperty({
    example: PaymentMethod.MOMO,
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn phương thức thanh toán' })
  method: PaymentMethod;

  @ApiProperty({
    example: 'Thanh toán qua MoMo',
    description: 'Ghi chú',
    required: false,
  })
  @StringOptional()
  note?: string;
}
