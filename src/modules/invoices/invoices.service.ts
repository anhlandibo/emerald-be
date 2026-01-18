import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class InvoicesService {
  private readonly VAT_RATE = 8; // 8% VAT

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
  ) {}

  /**
   * Tính VAT cho amount
   */
  private calculateVAT(amount: number): {
    vatAmount: number;
    totalWithVat: number;
  } {
    const vatAmount = Number(((amount * this.VAT_RATE) / 100).toFixed(2));
    const totalWithVat = Number((amount + vatAmount).toFixed(2));
    return { vatAmount, totalWithVat };
  }

  /**
   * Tìm apartment ID từ resident ID (lấy từ token)
   */
  async findApartmentByAccountId(accountId: number): Promise<number> {
    const resident = await this.residentRepository.findOne({
      where: { accountId },
    });
    const apartmentResident = await this.apartmentResidentRepository.findOne({
      where: { residentId: resident?.id },
      relations: ['apartment'],
    });
    console.log('Resident ID:', resident?.id);
    console.log('Apartment Resident:', apartmentResident);

    if (!apartmentResident) {
      throw new HttpException(
        'Không tìm thấy căn hộ liên kết với cư dân này',
        HttpStatus.NOT_FOUND,
      );
    }

    return apartmentResident.apartmentId;
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

      const { vatAmount, totalWithVat } = this.calculateVAT(waterPrice);

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

      const { vatAmount, totalWithVat } = this.calculateVAT(electricityPrice);

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

        const { vatAmount, totalWithVat } = this.calculateVAT(feePrice);

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

        const { vatAmount, totalWithVat } = this.calculateVAT(feePrice);

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

    const periodDate = new Date(period);

    // Kiểm tra apartment tồn tại
    const apartment = await this.apartmentRepository.findOne({
      where: { id: apartmentId },
    });

    if (!apartment) {
      throw new HttpException('Không tìm thấy căn hộ', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra đã tồn tại hóa đơn cho kỳ này chưa
    const existingInvoice = await this.invoiceRepository.findOne({
      where: {
        apartmentId,
        period: periodDate,
      },
    });

    if (existingInvoice) {
      throw new HttpException(
        'Hóa đơn cho kỳ này đã tồn tại',
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

    // Tính VAT cho toàn bộ hóa đơn
    const { vatAmount, totalWithVat } = this.calculateVAT(subtotalAmount);

    // Tạo invoice
    const invoice = this.invoiceRepository.create({
      invoiceCode,
      apartmentId,
      period: periodDate,
      subtotalAmount,
      vatRate: this.VAT_RATE,
      vatAmount,
      totalAmount: totalWithVat,
      status: InvoiceStatus.UNPAID,
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
    const { waterIndex, electricityIndex, period } = createInvoiceDto;

    // Tìm apartment từ resident
    const apartmentId = await this.findApartmentByAccountId(accountId);

    const periodDate = new Date(period);

    // Kiểm tra đã tồn tại hóa đơn cho kỳ này chưa
    const existingInvoice = await this.invoiceRepository.findOne({
      where: {
        apartmentId,
        period: periodDate,
      },
    });

    if (existingInvoice) {
      throw new HttpException(
        'Hóa đơn cho kỳ này đã tồn tại',
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

    // Tính VAT cho toàn bộ hóa đơn
    const { vatAmount, totalWithVat } = this.calculateVAT(subtotalAmount);

    // Tạo invoice
    const invoice = this.invoiceRepository.create({
      invoiceCode,
      apartmentId,
      period: periodDate,
      subtotalAmount,
      vatRate: this.VAT_RATE,
      vatAmount,
      totalAmount: totalWithVat,
      status: InvoiceStatus.UNPAID,
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

    const periodDate = new Date(period);

    // Xóa các invoice details cũ
    await this.invoiceDetailRepository.delete({ invoiceId: id });

    // Tính toán lại chi tiết hóa đơn
    const { details, subtotalAmount } = await this.calculateInvoiceDetails(
      apartmentId,
      waterIndex,
      electricityIndex,
      periodDate,
    );

    // Tính VAT cho toàn bộ hóa đơn
    const { vatAmount, totalWithVat } = this.calculateVAT(subtotalAmount);

    // Cập nhật invoice
    invoice.apartmentId = apartmentId;
    invoice.period = periodDate;
    invoice.subtotalAmount = subtotalAmount;
    invoice.vatRate = this.VAT_RATE;
    invoice.vatAmount = vatAmount;
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
   * Lấy chi tiết 1 hóa đơn
   */
  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['invoiceDetails', 'invoiceDetails.feeType', 'apartment'],
    });

    if (!invoice) {
      throw new HttpException('Không tìm thấy hóa đơn', HttpStatus.NOT_FOUND);
    }

    return invoice;
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
          const { vatAmount, totalWithVat } = this.calculateVAT(totalPrice);

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
    invoice.vatRate = this.VAT_RATE;
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

    await this.invoiceRepository.softDelete(id);
  }
}
