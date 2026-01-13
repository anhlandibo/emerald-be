import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { TargetBlock } from './entities/target-block.entity';
import { Block } from '../blocks/entities/block.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { ScopeType } from './enums/scope-type.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserNotification } from './entities/user-notification.entity';
import { ApartmentResident } from '../apartments/entities/apartment-resident.entity';
import { Resident } from '../residents/entities/resident.entity';

interface NotificationWithStatus extends Notification {
  userStatus?: UserNotification;
}
import { SupabaseStorageService } from '../supabase-storage/supabase-storage.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(TargetBlock)
    private readonly targetBlockRepository: Repository<TargetBlock>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    private readonly cloudinaryService: CloudinaryService,

    @InjectRepository(UserNotification)
    private readonly userNotiRepository: Repository<UserNotification>,
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
    @InjectRepository(ApartmentResident)
    private readonly aptResidentRepository: Repository<ApartmentResident>,
    private readonly supabaseStorageService: SupabaseStorageService,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
    files?: Express.Multer.File[],
  ) {
    console.log(createNotificationDto.channels);
    // Validate target blocks if scope is BLOCK or FLOOR
    if (
      (createNotificationDto.targetScope === ScopeType.BLOCK ||
        createNotificationDto.targetScope === ScopeType.FLOOR) &&
      (!createNotificationDto.targetBlocks ||
        createNotificationDto.targetBlocks.length === 0)
    ) {
      throw new BadRequestException(
        'Target blocks are required when scope is BLOCK or FLOOR',
      );
    }

    // Validate blocks exist and are active
    if (createNotificationDto.targetBlocks) {
      const blockIds = createNotificationDto.targetBlocks.map(
        (tb) => tb.blockId,
      );
      const blocks = await this.blockRepository.find({
        where: { id: In(blockIds), isActive: true },
      });

      if (blocks.length !== blockIds.length) {
        throw new NotFoundException('One or more blocks not found or inactive');
      }

      // Validate floor numbers for FLOOR scope
      if (createNotificationDto.targetScope === ScopeType.FLOOR) {
        for (const targetBlock of createNotificationDto.targetBlocks) {
          const block = blocks.find((b) => b.id === targetBlock.blockId);
          if (!block) {
            throw new NotFoundException(
              `Block with ID ${targetBlock.blockId} not found`,
            );
          }

          if (
            !targetBlock.targetFloorNumbers ||
            targetBlock.targetFloorNumbers.length === 0
          ) {
            throw new BadRequestException(
              `Target floor numbers are required for block ${block.name} when scope is FLOOR`,
            );
          }

          // Validate floor numbers are within block's total floors
          if (block.totalFloors) {
            const invalidFloors = targetBlock.targetFloorNumbers.filter(
              (floor) => floor < 0 || floor > block.totalFloors,
            );
            if (invalidFloors.length > 0) {
              throw new BadRequestException(
                `Invalid floor numbers [${invalidFloors.join(', ')}] for block ${block.name}. Valid range: 0-${block.totalFloors}`,
              );
            }
          }
        }
      }
    }

    // Upload files to Supabase Storage if provided
    let fileUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        fileUrls = await this.supabaseStorageService.uploadMultipleFiles(
          files,
          'notifications',
        );
      } catch (error) {
        console.error('Supabase upload error:', error);
        throw new HttpException(
          `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // Create notification
    const notification = this.notificationRepository.create({
      title: createNotificationDto.title,
      content: createNotificationDto.content,
      type: createNotificationDto.type,
      isUrgent: createNotificationDto.isUrgent ?? false,
      fileUrls: fileUrls,
      targetScope: createNotificationDto.targetScope,
      channels: createNotificationDto.channels,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Create target blocks if provided
    if (
      createNotificationDto.targetBlocks &&
      createNotificationDto.targetBlocks.length > 0
    ) {
      const targetBlocks = createNotificationDto.targetBlocks.map((tb) =>
        this.targetBlockRepository.create({
          notificationId: savedNotification.id,
          blockId: tb.blockId,
          targetFloorNumbers: tb.targetFloorNumbers || undefined,
        }),
      );

      await this.targetBlockRepository.save(targetBlocks);
    }

    // Return notification with relations
    return this.findOne(savedNotification.id);
  }

  async findAll(queryNotificationDto: QueryNotificationDto) {
    const { search, type, targetScope, isUrgent } = queryNotificationDto;

    const queryBuilder =
      this.notificationRepository.createQueryBuilder('notification');

    // Always filter active notifications
    queryBuilder.andWhere('notification.isActive = :isActive', {
      isActive: true,
    });

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(notification.title LIKE :search OR notification.content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (targetScope) {
      queryBuilder.andWhere('notification.targetScope = :targetScope', {
        targetScope,
      });
    }

    if (isUrgent !== undefined) {
      queryBuilder.andWhere('notification.isUrgent = :isUrgent', { isUrgent });
    }

    // Order by isUrgent DESC, then by created date DESC
    queryBuilder
      .orderBy('notification.isUrgent', 'DESC')
      .addOrderBy('notification.createdAt', 'DESC');

    const notifications = await queryBuilder.getMany();

    return notifications;
  }

  async findOne(id: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, isActive: true },
      relations: ['targetBlocks', 'targetBlocks.block'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async update(
    id: number,
    updateNotificationDto: UpdateNotificationDto,
    files?: Express.Multer.File[],
  ) {
    const notification = await this.findOne(id);

    // Validate target blocks if scope is being updated
    if (updateNotificationDto.targetScope) {
      if (
        (updateNotificationDto.targetScope === ScopeType.BLOCK ||
          updateNotificationDto.targetScope === ScopeType.FLOOR) &&
        (!updateNotificationDto.targetBlocks ||
          updateNotificationDto.targetBlocks.length === 0)
      ) {
        throw new BadRequestException(
          'Target blocks are required when scope is BLOCK or FLOOR',
        );
      }
    }

    // Validate blocks if provided
    if (updateNotificationDto.targetBlocks) {
      const blockIds = updateNotificationDto.targetBlocks.map(
        (tb) => tb.blockId,
      );
      const blocks = await this.blockRepository.find({
        where: { id: In(blockIds), isActive: true },
      });

      if (blocks.length !== blockIds.length) {
        throw new NotFoundException('One or more blocks not found or inactive');
      }

      // Validate floor numbers for FLOOR scope
      const targetScope =
        updateNotificationDto.targetScope || notification.targetScope;
      if (targetScope === ScopeType.FLOOR) {
        for (const targetBlock of updateNotificationDto.targetBlocks) {
          const block = blocks.find((b) => b.id === targetBlock.blockId);
          if (!block) {
            throw new NotFoundException(
              `Block with ID ${targetBlock.blockId} not found`,
            );
          }

          if (
            !targetBlock.targetFloorNumbers ||
            targetBlock.targetFloorNumbers.length === 0
          ) {
            throw new BadRequestException(
              `Target floor numbers are required for block ${block.name} when scope is FLOOR`,
            );
          }

          if (block.totalFloors) {
            const invalidFloors = targetBlock.targetFloorNumbers.filter(
              (floor) => floor < 0 || floor > block.totalFloors,
            );
            if (invalidFloors.length > 0) {
              throw new BadRequestException(
                `Invalid floor numbers [${invalidFloors.join(', ')}] for block ${block.name}. Valid range: 0-${block.totalFloors}`,
              );
            }
          }
        }
      }
    }

    // Upload new files if provided
    if (files && files.length > 0) {
      try {
        const newFileUrls =
          await this.supabaseStorageService.uploadMultipleFiles(
            files,
            'notifications',
          );

        // Append new file URLs to existing ones
        notification.fileUrls = [
          ...(notification.fileUrls || []),
          ...newFileUrls,
        ];
      } catch (error) {
        console.error('Supabase upload error:', error);
        throw new HttpException(
          `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // Update notification
    Object.assign(notification, {
      ...updateNotificationDto,
      fileUrls: notification.fileUrls, // Keep updated fileUrls
      targetBlocks: undefined, // Don't update relations directly
    });

    await this.notificationRepository.save(notification);

    // Update target blocks if provided
    if (updateNotificationDto.targetBlocks) {
      // Delete existing target blocks
      await this.targetBlockRepository.delete({ notificationId: id });

      // Create new target blocks
      const targetBlocks = updateNotificationDto.targetBlocks.map((tb) =>
        this.targetBlockRepository.create({
          notificationId: id,
          blockId: tb.blockId,
          targetFloorNumbers: tb.targetFloorNumbers || undefined,
        }),
      );

      await this.targetBlockRepository.save(targetBlocks);
    }

    // Return updated notification with relations
    return this.findOne(id);
  }

  async remove(id: number) {
    const notification = await this.findOne(id);

    // Delete files from Supabase Storage if they exist
    if (notification.fileUrls && notification.fileUrls.length > 0) {
      try {
        await this.supabaseStorageService.deleteMultipleFiles(
          notification.fileUrls,
        );
      } catch (error) {
        // Log error but don't fail the deletion
        console.error('Failed to delete some files from Supabase:', error);
      }
    }

    // Soft delete by setting isActive to false
    await this.notificationRepository.update(id, { isActive: false });
    return { message: 'Notification deleted successfully' };
  }

  async removeMany(ids: number[]) {
    // Find all active notifications
    const notifications = await this.notificationRepository.find({
      where: { id: In(ids), isActive: true },
    });

    if (notifications.length === 0) {
      throw new NotFoundException('No notifications found with provided IDs');
    }

    // Collect all file URLs to delete
    const allFileUrls = notifications.flatMap((n) => n.fileUrls || []);

    // Delete files from Supabase Storage
    if (allFileUrls.length > 0) {
      try {
        await this.supabaseStorageService.deleteMultipleFiles(allFileUrls);
      } catch (error) {
        console.error('Failed to delete some files from Supabase:', error);
      }
    }

    // Soft delete by setting isActive to false
    await this.notificationRepository.update(
      { id: In(ids) },
      { isActive: false },
    );

    return {
      message: `Successfully deleted ${notifications.length} notification(s)`,
      deletedCount: notifications.length,
    };
  }

  async findMine(accountId: number) {
    const resident = await this.residentRepository.findOne({
      where: { accountId, isActive: true },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    const myApartments = await this.aptResidentRepository.find({
      where: { residentId: resident.id },
      relations: ['apartment'],
    });

    const myBlocks = [
      ...new Set(myApartments.map((ap) => ap.apartment.blockId)),
    ];
    const myAptsInfo = myApartments.map((ap) => ({
      blockId: ap.apartment.blockId,
      floor: ap.apartment.floor.toString(),
    }));

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.targetBlocks', 'targetBlocks')
      .leftJoinAndSelect('targetBlocks.block', 'block')
      .leftJoinAndMapOne(
        'notification.userStatus',
        UserNotification,
        'userStatus',
        'userStatus.notificationId = notification.id AND userStatus.accountId = :accountId',
        { accountId },
      )
      .where('notification.isActive = :isActive', { isActive: true });

    queryBuilder.andWhere(
      new Brackets((qb) => {
        qb.where('notification.targetScope = :all', { all: ScopeType.ALL });

        if (myBlocks.length > 0) {
          qb.orWhere(
            '(notification.targetScope = :blockScope AND targetBlocks.blockId IN (:...myBlocks))',
            { blockScope: ScopeType.BLOCK, myBlocks },
          );
        }

        if (myAptsInfo.length > 0) {
          qb.orWhere(
            new Brackets((floorQb) => {
              floorQb.where('notification.targetScope = :floorScope', {
                floorScope: ScopeType.FLOOR,
              });

              myAptsInfo.forEach((info, index) => {
                const bKey = `bId${index}`;
                const fKey = `fNum${index}`;

                // Trick SQL: Dùng dấu phẩy bao quanh để khớp chính xác số tầng trong simple-array (string)
                // Ví dụ: ',1,2,5,' LIKE '%,5,%' sẽ đúng, còn '%,15,%' sẽ sai
                floorQb.orWhere(
                  `(targetBlocks.blockId = :${bKey} AND ',' || targetBlocks.targetFloorNumbers || ',' LIKE :${fKey})`,
                  {
                    [bKey]: info.blockId,
                    [fKey]: `%,${info.floor},%`,
                  },
                );
              });
            }),
          );
        }
      }),
    );

    queryBuilder.andWhere(
      new Brackets((qb) => {
        qb.where('userStatus.id IS NULL').orWhere(
          'userStatus.isDeleted = false',
        );
      }),
    );

    queryBuilder.orderBy('notification.createdAt', 'DESC');

    const notifications =
      (await queryBuilder.getMany()) as NotificationWithStatus[];

    return notifications.map((n) => {
      const userStatus = n.userStatus;
      return {
        id: n.id,
        title: n.title,
        content: n.content,
        type: n.type,
        is_urgent: n.isUrgent,
        created_at: n.createdAt.toISOString(),
        updated_at: n.updatedAt.toISOString(),
        file_urls: n.fileUrls || [],
        target_blocks:
          n.targetBlocks?.map((tb) => ({
            id: tb.blockId,
            name: tb.block?.name || '',
          })) || [],
        channels: n.channels || [],
        is_read: userStatus ? userStatus.isRead : false,
      };
    });
  }

  async toggleRead(notificationId: number, accountId: number) {
    await this.findOne(notificationId);

    let status = await this.userNotiRepository.findOne({
      where: { notificationId, accountId },
    });

    if (!status) {
      status = this.userNotiRepository.create({
        notificationId,
        accountId,
        isRead: true,
      });
    } else {
      status.isRead = !status.isRead;
    }

    return this.userNotiRepository.save(status);
  }

  async softDeleteForUser(notificationId: number, accountId: number) {
    let status = await this.userNotiRepository.findOne({
      where: { notificationId, accountId },
    });

    if (!status) {
      status = this.userNotiRepository.create({
        notificationId,
        accountId,
        isDeleted: true,
      });
    } else {
      status.isDeleted = true;
    }

    await this.userNotiRepository.save(status);
    return { message: 'Đã ẩn thông báo thành công' };
  }

  async markAllRead(accountId: number) {
    const myNotis = await this.findMine(accountId);
    const notReadIds = myNotis.filter((n) => !n.is_read).map((n) => n.id);

    if (notReadIds.length === 0) return { message: 'Tất cả đã được đọc' };

    const savePromises = notReadIds.map(async (id) => {
      return this.userNotiRepository.upsert(
        { accountId, notificationId: id, isRead: true },
        ['accountId', 'notificationId'], // Dựa vào Unique Index đã tạo trong Migration
      );
    });

    await Promise.all(savePromises);
    return { message: `Đã đánh dấu đọc ${notReadIds.length} thông báo` };
  }

  async hideAllForUser(accountId: number) {
    const myNotis = await this.findMine(accountId);
    const ids = myNotis.map((n) => n.id);

    if (ids.length === 0) return { message: 'Danh sách trống' };

    const savePromises = ids.map(async (id) => {
      return this.userNotiRepository.upsert(
        { accountId, notificationId: id, isDeleted: true },
        ['accountId', 'notificationId'],
      );
    });

    await Promise.all(savePromises);
    return { message: 'Đã ẩn toàn bộ thông báo' };
  }
}
