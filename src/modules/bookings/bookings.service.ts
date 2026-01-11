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

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingPayment)
    private readonly paymentRepository: Repository<BookingPayment>,
    @InjectRepository(SlotAvailability)
    private readonly slotRepository: Repository<SlotAvailability>,
  ) {}

  async createBooking(bookingData: {
    residentId: number;
    serviceId: number;
    bookingDate: string;
    timestamps: { startTime: string; endTime: string }[];
    unitPrice: number;
    totalPrice: number;
  }): Promise<BookingResponseDto> {
    const code = await this.generateBookingCode();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const booking = this.bookingRepository.create({
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
        `Booking with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.transformToResponse(booking);
  }

  async payBooking(
    id: number,
    payBookingDto: PayBookingDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
    });

    if (!booking) {
      throw new HttpException(
        `Booking with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Can only pay for pending bookings');
    }

    if (booking.expiresAt && new Date() > booking.expiresAt) {
      booking.status = BookingStatus.EXPIRED;
      await this.bookingRepository.save(booking);

      await this.releaseSlot(booking);

      throw new BadRequestException('Booking has expired');
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

  private async generateBookingCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const count = await this.bookingRepository.count({
      where: {
        code: Like(`BKG-${dateStr}-%`),
      },
    });

    const sequence = String(count + 1).padStart(3, '0');

    return `BKG-${dateStr}-${sequence}`;
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
      bookingDate: booking.bookingDate.toISOString().split('T')[0],
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
