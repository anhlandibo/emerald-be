/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, Not, LessThan } from 'typeorm';
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

@Injectable()
export class SystemNotificationsService {
  private readonly logger = new Logger(SystemNotificationsService.name);
  private socketGateway: SocketGateway;

  constructor(
    @InjectRepository(SystemNotification)
    private readonly systemNotificationRepository: Repository<SystemNotification>,
    @InjectRepository(SystemUserNotification)
    private readonly systemUserNotificationRepository: Repository<SystemUserNotification>,
  ) {}

  /**
   * Set socket gateway reference (called from SocketsModule)
   */
  setSocketGateway(gateway: SocketGateway) {
    this.socketGateway = gateway;
  }

  /**
   * Send system notification in real-time and save to database
   */
  async sendSystemNotification(
    dto: SendSystemNotificationDto,
    createdBy: number,
  ) {
    try {
      const notification = new SystemNotification();
      notification.title = dto.title;
      notification.content = dto.content;
      notification.type = dto.type || SystemNotificationType.INFO;
      notification.priority = dto.priority || SystemNotificationPriority.NORMAL;
      notification.targetUserIds = dto.targetUserIds || [];
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
        message: dto.scheduledFor
          ? 'Thông báo đã được lên lịch'
          : 'Gửi thông báo hệ thống thành công',
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
   * Send notification now via socket
   */
  private async sendNotificationNow(notification: SystemNotification) {
    try {
      if (notification.targetUserIds && notification.targetUserIds.length > 0) {
        const userNotifications = notification.targetUserIds.map((userId) => {
          const userNotif = new SystemUserNotification();
          userNotif.userId = userId;
          userNotif.notificationId = notification.id;
          return userNotif;
        });
        await this.systemUserNotificationRepository.save(userNotifications);
      }

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
}
