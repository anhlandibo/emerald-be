import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationListResponseDto } from './dto/notification-list-response.dto';
import { NotificationDetailResponseDto } from './dto/notification-detail-response.dto';
import { DeleteManyNotificationsDto } from './dto/delete-many-notifications.dto';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { plainToInstance } from 'class-transformer';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { UseGuards } from '@nestjs/common';

@ApiTags('Notifications')
@Controller('notifications')
@UseInterceptors(ClassSerializerInterceptor, TransformInterceptor)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a new notification with optional file attachments',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification created successfully',
    type: NotificationDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or missing required fields',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Block not found or inactive',
  })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const notification = await this.notificationsService.create(
      createNotificationDto,
      files,
    );
    return plainToInstance(NotificationDetailResponseDto, notification);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all notifications with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of notifications retrieved successfully',
    type: [NotificationListResponseDto],
  })
  async findAll(@Query() queryNotificationDto: QueryNotificationDto) {
    const result =
      await this.notificationsService.findAll(queryNotificationDto);
    return plainToInstance(NotificationListResponseDto, result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed notification information by ID' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification details retrieved successfully',
    type: NotificationDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const notification = await this.notificationsService.findOne(id);
    return plainToInstance(NotificationDetailResponseDto, notification);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update notification with optional new file attachments',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification updated successfully',
    type: NotificationDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const notification = await this.notificationsService.update(
      id,
      updateNotificationDto,
      files,
    );
    return plainToInstance(NotificationDetailResponseDto, notification);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(id);
  }

  @Post('delete-many')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No notifications found with provided IDs',
  })
  async removeMany(@Body() deleteManyDto: DeleteManyNotificationsDto) {
    return this.notificationsService.removeMany(deleteManyDto.ids);
  }

  @Get('mine')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Lấy thông báo cho cư dân hiện tại' })
  async findMine(@CurrentUser('id') accountId: number) {
    return this.notificationsService.findMine(accountId);
  }
}
