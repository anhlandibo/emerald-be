import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreatePaymentResponseDto {
  @ApiProperty()
  @Expose()
  transactionId: number;

  @ApiProperty()
  @Expose()
  txnRef: string;

  @ApiProperty()
  @Expose()
  paymentUrl: string;

  @ApiProperty()
  @Expose()
  amount: number;

  @ApiProperty()
  @Expose()
  expiresAt: Date;
}
