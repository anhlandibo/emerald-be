import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InvoiceStatus } from '../enums/invoice-status.enum';

class InvoiceDetailItemDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 1 })
  @Expose()
  feeTypeId: number;

  @ApiProperty({ example: 'Tiền điện' })
  @Expose()
  feeTypeName: string;

  @ApiProperty({ example: 100 })
  @Expose()
  amount: number;

  @ApiProperty({ example: 1600 })
  @Expose()
  unitPrice: number;

  @ApiProperty({ example: 160000 })
  @Expose()
  totalPrice: number;

  @ApiProperty({
    example: { 'Bậc 1': '50*1600', 'Bậc 2': '50*1700' },
    required: false,
  })
  @Expose()
  calculationBreakdown: Record<string, string>;
}

export class InvoiceDetailResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'INV-202401-A101' })
  @Expose()
  invoiceCode: string;

  @ApiProperty({ example: 12 })
  @Expose()
  apartmentId: number;

  @ApiProperty({ example: '2024-01-01' })
  @Expose()
  period: Date;

  @ApiProperty({ example: 1500000.0 })
  @Expose()
  totalAmount: number;

  @ApiProperty({ example: InvoiceStatus.UNPAID, enum: InvoiceStatus })
  @Expose()
  status: InvoiceStatus;

  @ApiProperty({ type: [InvoiceDetailItemDto] })
  @Expose()
  @Type(() => InvoiceDetailItemDto)
  invoiceDetails: InvoiceDetailItemDto[];

  @ApiProperty({ example: '2024-01-05T10:15:30Z' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ example: '2024-01-05T10:15:30Z' })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
