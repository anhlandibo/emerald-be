import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MaintenanceTicket } from './entities/maintenance-ticket.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Block } from '../blocks/entities/block.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { Issue } from '../issues/entities/issue.entity';
import { AssetsService } from '../assets/assets.service';
import { SupabaseStorageService } from '../supabase-storage/supabase-storage.service';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { CreateIncidentMaintenanceTicketDto } from './dtos/create-incident-maintenance-ticket.dto';
import { CreateScheduledMaintenanceTicketDto } from './dtos/create-scheduled-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from './dto/update-maintenance-ticket.dto';
import { UpdateIncidentMaintenanceTicketDto } from './dtos/update-incident-maintenance-ticket.dto';
import { UpdateScheduledMaintenanceTicketDto } from './dtos/update-scheduled-maintenance-ticket.dto';
import { CompleteIncidentMaintenanceTicketDto } from './dtos/complete-incident-maintenance-ticket.dto';
import { CompleteScheduledMaintenanceTicketDto } from './dtos/complete-scheduled-maintenance-ticket.dto';
import { DeleteManyMaintenanceTicketsDto } from './dto/delete-many-maintenance-tickets.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CancelTicketDto } from './dto/cancel-ticket.dto';
import { QueryMaintenanceTicketDto } from './dto/query-maintenance-ticket.dto';
import { TicketStatus } from './enums/ticket-status.enum';
import { TicketPriority } from './enums/ticket-priority.enum';
import { MaintenanceResult } from './enums/maintenance-result.enum';
import { IssueStatus } from '../issues/enums/issue-status.enum';
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
    @InjectRepository(Technician)
    private readonly technicianRepository: Repository<Technician>,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    private readonly assetsService: AssetsService,
    private readonly supabaseStorageService: SupabaseStorageService,
  ) {}

  async createIncident(createDto: CreateIncidentMaintenanceTicketDto) {
    // Validate Asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: createDto.assetId, isActive: true },
      relations: ['block'],
    });

    if (!asset) {
      throw new HttpException(
        `Asset với ID ${createDto.assetId} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Extract blockId and floor from asset
    const blockId = asset.blockId;
    const floor = asset.floor;

    // Validate Block exists
    const block = await this.blockRepository.findOne({
      where: { id: blockId, isActive: true },
    });

    if (!block) {
      throw new HttpException(
        `Block với ID ${blockId} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    const ticket = this.ticketRepository.create({
      title: createDto.title,
      description: createDto.description,
      type: createDto.type,
      priority: createDto.priority || TicketPriority.MEDIUM,
      blockId: blockId,
      floor: floor,
      startedDate: new Date(),
      assetId: createDto.assetId,
      status: TicketStatus.PENDING,
    });

    const savedTicket = await this.ticketRepository.save(ticket);
    return this.findOne(savedTicket.id);
  }

  async createScheduledMaintenance(
    createDto: CreateScheduledMaintenanceTicketDto,
  ) {
    // Validate Asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: createDto.assetId, isActive: true },
      relations: ['block'],
    });

    if (!asset) {
      throw new HttpException(
        `Asset với ID ${createDto.assetId} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Extract blockId and floor from asset
    const blockId = asset.blockId;
    const floor = asset.floor;

    // Validate Block exists
    const block = await this.blockRepository.findOne({
      where: { id: blockId, isActive: true },
    });

    if (!block) {
      throw new HttpException(
        `Block với ID ${blockId} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    const ticket = this.ticketRepository.create({
      title: createDto.title,
      description: createDto.description,
      type: createDto.type,
      priority: TicketPriority.MEDIUM,
      blockId: blockId,
      floor: floor,
      startedDate: new Date(),
      assetId: createDto.assetId,
      checklistItems: createDto.checklistItems,
      status: TicketStatus.PENDING,
    });

    const savedTicket = await this.ticketRepository.save(ticket);
    return this.findOne(savedTicket.id);
  }

  async updateIncident(
    id: number,
    updateDto: UpdateIncidentMaintenanceTicketDto,
  ) {
    const ticket = await this.ticketRepository.findOne({
      where: { id, isActive: true },
      relations: ['block', 'asset', 'asset.block'],
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

    // If assetId is being updated, validate and extract blockId/floor from new asset
    if (updateDto.assetId && updateDto.assetId !== ticket.assetId) {
      const asset = await this.assetRepository.findOne({
        where: { id: updateDto.assetId, isActive: true },
        relations: ['block'],
      });

      if (!asset) {
        throw new HttpException(
          `Asset với ID ${updateDto.assetId} không tồn tại`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Extract blockId and floor from asset
      const blockId = asset.blockId;
      const floor = asset.floor;

      // Validate Block
      const block = await this.blockRepository.findOne({
        where: { id: blockId, isActive: true },
      });

      if (!block) {
        throw new HttpException(
          `Block với ID ${blockId} không tồn tại`,
          HttpStatus.NOT_FOUND,
        );
      }

      Object.assign(ticket, {
        title: updateDto.title,
        description: updateDto.description,
        priority: updateDto.priority,
        assetId: updateDto.assetId,
        blockId: blockId,
        floor: floor,
      });
    } else {
      // Only update title, description, priority if assetId not changed
      Object.assign(ticket, {
        title: updateDto.title,
        description: updateDto.description,
        priority: updateDto.priority,
      });
    }

    await this.ticketRepository.save(ticket);
    return this.findOne(id);
  }

  async updateScheduledMaintenance(
    id: number,
    updateDto: UpdateScheduledMaintenanceTicketDto,
  ) {
    const ticket = await this.ticketRepository.findOne({
      where: { id, isActive: true },
      relations: ['block', 'asset', 'asset.block'],
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

    // If assetId is being updated, validate and extract blockId/floor from new asset
    if (updateDto.assetId && updateDto.assetId !== ticket.assetId) {
      const asset = await this.assetRepository.findOne({
        where: { id: updateDto.assetId, isActive: true },
        relations: ['block'],
      });

      if (!asset) {
        throw new HttpException(
          `Asset với ID ${updateDto.assetId} không tồn tại`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Extract blockId and floor from asset
      const blockId = asset.blockId;
      const floor = asset.floor;

      // Validate Block
      const block = await this.blockRepository.findOne({
        where: { id: blockId, isActive: true },
      });

      if (!block) {
        throw new HttpException(
          `Block với ID ${blockId} không tồn tại`,
          HttpStatus.NOT_FOUND,
        );
      }

      Object.assign(ticket, {
        title: updateDto.title,
        description: updateDto.description,
        assetId: updateDto.assetId,
        blockId: blockId,
        floor: floor,
        checklistItems: updateDto.checklistItems || ticket.checklistItems,
      });
    } else {
      // Only update title, description, checklistItems if assetId not changed
      Object.assign(ticket, {
        title: updateDto.title,
        description: updateDto.description,
        checklistItems: updateDto.checklistItems || ticket.checklistItems,
      });
    }

    await this.ticketRepository.save(ticket);
    return this.findOne(id);
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
        estimatedCost:
          ticket.estimatedCost !== undefined && ticket.estimatedCost !== null
            ? Number(ticket.estimatedCost)
            : null,
        actualCost:
          ticket.actualCost !== undefined && ticket.actualCost !== null
            ? Number(ticket.actualCost)
            : null,
        createdAt: ticket.createdAt,
      }),
    );
  }

  async findOne(id: number) {
    const ticket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.block', 'block')
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
      locationDetail: ticket.asset?.locationDetail,
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
      estimatedCost:
        ticket.estimatedCost !== undefined && ticket.estimatedCost !== null
          ? Number(ticket.estimatedCost)
          : null,
      actualCost:
        ticket.actualCost !== undefined && ticket.actualCost !== null
          ? Number(ticket.actualCost)
          : null,
      createdAt: ticket.createdAt,
    });
  }

  async findByAssetId(assetId: number, query?: QueryMaintenanceTicketDto) {
    // Validate asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: assetId, isActive: true },
    });

    if (!asset) {
      throw new HttpException(
        `Asset với ID ${assetId} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    const { type, status, priority } = query || {};

    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.block', 'block')
      .leftJoinAndSelect('ticket.technician', 'technician')
      .where('ticket.assetId = :assetId', { assetId })
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

    queryBuilder.orderBy('ticket.createdAt', 'DESC');

    const tickets = await queryBuilder.getMany();

    return tickets.map((ticket) =>
      plainToInstance(MaintenanceTicketListItemDto, {
        id: ticket.id,
        title: ticket.title,
        type: ticket.type,
        priority: ticket.priority,
        status: ticket.status,
        assetName: asset.name,
        blockName: ticket.block?.name,
        floor: ticket.floor,
        technicianName: ticket.technician?.fullName,
        estimatedCost:
          ticket.estimatedCost !== undefined && ticket.estimatedCost !== null
            ? Number(ticket.estimatedCost)
            : null,
        actualCost:
          ticket.actualCost !== undefined && ticket.actualCost !== null
            ? Number(ticket.actualCost)
            : null,
        createdAt: ticket.createdAt,
      }),
    );
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
    ticket.estimatedCost = assignDto.estimatedCost;
    ticket.status = TicketStatus.ASSIGNED;
    ticket.assignedDate = new Date();

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

  async completeIncident(
    id: number,
    completeDto: CompleteIncidentMaintenanceTicketDto,
    imageFile?: Express.Multer.File,
    videoFile?: Express.Multer.File,
  ) {
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

    // Upload image and video to Supabase Storage if provided
    let imageUrl: string | undefined;
    let videoUrl: string | undefined;

    if (imageFile) {
      try {
        imageUrl = await this.supabaseStorageService.uploadFile(
          imageFile,
          'maintenance/incidents',
        );
      } catch (error) {
        console.error('Image upload error:', error);
        throw new HttpException('Lỗi upload hình ảnh', HttpStatus.BAD_REQUEST);
      }
    }

    if (videoFile) {
      try {
        videoUrl = await this.supabaseStorageService.uploadFile(
          videoFile,
          'maintenance/incidents',
        );
      } catch (error) {
        console.error('Video upload error:', error);
        throw new HttpException('Lỗi upload video', HttpStatus.BAD_REQUEST);
      }
    }

    ticket.status = TicketStatus.COMPLETED;
    ticket.result = completeDto.result;
    ticket.actualCost = completeDto.actualCost;
    ticket.resultNote = completeDto.resultNote;
    ticket.completedDate = new Date();

    // Store Cloudinary URLs in additional fields
    if (imageUrl) {
      ticket.evidenceImage = imageUrl;
    }
    if (videoUrl) {
      ticket.evidenceVideo = videoUrl;
    }

    await this.ticketRepository.save(ticket);

    // Update asset status based on result
    if (ticket.assetId) {
      const completedDate = ticket.completedDate;

      if (completeDto.result === MaintenanceResult.GOOD) {
        await this.assetRepository.update(ticket.assetId, {
          status: AssetStatus.ACTIVE,
          lastMaintenanceDate: completedDate,
        });

        // Recalculate next maintenance date
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

    // update associated issue status to RESOLVED if ticket is completed
    if (ticket.id) {
      await this.issueRepository.update(
        { maintenanceTicketId: ticket.id },
        { status: IssueStatus.RESOLVED },
      );
    }

    return this.findOne(id);
  }

  async completeScheduledMaintenance(
    id: number,
    completeDto: CompleteScheduledMaintenanceTicketDto,
  ) {
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

    ticket.status = TicketStatus.COMPLETED;
    ticket.result = completeDto.result;
    ticket.actualCost = completeDto.actualCost;
    ticket.hasIssue = completeDto.hasIssue || false;
    ticket.issueDetail = completeDto.issueDetail;
    ticket.resultNote = completeDto.resultNote;
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

        // Recalculate next maintenance date
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
