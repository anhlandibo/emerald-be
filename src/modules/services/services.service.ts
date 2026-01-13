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
        `Service with ID ${id} not found`,
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

    console.log('date: ', date);

    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    console.log('startOfDay: ', startOfDay);
    console.log('endOfDay: ', endOfDay);

    const existingSlots = await this.slotRepository.find({
      where: {
        serviceId,
        startTime: Between(startOfDay, endOfDay),
      },
      order: { startTime: 'ASC' },
    });

    console.log('existingSlots: ', existingSlots);

    const allPossibleSlots = this.generateTimeSlots(
      checkSlotDto.date,
      service.openHour,
      service.closeHour,
      service.unitTimeBlock,
    );

    console.log('allPossibleSlots: ', allPossibleSlots);

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
        'Resident profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }

    if (reserveSlotDto.slots.length === 0) {
      throw new BadRequestException('No slots provided');
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
          throw new BadRequestException(
            `Slot ${slotItem.startTime}-${slotItem.endTime} is outside service hours ${service.openHour}-${service.closeHour}`,
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
            throw new BadRequestException(
              `No available slots for ${slotItem.startTime}-${slotItem.endTime}`,
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
    console.log('(generate) date: ', date);
    console.log('(generate) openHour: ', openHour);
    console.log('(generate) closeHour: ', closeHour);
    console.log('(generate) unitTimeBlock: ', unitTimeBlock);

    const slots: { startTime: Date; endTime: Date }[] = [];

    const [openH, openM] = openHour.split(':').map(Number);
    const [closeH, closeM] = closeHour.split(':').map(Number);

    const formattedOpen = `${openH.toString().padStart(2, '0')}:${openM.toString().padStart(2, '0')}`;
    const formattedClose = `${closeH.toString().padStart(2, '0')}:${closeM.toString().padStart(2, '0')}`;

    console.log('currentTime:', formattedOpen);
    console.log('endTime:', formattedClose);

    let currentTime = new Date(`${date}T${formattedOpen}:00`);
    const endTime = new Date(`${date}T${formattedClose}:00`);

    console.log('currentTime:', currentTime);
    console.log('endTime:', endTime);
    console.log('currentTime < endTime:', currentTime < endTime);

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
        throw new BadRequestException(
          'End time must be after start time for slot',
        );
      }

      const durationMinutes = endMinutes - startMinutes;
      if (durationMinutes % service.unitTimeBlock !== 0) {
        throw new BadRequestException(
          `Duration must be a multiple of ${service.unitTimeBlock} minutes for each slot`,
        );
      }

      totalDuration += durationMinutes;
    }

    const numBlocks = totalDuration / service.unitTimeBlock;
    return numBlocks * service.unitPrice;
  }
}
