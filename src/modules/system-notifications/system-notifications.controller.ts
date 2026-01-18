import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SystemNotificationsService } from './system-notifications.service';
import { SendSystemNotificationDto } from './dto/send-system-notification.dto';
import { UpdateSystemNotificationDto } from './dto/update-system-notification.dto';
import {
  QuerySystemNotificationDto,
  QueryUserNotificationDto,
} from './dto/query-system-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    sub?: number;
    id?: number;
  };
}

@ApiTags('System Notifications')
@Controller('system-notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SystemNotificationsController {
  constructor(
    private readonly systemNotificationsService: SystemNotificationsService,
  ) {}

  // ==================== ADMIN ENDPOINTS ====================

  @Post('send')
  @ApiOperation({
    summary: 'Send system notification',
    description:
      'Send real-time system notification to specific users or all users. Notification will be saved to database and sent via WebSocket.',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification sent successfully',
  })
  async send(
    @Body() dto: SendSystemNotificationDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = (req.user?.sub || req.user?.id) as number;
    return this.systemNotificationsService.sendSystemNotification(dto, userId);
  }

  @Get('admin/all')
  @ApiOperation({
    summary: 'Get all system notifications (Admin)',
    description: 'Get all system notifications with pagination and filters',
  })
  async findAllAdmin(@Query() query: QuerySystemNotificationDto) {
    return this.systemNotificationsService.findAll(query);
  }
  @Get('admin/stats')
  @ApiOperation({
    summary: 'Get notification statistics (Admin)',
    description:
      'Get comprehensive statistics about system notifications including counts by type, priority, and time periods',
  })
  async getAdminStats() {
    return this.systemNotificationsService.getStats();
  }

  @Get('admin/:id')
  @ApiOperation({
    summary: 'Get a system notification by ID (Admin)',
    description:
      'Get detailed information about a specific system notification',
  })
  async findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.systemNotificationsService.findOne(id);
  }

  // @Put('admin/:id')
  // @ApiOperation({
  //   summary: 'Update a system notification (Admin)',
  //   description:
  //     'Update a system notification. Can only update if not sent yet.',
  // })
  // async updateAdmin(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() dto: UpdateSystemNotificationDto,
  // ) {
  //   return this.systemNotificationsService.update(id, dto);
  // }

  // @Delete('admin/:id')
  // @ApiOperation({
  //   summary: 'Delete a system notification (Admin)',
  //   description: 'Permanently delete a system notification from database',
  // })
  // @HttpCode(HttpStatus.OK)
  // async removeAdmin(@Param('id', ParseIntPipe) id: number) {
  //   return this.systemNotificationsService.remove(id);
  // }

  // ==================== USER ENDPOINTS ====================
  @Get('my-notifications')
  @ApiOperation({
    summary: 'Get current user notifications',
    description: 'Get notifications for the authenticated user',
  })
  async getMyNotifications(
    @Request() req: RequestWithUser,
    @Query() query: QueryUserNotificationDto,
  ) {
    const userId = (req.user?.sub || req.user?.id) as number;
    return this.systemNotificationsService.getUserNotifications(userId, query);
  }

  @Get('my-notifications/unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Get the count of unread notifications for current user',
  })
  async getUnreadCount(@Request() req: RequestWithUser) {
    const userId = (req.user?.sub || req.user?.id) as number;
    const count = await this.systemNotificationsService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Get('my-notifications/stats')
  @ApiOperation({
    summary: 'Get user notification statistics',
    description: 'Get statistics about user notifications',
  })
  async getMyStats(@Request() req: RequestWithUser) {
    const userId = (req.user?.sub || req.user?.id) as number;
    return this.systemNotificationsService.getUserStats(userId);
  }

  @Put('my-notifications/:notificationId/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read for current user',
  })
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Request() req: RequestWithUser,
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    const userId = (req.user?.sub || req.user?.id) as number;
    return this.systemNotificationsService.markAsRead(userId, notificationId);
  }

  @Put('my-notifications/mark-all-read')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications as read for current user',
  })
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: RequestWithUser) {
    const userId = (req.user?.sub || req.user?.id) as number;
    return this.systemNotificationsService.markAllAsRead(userId);
  }

  // @Delete('my-notifications/:notificationId')
  // @ApiOperation({
  //   summary: 'Delete user notification',
  //   description:
  //     'Soft delete a notification for current user (notification still exists in system)',
  // })
  // @HttpCode(HttpStatus.OK)
  // async deleteUserNotification(
  //   @Request() req: RequestWithUser,
  //   @Param('notificationId', ParseIntPipe) notificationId: number,
  // ) {
  //   const userId = (req.user?.sub || req.user?.id) as number;
  //   return this.systemNotificationsService.deleteUserNotification(
  //     userId,
  //     notificationId,
  //   );
  // }
}
