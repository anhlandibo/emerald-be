import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SystemNotification,
  SystemNotificationType,
} from './entities/system-notification.entity';
import { SendSystemNotificationDto } from './dto/send-system-notification.dto';
import { QuerySystemNotificationDto } from './dto/query-system-notification.dto';
import { SocketGateway } from 'src/modules/sockets/socket.gateway';

@Injectable()
export class SystemNotificationsService {
  private socketGateway: SocketGateway;

  constructor(
    @InjectRepository(SystemNotification)
    private readonly systemNotificationRepository: Repository<SystemNotification>,
  ) {}

  /**
   * Set socket gateway reference (called from SocketsModule)
   */
  setSocketGateway(gateway: SocketGateway) {
    this.socketGateway = gateway;
  }

  /**
   * Send system notification in real-time and save to database
   * Can be called from any module
   */
  async sendSystemNotification(dto: SendSystemNotificationDto) {
    try {
      // 1. Create and save notification to database
      const notification = new SystemNotification();
      notification.title = dto.title;
      notification.content = dto.content;
      notification.type = dto.type || SystemNotificationType.INFO;
      notification.targetUserIds = dto.targetUserIds || [];
      notification.metadata = dto.metadata || [];
      notification.isSent = false;

      const savedNotification =
        await this.systemNotificationRepository.save(notification);

      // 2. Send via Socket.IO if gateway is available
      if (this.socketGateway) {
        this.socketGateway.sendSystemNotification(
          {
            id: savedNotification.id,
            title: savedNotification.title,
            content: savedNotification.content,
            type: savedNotification.type,
            metadata: savedNotification.metadata,
            createdAt: savedNotification.createdAt,
          },
          dto.targetUserIds,
        );

        // Mark as sent
        savedNotification.isSent = true;
        savedNotification.sentAt = new Date();
        await this.systemNotificationRepository.save(savedNotification);
      }

      return {
        success: true,
        notification: savedNotification,
        message: 'Gửi thông báo hệ thống thành công',
      };
    } catch (error) {
      throw new HttpException(
        'Không thể gửi thông báo hệ thống',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get system notifications with pagination
   */
  async findAll(query: QuerySystemNotificationDto) {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.systemNotificationRepository
      .createQueryBuilder('notification')
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

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
      },
    };
  }

  /**
   * Get a single system notification by ID
   */
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

  /**
   * Delete a system notification
   */
  async remove(id: number) {
    const notification = await this.findOne(id);
    await this.systemNotificationRepository.remove(notification);

    return {
      success: true,
      message: 'Xóa thông báo hệ thống thành công',
    };
  }

  /**
   * Get notification statistics
   */
  async getStats() {
    const total = await this.systemNotificationRepository.count();
    const sent = await this.systemNotificationRepository.count({
      where: { isSent: true },
    });
    const pending = await this.systemNotificationRepository.count({
      where: { isSent: false },
    });

    const byType = await this.systemNotificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.type')
      .getRawMany();

    return {
      total,
      sent,
      pending,
      byType,
    };
  }
}
