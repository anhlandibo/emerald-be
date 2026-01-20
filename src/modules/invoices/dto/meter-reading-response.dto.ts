import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class FeeTypeDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Tiền điện' })
  @Expose()
  name: string;
}

export class MeterReadingResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 1 })
  @Expose()
  feeTypeId: number;

  @ApiProperty({ type: FeeTypeDto })
  @Expose()
  @Type(() => FeeTypeDto)
  feeType: FeeTypeDto;

  @ApiProperty({
    example: '2024-01-20',
    description: 'Ngày ghi chỉ số',
  })
  @Expose()
  @Type(() => Date)
  readingDate: Date;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Kỳ tính phí',
  })
  @Expose()
  @Type(() => Date)
  billingMonth: Date;

  @ApiProperty({
    example: 100.5,
    description: 'Chỉ số cũ (lần đọc trước)',
  })
  @Expose()
  oldIndex: number;

  @ApiProperty({
    example: 150.75,
    description: 'Chỉ số mới (lần ghi hiện tại)',
  })
  @Expose()
  newIndex: number;

  @ApiProperty({
    example: 50.25,
    description: 'Lượng sử dụng (chỉ số mới - chỉ số cũ)',
  })
  @Expose()
  usageAmount: number;

  @ApiProperty({
    example: 'https://res.cloudinary.com/...',
    description: 'URL ảnh chứng minh chỉ số (của cư dân chụp)',
    required: false,
  })
  @Expose()
  imageProofUrl: string;

  @ApiProperty({
    example: true,
    description: 'Đã được admin xác minh chưa',
  })
  @Expose()
  isVerified: boolean;

  @ApiProperty({ example: '2024-01-20T10:15:30Z' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;
}
