/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Invoice } from './entities/invoice.entity';
import { InvoiceDetail } from './entities/invoice-detail.entity';
import { MeterReading } from './entities/meter-reading.entity';
import { CreateInvoiceAdminDto } from './dto/create-invoice-admin.dto';
import { CreateInvoiceClientDto } from './dto/create-invoice-client.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { Fee } from '../fees/entities/fee.entity';
import { FeeTier } from '../fees/entities/fee-tier.entity';
import { FeeType } from '../fees/enums/fee-type.enum';
import { InvoiceStatus } from './enums/invoice-status.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Apartment } from '../apartments/entities/apartment.entity';
import { ApartmentResident } from '../apartments/entities/apartment-resident.entity';
import { Resident } from '../residents/entities/resident.entity';
import { SystemNotificationsService } from '../system-notifications/system-notifications.service';
import { SystemNotificationType } from 'src/modules/system-notifications/entities/system-notification.entity';

@Injectable()
export class InvoicesService {
  // VAT rates by fee type/name
  private readonly VAT_RATES = {
    'Tiền điện': 8, // Electricity: 8%
    'Tiền nước': 5, // Water: 5%
    'Phí quản lý': 0, // Management fee: 0%
    'Phí dịch vụ': 0, // Service fee: 0%
    default: 0, // Default: 0% for other fees
  };

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceDetail)
    private invoiceDetailRepository: Repository<InvoiceDetail>,
    @InjectRepository(MeterReading)
    private meterReadingRepository: Repository<MeterReading>,
    @InjectRepository(Fee)
    private feeRepository: Repository<Fee>,
    @InjectRepository(FeeTier)
    private feeTierRepository: Repository<FeeTier>,
    @InjectRepository(Apartment)
    private apartmentRepository: Repository<Apartment>,
    @InjectRepository(Resident)
    private residentRepository: Repository<Resident>,
    @InjectRepository(ApartmentResident)
    private apartmentResidentRepository: Repository<ApartmentResident>,
    private cloudinaryService: CloudinaryService,
    private systemNotificationsService: SystemNotificationsService,
  ) {}

  /**
   * Tính VAT cho amount dựa trên loại phí
   * @param amount - số tiền cần tính VAT
   * @param feeName - tên loại phí (để xác định VAT rate)
   * @returns VAT amount và total with VAT
   */
  private calculateVAT(
    amount: number,
    feeName?: string,
  ): {
    vatAmount: number;
    totalWithVat: number;
    vatRate: number;
  } {
    // Xác định VAT rate dựa trên feeName
    const vatRate = feeName
      ? (this.VAT_RATES[feeName] ?? this.VAT_RATES.default)
      : this.VAT_RATES.default;

    const vatAmount = Number(((amount * vatRate) / 100).toFixed(2));
    const totalWithVat = Number((amount + vatAmount).toFixed(2));

    return { vatAmount, totalWithVat, vatRate };
  }

  /**
   * Normalize periodDate về đầu tháng (1st of month)
   * Đảm bảo rằng dù frontend truyền 2024-01-01, 2024-01-15 hay 2024-01-31
   * thì đều được normalize thành 2024-01-01 (đầu tháng)
   *
   * Business Logic: 1 căn hộ chỉ có 1 hóa đơn per tháng
   */
  private normalizePeriodDate(period: string | Date): Date {
    const date = typeof period === 'string' ? new Date(period) : period;

    // Normalize về đầu tháng
    const year = date.getFullYear();
    const month = date.getMonth();

    return new Date(year, month, 1);
  }

  /**
   * Calculate due date (mặc định 15 ngày sau ngày tạo)
   * @param createdDate - ngày tạo hóa đơn
   * @param dueDays - số ngày để thanh toán (default: 15)
   */
  private calculateDueDate(createdDate: Date, dueDays: number = 15): Date {
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + dueDays);
    return dueDate;
  }

  /**
   * Check nếu invoice đã quá hạn (OVERDUE)
   * @param dueDate - ngày hết hạn
   * @param status - trạng thái hiện tại
   */
  private isInvoiceOverdue(dueDate: Date, status: InvoiceStatus): boolean {
    // Chỉ có thể overdue nếu hiện tại là UNPAID
    if (status !== InvoiceStatus.UNPAID) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);

    return today > dueDateOnly;
  }

  /**
   * Tạo mã hóa đơn duy nhất: INV-YYYYMM-A{apartmentName}
   */
  private async generateInvoiceCode(
    apartmentId: number,
    period: Date,
  ): Promise<string> {
    const apartment = await this.apartmentRepository.findOne({
      where: { id: apartmentId },
    });

    if (!apartment) {
      throw new HttpException('Không tìm thấy căn hộ', HttpStatus.NOT_FOUND);
    }

    const year = period.getFullYear();
    const month = String(period.getMonth() + 1).padStart(2, '0');
    return `INV-${year}${month}-A${apartment.name}`;
  }

  /**
   * Tính tiền theo bậc thang
   */
  private calculateTieredPrice(
    usage: number,
    tiers: FeeTier[],
  ): { totalPrice: number; breakdown: Record<string, string> } {
    let remaining = usage;
    let totalPrice = 0;
    const breakdown: Record<string, string> = {};

    // Sắp xếp các bậc theo fromValue
    const sortedTiers = tiers.sort((a, b) => a.fromValue - b.fromValue);

    for (const tier of sortedTiers) {
      if (remaining <= 0) break;

      const tierFrom = tier.fromValue;
      const tierTo = tier.toValue || Infinity;
      const tierRange = tierTo - tierFrom;
      const tierUnitPrice = Number(tier.unitPrice);

      // Tính số lượng thuộc bậc này
      const usageInTier = Math.min(remaining, tierRange);

      if (usageInTier > 0) {
        const tierPrice = usageInTier * tierUnitPrice;
        totalPrice += tierPrice;
        breakdown[tier.name] = `${usageInTier}*${tierUnitPrice}`;
        remaining -= usageInTier;
      }
    }

    return { totalPrice, breakdown };
  }

  /**
   * Lấy chỉ số cũ từ meter_readings
   */
  private async getOldIndex(
    apartmentId: number,
    feeTypeId: number,
    period: Date,
  ): Promise<number> {
    const lastReading = await this.meterReadingRepository.findOne({
      where: {
        apartmentId,
        feeTypeId,
      },
      order: {
        billingMonth: 'DESC',
      },
    });

    return lastReading ? Number(lastReading.newIndex) : 0;
  }

  /**
   * Tính toán invoice details cho điện và nước
   */
  private async calculateInvoiceDetails(
    apartmentId: number,
    waterIndex: number,
    electricityIndex: number,
    period: Date,
  ): Promise<{ details: Partial<InvoiceDetail>[]; subtotalAmount: number }> {
    const details: Partial<InvoiceDetail>[] = [];
    let subtotalAmount = 0;

    // Lấy fee types cho điện và nước
    const waterFee = await this.feeRepository.findOne({
      where: { name: 'Tiền nước', type: FeeType.METERED, isActive: true },
      relations: ['tiers'],
    });

    const electricityFee = await this.feeRepository.findOne({
      where: { name: 'Tiền điện', type: FeeType.METERED, isActive: true },
      relations: ['tiers'],
    });

    if (!waterFee || !electricityFee) {
      throw new HttpException(
        'Không tìm thấy cấu hình phí điện hoặc nước',
        HttpStatus.NOT_FOUND,
      );
    }

    // Tính tiền nước
    if (waterIndex > 0) {
      const oldWaterIndex = await this.getOldIndex(
        apartmentId,
        waterFee.id,
        period,
      );
      const waterUsage = waterIndex - oldWaterIndex;

      if (waterUsage < 0) {
        throw new HttpException(
          'Chỉ số nước mới phải lớn hơn chỉ số cũ',
          HttpStatus.BAD_REQUEST,
        );
      }

      let waterPrice = 0;
      let waterBreakdown: Record<string, string> = {};

      if (waterFee.tiers && waterFee.tiers.length > 0) {
        const result = this.calculateTieredPrice(waterUsage, waterFee.tiers);
        waterPrice = result.totalPrice;
        waterBreakdown = result.breakdown;
      } else {
        // Không có bậc thang, tính theo giá cố định (nếu có)
        waterPrice = waterUsage * Number(waterFee.tiers?.[0]?.unitPrice || 0);
      }

      const { vatAmount, totalWithVat } = this.calculateVAT(
        waterPrice,
        waterFee.name,
      );

      details.push({
        feeTypeId: waterFee.id,
        amount: waterUsage,
        unitPrice: undefined,
        totalPrice: waterPrice,
        vatAmount,
        totalWithVat,
        calculationBreakdown: waterBreakdown,
      });

      subtotalAmount += waterPrice;
    }

    // Tính tiền điện
    if (electricityIndex > 0) {
      const oldElectricityIndex = await this.getOldIndex(
        apartmentId,
        electricityFee.id,
        period,
      );
      const electricityUsage = electricityIndex - oldElectricityIndex;

      if (electricityUsage < 0) {
        throw new HttpException(
          'Chỉ số điện mới phải lớn hơn chỉ số cũ',
          HttpStatus.BAD_REQUEST,
        );
      }

      let electricityPrice = 0;
      let electricityBreakdown: Record<string, string> = {};

      if (electricityFee.tiers && electricityFee.tiers.length > 0) {
        const result = this.calculateTieredPrice(
          electricityUsage,
          electricityFee.tiers,
        );
        electricityPrice = result.totalPrice;
        electricityBreakdown = result.breakdown;
      } else {
        electricityPrice =
          electricityUsage * Number(electricityFee.tiers?.[0]?.unitPrice || 0);
      }

      const { vatAmount, totalWithVat } = this.calculateVAT(
        electricityPrice,
        electricityFee.name,
      );

      details.push({
        feeTypeId: electricityFee.id,
        amount: electricityUsage,
        unitPrice: undefined,
        totalPrice: electricityPrice,
        vatAmount,
        totalWithVat,
        calculationBreakdown: electricityBreakdown,
      });

      subtotalAmount += electricityPrice;
    }

    // Thêm các phí cố định khác (phí quản lý, phí dịch vụ, v.v.)
    const fixedFees = await this.feeRepository.find({
      where: [{ type: FeeType.FIXED_AREA }, { type: FeeType.FIXED_MONTH }],
      relations: ['tiers'],
    });

    const apartment = await this.apartmentRepository.findOne({
      where: { id: apartmentId },
    });

    for (const fee of fixedFees) {
      let feeAmount = 0;
      let feePrice = 0;

      if (fee.type === FeeType.FIXED_AREA && apartment?.area) {
        // Tính theo diện tích
        feeAmount = Number(apartment.area);
        const unitPrice = Number(fee.tiers?.[0]?.unitPrice || 0);
        feePrice = feeAmount * unitPrice;

        const { vatAmount, totalWithVat } = this.calculateVAT(
          feePrice,
          fee.name,
        );

        details.push({
          feeTypeId: fee.id,
          amount: feeAmount,
          unitPrice: unitPrice,
          totalPrice: feePrice,
          vatAmount,
          totalWithVat,
          calculationBreakdown: undefined,
        });
      } else if (fee.type === FeeType.FIXED_MONTH) {
        // Tính cố định theo tháng
        feeAmount = 1;
        feePrice = Number(fee.tiers?.[0]?.unitPrice || 0);

        const { vatAmount, totalWithVat } = this.calculateVAT(
          feePrice,
          fee.name,
        );

        details.push({
          feeTypeId: fee.id,
          amount: feeAmount,
          unitPrice: feePrice,
          totalPrice: feePrice,
          vatAmount,
          totalWithVat,
          calculationBreakdown: undefined,
        });
      }

      subtotalAmount += feePrice;
    }

    return { details, subtotalAmount };
  }

  /**
   * Lưu meter readings
   */
  private async saveMeterReadings(
    apartmentId: number,
    waterIndex: number,
    electricityIndex: number,
    period: Date,
    imageProofUrl?: string,
    isVerified: boolean = true,
  ): Promise<void> {
    const readingDate = new Date();

    // Lấy fee types
    const waterFee = await this.feeRepository.findOne({
      where: { name: 'Tiền nước', type: FeeType.METERED },
    });

    const electricityFee = await this.feeRepository.findOne({
      where: { name: 'Tiền điện', type: FeeType.METERED },
    });

    if (!waterFee || !electricityFee) {
      throw new HttpException(
        'Không tìm thấy cấu hình phí điện hoặc nước',
        HttpStatus.NOT_FOUND,
      );
    }

    // Lưu water reading
    if (waterIndex > 0) {
      const oldWaterIndex = await this.getOldIndex(
        apartmentId,
        waterFee.id,
        period,
      );

      const waterReading = this.meterReadingRepository.create({
        apartmentId,
        feeTypeId: waterFee.id,
        readingDate,
        billingMonth: period,
        oldIndex: oldWaterIndex,
        newIndex: waterIndex,
        usageAmount: waterIndex - oldWaterIndex,
        imageProofUrl,
        isVerified,
      });

      await this.meterReadingRepository.save(waterReading);
    }

    // Lưu electricity reading
    if (electricityIndex > 0) {
      const oldElectricityIndex = await this.getOldIndex(
        apartmentId,
        electricityFee.id,
        period,
      );

      const electricityReading = this.meterReadingRepository.create({
        apartmentId,
        feeTypeId: electricityFee.id,
        readingDate,
        billingMonth: period,
        oldIndex: oldElectricityIndex,
        newIndex: electricityIndex,
        usageAmount: electricityIndex - oldElectricityIndex,
        imageProofUrl,
        isVerified,
      });

      await this.meterReadingRepository.save(electricityReading);
    }
  }

  /**
   * [ADMIN] Tạo hóa đơn
   */
  async createInvoiceByAdmin(
    createInvoiceDto: CreateInvoiceAdminDto,
  ): Promise<Invoice> {
    const { apartmentId, waterIndex, electricityIndex, period } =
      createInvoiceDto;

    // Validate: period không được là tương lai
    const inputDate = new Date(period);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate > today) {
      throw new HttpException(
        'Kỳ thanh toán không được là ngày trong tương lai',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Normalize period về đầu tháng (1st of month)
    const periodDate = this.normalizePeriodDate(period);

    // Debug log
    console.log(
      `📌 [ADMIN] Creating invoice - Input period: ${period} -> Normalized: ${periodDate.toISOString()}`,
    );

    // Kiểm tra apartment tồn tại
    const apartment = await this.apartmentRepository.findOne({
      where: { id: apartmentId },
    });

    if (!apartment) {
      throw new HttpException('Không tìm thấy căn hộ', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra đã tồn tại hóa đơn cho kỳ này chưa
    // IMPORTANT: Dùng BETWEEN để check toàn bộ tháng (từ 1/1 đến 31/1)
    // Tránh tình trạng: 2024-01-01, 2024-01-15, 2024-01-31 tạo 3 invoices
    const yearStart = periodDate.getFullYear();
    const monthStart = periodDate.getMonth();
    const monthStart_Date = new Date(yearStart, monthStart, 1);
    const monthEnd_Date = new Date(yearStart, monthStart + 1, 0);

    const existingInvoice = await this.invoiceRepository.findOne({
      where: {
        apartmentId,
        period: Between(monthStart_Date, monthEnd_Date),
        isActive: true,
      },
    });

    if (existingInvoice) {
      throw new HttpException(
        'Hóa đơn cho tháng này đã tồn tại',
        HttpStatus.CONFLICT,
      );
    }

    // Tạo invoice code
    const invoiceCode = await this.generateInvoiceCode(apartmentId, periodDate);

    // Tính toán chi tiết hóa đơn
    const { details, subtotalAmount } = await this.calculateInvoiceDetails(
      apartmentId,
      waterIndex,
      electricityIndex,
      periodDate,
    );

    // Tính VAT tổng từ sum của vatAmount của các details
    const totalVatAmount = Number(
      details
        .reduce((sum, detail) => sum + (detail.vatAmount || 0), 0)
        .toFixed(2),
    );
    const totalWithVat = Number((subtotalAmount + totalVatAmount).toFixed(2));

    // Tính due date (15 ngày từ ngày tạo)
    const now = new Date();
    const dueDate = this.calculateDueDate(now, 15);

    // Xác định VAT rate trung bình (để hiển thị trong invoice header)
    const avgVatRate =
      subtotalAmount > 0 ? (totalVatAmount / subtotalAmount) * 100 : 0;

    // Tạo invoice
    const invoice = this.invoiceRepository.create({
      invoiceCode,
      apartmentId,
      period: periodDate,
      subtotalAmount,
      vatRate: Number(avgVatRate.toFixed(2)),
      vatAmount: totalVatAmount,
      totalAmount: totalWithVat,
      status: InvoiceStatus.UNPAID,
      dueDate,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Tạo invoice details
    const invoiceDetails = details.map((detail) =>
      this.invoiceDetailRepository.create({
        ...detail,
        invoiceId: savedInvoice.id,
      }),
    );

    await this.invoiceDetailRepository.save(invoiceDetails);

    // Lưu meter readings (admin tạo thì đã verified)
    await this.saveMeterReadings(
      apartmentId,
      waterIndex,
      electricityIndex,
      periodDate,
      undefined,
      true,
    );

    const result = await this.invoiceRepository.findOne({
      where: { id: savedInvoice.id },
      relations: ['invoiceDetails', 'invoiceDetails.feeType'],
    });

    if (!result) {
      throw new HttpException(
        'Không tìm thấy hóa đơn sau khi tạo',
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  /**
   * [CLIENT] Tạo hóa đơn với ảnh chứng minh
   */
  async createInvoiceByClient(
    accountId: number,
    createInvoiceDto: CreateInvoiceClientDto,
    files: Express.Multer.File[],
  ): Promise<Invoice> {
    const { waterIndex, electricityIndex, apartmentId } = createInvoiceDto;

    // Xác thực cư dân sở hữu căn hộ này
    const resident = await this.residentRepository.findOne({
      where: { accountId },
    });

    if (!resident) {
      throw new HttpException('Không tìm thấy cư dân', HttpStatus.NOT_FOUND);
    }

    const apartmentResident = await this.apartmentResidentRepository.findOne({
      where: {
        residentId: resident.id,
        apartmentId: apartmentId,
      },
    });

    if (!apartmentResident) {
      throw new HttpException(
        'Cư dân không sở hữu căn hộ này',
        HttpStatus.FORBIDDEN,
      );
    }

    // Normalize period về đầu tháng (1st of month)
    const periodDate = this.normalizePeriodDate(new Date());

    // Kiểm tra đã tồn tại hóa đơn cho kỳ này chưa
    // IMPORTANT: Dùng BETWEEN để check toàn bộ tháng (từ 1/1 đến 31/1)
    const yearStart = periodDate.getFullYear();
    const monthStart = periodDate.getMonth();
    const monthStart_Date = new Date(yearStart, monthStart, 1);
    const monthEnd_Date = new Date(yearStart, monthStart + 1, 0);

    const existingInvoice = await this.invoiceRepository.findOne({
      where: {
        apartmentId,
        period: Between(monthStart_Date, monthEnd_Date),
        isActive: true,
      },
    });

    if (existingInvoice) {
      throw new HttpException(
        'Hóa đơn cho tháng này đã tồn tại',
        HttpStatus.CONFLICT,
      );
    }

    // Upload ảnh chứng minh
    let imageProofUrl: string | undefined;
    if (files && files.length > 0) {
      const uploadedImages = await Promise.all(
        files.map((file) => this.cloudinaryService.uploadFile(file)),
      );
      // Lưu URL ảnh đầu tiên hoặc nối nhiều URL lại
      imageProofUrl = uploadedImages
        .map((img) => (img?.url as string) || '')
        .join(',');
    }

    // Tạo invoice code
    const invoiceCode = await this.generateInvoiceCode(apartmentId, periodDate);

    // Tính toán chi tiết hóa đơn
    const { details, subtotalAmount } = await this.calculateInvoiceDetails(
      apartmentId,
      waterIndex,
      electricityIndex,
      periodDate,
    );

    // Tính VAT tổng từ sum của vatAmount của các details
    const totalVatAmount = Number(
      details
        .reduce((sum, detail) => sum + (detail.vatAmount || 0), 0)
        .toFixed(2),
    );
    const totalWithVat = Number((subtotalAmount + totalVatAmount).toFixed(2));

    // Tính due date (15 ngày từ ngày tạo)
    const now = new Date();
    const dueDate = this.calculateDueDate(now, 15);

    // Xác định VAT rate trung bình (để hiển thị trong invoice header)
    const avgVatRate =
      subtotalAmount > 0 ? (totalVatAmount / subtotalAmount) * 100 : 0;

    // Tạo invoice
    const invoice = this.invoiceRepository.create({
      invoiceCode,
      apartmentId,
      period: periodDate,
      subtotalAmount,
      vatRate: Number(avgVatRate.toFixed(2)),
      vatAmount: totalVatAmount,
      totalAmount: totalWithVat,
      status: InvoiceStatus.UNPAID,
      dueDate,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Tạo invoice details
    const invoiceDetails = details.map((detail) =>
      this.invoiceDetailRepository.create({
        ...detail,
        invoiceId: savedInvoice.id,
      }),
    );

    await this.invoiceDetailRepository.save(invoiceDetails);

    // Lưu meter readings (client tạo thì chưa verified)
    await this.saveMeterReadings(
      apartmentId,
      waterIndex,
      electricityIndex,
      periodDate,
      imageProofUrl,
      false,
    );

    const result = await this.invoiceRepository.findOne({
      where: { id: savedInvoice.id },
      relations: ['invoiceDetails', 'invoiceDetails.feeType'],
    });

    if (!result) {
      throw new HttpException(
        'Không tìm thấy hóa đơn sau khi tạo',
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  /**
   * [ADMIN] Cập nhật hóa đơn
   */
  async updateInvoice(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['invoiceDetails'],
    });

    if (!invoice) {
      throw new HttpException('Không tìm thấy hóa đơn', HttpStatus.NOT_FOUND);
    }

    const { apartmentId, waterIndex, electricityIndex, period } =
      updateInvoiceDto;

    // Validate: period không được là tương lai
    const inputDate = new Date(period);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate > today) {
      throw new HttpException(
        'Kỳ thanh toán không được là ngày trong tương lai',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Normalize period về đầu tháng (1st of month)
    const periodDate = this.normalizePeriodDate(period);

    // Debug log
    console.log(
      `📌 [ADMIN] Updating invoice - Input period: ${period} -> Normalized: ${periodDate.toISOString()}`,
    );

    // Xóa các invoice details cũ
    await this.invoiceDetailRepository.delete({ invoiceId: id });

    // Tính toán lại chi tiết hóa đơn
    const { details, subtotalAmount } = await this.calculateInvoiceDetails(
      apartmentId,
      waterIndex,
      electricityIndex,
      periodDate,
    );

    // Tính VAT tổng từ sum của vatAmount của các details
    const totalVatAmount = Number(
      details
        .reduce((sum, detail) => sum + (detail.vatAmount || 0), 0)
        .toFixed(2),
    );
    const totalWithVat = Number((subtotalAmount + totalVatAmount).toFixed(2));

    // Xác định VAT rate trung bình (để hiển thị trong invoice header)
    const avgVatRate =
      subtotalAmount > 0 ? (totalVatAmount / subtotalAmount) * 100 : 0;

    // Cập nhật invoice
    invoice.apartmentId = apartmentId;
    invoice.period = periodDate;
    invoice.subtotalAmount = subtotalAmount;
    invoice.vatRate = Number(avgVatRate.toFixed(2));
    invoice.vatAmount = totalVatAmount;
    invoice.totalAmount = totalWithVat;
    invoice.invoiceCode = await this.generateInvoiceCode(
      apartmentId,
      periodDate,
    );

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Tạo invoice details mới
    const invoiceDetails = details.map((detail) =>
      this.invoiceDetailRepository.create({
        ...detail,
        invoiceId: updatedInvoice.id,
      }),
    );

    await this.invoiceDetailRepository.save(invoiceDetails);

    // Cập nhật meter readings
    await this.saveMeterReadings(
      apartmentId,
      waterIndex,
      electricityIndex,
      periodDate,
      undefined,
      true,
    );

    const result = await this.invoiceRepository.findOne({
      where: { id: updatedInvoice.id },
      relations: ['invoiceDetails', 'invoiceDetails.feeType'],
    });

    if (!result) {
      throw new HttpException(
        'Không tìm thấy hóa đơn sau khi cập nhật',
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  /**
   * Lấy danh sách hóa đơn
   */
  async findAll(queryDto: QueryInvoiceDto): Promise<Invoice[]> {
    const { page = 1, limit = 10, apartmentId, status, period } = queryDto;

    const query = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.apartment', 'apartment')
      .where('invoice.isActive = :isActive', { isActive: true })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('invoice.createdAt', 'DESC');

    if (apartmentId) {
      query.andWhere('invoice.apartmentId = :apartmentId', { apartmentId });
    }

    if (status) {
      query.andWhere('invoice.status = :status', { status });
    }

    if (period) {
      const periodDate = new Date(period);
      const year = periodDate.getFullYear();
      const month = periodDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      query.andWhere('invoice.period BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.getMany();
  }

  /**
   * Get invoices created by clients (with image proof)
   * Filter by apartments and pagination
   * Returns invoices with meter readings and verification status
   */
  async findClientCreatedInvoices(queryDto: QueryInvoiceDto): Promise<
    (Invoice & {
      meterReadings: MeterReading[];
      meterReadingsVerified: boolean;
    })[]
  > {
    const { page = 1, limit = 10, apartmentId, status, period } = queryDto;

    // Query to get invoice IDs that have client-created meter readings
    const invoicesQuery = this.invoiceRepository
      .createQueryBuilder('invoice')
      .select(['invoice.id', 'invoice.createdAt'])
      .distinct(true)
      .innerJoin(
        'meter_readings',
        'mr',
        'mr.apartment_id = invoice.apartment_id AND mr.billing_month = invoice.period AND mr.image_proof_url IS NOT NULL',
      )
      .where('invoice.isActive = :isActive', { isActive: true });

    if (apartmentId) {
      invoicesQuery.andWhere('invoice.apartmentId = :apartmentId', {
        apartmentId,
      });
    }

    if (status) {
      invoicesQuery.andWhere('invoice.status = :status', { status });
    }

    if (period) {
      const periodDate = new Date(period);
      const year = periodDate.getFullYear();
      const month = periodDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      invoicesQuery.andWhere('invoice.period BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Get paginated invoice IDs
    const paginatedQuery = invoicesQuery
      .orderBy('invoice.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const invoiceIds = (await paginatedQuery.getRawMany()).map(
      (row) => row.invoice_id,
    );

    // If no invoices found, return empty array
    if (invoiceIds.length === 0) {
      return [];
    }

    // Fetch full invoice data with apartment
    const invoices = await this.invoiceRepository.find({
      where: { id: In(invoiceIds), isActive: true },
      relations: ['apartment'],
      order: { createdAt: 'DESC' },
    });

    // For each invoice, fetch its meter readings
    const result: (Invoice & {
      meterReadings: MeterReading[];
      meterReadingsVerified: boolean;
    })[] = [];

    for (const invoice of invoices) {
      const meterReadings = await this.meterReadingRepository
        .createQueryBuilder('mr')
        .leftJoinAndSelect('mr.feeType', 'feeType')
        .where('mr.apartmentId = :apartmentId', {
          apartmentId: invoice.apartmentId,
        })
        .andWhere('mr.billingMonth = :billingMonth', {
          billingMonth: invoice.period,
        })
        .andWhere('mr.imageProofUrl IS NOT NULL')
        .andWhere('mr.isVerified = :isVerified', { isVerified: true })
        .orderBy('mr.createdAt', 'DESC')
        .getMany();

      // Enrich each meter reading with oldIndexReadingDate
      for (const mr of meterReadings) {
        const previousMeterReading = await this.meterReadingRepository
          .createQueryBuilder('prev_mr')
          .where('prev_mr.apartmentId = :apartmentId', {
            apartmentId: invoice.apartmentId,
          })
          .andWhere('prev_mr.feeTypeId = :feeTypeId', {
            feeTypeId: mr.feeTypeId,
          })
          .andWhere('prev_mr.billingMonth < :billingMonth', {
            billingMonth: invoice.period,
          })
          .orderBy('prev_mr.billingMonth', 'DESC')
          .limit(1)
          .getOne();

        if (previousMeterReading) {
          (mr as any).oldIndexReadingDate = previousMeterReading.readingDate;
        }
      }

      // Calculate if all meter readings are verified
      const meterReadingsVerified = meterReadings.length > 0;

      result.push({
        ...invoice,
        meterReadings,
        meterReadingsVerified,
      });
    }

    return result;
  }

  /**
   * Lấy chi tiết 1 hóa đơn kèm meter readings
   */
  async findOne(id: number): Promise<Invoice & { meterReadings: any[] }> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['invoiceDetails', 'invoiceDetails.feeType', 'apartment'],
    });

    if (!invoice) {
      throw new HttpException('Không tìm thấy hóa đơn', HttpStatus.NOT_FOUND);
    }

    // Fetch meter readings for this invoice
    const meterReadings = await this.meterReadingRepository
      .createQueryBuilder('mr')
      .leftJoinAndSelect('mr.feeType', 'feeType')
      .where('mr.apartmentId = :apartmentId', {
        apartmentId: invoice.apartmentId,
      })
      .andWhere('mr.billingMonth = :billingMonth', {
        billingMonth: invoice.period,
      })
      .orderBy('mr.createdAt', 'DESC')
      .getMany();

    // Enrich each meter reading with oldIndexReadingDate
    for (const mr of meterReadings) {
      const previousMeterReading = await this.meterReadingRepository
        .createQueryBuilder('prev_mr')
        .where('prev_mr.apartmentId = :apartmentId', {
          apartmentId: invoice.apartmentId,
        })
        .andWhere('prev_mr.feeTypeId = :feeTypeId', {
          feeTypeId: mr.feeTypeId,
        })
        .andWhere('prev_mr.billingMonth < :billingMonth', {
          billingMonth: invoice.period,
        })
        .orderBy('prev_mr.billingMonth', 'DESC')
        .limit(1)
        .getOne();

      if (previousMeterReading) {
        (mr as any).oldIndexReadingDate = previousMeterReading.readingDate;
      }
    }

    return {
      ...invoice,
      meterReadings,
    };
  }

  /**
   * [ADMIN] Verify meter reading
   */
  async verifyMeterReading(meterReadingId: number): Promise<MeterReading> {
    const meterReading = await this.meterReadingRepository.findOne({
      where: { id: meterReadingId },
    });

    if (!meterReading) {
      throw new HttpException(
        'Không tìm thấy chỉ số meter',
        HttpStatus.NOT_FOUND,
      );
    }

    meterReading.isVerified = true;
    return this.meterReadingRepository.save(meterReading);
  }

  /**
   * [ADMIN] Verify invoice readings and recalculate invoice
   * Updates meter readings and recalculates invoice totals based on tiered pricing
   */
  async verifyInvoiceReadings(
    invoiceId: number,
    meterReadingUpdates: Array<{
      feeTypeId: number;
      newIndex: number;
      oldIndex?: number;
      imageProofUrl?: string;
    }>,
  ): Promise<Invoice> {
    // Kiểm tra hóa đơn tồn tại
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['invoiceDetails', 'apartment'],
    });

    if (!invoice) {
      throw new HttpException('Không tìm thấy hóa đơn', HttpStatus.NOT_FOUND);
    }

    // Cập nhật meter readings
    const feeTypeMap = new Map<number, (typeof meterReadingUpdates)[0]>();
    const meterReadingsToUpdate: MeterReading[] = [];

    for (const update of meterReadingUpdates) {
      // Kiểm tra fee type tồn tại
      const fee = await this.feeRepository.findOne({
        where: { id: update.feeTypeId },
        relations: ['tiers'],
      });

      if (!fee) {
        throw new HttpException(
          `Không tìm thấy loại phí với ID ${update.feeTypeId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Kiểm tra fee là metered type
      if (fee.type !== FeeType.METERED) {
        throw new HttpException(
          `Loại phí ${fee.name} không phải là phí đo lường`,
          HttpStatus.BAD_REQUEST,
        );
      }

      feeTypeMap.set(update.feeTypeId, update);

      // Tìm hoặc tạo meter reading cho kỳ này
      let meterReading = await this.meterReadingRepository.findOne({
        where: {
          apartmentId: invoice.apartment.id,
          feeTypeId: update.feeTypeId,
          billingMonth: invoice.period,
        },
      });

      if (!meterReading) {
        // Tạo mới nếu chưa tồn tại
        const oldIndex =
          update.oldIndex ??
          (await this.getOldIndex(
            invoice.apartment.id,
            update.feeTypeId,
            invoice.period,
          ));

        meterReading = this.meterReadingRepository.create({
          apartmentId: invoice.apartment.id,
          feeTypeId: update.feeTypeId,
          readingDate: new Date(),
          billingMonth: invoice.period,
          oldIndex,
          newIndex: update.newIndex,
          usageAmount: update.newIndex - oldIndex,
          isVerified: true,
        });
      } else {
        // Cập nhật existing meter reading
        if (update.oldIndex !== undefined) {
          meterReading.oldIndex = update.oldIndex;
        }
        meterReading.newIndex = update.newIndex;
        meterReading.usageAmount =
          update.newIndex - Number(meterReading.oldIndex);
        meterReading.isVerified = true;
      }

      // Kiểm tra chỉ số mới >= chỉ số cũ
      if (meterReading.newIndex < Number(meterReading.oldIndex)) {
        throw new HttpException(
          `Chỉ số mới phải lớn hơn hoặc bằng chỉ số cũ (Fee: ${fee.name})`,
          HttpStatus.BAD_REQUEST,
        );
      }

      meterReadingsToUpdate.push(meterReading);
    }

    // Lưu meter readings
    await this.meterReadingRepository.save(meterReadingsToUpdate);

    // Recalculate invoice details
    const newDetails: Partial<InvoiceDetail>[] = [];
    let newSubtotalAmount = 0;

    // Xử lý các metered fees (điện, nước)
    for (const detail of invoice.invoiceDetails) {
      const update = feeTypeMap.get(detail.feeTypeId);

      if (update) {
        // Lấy fee type với tiers
        const fee = await this.feeRepository.findOne({
          where: { id: detail.feeTypeId },
          relations: ['tiers'],
        });

        const meterReading = meterReadingsToUpdate.find(
          (mr) => mr.feeTypeId === detail.feeTypeId,
        );

        if (!fee || !meterReading) {
          throw new HttpException(
            'Lỗi tính toán hóa đơn: không tìm thấy loại phí hoặc chỉ số meter',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const usage = Number(meterReading.usageAmount);

        if (fee.tiers && fee.tiers.length > 0) {
          const result = this.calculateTieredPrice(usage, fee.tiers);
          detail.totalPrice = Number(result.totalPrice);
          detail.calculationBreakdown = result.breakdown;
          detail.amount = usage;
        } else {
          // Nếu không có tiers, lấy unitPrice từ tiers[0]
          const unitPrice = Number(fee.tiers?.[0]?.unitPrice || 0);
          detail.totalPrice = usage * unitPrice;
          detail.amount = usage;
        }

        // Tính VAT cho detail
        const { vatAmount, totalWithVat } = this.calculateVAT(
          detail.totalPrice,
          detail.feeType?.name,
        );
        detail.vatAmount = vatAmount;
        detail.totalWithVat = totalWithVat;

        newSubtotalAmount += detail.totalPrice;
        newDetails.push(detail);
      } else if (detail.feeType?.type === FeeType.METERED) {
        // Metered fee không được update, xóa nó khỏi invoice
        await this.invoiceDetailRepository.remove(detail);
      } else {
        // Fixed fees giữ nguyên
        newSubtotalAmount += Number(detail.totalPrice);
        newDetails.push(detail);
      }
    }

    // Thêm các metered fees mới (nếu có)
    for (const [feeTypeId, update] of feeTypeMap.entries()) {
      const existingDetail = newDetails.find((d) => d.feeTypeId === feeTypeId);

      if (!existingDetail) {
        const fee = await this.feeRepository.findOne({
          where: { id: feeTypeId },
          relations: ['tiers'],
        });

        const meterReading = meterReadingsToUpdate.find(
          (mr) => mr.feeTypeId === feeTypeId,
        );

        if (!fee || !meterReading) {
          throw new HttpException(
            'Lỗi tính toán hóa đơn: không tìm thấy loại phí hoặc chỉ số meter',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const usage = Number(meterReading.usageAmount);

        if (fee.tiers && fee.tiers.length > 0) {
          const result = this.calculateTieredPrice(usage, fee.tiers);
          const totalPrice = Number(result.totalPrice);
          const { vatAmount, totalWithVat } = this.calculateVAT(
            totalPrice,
            fee.name,
          );

          newDetails.push({
            feeTypeId,
            amount: usage,
            unitPrice: undefined,
            totalPrice: totalPrice,
            vatAmount,
            totalWithVat,
            calculationBreakdown: result.breakdown,
          });

          newSubtotalAmount += totalPrice;
        }
      }
    }

    // Lưu updated details
    for (const detail of newDetails) {
      if (detail.id) {
        await this.invoiceDetailRepository.save(detail);
      } else {
        const newDetail = this.invoiceDetailRepository.create({
          invoiceId,
          ...detail,
        });
        await this.invoiceDetailRepository.save(newDetail);
      }
    }

    // Tính VAT cho toàn bộ invoice
    const { vatAmount, totalWithVat } = this.calculateVAT(newSubtotalAmount);

    // Cập nhật invoice
    invoice.subtotalAmount = Number(newSubtotalAmount.toFixed(2));
    invoice.vatAmount = vatAmount;
    invoice.totalAmount = totalWithVat;

    return this.invoiceRepository.save(invoice);
  }

  /**
   * [ADMIN] Xóa mềm hóa đơn
   */
  async remove(id: number): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
    });

    if (!invoice) {
      throw new HttpException('Không tìm thấy hóa đơn', HttpStatus.NOT_FOUND);
    }

    await this.invoiceRepository.update(id, { isActive: false });
  }

  /**
   * [ADMIN] Xóa mềm nhiều hóa đơn
   */
  async removeMany(
    ids: number[],
  ): Promise<{ message: string; deletedCount: number }> {
    const invoices = await this.invoiceRepository.find({
      where: { id: In(ids) },
    });

    if (invoices.length === 0) {
      throw new HttpException(
        'Không tìm thấy hóa đơn với các ID đã cung cấp',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.invoiceRepository.update(ids, { isActive: false });

    return {
      message: 'Xóa hóa đơn thành công',
      deletedCount: invoices.length,
    };
  }

  /**
   * [CRON] Cập nhật invoices quá hạn về OVERDUE status
   * Chạy hàng ngày lúc 00:00 (nửa đêm)
   * Logic: Nếu dueDate < hôm nay AND status = UNPAID → UPDATE thành OVERDUE
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateOverdueInvoices(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Find all UNPAID invoices with dueDate < today
      const overdueInvoices = await this.invoiceRepository.find({
        where: {
          status: InvoiceStatus.UNPAID,
          dueDate: Between(
            new Date('2000-01-01'),
            new Date(today.getTime() - 1),
          ),
          isActive: true,
        },
      });

      if (overdueInvoices.length === 0) {
        console.log('No overdue invoices to update');
        return;
      }

      // Update invoices to OVERDUE status
      const overdueIds = overdueInvoices.map((inv) => inv.id);
      await this.invoiceRepository.update(overdueIds, {
        status: InvoiceStatus.OVERDUE,
      });

      console.log(`✅ Updated ${overdueIds.length} invoices to OVERDUE status`);
    } catch (error) {
      console.error('❌ Error updating overdue invoices:', error);
    }
  }

  /**
   * [CRON] Gửi thông báo nhắc nhở thanh toán hóa đơn 1 ngày trước khi hết hạn
   * Chạy hàng ngày lúc 09:00 sáng
   * Logic: Tìm các hóa đơn có dueDate = ngày mai AND status = UNPAID → Gửi thông báo
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendPaymentReminderNotifications(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tính ngày mai (1 ngày trước khi hết hạn)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Ngày kết thúc của ngày mai
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    try {
      // Tìm tất cả hóa đơn UNPAID có dueDate = ngày mai
      const upcomingDueInvoices = await this.invoiceRepository.find({
        where: {
          status: InvoiceStatus.UNPAID,
          dueDate: Between(tomorrow, tomorrowEnd),
          isActive: true,
        },
        relations: ['apartment'],
      });

      if (upcomingDueInvoices.length === 0) {
        console.log('No invoices due tomorrow that need payment reminders');
        return;
      }

      console.log(
        `📧 Found ${upcomingDueInvoices.length} invoices due tomorrow, sending reminders...`,
      );

      // Gửi thông báo cho từng hóa đơn
      for (const invoice of upcomingDueInvoices) {
        try {
          // Tìm resident của apartment này
          const apartmentResident =
            await this.apartmentResidentRepository.findOne({
              where: { apartmentId: invoice.apartmentId },
              relations: ['resident'],
            });

          if (!apartmentResident?.resident?.accountId) {
            console.log(
              `⚠️ No resident found for apartment ${invoice.apartment?.name}`,
            );
            continue;
          }

          const userId = apartmentResident.resident.accountId;

          // Format số tiền
          const formattedAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(invoice.totalAmount);

          // Gửi thông báo
          await this.systemNotificationsService.sendSystemNotification(
            {
              title: '⏰ Nhắc nhở thanh toán hóa đơn',
              content: `Hóa đơn ${invoice.invoiceCode} (${formattedAmount}) của căn hộ ${invoice.apartment?.name} sẽ đến hạn thanh toán vào ngày mai. Vui lòng thanh toán để tránh phát sinh phí trễ hạn.`,
              type: SystemNotificationType.WARNING,
              targetUserIds: [userId],
              metadata: {
                invoiceId: invoice.id,
                invoiceCode: invoice.invoiceCode,
                apartmentName: invoice.apartment?.name,
                totalAmount: invoice.totalAmount,
                dueDate: invoice.dueDate,
              },
              actionUrl: `/invoices/${invoice.id}`,
              actionText: 'Xem hóa đơn',
              isPersistent: true,
            },
            1, // System user ID (admin/system)
          );

          console.log(
            `✅ Sent payment reminder for invoice ${invoice.invoiceCode} to user ${userId}`,
          );
        } catch (error) {
          console.error(
            `❌ Error sending reminder for invoice ${invoice.invoiceCode}:`,
            error,
          );
        }
      }

      console.log(
        `✅ Completed sending ${upcomingDueInvoices.length} payment reminders`,
      );
    } catch (error) {
      console.error('❌ Error sending payment reminder notifications:', error);
    }
  }
}
