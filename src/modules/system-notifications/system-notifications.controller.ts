import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemNotificationsService } from './system-notifications.service';
import { SendSystemNotificationDto } from './dto/send-system-notification.dto';
import { QuerySystemNotificationDto } from './dto/query-system-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('System Notifications')
@Controller('system-notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SystemNotificationsController {
  constructor(
    private readonly systemNotificationsService: SystemNotificationsService,
  ) {}

  @Post('send')
  @ApiOperation({
    summary: 'Send system notification',
    description:
      'Send real-time system notification to specific users or all users. Notification will be saved to database and sent via WebSocket.',
  })
  async send(@Body() dto: SendSystemNotificationDto) {
    return this.systemNotificationsService.sendSystemNotification(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all system notifications',
    description: 'Get system notifications with pagination and filters',
  })
  async findAll(@Query() query: QuerySystemNotificationDto) {
    return this.systemNotificationsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get notification statistics',
    description: 'Get statistics about system notifications',
  })
  async getStats() {
    return this.systemNotificationsService.getStats();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a system notification by ID',
    description:
      'Get detailed information about a specific system notification',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.systemNotificationsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a system notification',
    description: 'Delete a system notification from database',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.systemNotificationsService.remove(id);
  }
}
