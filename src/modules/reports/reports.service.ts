import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import * as XLSX from 'xlsx';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoiceDetail } from '../invoices/entities/invoice-detail.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { MaintenanceTicket } from '../maintenance-tickets/entities/maintenance-ticket.entity';
import { ApartmentResident } from '../apartments/entities/apartment-resident.entity';
import { TicketStatus } from '../maintenance-tickets/enums/ticket-status.enum';
import { AssetStatus } from '../assets/enums/asset-status.enum';
import { InvoiceStatus } from '../invoices/enums/invoice-status.enum';
import { BookingStatus } from '../bookings/enums/booking-status.enum';
import { FeeType } from '../fees/enums/fee-type.enum';
import {
  DashboardStatisticsDto,
  RevenueStatisticsDto,
  DebtStatisticsDto,
  MaintenanceStatisticsDto,
  ChartDataPointDto,
  ServiceBookingChartDto,
  AssetStatusStatisticsDto,
} from './dto/dashboard-statistics.dto';
import {
  MonthlyReportsResponseDto,
  MonthlyReportDataDto,
} from './dto/monthly-reports.dto';
import { QueryReportDto } from './dto/query-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceDetail)
    private readonly invoiceDetailRepository: Repository<InvoiceDetail>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(MaintenanceTicket)
    private readonly maintenanceTicketRepository: Repository<MaintenanceTicket>,
    @InjectRepository(ApartmentResident)
    private readonly apartmentResidentRepository: Repository<ApartmentResident>,
  ) {}

  /**
   * Parse and validate date range from query
   */
  private parseDateRange(queryDto: QueryReportDto): {
    startDate: Date;
    endDate: Date;
  } {
    const startDate = new Date(queryDto.startDate);
    const endDate = new Date(queryDto.endDate);

    // Validate date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new HttpException(
        'Ngày bắt đầu và ngày kết thúc phải hợp lệ (ISO format: YYYY-MM-DD)',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (startDate > endDate) {
      throw new HttpException(
        'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Set time to full day range
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  /**
   * Calculate previous period date range (same duration as current)
   * Calculates dates for comparison analytics
   */
  private calculatePreviousPeriod(
    startDate: Date,
    endDate: Date,
  ): { prevStartDate: Date; prevEndDate: Date } {
    // Calculate number of days in current period
    const currentStart = new Date(startDate);
    currentStart.setHours(0, 0, 0, 0);

    const currentEnd = new Date(endDate);
    currentEnd.setHours(0, 0, 0, 0);

    const durationDays = Math.ceil(
      (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Previous period: go back by duration days
    const prevEndDate = new Date(currentStart);
    prevEndDate.setDate(prevEndDate.getDate() - 1); // Last day before current period
    prevEndDate.setHours(23, 59, 59, 999);

    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - durationDays + 1);
    prevStartDate.setHours(0, 0, 0, 0);

    return { prevStartDate, prevEndDate };
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
   * Get debt statistics - unpaid invoices in current period
   */
  async getDebtStatistics(
    startDate: Date,
    endDate: Date,
  ): Promise<DebtStatisticsDto> {
    // Total unpaid amount in date range
    const debtResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.UNPAID })
      .select('SUM(CAST(invoice.totalAmount AS DECIMAL))', 'total')
      .getRawOne();

    const totalDebt = debtResult?.total ? parseFloat(debtResult.total) : 0;

    // Count apartments with unpaid invoices in date range
    const apartmentsOwing = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.UNPAID })
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

    return Array.from(chartData.values())
      .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime())
      .slice(0, 4); // Limit to 4 days for consistency
  }

  /**
   * Get service booking chart data
   */
  async getServiceBookingChart(
    startDate: Date,
    endDate: Date,
  ): Promise<ServiceBookingChartDto[]> {
    // Get top 4 services by booking count (including those with 0 bookings)
    const serviceBookings = await this.serviceRepository
      .createQueryBuilder('service')
      .select('service.id', 'id')
      .addSelect('service.name', 'serviceName')
      .addSelect((qb) => {
        return qb
          .select('COUNT(booking.id)', 'count')
          .from(Booking, 'booking')
          .where('booking.serviceId = service.id')
          .andWhere('booking.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
          })
          .andWhere('booking.status IN (:...statuses)', {
            statuses: [BookingStatus.COMPLETED, BookingStatus.PAID],
          });
      }, 'count')
      .orderBy('count', 'DESC')
      .addOrderBy('service.name', 'ASC')
      .limit(4)
      .getRawMany();

    return serviceBookings.map((row) => ({
      serviceName: row.serviceName,
      bookingCount: parseInt(row.count || 0, 10),
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
    const { startDate, endDate } = this.parseDateRange(queryDto);
    const { prevStartDate, prevEndDate } = this.calculatePreviousPeriod(
      startDate,
      endDate,
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
      this.getDebtStatistics(startDate, endDate),
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
   * Get the latest month with invoices
   */
  private async getLatestInvoiceMonth(): Promise<Date | null> {
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('MAX(invoice.period)', 'latestMonth')
      .getRawOne();

    if (!result?.latestMonth) {
      return null;
    }

    const latestMonth = new Date(result.latestMonth);
    latestMonth.setDate(1); // Set to first day of month
    latestMonth.setHours(0, 0, 0, 0);

    return latestMonth;
  }

  /**
   * Calculate date range for a specific month
   */
  private getMonthDateRange(
    year: number,
    month: number,
  ): { start: Date; end: Date } {
    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Get 6 months of revenue report data
   */
  async getMonthlyReports(): Promise<MonthlyReportsResponseDto> {
    // Get the latest month with invoices
    const latestMonth = await this.getLatestInvoiceMonth();

    if (!latestMonth) {
      throw new HttpException(
        'Không có dữ liệu hóa đơn nào',
        HttpStatus.NOT_FOUND,
      );
    }

    // Calculate 6 months back from latest month
    const sixMonthsData: MonthlyReportDataDto[] = [];
    let totalRevenue6Months = 0;
    let currentDebt = 0;

    // Generate 6 months of data (from 6 months ago to latest month)
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(latestMonth);
      targetDate.setMonth(targetDate.getMonth() - i);

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;

      const { start, end } = this.getMonthDateRange(year, month);

      // Get invoices for this month (PAID only for revenue)
      const paidInvoices = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect(
          'invoice.invoiceDetails',
          'detail',
          'invoice.id = detail.invoiceId',
        )
        .leftJoinAndSelect('detail.feeType', 'fee')
        .where('invoice.period BETWEEN :start AND :end', { start, end })
        .andWhere('invoice.status = :status', { status: InvoiceStatus.PAID })
        .getMany();

      // Get all invoices (for unpaid amount)
      const allInvoices = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.period BETWEEN :start AND :end', { start, end })
        .getMany();

      // Calculate revenue by type
      let electricityRevenue = 0;
      let waterRevenue = 0;
      let managementFeeRevenue = 0;

      paidInvoices.forEach((invoice) => {
        if (invoice.invoiceDetails) {
          invoice.invoiceDetails.forEach((detail) => {
            if (detail.feeType) {
              if (detail.feeType.name === 'Tiền điện') {
                electricityRevenue += Number(
                  detail.totalWithVat || detail.totalPrice,
                );
              } else if (detail.feeType.name === 'Tiền nước') {
                waterRevenue += Number(
                  detail.totalWithVat || detail.totalPrice,
                );
              } else if (
                detail.feeType.type === FeeType.FIXED_AREA ||
                detail.feeType.type === FeeType.FIXED_MONTH
              ) {
                managementFeeRevenue += Number(
                  detail.totalWithVat || detail.totalPrice,
                );
              }
            }
          });
        }
      });

      const totalMonthRevenue =
        electricityRevenue + waterRevenue + managementFeeRevenue;

      // Calculate unpaid amount for this month
      const unpaidInvoices = allInvoices.filter(
        (inv) => inv.status === InvoiceStatus.UNPAID,
      );
      const unpaidAmount = unpaidInvoices.reduce(
        (sum, inv) => sum + Number(inv.totalAmount || 0),
        0,
      );

      // Paid invoice count
      const paidCount = paidInvoices.length;
      const totalCount = allInvoices.length;

      const monthlyData: MonthlyReportDataDto = {
        month: monthStr,
        electricityRevenue: Math.round(electricityRevenue),
        waterRevenue: Math.round(waterRevenue),
        managementFeeRevenue: Math.round(managementFeeRevenue),
        totalRevenue: Math.round(totalMonthRevenue),
        invoiceCount: totalCount,
        paidInvoiceCount: paidCount,
        unpaidAmount: Math.round(unpaidAmount),
      };

      sixMonthsData.push(monthlyData);
      totalRevenue6Months += totalMonthRevenue;
      currentDebt += unpaidAmount;
    }

    const averageMonthlyRevenue =
      sixMonthsData.length > 0
        ? Math.round(totalRevenue6Months / sixMonthsData.length)
        : 0;

    const startMonth = sixMonthsData[0]?.month || '';
    const endMonth = sixMonthsData[sixMonthsData.length - 1]?.month || '';

    return {
      data: sixMonthsData,
      startMonth,
      endMonth,
      totalRevenue6Months: Math.round(totalRevenue6Months),
      averageMonthlyRevenue,
      currentDebt: Math.round(currentDebt),
    };
  }

  /**
   * Export monthly reports to Excel
   */
  async exportMonthlyReportsToExcel(): Promise<Buffer> {
    const reports = await this.getMonthlyReports();

    const data: any[][] = [];

    // Add title
    data.push(['BÁO CÁO DOANH THU 6 THÁNG']);
    data.push([]);

    // Add summary
    data.push(['TỔNG HỢP']);
    data.push(['Tổng doanh thu 6 tháng', reports.totalRevenue6Months]);
    data.push(['Trung bình doanh thu/tháng', reports.averageMonthlyRevenue]);
    data.push(['Công nợ hiện tại', reports.currentDebt]);
    data.push([]);

    // Add detail table header
    data.push([
      'THÁNG',
      'ĐIỆN',
      'NƯỚC',
      'PHÍ QL',
      'TỔNG',
      'SỐ HÓA ĐƠN',
      'ĐÃ THANH TOÁN',
      'CÔNG NỢ',
    ]);

    // Add detail rows
    reports.data.forEach((row) => {
      data.push([
        row.month,
        row.electricityRevenue,
        row.waterRevenue,
        row.managementFeeRevenue,
        row.totalRevenue,
        row.invoiceCount,
        row.paidInvoiceCount,
        row.unpaidAmount,
      ]);
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Month
      { wch: 15 }, // Electricity
      { wch: 15 }, // Water
      { wch: 15 }, // Management fee
      { wch: 15 }, // Total
      { wch: 15 }, // Invoice count
      { wch: 15 }, // Paid count
      { wch: 15 }, // Unpaid amount
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Reports');

    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
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

  /**
   * Get apartment IDs for a resident
   */
  private async getResidentApartmentIds(accountId: number): Promise<number[]> {
    const apartmentResidents = await this.apartmentResidentRepository
      .createQueryBuilder('ar')
      .leftJoinAndSelect('ar.resident', 'resident')
      .where('resident.accountId = :accountId', { accountId })
      .getMany();

    return apartmentResidents.map((ar) => ar.apartmentId);
  }

  /**
   * Get 6 months of revenue report data for a specific resident
   */
  async getMonthlyReportsByResident(
    accountId: number,
  ): Promise<MonthlyReportsResponseDto> {
    // Get all apartment IDs for this resident
    const apartmentIds = await this.getResidentApartmentIds(accountId);

    if (apartmentIds.length === 0) {
      throw new HttpException(
        'Cư dân không quản lý bất kỳ căn hộ nào',
        HttpStatus.NOT_FOUND,
      );
    }

    // Get the latest month with invoices for resident's apartments
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('MAX(invoice.period)', 'latestMonth')
      .where('invoice.apartmentId IN (:...apartmentIds)', { apartmentIds })
      .getRawOne();

    if (!result?.latestMonth) {
      throw new HttpException(
        'Không có dữ liệu hóa đơn nào cho căn hộ của cư dân',
        HttpStatus.NOT_FOUND,
      );
    }

    const latestMonth = new Date(result.latestMonth);
    latestMonth.setDate(1);
    latestMonth.setHours(0, 0, 0, 0);

    // Calculate 6 months back from latest month
    const sixMonthsData: MonthlyReportDataDto[] = [];
    let totalRevenue6Months = 0;
    let currentDebt = 0;

    // Generate 6 months of data
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(latestMonth);
      targetDate.setMonth(targetDate.getMonth() - i);

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;

      const { start, end } = this.getMonthDateRange(year, month);

      // Get invoices for this month (PAID only for revenue)
      const paidInvoices = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect(
          'invoice.invoiceDetails',
          'detail',
          'invoice.id = detail.invoiceId',
        )
        .leftJoinAndSelect('detail.feeType', 'fee')
        .where('invoice.apartmentId IN (:...apartmentIds)', { apartmentIds })
        .andWhere('invoice.period BETWEEN :start AND :end', { start, end })
        .andWhere('invoice.status = :status', { status: InvoiceStatus.PAID })
        .getMany();

      // Get all invoices (for unpaid amount)
      const allInvoices = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.apartmentId IN (:...apartmentIds)', { apartmentIds })
        .andWhere('invoice.period BETWEEN :start AND :end', { start, end })
        .getMany();

      // Calculate revenue by type
      let electricityRevenue = 0;
      let waterRevenue = 0;
      let managementFeeRevenue = 0;

      paidInvoices.forEach((invoice) => {
        if (invoice.invoiceDetails) {
          invoice.invoiceDetails.forEach((detail) => {
            if (detail.feeType) {
              if (detail.feeType.name === 'Tiền điện') {
                electricityRevenue += Number(
                  detail.totalWithVat || detail.totalPrice,
                );
              } else if (detail.feeType.name === 'Tiền nước') {
                waterRevenue += Number(
                  detail.totalWithVat || detail.totalPrice,
                );
              } else if (
                detail.feeType.type === FeeType.FIXED_AREA ||
                detail.feeType.type === FeeType.FIXED_MONTH
              ) {
                managementFeeRevenue += Number(
                  detail.totalWithVat || detail.totalPrice,
                );
              }
            }
          });
        }
      });

      const totalMonthRevenue =
        electricityRevenue + waterRevenue + managementFeeRevenue;

      // Calculate unpaid amount for this month
      const unpaidInvoices = allInvoices.filter(
        (inv) => inv.status === InvoiceStatus.UNPAID,
      );
      const unpaidAmount = unpaidInvoices.reduce(
        (sum, inv) => sum + Number(inv.totalAmount || 0),
        0,
      );

      // Paid invoice count
      const paidCount = paidInvoices.length;
      const totalCount = allInvoices.length;

      const monthlyData: MonthlyReportDataDto = {
        month: monthStr,
        electricityRevenue: Math.round(electricityRevenue),
        waterRevenue: Math.round(waterRevenue),
        managementFeeRevenue: Math.round(managementFeeRevenue),
        totalRevenue: Math.round(totalMonthRevenue),
        invoiceCount: totalCount,
        paidInvoiceCount: paidCount,
        unpaidAmount: Math.round(unpaidAmount),
      };

      sixMonthsData.push(monthlyData);
      totalRevenue6Months += totalMonthRevenue;
      currentDebt += unpaidAmount;
    }

    const averageMonthlyRevenue =
      sixMonthsData.length > 0
        ? Math.round(totalRevenue6Months / sixMonthsData.length)
        : 0;

    const startMonth = sixMonthsData[0]?.month || '';
    const endMonth = sixMonthsData[sixMonthsData.length - 1]?.month || '';

    return {
      data: sixMonthsData,
      startMonth,
      endMonth,
      totalRevenue6Months: Math.round(totalRevenue6Months),
      averageMonthlyRevenue,
      currentDebt: Math.round(currentDebt),
    };
  }

  /**
   * Export monthly reports to Excel for a resident
   */
  async exportMonthlyReportsToExcelByResident(
    accountId: number,
  ): Promise<Buffer> {
    const reports = await this.getMonthlyReportsByResident(accountId);

    const data: any[][] = [];

    // Add title
    data.push(['BÁO CÁO DOANH THU 6 THÁNG CỦA CƯ DÂN']);
    data.push([]);

    // Add summary
    data.push(['TỔNG HỢP']);
    data.push(['Tổng doanh thu 6 tháng', reports.totalRevenue6Months]);
    data.push(['Trung bình doanh thu/tháng', reports.averageMonthlyRevenue]);
    data.push(['Công nợ hiện tại', reports.currentDebt]);
    data.push([]);

    // Add detail table header
    data.push([
      'THÁNG',
      'ĐIỆN',
      'NƯỚC',
      'PHÍ QL',
      'TỔNG',
      'SỐ HÓA ĐƠN',
      'ĐÃ THANH TOÁN',
      'CÔNG NỢ',
    ]);

    // Add detail rows
    reports.data.forEach((row) => {
      data.push([
        row.month,
        row.electricityRevenue,
        row.waterRevenue,
        row.managementFeeRevenue,
        row.totalRevenue,
        row.invoiceCount,
        row.paidInvoiceCount,
        row.unpaidAmount,
      ]);
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Month
      { wch: 15 }, // Electricity
      { wch: 15 }, // Water
      { wch: 15 }, // Management Fee
      { wch: 15 }, // Total
      { wch: 15 }, // Invoice Count
      { wch: 15 }, // Paid Count
      { wch: 15 }, // Unpaid Amount
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Reports');

    // Write to buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    return excelBuffer as Buffer;
  }
}
