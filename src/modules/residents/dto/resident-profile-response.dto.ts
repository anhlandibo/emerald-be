import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Gender } from '../enums/gender.enum';
import { ApartmentType } from '../../apartments/enums/apartment-type.enum';
import { PaymentResponseDto } from '../../payments/dto/payment-response.dto';

class BlockInfoDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'A' })
  @Expose()
  name: string;
}

class ApartmentDetailDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'A-12.05' })
  @Expose()
  name: string;

  @ApiProperty({ example: 12 })
  @Expose()
  floor: number;

  @ApiProperty({ example: 'STUDIO', enum: ApartmentType })
  @Expose()
  type: ApartmentType;

  @ApiProperty({ example: 85.5 })
  @Expose()
  area: number;

  @ApiProperty({ type: BlockInfoDto })
  @Expose()
  @Type(() => BlockInfoDto)
  block: BlockInfoDto;

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  createdAt: Date;
}

class ApartmentWithRelationshipDto {
  @ApiProperty({ type: ApartmentDetailDto })
  @Expose()
  @Type(() => ApartmentDetailDto)
  apartment: ApartmentDetailDto;

  @ApiProperty({
    example: 'OWNER',
    description: 'Relationship of the resident to the apartment',
  })
  @Expose()
  relationship: string;
}

class BookingProfileDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'BK-202401-001' })
  @Expose()
  code: string;

  @ApiProperty({ example: '2024-01-05' })
  @Expose()
  bookingDate: Date;

  @ApiProperty({
    example: {
      startTime: '09:00',
      endTime: '11:00',
    },
  })
  @Expose()
  timestamps: { startTime: string; endTime: string }[];

  @ApiProperty({ example: 50000 })
  @Expose()
  unitPrice: number;

  @ApiProperty({ example: 100000 })
  @Expose()
  totalPrice: number;

  @ApiProperty({ example: 'PENDING' })
  @Expose()
  status: string;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}

@Exclude()
export class ResidentProfileResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the resident',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 1,
    description: 'Account ID associated with the resident',
  })
  @Expose()
  accountId: number;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Full name of the resident',
  })
  @Expose()
  fullName: string;

  @ApiProperty({
    example: '079203001234',
    description: 'Citizen ID (CCCD)',
  })
  @Expose()
  citizenId: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    description: 'Image URL of the resident',
  })
  @Expose()
  imageUrl: string;

  @ApiProperty({
    example: '2000-01-01',
    description: 'Date of birth',
  })
  @Expose()
  dob: Date;

  @ApiProperty({
    example: Gender.MALE,
    description: 'Gender of the resident',
    enum: Gender,
  })
  @Expose()
  gender: Gender;

  @ApiProperty({
    example: '0901234567',
    description: 'Phone number',
  })
  @Expose()
  phoneNumber: string;

  @ApiProperty({
    example: 'Việt Nam',
    description: 'Nationality',
  })
  @Expose()
  nationality: string;

  @ApiProperty({
    example: 'Hồ Chí Minh',
    description: 'Province/City',
  })
  @Expose()
  province: string;

  @ApiProperty({
    example: 'Quận 1',
    description: 'District',
    required: false,
  })
  @Expose()
  district: string | null;

  @ApiProperty({
    example: 'Phường Bến Nghé',
    description: 'Ward',
  })
  @Expose()
  ward: string;

  @ApiProperty({
    example: '123 Đường Nguyễn Huệ',
    description: 'Detailed address',
  })
  @Expose()
  detailAddress: string;

  @ApiProperty({
    example: true,
    description: 'Whether the resident is active',
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    type: [ApartmentWithRelationshipDto],
    description:
      'List of apartments managed by this resident with their relationship',
  })
  @Expose()
  @Type(() => ApartmentWithRelationshipDto)
  apartments: ApartmentWithRelationshipDto[];

  @ApiProperty({
    type: [BookingProfileDto],
    description: 'List of bookings for this resident',
  })
  @Expose()
  @Type(() => BookingProfileDto)
  bookings: BookingProfileDto[];

  @ApiProperty({
    type: [PaymentResponseDto],
    description: 'List of payment transactions for this resident',
  })
  @Expose()
  @Type(() => PaymentResponseDto)
  payments: PaymentResponseDto[];

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Account creation timestamp',
  })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-05T10:15:30Z',
    description: 'Last update timestamp',
  })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
