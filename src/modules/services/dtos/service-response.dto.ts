import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ServiceType } from '../enums/service-type.enum';

@Exclude()
export class ServiceResponseDto {
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
}

@Exclude()
export class SlotAvailabilityResponseDto {
  @ApiProperty({ example: '2024-01-20T14:00:00Z' })
  @Expose()
  startTime: Date;

  @ApiProperty({ example: '2024-01-20T16:00:00Z' })
  @Expose()
  endTime: Date;

  @ApiProperty({ example: 8 })
  @Expose()
  remainingSlot: number;

  @ApiProperty({ example: true })
  @Expose()
  isAvailable: boolean;
}
