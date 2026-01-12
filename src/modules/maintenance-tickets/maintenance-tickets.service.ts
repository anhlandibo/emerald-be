import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MaintenanceTicket } from './entities/maintenance-ticket.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Block } from '../blocks/entities/block.entity';
import { Apartment } from '../apartments/entities/apartment.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { AssetsService } from '../assets/assets.service';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from './dto/update-maintenance-ticket.dto';
import { DeleteManyMaintenanceTicketsDto } from './dto/delete-many-maintenance-tickets.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto';
import { CancelTicketDto } from './dto/cancel-ticket.dto';
import { QueryMaintenanceTicketDto } from './dto/query-maintenance-ticket.dto';
import { TicketStatus } from './enums/ticket-status.enum';
import { TicketPriority } from './enums/ticket-priority.enum';
import { MaintenanceResult } from './enums/maintenance-result.enum';
import { AssetStatus } from '../assets/enums/asset-status.enum';
import { plainToInstance } from 'class-transformer';
import { MaintenanceTicketListItemDto } from './dto/maintenance-ticket-list.dto';
import { MaintenanceTicketDetailDto } from './dto/maintenance-ticket-detail.dto';
import { TicketHistoryItemDto } from './dto/ticket-history-item.dto';

@Injectable()
export class MaintenanceTicketsService {
  constructor(
    @InjectRepository(MaintenanceTicket)
    private readonly ticketRepository: Repository<MaintenanceTicket>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(Apartment)
    private readonly apartmentRepository: Repository<Apartment>,
    @InjectRepository(Technician)
    private readonly technicianRepository: Repository<Technician>,
    private readonly assetsService: AssetsService,
  ) {}

