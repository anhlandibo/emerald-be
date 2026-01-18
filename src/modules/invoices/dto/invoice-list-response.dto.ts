import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InvoiceStatus } from '../enums/invoice-status.enum';

export class InvoiceListResponseDto {
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

  @ApiProperty({ example: 1500000.0, description: 'Tiền trước khi tính thuế' })
  @Expose()
  subtotalAmount: number;

  @ApiProperty({ example: 120000.0, description: 'Tiền thuế VAT' })
  @Expose()
  vatAmount: number;

  @ApiProperty({
    example: 1620000.0,
    description: 'Tổng tiền sau khi tính thuế',
  })
  @Expose()
  totalAmount: number;

  @ApiProperty({ example: InvoiceStatus.UNPAID, enum: InvoiceStatus })
  @Expose()
  status: InvoiceStatus;

  @ApiProperty({ example: '2024-01-05T10:15:30Z' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ example: '2024-01-05T10:15:30Z' })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
