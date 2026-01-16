import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ServiceType } from '../enums/service-type.enum';
import { BookingStatus } from '../../bookings/enums/booking-status.enum';

class BookingHistoryItem {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'BKG-20240120-001' })
  @Expose()
  code: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Expose()
  residentName: string;

  @ApiProperty({ example: '0901234567' })
  @Expose()
  phoneNumber: string;

  @ApiProperty({ example: '2024-01-20' })
  @Expose()
  bookingDate: Date;

  @ApiProperty({ example: 50000 })
  @Expose()
  unitPrice: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        startTime: { type: 'string', example: '14:00' },
        endTime: { type: 'string', example: '15:00' },
      },
    },
    example: [
      { startTime: '14:00', endTime: '15:00' },
      { startTime: '16:00', endTime: '17:00' },
    ],
  })
  @Expose()
  @Type(() => Object)
  timestamps: { startTime: string; endTime: string }[];

  @ApiProperty({ example: 100000 })
  @Expose()
  totalPrice: number;

  @ApiProperty({ example: BookingStatus.PAID, enum: BookingStatus })
  @Expose()
  status: string;

  @ApiProperty({ example: 'Đã thanh toán' })
  @Expose()
  statusLabel: string;

  @ApiProperty({ example: '2024-01-20T14:00:00Z' })
  @Expose()
  createdAt: Date;
}

@Exclude()
export class ServiceDetailResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Bể bơi' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Bể bơi ngoài trời' })
  @Expose()
  description: string;

  @ApiProperty({ example: '06:00' })
  @Expose()
  openHour: string;

  @ApiProperty({ example: '22:00' })
  @Expose()
  closeHour: string;

  @ApiProperty({ example: 'https://cloudinary.com/image.jpg' })
  @Expose()
  imageUrl: string;

  @ApiProperty({ example: 50000 })
  @Expose()
  unitPrice: number;

  @ApiProperty({ example: 60 })
  @Expose()
  unitTimeBlock: number;

  @ApiProperty({ example: 10 })
  @Expose()
  totalSlot: number;

  @ApiProperty({ example: ServiceType.NORMAL, enum: ServiceType })
  @Expose()
  type: string;

  @ApiProperty({ example: 'Dịch vụ thường' })
  @Expose()
  typeLabel: string;

  @ApiProperty({ example: '2024-01-10T08:00:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    type: [BookingHistoryItem],
    description: 'Lịch sử đặt dịch vụ',
  })
  @Expose()
  @Type(() => BookingHistoryItem)
  bookingHistory: BookingHistoryItem[];
}
