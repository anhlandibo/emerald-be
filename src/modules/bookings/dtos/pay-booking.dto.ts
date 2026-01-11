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
  @IsEnum(PaymentMethod, { message: 'Method must be a valid payment method' })
  @IsNotEmpty({ message: 'Payment method cannot be empty' })
  method: PaymentMethod;

  @ApiProperty({
    example: 'Thanh toán qua MoMo',
    description: 'Ghi chú',
    required: false,
  })
  @StringOptional()
  note?: string;
}
