import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentTargetType } from '../enums/payment-target-type.enum';
import { PaymentGateway } from '../enums/payment-gateway.enum';

export class PaymentResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  txnRef: string;

  @ApiProperty({ enum: PaymentTargetType })
  @Expose()
  targetType: PaymentTargetType;

  @ApiProperty()
  @Expose()
  targetId: number;

  @ApiProperty()
  @Expose()
  amount: number;

  @ApiProperty()
  @Expose()
  currency: string;

  @ApiProperty({ enum: PaymentGateway })
  @Expose()
  paymentMethod: PaymentGateway;

  @ApiProperty({ enum: PaymentStatus })
  @Expose()
  status: PaymentStatus;

  @ApiProperty({ required: false })
  @Expose()
  description?: string;

  @ApiProperty({ required: false })
  @Expose()
  paymentUrl?: string;

  @ApiProperty({ required: false })
  @Expose()
  expiresAt?: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ required: false })
  @Expose()
  payDate?: Date;
}
