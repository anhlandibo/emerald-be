import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class MonthlyReportDataDto {
  @ApiProperty({
    description: 'Tháng (YYYY-MM)',
    example: '2025-12',
  })
  @Expose()
  month: string;

  @ApiProperty({
    type: Number,
    description: 'Doanh thu (tiền sau khi tính VAT)',
    example: 354345,
  })
  @Expose()
  electricityRevenue: number;

  @ApiProperty({
    type: Number,
    description: 'Tiền nước',
    example: 154345,
  })
  @Expose()
  waterRevenue: number;

  @ApiProperty({
    type: Number,
    description: 'Phí quản lý / Phí dịch vụ',
    example: 50000,
  })
  @Expose()
  managementFeeRevenue: number;

  @ApiProperty({
    type: Number,
    description: 'Tổng doanh thu trong tháng (cộng lại)',
    example: 558690,
  })
  @Expose()
  totalRevenue: number;

  @ApiProperty({
    type: Number,
    description: 'Tổng hóa đơn tạo',
    example: 45,
  })
  @Expose()
  invoiceCount: number;

  @ApiProperty({
    type: Number,
    description: 'Hóa đơn đã thanh toán',
    example: 30,
  })
  @Expose()
  paidInvoiceCount: number;

  @ApiProperty({
    type: Number,
    description: 'Công nợ còn lại',
    example: 125000,
  })
  @Expose()
  unpaidAmount: number;
}

export class MonthlyReportsResponseDto {
  @ApiProperty({
    type: [MonthlyReportDataDto],
    description: 'Dữ liệu 6 tháng gần nhất theo thứ tự từ cũ đến mới',
  })
  @Expose()
  @Type(() => MonthlyReportDataDto)
  data: MonthlyReportDataDto[];

  @ApiProperty({
    description: 'Tháng đầu tiên của dữ liệu (YYYY-MM)',
    example: '2025-08',
  })
  @Expose()
  startMonth: string;

  @ApiProperty({
    description: 'Tháng cuối cùng của dữ liệu (YYYY-MM)',
    example: '2026-01',
  })
  @Expose()
  endMonth: string;

  @ApiProperty({
    type: Number,
    description: 'Tổng doanh thu 6 tháng',
    example: 3000000,
  })
  @Expose()
  totalRevenue6Months: number;

  @ApiProperty({
    type: Number,
    description: 'Trung bình doanh thu mỗi tháng',
    example: 500000,
  })
  @Expose()
  averageMonthlyRevenue: number;

  @ApiProperty({
    type: Number,
    description: 'Công nợ hiện tại',
    example: 850000,
  })
  @Expose()
  currentDebt: number;
}
