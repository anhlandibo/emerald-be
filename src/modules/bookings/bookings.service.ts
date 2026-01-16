import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Like } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking } from './entities/booking.entity';
import { BookingPayment } from './entities/booking-payment.entity';
import { SlotAvailability } from '../services/entities/slot-availability.entity';
import { PayBookingDto } from './dtos/pay-booking.dto';
import { BookingResponseDto } from './dtos/booking-response.dto';
import {
  BookingStatus,
  BookingStatusLabels,
} from './enums/booking-status.enum';
import { EntityManager } from 'typeorm';
import { Resident } from '../residents/entities/resident.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingPayment)
    private readonly paymentRepository: Repository<BookingPayment>,
    @InjectRepository(SlotAvailability)
    private readonly slotRepository: Repository<SlotAvailability>,
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) {}

  async createBooking(
    bookingData: {
      residentId: number;
      serviceId: number;
      bookingDate: string;
      timestamps: { startTime: string; endTime: string }[];
      unitPrice: number;
      totalPrice: number;
    },
    manager?: EntityManager,
  ): Promise<BookingResponseDto> {
    const repo = manager
      ? manager.getRepository(Booking)
      : this.bookingRepository;

    const code = await this.generateBookingCode(manager);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const booking = repo.create({
      code,
      residentId: bookingData.residentId,
      serviceId: bookingData.serviceId,
      bookingDate: new Date(bookingData.bookingDate),
      timestamps: bookingData.timestamps,
      unitPrice: bookingData.unitPrice,
      totalPrice: bookingData.totalPrice,
      status: BookingStatus.PENDING,
      expiresAt,
    });

    const savedBooking = await this.bookingRepository.save(booking);
    return this.findOne(savedBooking.id);
  }

  async findMyBookings(residentId: number): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.find({
      where: { residentId },
      relations: ['service', 'resident'],
      order: { createdAt: 'DESC' },
    });

    return bookings.map((booking) => this.transformToResponse(booking));
  }

  async findOne(id: number): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['service', 'resident'],
    });

    if (!booking) {
      throw new HttpException(
        `Booking với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.transformToResponse(booking);
  }

  async payBooking(
    id: number,
    payBookingDto: PayBookingDto,
    accountId: number,
  ): Promise<BookingResponseDto> {
    const resident = await this.getResidentByAccount(accountId);
    const booking = await this.bookingRepository.findOne({
      where: { id },
    });

    if (!booking) {
      throw new HttpException(
        `Booking với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (booking.residentId !== resident.id) {
      throw new HttpException(
        'Bạn không có quyền thanh toán cho booking này',
        HttpStatus.FORBIDDEN,
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new HttpException(
        'Chỉ có thể thanh toán cho booking đang chờ xử lý',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (booking.expiresAt && new Date() > booking.expiresAt) {
      booking.status = BookingStatus.EXPIRED;
      await this.bookingRepository.save(booking);

      await this.releaseSlot(booking);

      throw new HttpException(
        'Booking đã hết hạn thanh toán',
        HttpStatus.BAD_REQUEST,
      );
    }

    const payment = this.paymentRepository.create({
      bookingId: booking.id,
      amount: booking.totalPrice,
      method: payBookingDto.method,
      note: payBookingDto.note,
    });

    await this.paymentRepository.save(payment);

    booking.status = BookingStatus.PAID;
    booking.expiresAt = null;
    await this.bookingRepository.save(booking);

    return this.findOne(id);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredBookings(): Promise<void> {
    const now = new Date();

    const expiredBookings = await this.bookingRepository.find({
      where: {
        status: BookingStatus.PENDING,
        expiresAt: LessThan(now),
      },
    });

    for (const booking of expiredBookings) {
      booking.status = BookingStatus.EXPIRED;
      await this.bookingRepository.save(booking);

      await this.releaseSlot(booking);
    }

    if (expiredBookings.length > 0) {
      console.log(`[CRON] Expired ${expiredBookings.length} booking(s)`);
    }
  }

  private async releaseSlot(booking: Booking): Promise<void> {
    const dateStr = booking.bookingDate.toISOString().split('T')[0];

    for (const slotItem of booking.timestamps) {
      const startDateTime = new Date(`${dateStr}T${slotItem.startTime}:00`);
      const endDateTime = new Date(`${dateStr}T${slotItem.endTime}:00`);

      const slot = await this.slotRepository.findOne({
        where: {
          serviceId: booking.serviceId,
          startTime: startDateTime,
          endTime: endDateTime,
        },
      });

      if (slot) {
        slot.remainingSlot += 1;
        await this.slotRepository.save(slot);
      }
    }
  }

  private async generateBookingCode(manager?: EntityManager): Promise<string> {
    const repo = manager
      ? manager.getRepository(Booking)
      : this.bookingRepository;

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const count = await repo.count({
      where: {
        code: Like(`BKG-${dateStr}-%`),
      },
    });

    const sequence = String(count + 1).padStart(3, '0');

    return `BKG-${dateStr}-${sequence}`;
  }

  private async getResidentByAccount(accountId: number) {
    const resident = await this.residentRepository.findOne({
      where: { accountId, isActive: true },
    });
    if (!resident) {
      throw new HttpException(
        'Không tìm thấy thông tin cư dân',
        HttpStatus.NOT_FOUND,
      );
    }
    return resident;
  }

  transformToResponse(booking: Booking): BookingResponseDto {
    return {
      id: booking.id,
      code: booking.code,
      service: booking.service
        ? {
            id: booking.service.id,
            name: booking.service.name,
            imageUrl: booking.service.imageUrl,
          }
        : null,
      resident: booking.resident
        ? {
            id: booking.resident.id,
            fullName: booking.resident.fullName,
            phoneNumber: booking.resident.phoneNumber,
          }
        : null,
      bookingDate: booking.bookingDate,
      timestamps: booking.timestamps,
      unitPrice: booking.unitPrice,
      totalPrice: booking.totalPrice,
      status: booking.status,
      statusLabel: BookingStatusLabels[booking.status],
      expiresAt: booking.expiresAt,
      createdAt: booking.createdAt,
    };
  }
}
