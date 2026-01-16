import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import * as XLSX from 'xlsx';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { MaintenanceTicket } from '../maintenance-tickets/entities/maintenance-ticket.entity';
import { TicketStatus } from '../maintenance-tickets/enums/ticket-status.enum';
import { AssetStatus } from '../assets/enums/asset-status.enum';
import { InvoiceStatus } from '../invoices/enums/invoice-status.enum';
import { BookingStatus } from '../bookings/enums/booking-status.enum';
import {
  DashboardStatisticsDto,
  RevenueStatisticsDto,
  DebtStatisticsDto,
  MaintenanceStatisticsDto,
  ChartDataPointDto,
  ServiceBookingChartDto,
  AssetStatusStatisticsDto,
} from './dto/dashboard-statistics.dto';
import { QueryReportDto, DateRangeType } from './dto/query-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(MaintenanceTicket)
    private readonly maintenanceTicketRepository: Repository<MaintenanceTicket>,
  ) {}

  /**
   * Get date range based on rangeType and custom dates
   */
  private getDateRange(queryDto: QueryReportDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (queryDto.rangeType === DateRangeType.DAY) {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (queryDto.rangeType === DateRangeType.MONTH) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (queryDto.rangeType === DateRangeType.YEAR) {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (queryDto.rangeType === DateRangeType.CUSTOM) {
      if (!queryDto.startDate || !queryDto.endDate) {
        throw new HttpException(
          'startDate và endDate là bắt buộc với rangeType là CUSTOM',
          HttpStatus.BAD_REQUEST,
        );
      }
      startDate = new Date(queryDto.startDate);
      endDate = new Date(queryDto.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  }

  /**
   * Get previous period date range
   */
  private getPreviousPeriodDateRange(
    rangeType: DateRangeType,
    startDate: Date,
  ): {
    startDate: Date;
    endDate: Date;
  } {
    let prevStart = new Date(startDate);
    let prevEnd = new Date(startDate);

    if (rangeType === DateRangeType.DAY) {
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (rangeType === DateRangeType.MONTH) {
      prevStart = new Date(
        startDate.getFullYear(),
        startDate.getMonth() - 1,
        1,
      );
      prevEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (rangeType === DateRangeType.YEAR) {
      prevStart = new Date(startDate.getFullYear() - 1, 0, 1);
      prevEnd = new Date(startDate.getFullYear(), 0, 0);
      prevEnd.setHours(23, 59, 59, 999);
    }

    return { startDate: prevStart, endDate: prevEnd };
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStatistics(
    startDate: Date,
    endDate: Date,
    prevStartDate: Date,
    prevEndDate: Date,
  ): Promise<RevenueStatisticsDto> {
    const currentRevenue = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.PAID })
      .select('SUM(CAST(invoice.totalAmount AS DECIMAL))', 'total')
      .getRawOne();

    const previousRevenue = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.createdAt BETWEEN :startDate AND :endDate', {
        startDate: prevStartDate,
        endDate: prevEndDate,
      })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.PAID })
      .select('SUM(CAST(invoice.totalAmount AS DECIMAL))', 'total')
      .getRawOne();

    const currentTotal = currentRevenue?.total
      ? parseFloat(currentRevenue.total)
      : 0;
    const previousTotal = previousRevenue?.total
      ? parseFloat(previousRevenue.total)
      : 0;

    let percentageCompared = 0;
    if (previousTotal > 0) {
      percentageCompared =
        ((currentTotal - previousTotal) / previousTotal) * 100;
    }

    return {
      totalRevenue: Math.round(currentTotal),
      percentageComparedToPreviousMonth:
        Math.round(percentageCompared * 100) / 100,
    };
  }

  /**
   * Get debt statistics
   */
  async getDebtStatistics(): Promise<DebtStatisticsDto> {
    // Total unpaid amount
    const debtResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: InvoiceStatus.UNPAID })
      .select('SUM(CAST(invoice.totalAmount AS DECIMAL))', 'total')
      .getRawOne();

    const totalDebt = debtResult?.total ? parseFloat(debtResult.total) : 0;

    // Count apartments with unpaid invoices
    const apartmentsOwing = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: InvoiceStatus.UNPAID })
      .select('COUNT(DISTINCT invoice.apartmentId)', 'count')
      .getRawOne();

    const totalApartmentsOwing = apartmentsOwing?.count
      ? parseInt(apartmentsOwing.count, 10)
      : 0;

    return {
      totalDebt: Math.round(totalDebt),
      totalApartmentsOwing,
    };
  }

  /**
   * Get maintenance statistics
   */
  async getMaintenanceStatistics(
    startDate: Date,
    endDate: Date,
  ): Promise<MaintenanceStatisticsDto> {
    const maintenanceCount = await this.maintenanceTicketRepository
      .createQueryBuilder('ticket')
      .where('ticket.completedDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('ticket.status = :status', { status: TicketStatus.COMPLETED })
      .getCount();

    return {
      totalAssetsMaintenanced: maintenanceCount,
    };
  }

  /**
   * Get revenue and expense chart data by day
   */
  async getRevenueExpenseChart(
    startDate: Date,
    endDate: Date,
  ): Promise<ChartDataPointDto[]> {
    const chartData: Map<string, ChartDataPointDto> = new Map();

    // Get revenue data by date
    const revenues = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.PAID })
      .select('DATE(invoice.createdAt) as date')
      .addSelect('SUM(CAST(invoice.totalAmount AS DECIMAL))', 'total')
      .groupBy('DATE(invoice.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    revenues.forEach((row) => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      const existing = chartData.get(dateStr) || {
        label: dateStr,
        revenue: 0,
        expense: 0,
      };
      existing.revenue = Math.round(parseFloat(row.total) || 0);
      chartData.set(dateStr, existing);
    });

    // Get maintenance expense data by date
    const expenses = await this.maintenanceTicketRepository
      .createQueryBuilder('ticket')
      .where('ticket.completedDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('ticket.status = :status', { status: TicketStatus.COMPLETED })
      .select('DATE(ticket.completedDate) as date')
      .addSelect('SUM(ticket.actualCost)', 'total')
      .groupBy('DATE(ticket.completedDate)')
      .orderBy('date', 'ASC')
      .getRawMany();

    expenses.forEach((row) => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      const existing = chartData.get(dateStr) || {
        label: dateStr,
        revenue: 0,
        expense: 0,
      };
      existing.expense = Math.round(parseFloat(row.total) || 0);
      chartData.set(dateStr, existing);
    });

    return Array.from(chartData.values()).sort(
      (a, b) => new Date(a.label).getTime() - new Date(b.label).getTime(),
    );
  }

  /**
   * Get service booking chart data
   */
  async getServiceBookingChart(
    startDate: Date,
    endDate: Date,
  ): Promise<ServiceBookingChartDto[]> {
    const serviceBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .where('booking.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.COMPLETED, BookingStatus.PAID],
      })
      .select('service.name', 'serviceName')
      .addSelect('COUNT(booking.id)', 'count')
      .groupBy('service.id')
      .addGroupBy('service.name')
      .orderBy('count', 'DESC')
      .getRawMany();

    return serviceBookings.map((row) => ({
      serviceName: row.serviceName,
      bookingCount: parseInt(row.count, 10),
    }));
  }

  /**
   * Get asset status statistics
   */
  async getAssetStatusStatistics(): Promise<AssetStatusStatisticsDto> {
    // Count assets by status directly from Asset entity
    const brokenAssets = await this.assetRepository.count({
      where: { status: AssetStatus.BROKEN, isActive: true },
    });

    const maintenanceAssets = await this.assetRepository.count({
      where: { status: AssetStatus.MAINTENANCE, isActive: true },
    });

    const workingAssets = await this.assetRepository.count({
      where: { status: AssetStatus.ACTIVE, isActive: true },
    });

    return {
      brokenAssets,
      maintenanceAssets,
      workingAssets,
    };
  }

  /**
   * Get complete dashboard statistics
   */
  async getDashboardStatistics(
    queryDto: QueryReportDto,
  ): Promise<DashboardStatisticsDto> {
    const { startDate, endDate } = this.getDateRange(queryDto);
    const { startDate: prevStartDate, endDate: prevEndDate } =
      this.getPreviousPeriodDateRange(
        queryDto.rangeType || DateRangeType.MONTH,
        startDate,
      );

    const [
      revenue,
      debt,
      maintenance,
      revenueExpenseChart,
      serviceBookingChart,
      assetStatus,
    ] = await Promise.all([
      this.getRevenueStatistics(startDate, endDate, prevStartDate, prevEndDate),
      this.getDebtStatistics(),
      this.getMaintenanceStatistics(startDate, endDate),
      this.getRevenueExpenseChart(startDate, endDate),
      this.getServiceBookingChart(startDate, endDate),
      this.getAssetStatusStatistics(),
    ]);

    return {
      revenue,
      debt,
      maintenance,
      revenueExpenseChart,
      serviceBookingChart,
      assetStatus,
    };
  }

  /**
   * Export dashboard statistics to Excel (XLSX format)
   */
  async exportDashboardToExcel(queryDto: QueryReportDto): Promise<Buffer> {
    const statistics = await this.getDashboardStatistics(queryDto);

    // Create array to store data
    const data: any[][] = [];

    // Add title
    data.push(['THỐNG KÊ TỔNG HỢP']);
    data.push([]);

    // Revenue section
    data.push(['DOANH THU']);
    data.push(['Tổng doanh thu', statistics.revenue.totalRevenue]);
    data.push([
      '% so với tháng trước',
      `${statistics.revenue.percentageComparedToPreviousMonth}%`,
    ]);
    data.push([]);

    // Debt section
    data.push(['CÔNG NỢ']);
    data.push(['Tổng công nợ', statistics.debt.totalDebt]);
    data.push(['Số căn hộ còn nợ', statistics.debt.totalApartmentsOwing]);
    data.push([]);

    // Maintenance section
    data.push(['BẢO TRÌ']);
    data.push([
      'Số thiết bị đã bảo trì',
      statistics.maintenance.totalAssetsMaintenanced,
    ]);
    data.push([]);

    // Asset status section
    data.push(['TÀI SẢN THIẾT BỊ']);
    data.push(['Hư hỏng', statistics.assetStatus.brokenAssets]);
    data.push(['Đang bảo trì', statistics.assetStatus.maintenanceAssets]);
    data.push(['Hoạt động tốt', statistics.assetStatus.workingAssets]);
    data.push([]);
    data.push([]);

    // Revenue & Expense Chart
    data.push(['DOANH THU & CHI PHÍ']);
    data.push(['Ngày', 'Doanh thu', 'Chi phí']);
    statistics.revenueExpenseChart.forEach((row) => {
      data.push([row.label, row.revenue || 0, row.expense || 0]);
    });
    data.push([]);
    data.push([]);

    // Service Bookings
    data.push(['DỊCH VỤ - LƯỢT BOOKING']);
    data.push(['Tên dịch vụ', 'Số lượt booking']);
    statistics.serviceBookingChart.forEach((row) => {
      data.push([row.serviceName, row.bookingCount]);
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Column A
      { wch: 20 }, // Column B
      { wch: 20 }, // Column C
      { wch: 20 }, // Column D
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');

    // Write to buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    return excelBuffer as Buffer;
  }
}
