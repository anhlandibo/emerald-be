/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, Not, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  SystemNotification,
  SystemNotificationType,
  SystemNotificationPriority,
} from './entities/system-notification.entity';
import { SystemUserNotification } from './entities/user-notification.entity';
import { SendSystemNotificationDto } from './dto/send-system-notification.dto';
import { UpdateSystemNotificationDto } from './dto/update-system-notification.dto';
import {
  QuerySystemNotificationDto,
  QueryUserNotificationDto,
} from './dto/query-system-notification.dto';
import { SocketGateway } from 'src/modules/sockets/socket.gateway';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class SystemNotificationsService {
  private readonly logger = new Logger(SystemNotificationsService.name);
  private socketGateway: SocketGateway;

  constructor(
    @InjectRepository(SystemNotification)
    private readonly systemNotificationRepository: Repository<SystemNotification>,
    @InjectRepository(SystemUserNotification)
    private readonly systemUserNotificationRepository: Repository<SystemUserNotification>,
    private readonly accountsService: AccountsService,
  ) {}

  /**
   * Set socket gateway reference (called from SocketsModule)
   */
  setSocketGateway(gateway: SocketGateway) {
    this.socketGateway = gateway;
  }

  /**
   * Send system notification in real-time and save to database
   * If targetUserIds is empty or not provided, sends to ALL active users
   */
  async sendSystemNotification(
    dto: SendSystemNotificationDto,
    createdBy: number,
  ) {
    try {
      // Determine target users - if empty, get all active users
      let targetUserIds = dto.targetUserIds || [];

      if (targetUserIds.length === 0) {
        // Fetch all active users
        const allUsers = await this.accountsService.findAll({
          isActive: true,
        });
        targetUserIds = allUsers.map((user) => user.id);
        this.logger.log(
          `📢 Broadcasting to ${targetUserIds.length} active users`,
        );
      }

      const notification = new SystemNotification();
      notification.title = dto.title;
      notification.content = dto.content;
      notification.type = dto.type || SystemNotificationType.INFO;
      notification.priority = dto.priority || SystemNotificationPriority.NORMAL;
      notification.targetUserIds = targetUserIds;
      notification.metadata = dto.metadata || {};
      notification.actionUrl = dto.actionUrl || null;
      notification.actionText = dto.actionText || null;
      notification.isPersistent = dto.isPersistent || false;
      notification.createdBy = createdBy;

      if (dto.scheduledFor) {
        notification.scheduledFor = new Date(dto.scheduledFor);
        notification.isSent = false;
      }

      if (dto.expiresAt) {
        notification.expiresAt = new Date(dto.expiresAt);
      }

      const savedNotification =
        await this.systemNotificationRepository.save(notification);

      if (!dto.scheduledFor) {
        await this.sendNotificationNow(savedNotification);
      }

      return {
        success: true,
        notification: savedNotification,
        recipientCount: targetUserIds.length,
        message: dto.scheduledFor
          ? 'Thông báo đã được lên lịch'
          : `Gửi thông báo hệ thống thành công cho ${targetUserIds.length} người dùng`,
      };
    } catch (error) {
      this.logger.error('Error sending system notification:', error);
      throw new HttpException(
        'Không thể gửi thông báo hệ thống',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send notification now via socket and create user notification records
   */
  private async sendNotificationNow(notification: SystemNotification) {
    try {
      // Create user notification records for all target users
      if (notification.targetUserIds && notification.targetUserIds.length > 0) {
        const userNotifications = notification.targetUserIds.map((userId) => {
          const userNotif = new SystemUserNotification();
          userNotif.userId = userId;
          userNotif.notificationId = notification.id;
          userNotif.isRead = false;
          return userNotif;
        });

        await this.systemUserNotificationRepository.save(userNotifications);
        this.logger.log(
          `✅ Created ${userNotifications.length} user notification records`,
        );
      }

      // Send via socket gateway
      if (this.socketGateway) {
        const payload = {
          id: notification.id,
          title: notification.title,
          content: notification.content,
          type: notification.type,
          priority: notification.priority,
          metadata: notification.metadata,
          actionUrl: notification.actionUrl,
          actionText: notification.actionText,
          isPersistent: notification.isPersistent,
          createdAt: notification.createdAt,
          expiresAt: notification.expiresAt,
        };

        this.socketGateway.sendSystemNotification(
          payload,
          notification.targetUserIds,
        );

        notification.isSent = true;
        notification.sentAt = new Date();
        await this.systemNotificationRepository.save(notification);

        this.logger.log(
          `📤 Sent notification to ${notification.targetUserIds.length} users`,
        );
      }
    } catch (error) {
      this.logger.error('Error in sendNotificationNow:', error);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications =
        await this.systemNotificationRepository.find({
          where: {
            isSent: false,
            scheduledFor: LessThan(now),
          },
        });

      if (scheduledNotifications.length > 0) {
        this.logger.log(
          `📤 Sending ${scheduledNotifications.length} scheduled notifications`,
        );

        for (const notification of scheduledNotifications) {
          await this.sendNotificationNow(notification);
        }
      }
    } catch (error) {
      this.logger.error('Error in handleScheduledNotifications:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredNotifications() {
    try {
      const now = new Date();
      const expiredNotifications = await this.systemNotificationRepository.find(
        {
          where: {
            expiresAt: LessThan(now),
          },
        },
      );

      if (expiredNotifications.length > 0) {
        this.logger.log(
          `🗑️  Cleaning up ${expiredNotifications.length} expired notifications`,
        );

        await this.systemNotificationRepository.remove(expiredNotifications);
      }
    } catch (error) {
      this.logger.error('Error in cleanupExpiredNotifications:', error);
    }
  }

  async findAll(query: QuerySystemNotificationDto) {
    const { page = 1, limit = 20, type, priority, isSent, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.systemNotificationRepository
      .createQueryBuilder('notification')
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (priority) {
      queryBuilder.andWhere('notification.priority = :priority', { priority });
    }

    if (isSent !== undefined) {
      queryBuilder.andWhere('notification.isSent = :isSent', { isSent });
    }

    if (search) {
      queryBuilder.andWhere(
        '(notification.title ILIKE :search OR notification.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getUserNotifications(userId: number, query: QueryUserNotificationDto) {
    const { page = 1, limit = 20, isRead, type } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.systemUserNotificationRepository
      .createQueryBuilder('userNotif')
      .leftJoinAndSelect('userNotif.notification', 'notification')
      .where('userNotif.userId = :userId', { userId })
      .andWhere('userNotif.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('userNotif.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (isRead !== undefined) {
      queryBuilder.andWhere('userNotif.isRead = :isRead', { isRead });
    }

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    const [rawData, total] = await queryBuilder.getManyAndCount();

    // Transform data to include navigation info
    const data = rawData.map((userNotif) => ({
      ...userNotif,
      notification: userNotif.notification
        ? {
            ...userNotif.notification,
            // Thêm thông tin điều hướng từ actionUrl và metadata
            navigationPath:
              userNotif.notification.actionUrl ||
              this.extractNavigationPath(userNotif.notification),
            navigationData: userNotif.notification.metadata || {},
          }
        : undefined,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Extract navigation path from notification metadata
   * Ví dụ: metadata có thể chứa { entityType: 'invoice', entityId: 123 }
   */
  private extractNavigationPath(
    notification: SystemNotification,
  ): string | null {
    if (!notification.metadata) return null;

    const { entityType, entityId } = notification.metadata;

    if (!entityType || !entityId) return null;

    // Map entity types to navigation paths
    const pathMap: Record<string, string> = {
      invoice: '/invoices',
      maintenance: '/maintenances',
      issue: '/issues',
      voting: '/votings',
      service: '/services',
      fee: '/fees',
      resident: '/residents',
      apartment: '/apartments',
      block: '/blocks',
    };

    const basePath = pathMap[entityType];
    return basePath ? `${basePath}/${entityId}` : null;
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.systemUserNotificationRepository.count({
      where: {
        userId,
        isRead: false,
        isDeleted: false,
      },
    });
  }

  async markAsRead(userId: number, notificationId: number) {
    const userNotif = await this.systemUserNotificationRepository.findOne({
      where: { userId, notificationId },
    });

    if (!userNotif) {
      throw new HttpException('Không tìm thấy thông báo', HttpStatus.NOT_FOUND);
    }

    userNotif.isRead = true;
    userNotif.readAt = new Date();
    await this.systemUserNotificationRepository.save(userNotif);

    return {
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc',
    };
  }

  async markAllAsRead(userId: number) {
    await this.systemUserNotificationRepository
      .createQueryBuilder()
      .update(SystemUserNotification)
      .set({ isRead: true, readAt: new Date() })
      .where('userId = :userId AND isRead = :isRead', {
        userId,
        isRead: false,
      })
      .execute();

    return {
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
    };
  }

  async findOne(id: number) {
    const notification = await this.systemNotificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new HttpException(
        'Không tìm thấy thông báo hệ thống',
        HttpStatus.NOT_FOUND,
      );
    }

    return notification;
  }

  // async update(id: number, dto: UpdateSystemNotificationDto) {
  //   const notification = await this.findOne(id);

  //   if (notification.isSent) {
  //     throw new HttpException(
  //       'Không thể cập nhật thông báo đã gửi',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   Object.assign(notification, dto);

  //   if (dto.scheduledFor) {
  //     notification.scheduledFor = new Date(dto.scheduledFor);
  //   }

  //   if (dto.expiresAt) {
  //     notification.expiresAt = new Date(dto.expiresAt);
  //   }

  //   await this.systemNotificationRepository.save(notification);

  //   return {
  //     success: true,
  //     notification,
  //     message: 'Cập nhật thông báo thành công',
  //   };
  // }

  // async remove(id: number) {
  //   const notification = await this.findOne(id);
  //   await this.systemNotificationRepository.remove(notification);

  //   return {
  //     success: true,
  //     message: 'Xóa thông báo hệ thống thành công',
  //   };
  // }

  async getStats() {
    const [
      total,
      sent,
      pending,
      scheduled,
      byType,
      byPriority,
      todayCount,
      weekCount,
    ] = await Promise.all([
      this.systemNotificationRepository.count(),
      this.systemNotificationRepository.count({ where: { isSent: true } }),
      this.systemNotificationRepository.count({ where: { isSent: false } }),
      this.systemNotificationRepository.count({
        where: { isSent: false, scheduledFor: Not(IsNull()) },
      }),
      this.systemNotificationRepository
        .createQueryBuilder('notification')
        .select('notification.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('notification.type')
        .getRawMany(),
      this.systemNotificationRepository
        .createQueryBuilder('notification')
        .select('notification.priority', 'priority')
        .addSelect('COUNT(*)', 'count')
        .groupBy('notification.priority')
        .getRawMany(),
      this.systemNotificationRepository
        .createQueryBuilder('notification')
        .where('notification.createdAt >= CURRENT_DATE')
        .getCount(),
      this.systemNotificationRepository
        .createQueryBuilder('notification')
        .where("notification.createdAt >= CURRENT_DATE - INTERVAL '7 days'")
        .getCount(),
    ]);

    return {
      total,
      sent,
      pending,
      scheduled,
      todayCount,
      weekCount,
      byType: byType.reduce(
        (acc, item: any) => {
          acc[item.type as string] = parseInt(item.count as string);
          return acc;
        },
        {} as Record<string, number>,
      ),
      byPriority: byPriority.reduce(
        (acc, item: any) => {
          acc[item.priority as string] = parseInt(item.count as string);
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async getUserStats(userId: number) {
    const [total, unread, read] = await Promise.all([
      this.systemUserNotificationRepository.count({
        where: { userId, isDeleted: false },
      }),
      this.systemUserNotificationRepository.count({
        where: { userId, isRead: false, isDeleted: false },
      }),
      this.systemUserNotificationRepository.count({
        where: { userId, isRead: true, isDeleted: false },
      }),
    ]);

    return {
      total,
      unread,
      read,
    };
  }

  /**
   * Soft delete a notification for user
   */
  async deleteUserNotification(userId: number, notificationId: number) {
    const userNotification =
      await this.systemUserNotificationRepository.findOne({
        where: {
          userId,
          notificationId,
          isDeleted: false,
        },
      });

    if (!userNotification) {
      throw new HttpException(
        'Notification not found or already deleted',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.systemUserNotificationRepository.update(
      { id: userNotification.id },
      { isDeleted: true, deletedAt: new Date() },
    );

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

  /**
   * Soft delete multiple notifications for user
   */
  async deleteMultipleUserNotifications(
    userId: number,
    notificationIds: number[],
  ) {
    if (!notificationIds || notificationIds.length === 0) {
      throw new HttpException(
        'No notification IDs provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userNotifications = await this.systemUserNotificationRepository.find({
      where: {
        userId,
        notificationId: In(notificationIds),
        isDeleted: false,
      },
    });

    if (userNotifications.length === 0) {
      return {
        success: true,
        message: 'No notifications found to delete',
        count: 0,
      };
    }

    const ids = userNotifications.map((un) => un.id);
    await this.systemUserNotificationRepository.update(
      { id: In(ids) },
      { isDeleted: true, deletedAt: new Date() },
    );

    return {
      success: true,
      message: `Deleted ${userNotifications.length} notifications`,
      count: userNotifications.length,
    };
  }
}
