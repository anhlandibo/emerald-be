import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { BackupService } from './backup.service';
import { ConfirmRestoreDto } from './dto/confirm-restore.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from '../accounts/enums/user-role.enum';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';

@ApiTags('Backup & Recovery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(TransformInterceptor)
@Controller('backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Danh sách tất cả backup. Dùng để poll sau POST /backups cho đến khi status = SUCCESS',
  })
  findAll() {
    return this.backupService.findAll();
  }

  // 1. Tạo record Backup { status: PENDING } vào DB
  // 2. Trả về record PENDING ngay cho client
  // 3. Background: chạy pg_dump → file .sql tạm
  // 4. Upload file lên Supabase Storage
  // 5. Tính SHA-256 checksum
  // 6. Update record → SUCCESS + storagePath + checksum

  // -- Bước 1: INSERT
  // INSERT INTO backup (type, status, initiated_by, created_at)
  // VALUES ('MANUAL', 'PENDING', 'admin@gmail.com', NOW());

  // -- Bước 6: UPDATE
  // UPDATE backup
  // SET status = 'SUCCESS',
  //     storage_path = 'backups/backup-2024-01-01-id5.sql',
  //     checksum = 'abc123...',
  //     size_bytes = 204800
  // WHERE id = 5;

  // -- Nếu lỗi:
  // UPDATE backup
  // SET status = 'FAILED',
  //     error_message = 'pg_dump: connection refused'
  // WHERE id = 5;
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo manual backup (UC37)',
    description:
      'Trả về ngay với status PENDING. Poll GET /backups/:id để theo dõi.',
  })
  createManualBackup(@Req() req: Request & { user: { email: string } }) {
    return this.backupService.createManualBackup(req.user.email);
  }

  @Get('restore-jobs/:jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Poll trạng thái restore job' })
  @ApiParam({ name: 'jobId', type: Number })
  getRestoreJob(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.backupService.getRestoreJob(jobId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chi tiết 1 backup — poll status sau khi tạo' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.backupService.findOne(id);
  }

  // 1. Lấy backup record từ DB
  // 2. Download file từ Supabase về /tmp (nội bộ server)
  // 3. Tính lại SHA-256 của file vừa download
  // 4. So sánh với checksum đã lưu trong DB
  // 5. Nếu khớp → valid: true
  // 6. Nếu không khớp → update status = INVALID
  // 7. Xóa file tạm

  // Có nghĩa là file trên Supabase Storage không bị corrupt hay tamper kể từ lúc upload.
  @Get(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify checksum SHA-256 của backup (UC37)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: '{ valid: boolean, backup }' })
  verifyChecksum(@Param('id', ParseIntPipe) id: number) {
    return this.backupService.verifyChecksum(id);
  }

  // 1. Lấy backup record, kiểm tra status = SUCCESS
  // 2. Gọi Supabase createSignedUrl(storagePath, 300 giây)
  // 3. Trả URL về client — URL tự expire sau 5 phút
  @Get(':id/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy signed download URL (hết hạn sau 5 phút)' })
  @ApiParam({ name: 'id', type: Number })
  async getDownloadUrl(@Param('id', ParseIntPipe) id: number) {
    const url = await this.backupService.getDownloadUrl(+id);
    return { url, expiresIn: '5 minutes' };
  }

  // 1. Kiểm tra confirmed = true
  // 2. Lấy backup, kiểm tra status = SUCCESS
  // 3. Tạo RestoreJob { status: PENDING }
  // 4. Trả về job PENDING ngay
  // 5. Background:
  //   a. Update job → IN_PROGRESS
  //   b. Download file từ Supabase về /tmp
  //   c. Verify checksum lần nữa
  //   d. Chạy psql --single-transaction -f file.sql
  //   e. Update job → SUCCESS / FAILED
  //   f. Xóa file tạm
  @Post(':id/restore')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Khởi động restore từ backup (UC37)',
    description:
      'Gửi { confirmed: true } để xác nhận. Verify checksum trước khi restore. Chạy async — poll GET /backups/restore-jobs/:jobId.',
  })
  @ApiParam({ name: 'id', type: Number })
  initiateRestore(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmRestoreDto,
    @Req() req: Request & { user: { email: string } },
  ) {
    return this.backupService.initiateRestore(id, dto, req.user.email);
  }
}
