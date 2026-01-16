import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RevenueStatisticsDto {
  @ApiProperty({
    type: Number,
    description: 'Tổng doanh thu',
    example: 50000000,
  })
  @Expose()
  totalRevenue: number;

  @ApiProperty({
    type: Number,
    description: 'Phần trăm so với tháng trước',
    example: 8.5,
  })
  @Expose()
  percentageComparedToPreviousMonth: number;
}

export class DebtStatisticsDto {
  @ApiProperty({
    type: Number,
    description: 'Tổng công nợ',
    example: 15000000,
  })
  @Expose()
  totalDebt: number;

  @ApiProperty({
    type: Number,
    description: 'Số căn hộ còn nợ',
    example: 32,
  })
  @Expose()
  totalApartmentsOwing: number;
}

export class MaintenanceStatisticsDto {
  @ApiProperty({
    type: Number,
    description: 'Số thiết bị đã bảo trì',
    example: 45,
  })
  @Expose()
  totalAssetsMaintenanced: number;
}

export class ChartDataPointDto {
  @ApiProperty({
    description: 'Nhãn trục X',
    example: '2025-01-01',
  })
  @Expose()
  label: string;

  @ApiProperty({
    type: Number,
    description: 'Giá trị doanh thu',
    example: 5000000,
  })
  @Expose()
  revenue?: number;

  @ApiProperty({
    type: Number,
    description: 'Giá trị chi phí',
    example: 2000000,
  })
  @Expose()
  expense?: number;

  @ApiProperty({
    type: Number,
    description: 'Số lượt booking',
    example: 45,
  })
  @Expose()
  bookingCount?: number;
}

export class ServiceBookingChartDto {
  @ApiProperty({
    description: 'Tên dịch vụ',
    example: 'Tennis',
  })
  @Expose()
  serviceName: string;

  @ApiProperty({
    type: Number,
    description: 'Số lượt booking',
    example: 45,
  })
  @Expose()
  bookingCount: number;
}

export class AssetStatusStatisticsDto {
  @ApiProperty({
    type: Number,
    description: 'Số thiết bị hư hỏng',
    example: 16,
  })
  @Expose()
  brokenAssets: number;

  @ApiProperty({
    type: Number,
    description: 'Số thiết bị đang bảo trì',
    example: 45,
  })
  @Expose()
  maintenanceAssets: number;

  @ApiProperty({
    type: Number,
    description: 'Số thiết bị hoạt động tốt',
    example: 2113,
  })
  @Expose()
  workingAssets: number;
}

export class DashboardStatisticsDto {
  @ApiProperty({
    type: RevenueStatisticsDto,
    description: 'Thống kê doanh thu',
  })
  @Expose()
  revenue: RevenueStatisticsDto;

  @ApiProperty({
    type: DebtStatisticsDto,
    description: 'Thống kê công nợ',
  })
  @Expose()
  debt: DebtStatisticsDto;

  @ApiProperty({
    type: MaintenanceStatisticsDto,
    description: 'Thống kê bảo trì',
  })
  @Expose()
  maintenance: MaintenanceStatisticsDto;

  @ApiProperty({
    type: [ChartDataPointDto],
    description: 'Dữ liệu biểu đồ doanh thu & chi phí',
  })
  @Expose()
  revenueExpenseChart: ChartDataPointDto[];

  @ApiProperty({
    type: [ServiceBookingChartDto],
    description: 'Dữ liệu biểu đồ dịch vụ',
  })
  @Expose()
  serviceBookingChart: ServiceBookingChartDto[];

  @ApiProperty({
    type: AssetStatusStatisticsDto,
    description: 'Thống kê tài sản thiết bị',
  })
  @Expose()
  assetStatus: AssetStatusStatisticsDto;
}
