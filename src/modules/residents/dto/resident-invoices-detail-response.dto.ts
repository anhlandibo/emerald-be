import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InvoiceListResponseDto } from '../../invoices/dto/invoice-list-response.dto';
import { PaymentResponseDto } from '../../payments/dto/payment-response.dto';

export class ResidentInvoicesDetailResponseDto {
  @ApiProperty({
    type: [InvoiceListResponseDto],
    description: 'List of invoices for this resident across all apartments',
  })
  @Expose()
  @Type(() => InvoiceListResponseDto)
  invoices: InvoiceListResponseDto[];

  @ApiProperty({
    type: [PaymentResponseDto],
    description: 'List of payment transactions for this resident',
  })
  @Expose()
  @Type(() => PaymentResponseDto)
  payments: PaymentResponseDto[];
}
