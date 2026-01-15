import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { PaymentTargetType } from '../enums/payment-target-type.enum';
import { PaymentGateway } from '../enums/payment-gateway.enum';

export class CreatePaymentDto {
  @ApiProperty({
    enum: PaymentTargetType,
    example: PaymentTargetType.INVOICE,
    description: 'Type of target (INVOICE or BOOKING)',
  })
  @IsEnum(PaymentTargetType)
  @IsNotEmpty()
  targetType: PaymentTargetType;

  @ApiProperty({
    example: 1,
    description: 'ID of the invoice or booking',
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  targetId: number;

  @ApiProperty({
    enum: PaymentGateway,
    example: PaymentGateway.MOMO,
    description: 'Payment gateway to use (MOMO or VNPAY)',
  })
  @IsEnum(PaymentGateway)
  @IsNotEmpty()
  paymentMethod: PaymentGateway;
}