  async create(createDto: CreateMaintenanceTicketDto) {
    // Validate Block exists
    const block = await this.blockRepository.findOne({
      where: { id: createDto.blockId, isActive: true },
    });

    if (!block) {
      throw new HttpException(
        `Block với ID ${createDto.blockId} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate Asset if provided
    if (createDto.assetId) {
      const asset = await this.assetRepository.findOne({
        where: { id: createDto.assetId, isActive: true },
      });

      if (!asset) {
        throw new HttpException(
          `Asset với ID ${createDto.assetId} không tồn tại`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Validate Apartment if provided
    if (createDto.apartmentId) {
      const apartment = await this.apartmentRepository.findOne({
        where: { id: createDto.apartmentId },
      });

      if (!apartment) {
        throw new HttpException(
          `Apartment với ID ${createDto.apartmentId} không tồn tại`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const ticket = this.ticketRepository.create({
      title: createDto.title,
      description: createDto.description,
      type: createDto.type,
      priority: createDto.priority || TicketPriority.MEDIUM,
      blockId: createDto.blockId,
      floor: createDto.floor,
      apartmentId: createDto.apartmentId,
      assetId: createDto.assetId,
      checklistItems: createDto.checklistItems,
      status: TicketStatus.PENDING,
    });

    const savedTicket = await this.ticketRepository.save(ticket);
    return this.findOne(savedTicket.id);
  }

  async findAll(query: QueryMaintenanceTicketDto) {
    const { type, status, priority, blockId, technicianId, assetId } = query;

    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.block', 'block')
      .leftJoinAndSelect('ticket.asset', 'asset')
      .leftJoinAndSelect('ticket.technician', 'technician')
      .andWhere('ticket.isActive = :isActive', { isActive: true });

    if (type) {
      queryBuilder.andWhere('ticket.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('ticket.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('ticket.priority = :priority', { priority });
    }

    if (blockId) {
      queryBuilder.andWhere('ticket.blockId = :blockId', { blockId });
    }

    if (technicianId) {
      queryBuilder.andWhere('ticket.technicianId = :technicianId', {
        technicianId,
      });
    }

    if (assetId) {
      queryBuilder.andWhere('ticket.assetId = :assetId', { assetId });
    }

    queryBuilder.orderBy('ticket.createdAt', 'DESC');

    const tickets = await queryBuilder.getMany();

    return tickets.map((ticket) =>
      plainToInstance(MaintenanceTicketListItemDto, {
        id: ticket.id,
        title: ticket.title,
        type: ticket.type,
        priority: ticket.priority,
        status: ticket.status,
        assetName: ticket.asset?.name,
        blockName: ticket.block?.name,
        floor: ticket.floor,
        technicianName: ticket.technician?.fullName,
        createdAt: ticket.createdAt,
      }),
    );
  }

  async findOne(id: number) {
    const ticket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.block', 'block')
      .leftJoinAndSelect('ticket.apartment', 'apartment')
      .leftJoinAndSelect('ticket.asset', 'asset')
      .leftJoinAndSelect('asset.type', 'assetType')
      .leftJoinAndSelect('ticket.technician', 'technician')
      .where('ticket.id = :id', { id })
      .andWhere('ticket.isActive = :isActive', { isActive: true })
      .getOne();

    if (!ticket) {
      throw new HttpException(
        `Ticket với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    return plainToInstance(MaintenanceTicketDetailDto, {
      id: ticket.id,
      title: ticket.title,
      type: ticket.type,
      priority: ticket.priority,
      description: ticket.description,
      status: ticket.status,
      blockId: ticket.blockId,
      blockName: ticket.block?.name,
      floor: ticket.floor,
      apartmentId: ticket.apartmentId,
      apartmentNumber: ticket.apartment?.name,
      assetId: ticket.assetId,
      assetName: ticket.asset?.name,
      assetTypeName: ticket.asset?.type?.name,
      technicianId: ticket.technicianId,
      technicianName: ticket.technician?.fullName,
      technicianPhone: ticket.technician?.phoneNumber,
      checklistItems: ticket.checklistItems,
      assignedDate: ticket.assignedDate,
      startedDate: ticket.startedDate,
      completedDate: ticket.completedDate,
      result: ticket.result,
      resultNote: ticket.resultNote,
      hasIssue: ticket.hasIssue,
      issueDetail: ticket.issueDetail,
      materialCost: ticket.materialCost
        ? Number(ticket.materialCost)
        : undefined,
      laborCost: ticket.laborCost ? Number(ticket.laborCost) : undefined,
      totalCost: ticket.totalCost ? Number(ticket.totalCost) : undefined,
      estimatedCost: ticket.estimatedCost
        ? Number(ticket.estimatedCost)
        : undefined,
      actualCost: ticket.actualCost ? Number(ticket.actualCost) : undefined,
      createdAt: ticket.createdAt,
    });
  }

  async assignTechnician(id: number, assignDto: AssignTechnicianDto) {
    const ticket = await this.ticketRepository.findOne({
      where: { id, isActive: true },
    });

    if (!ticket) {
      throw new HttpException(
        `Ticket với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate technician exists
    const technician = await this.technicianRepository.findOne({
      where: { id: assignDto.technicianId, isActive: true },
    });

    if (!technician) {
      throw new HttpException(
        `Technician với ID ${assignDto.technicianId} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    ticket.technicianId = assignDto.technicianId;
    ticket.status = TicketStatus.ASSIGNED;

    if (assignDto.priority) {
      ticket.priority = assignDto.priority;
    }

    if (assignDto.assignedDate) {
      ticket.assignedDate = new Date(assignDto.assignedDate);
    } else {
      ticket.assignedDate = new Date();
    }

    await this.ticketRepository.save(ticket);
    return this.findOne(id);
  }

  async startWork(id: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id, isActive: true },
    });

    if (!ticket) {
      throw new HttpException(
        `Ticket với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (ticket.status !== TicketStatus.ASSIGNED) {
      throw new HttpException(
        'Ticket phải ở trạng thái ASSIGNED để bắt đầu làm việc',
        HttpStatus.BAD_REQUEST,
      );
    }

    ticket.status = TicketStatus.IN_PROGRESS;
    ticket.startedDate = new Date();

    // Update asset status to UNDER_MAINTENANCE if ticket has assetId
    if (ticket.assetId) {
      await this.assetRepository.update(ticket.assetId, {
        status: AssetStatus.MAINTENANCE,
      });
    }

    await this.ticketRepository.save(ticket);
    return this.findOne(id);
  }

  async updateProgress(id: number, updateDto: UpdateProgressDto) {
    const ticket = await this.ticketRepository.findOne({
      where: { id, isActive: true },
    });

    if (!ticket) {
      throw new HttpException(
        `Ticket với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    ticket.checklistItems = updateDto.checklistItems.map((item) => ({
      task: item.task,
      isChecked: item.isChecked ?? false,
    }));
    await this.ticketRepository.save(ticket);
    return this.findOne(id);
  }

  async complete(id: number, completeDto: CompleteMaintenanceDto) {
    const ticket = await this.ticketRepository.findOne({
      where: { id, isActive: true },
    });

    if (!ticket) {
      throw new HttpException(
        `Ticket với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (ticket.status !== TicketStatus.IN_PROGRESS) {
      throw new HttpException(
        'Ticket phải ở trạng thái IN_PROGRESS để hoàn thành',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Calculate total cost
    const materialCost = completeDto.materialCost || 0;
    const laborCost = completeDto.laborCost || 0;
    const totalCost = materialCost + laborCost;

    ticket.status = TicketStatus.COMPLETED;
    ticket.result = completeDto.result;
    ticket.resultNote = completeDto.resultNote;
    ticket.hasIssue = completeDto.hasIssue || false;
    ticket.issueDetail = completeDto.issueDetail;
    ticket.materialCost = materialCost;
    ticket.laborCost = laborCost;
    ticket.totalCost = totalCost;
    ticket.actualCost = totalCost;
    ticket.completedDate = new Date();

    await this.ticketRepository.save(ticket);

    // Update asset status based on result
    if (ticket.assetId) {
      const completedDate = ticket.completedDate;

      if (completeDto.result === MaintenanceResult.GOOD) {
        await this.assetRepository.update(ticket.assetId, {
          status: AssetStatus.ACTIVE,
          lastMaintenanceDate: completedDate,
        });

        // Recalculate next maintenance date using asset's maintenance interval
        const asset = await this.assetRepository.findOne({
          where: { id: ticket.assetId },
        });

        if (asset && asset.maintenanceIntervalMonths) {
          const nextMaintenanceDate = new Date(completedDate);
          nextMaintenanceDate.setMonth(
            nextMaintenanceDate.getMonth() + asset.maintenanceIntervalMonths,
          );

          await this.assetRepository.update(ticket.assetId, {
            nextMaintenanceDate,
          });
        }
      } else if (completeDto.result === MaintenanceResult.NEEDS_REPAIR) {
        await this.assetRepository.update(ticket.assetId, {
          status: AssetStatus.BROKEN,
        });
      } else if (completeDto.result === MaintenanceResult.MONITORING) {
        await this.assetRepository.update(ticket.assetId, {
          status: AssetStatus.ACTIVE,
          note: `Cần theo dõi: ${completeDto.resultNote || 'Cần theo dõi thêm'}`,
        });
      }
    }

    return this.findOne(id);
  }

  async cancel(id: number, cancelDto: CancelTicketDto) {
    const ticket = await this.ticketRepository.findOne({
      where: { id, isActive: true },
    });

    if (!ticket) {
      throw new HttpException(
        `Ticket với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (ticket.status === TicketStatus.COMPLETED) {
      throw new HttpException(
        'Không thể hủy ticket đã hoàn thành',
        HttpStatus.BAD_REQUEST,
      );
    }

    ticket.status = TicketStatus.CANCELLED;
    ticket.resultNote = `Hủy: ${cancelDto.reason}`;

    await this.ticketRepository.save(ticket);

    // If asset was UNDER_MAINTENANCE, return to ACTIVE
    if (ticket.assetId) {
      const asset = await this.assetRepository.findOne({
        where: { id: ticket.assetId },
      });

      if (asset && asset.status === AssetStatus.MAINTENANCE) {
        await this.assetRepository.update(ticket.assetId, {
          status: AssetStatus.ACTIVE,
        });
      }
    }

    return this.findOne(id);
  }

  async update(id: number, updateDto: UpdateMaintenanceTicketDto) {
    const ticket = await this.ticketRepository.findOne({
      where: { id, isActive: true },
      relations: ['block', 'apartment', 'asset'],
    });

    if (!ticket) {
      throw new HttpException(
        `Ticket với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Only allow update for PENDING or ASSIGNED tickets
    if (
      ticket.status !== TicketStatus.PENDING &&
      ticket.status !== TicketStatus.ASSIGNED
    ) {
      throw new HttpException(
        'Chỉ có thể cập nhật ticket ở trạng thái PENDING hoặc ASSIGNED',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate Block if changed
    if (updateDto.blockId && updateDto.blockId !== ticket.blockId) {
      const block = await this.blockRepository.findOne({
        where: { id: updateDto.blockId, isActive: true },
      });

      if (!block) {
        throw new HttpException(
          `Block với ID ${updateDto.blockId} không tồn tại`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Validate Apartment if changed
    if (updateDto.apartmentId && updateDto.apartmentId !== ticket.apartmentId) {
      const apartment = await this.apartmentRepository.findOne({
        where: { id: updateDto.apartmentId, isActive: true },
      });

      if (!apartment) {
        throw new HttpException(
          `Apartment với ID ${updateDto.apartmentId} không tồn tại`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Validate Asset if changed
    if (updateDto.assetId && updateDto.assetId !== ticket.assetId) {
      const asset = await this.assetRepository.findOne({
        where: { id: updateDto.assetId, isActive: true },
      });

      if (!asset) {
        throw new HttpException(
          `Asset với ID ${updateDto.assetId} không tồn tại`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Update ticket fields
    Object.assign(ticket, {
      ...updateDto,
      checklistItems: updateDto.checklistItems || ticket.checklistItems,
    });

    await this.ticketRepository.save(ticket);

    return this.findOne(id);
  }

  async remove(id: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id, isActive: true },
    });

    if (!ticket) {
      throw new HttpException(
        `Ticket với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete by setting isActive to false
    await this.ticketRepository.update(id, { isActive: false });

    return { message: 'Xóa ticket thành công' };
  }

  async removeMany(deleteDto: DeleteManyMaintenanceTicketsDto) {
    const { ids } = deleteDto;

    if (!ids || ids.length === 0) {
      throw new HttpException(
        'Danh sách IDs không được rỗng',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check which tickets exist
    const tickets = await this.ticketRepository.find({
      where: { id: In(ids), isActive: true },
    });

    const foundIds = tickets.map((t) => t.id);
    const notFoundIds = ids.filter((id) => !foundIds.includes(id));

    if (notFoundIds.length > 0) {
      throw new HttpException(
        `Các ticket với IDs ${notFoundIds.join(', ')} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete all by setting isActive to false
    await this.ticketRepository.update({ id: In(ids) }, { isActive: false });

    return {
      message: `Đã xóa thành công ${ids.length} ticket`,
      deletedIds: ids,
    };
  }

  async getAssetHistory(assetId: number): Promise<TicketHistoryItemDto[]> {
    const tickets = await this.ticketRepository.find({
      where: {
        assetId,
        status: TicketStatus.COMPLETED,
        isActive: true,
      },
      relations: ['technician'],
      order: {
        completedDate: 'DESC',
      },
      take: 10,
    });

    return tickets.map((ticket) =>
      plainToInstance(TicketHistoryItemDto, {
        id: ticket.id,
        title: ticket.title,
        type: ticket.type,
        status: ticket.status,
        date: ticket.completedDate
          ? ticket.completedDate.toISOString().split('T')[0]
          : '',
        result: ticket.result,
        technicianName: ticket.technician
          ? ticket.technician.fullName
          : 'Chưa có kỹ thuật viên',
      }),
    );
  }
}
