import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { BookingStatus } from '../enums/booking-status.enum';

class ServiceDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Bể bơi' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'https://cloudinary.com/image.jpg' })
  @Expose()
  imageUrl: string;
}

class ResidentDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Expose()
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @Expose()
  phoneNumber: string;
}

class SlotItem {
  @ApiProperty({ example: '14:00' })
  @Expose()
  startTime: string;

  @ApiProperty({ example: '15:00' })
  @Expose()
  endTime: string;
}

@Exclude()
export class BookingResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'BKG-20240120-001' })
  @Expose()
  code: string;

  @ApiProperty({ type: ServiceDto })
  @Expose()
  @Type(() => ServiceDto)
  service: ServiceDto | null;

  @ApiProperty({ type: ResidentDto })
  @Expose()
  @Type(() => ResidentDto)
  resident: ResidentDto | null;

  @ApiProperty({ example: '2024-01-20' })
  @Expose()
  bookingDate: string;

  @ApiProperty({
    type: [SlotItem],
    example: [
      { startTime: '14:00', endTime: '15:00' },
      { startTime: '16:00', endTime: '17:00' },
    ],
  })
  @Expose()
  @Type(() => SlotItem)
  timestamps: SlotItem[];

  @ApiProperty({ example: 50000 })
  @Expose()
  unitPrice: number;

  @ApiProperty({ example: 100000 })
  @Expose()
  totalPrice: number;

  @ApiProperty({ example: BookingStatus.PENDING, enum: BookingStatus })
  @Expose()
  status: string;

  @ApiProperty({ example: 'Chờ thanh toán' })
  @Expose()
  statusLabel: string;

  @ApiProperty({ example: '2024-01-20T14:15:00Z', nullable: true })
  @Expose()
  expiresAt: Date | null;

  @ApiProperty({ example: '2024-01-20T14:00:00Z' })
  @Expose()
  createdAt: Date;
}
