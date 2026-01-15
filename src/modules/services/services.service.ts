import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Service } from './entities/service.entity';
import { SlotAvailability } from './entities/slot-availability.entity';
import { Resident } from '../residents/entities/resident.entity';
import { CheckSlotAvailabilityDto } from './dtos/check-slot-availability.dto';
import { ReserveSlotDto } from './dtos/reserve-slot.dto';
import {
  ServiceResponseDto,
  SlotAvailabilityResponseDto,
} from './dtos/service-response.dto';
import { ServiceTypeLabels } from './enums/service-type.enum';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(SlotAvailability)
    private readonly slotRepository: Repository<SlotAvailability>,
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
    private readonly bookingsService: BookingsService,
  ) {}

  async findAll(): Promise<ServiceResponseDto[]> {
    const services = await this.serviceRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return services.map((s) => this.transformToResponse(s));
  }

  async findOne(id: number): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id, isActive: true },
    });

    if (!service) {
      throw new HttpException(
        `Service với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.transformToResponse(service);
  }

  async checkSlotAvailability(
    serviceId: number,
    checkSlotDto: CheckSlotAvailabilityDto,
  ): Promise<SlotAvailabilityResponseDto[]> {
    const service = await this.findOne(serviceId);

    const date = new Date(checkSlotDto.date);

    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const existingSlots = await this.slotRepository.find({
      where: {
        serviceId,
        startTime: Between(startOfDay, endOfDay),
      },
      order: { startTime: 'ASC' },
    });

    const allPossibleSlots = this.generateTimeSlots(
      checkSlotDto.date,
      service.openHour,
      service.closeHour,
      service.unitTimeBlock,
    );

    const result: SlotAvailabilityResponseDto[] = allPossibleSlots.map(
      (slot) => {
        const existingSlot = existingSlots.find(
          (es) =>
            es.startTime.getTime() === slot.startTime.getTime() &&
            es.endTime.getTime() === slot.endTime.getTime(),
        );

        const remainingSlot = existingSlot
          ? existingSlot.remainingSlot
          : service.totalSlot;

        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          remainingSlot,
          isAvailable: remainingSlot > 0,
        };
      },
    );

    return result;
  }

  async reserveSlot(
    serviceId: number,
    reserveSlotDto: ReserveSlotDto,
    accountId: number,
  ) {
    const resident = await this.residentRepository.findOne({
      where: { accountId, isActive: true },
    });

    if (!resident) {
      throw new HttpException(
        'Không tìm thấy thông tin cư dân',
        HttpStatus.NOT_FOUND,
      );
    }

    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      throw new HttpException(
        `Service với ID ${serviceId} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (reserveSlotDto.slots.length === 0) {
      throw new HttpException(
        'Không có slot nào được cung cấp',
        HttpStatus.BAD_REQUEST,
      );
    }

    const seen = new Set<string>();
    const uniqueSlots = reserveSlotDto.slots.filter((slotItem) => {
      const key = JSON.stringify(slotItem);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    const totalPrice = this.calculatePrice(service, reserveSlotDto);

    return await this.slotRepository.manager.transaction(async (manager) => {
      for (const slotItem of uniqueSlots) {
        const startParts = slotItem.startTime.split(':').map(Number);
        const endParts = slotItem.endTime.split(':').map(Number);

        const [openH, openM] = service.openHour.split(':').map(Number);
        const [closeH, closeM] = service.closeHour.split(':').map(Number);
        if (
          startParts[0] < openH ||
          (startParts[0] === openH && startParts[1] < openM) ||
          endParts[0] > closeH ||
          (endParts[0] === closeH && endParts[1] > closeM)
        ) {
          throw new HttpException(
            `Slot ${slotItem.startTime}-${slotItem.endTime} không nằm trong giờ dịch vụ ${service.openHour}-${service.closeHour}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        const bookingDate = new Date(reserveSlotDto.bookingDate);
        const startDateTime = new Date(bookingDate);
        startDateTime.setHours(startParts[0], startParts[1], 0, 0);
        const endDateTime = new Date(bookingDate);
        endDateTime.setHours(endParts[0], endParts[1], 0, 0);

        let slot = await manager.findOne(SlotAvailability, {
          where: { serviceId, startTime: startDateTime, endTime: endDateTime },
          lock: { mode: 'pessimistic_write' },
        });

        if (!slot) {
          slot = manager.create(SlotAvailability, {
            serviceId,
            startTime: startDateTime,
            endTime: endDateTime,
            remainingSlot: service.totalSlot - 1,
          });
        } else {
          if (slot.remainingSlot <= 0) {
            throw new HttpException(
              `Không còn slot nào khả dụng cho ${slotItem.startTime}-${slotItem.endTime}`,
              HttpStatus.BAD_REQUEST,
            );
          }
          slot.remainingSlot -= 1;
        }

        await manager.save(slot);
      }

      const booking = await this.bookingsService.createBooking(
        {
          residentId: resident.id,
          serviceId: service.id,
          bookingDate: reserveSlotDto.bookingDate,
          timestamps: uniqueSlots,
          unitPrice: service.unitPrice,
          totalPrice,
        },
        manager,
      );

      return booking;
    });
  }

  private generateTimeSlots(
    date: string,
    openHour: string,
    closeHour: string,
    unitTimeBlock: number,
  ): { startTime: Date; endTime: Date }[] {
    const slots: { startTime: Date; endTime: Date }[] = [];

    const [openH, openM] = openHour.split(':').map(Number);
    const [closeH, closeM] = closeHour.split(':').map(Number);

    const formattedOpen = `${openH.toString().padStart(2, '0')}:${openM.toString().padStart(2, '0')}`;
    const formattedClose = `${closeH.toString().padStart(2, '0')}:${closeM.toString().padStart(2, '0')}`;

    let currentTime = new Date(`${date}T${formattedOpen}:00`);
    const endTime = new Date(`${date}T${formattedClose}:00`);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + unitTimeBlock * 60000);

      if (slotEnd <= endTime) {
        slots.push({
          startTime: new Date(currentTime),
          endTime: new Date(slotEnd),
        });
      }

      currentTime = slotEnd;
    }

    return slots;
  }

  private transformToResponse(service: Service): ServiceResponseDto {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      openHour: service.openHour,
      closeHour: service.closeHour,
      imageUrl: service.imageUrl,
      unitPrice: service.unitPrice,
      unitTimeBlock: service.unitTimeBlock,
      totalSlot: service.totalSlot,
      type: service.type,
      typeLabel: ServiceTypeLabels[service.type],
      createdAt: service.createdAt,
    };
  }

  private calculatePrice(
    service: Service,
    reserveSlotDto: ReserveSlotDto,
  ): number {
    let totalDuration = 0;
    for (const slot of reserveSlotDto.slots) {
      const startParts = slot.startTime.split(':').map(Number);
      const endParts = slot.endTime.split(':').map(Number);
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];

      if (endMinutes <= startMinutes) {
        throw new HttpException(
          'Thời gian kết thúc phải sau thời gian bắt đầu cho mỗi slot',
          HttpStatus.BAD_REQUEST,
        );
      }

      const durationMinutes = endMinutes - startMinutes;
      if (durationMinutes % service.unitTimeBlock !== 0) {
        throw new HttpException(
          `Thời lượng phải là bội số của ${service.unitTimeBlock} phút cho mỗi slot`,
          HttpStatus.BAD_REQUEST,
        );
      }

      totalDuration += durationMinutes;
    }

    const numBlocks = totalDuration / service.unitTimeBlock;
    return numBlocks * service.unitPrice;
  }
}
