import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { MeterReadingResponseDto } from './meter-reading-response.dto';

class ApartmentInfoDto {
  @ApiProperty({ example: 12 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'A101' })
  @Expose()
  name: string;
}

export class ClientCreatedInvoiceResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'INV-202401-A101' })
  @Expose()
  invoiceCode: string;

  @ApiProperty({ example: 12 })
  @Expose()
  apartmentId: number;

  @ApiProperty({
    type: ApartmentInfoDto,
    description: 'Thông tin căn hộ (để dễ dàng nhận diện)',
  })
  @Expose()
  @Type(() => ApartmentInfoDto)
  apartment: ApartmentInfoDto;

  @ApiProperty({ example: '2024-01-01' })
  @Expose()
  @Type(() => Date)
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

  @ApiProperty({
    example: '2024-01-16',
    description: 'Hạn thanh toán',
  })
  @Expose()
  @Type(() => Date)
  dueDate: Date;

  @ApiProperty({
    type: [MeterReadingResponseDto],
    description:
      'Danh sách chỉ số meter được ghi nhận cho hóa đơn này. Mỗi item là 1 chỉ số (điện, nước, etc.) được cư dân gửi lên. Bao gồm chỉ số cũ, chỉ số mới, lượng sử dụng, ảnh chứng minh.',
  })
  @Expose()
  @Type(() => MeterReadingResponseDto)
  meterReadings: MeterReadingResponseDto[];

  @ApiProperty({ example: '2024-01-20T10:15:30Z' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:15:30Z' })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
