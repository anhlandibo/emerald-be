import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ReportsService } from './reports.service';
import { DashboardStatisticsDto } from './dto/dashboard-statistics.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/role.decorator';
import { UserRole } from '../accounts/enums/user-role.enum';
import { ApiDoc } from '../../decorators/api-doc.decorator';
import { TransformInterceptor } from '../../interceptors/transform.interceptor';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard/export')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: '[ADMIN] Xuất thống kê dashboard sang Excel',
    description:
      'Admin xuất dữ liệu thống kê dashboard sang file XLSX với đầy đủ các thông tin',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File XLSX đã được tạo',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
    },
  })
  async exportDashboardToExcel(
    @Query() queryDto: QueryReportDto,
  ): Promise<StreamableFile> {
    const buffer = await this.reportsService.exportDashboardToExcel(queryDto);
    const filename = `dashboard-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get('dashboard')
  @UseInterceptors(ClassSerializerInterceptor, TransformInterceptor)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: '[ADMIN] Lấy thống kê tổng hợp dashboard',
    description:
      'Admin xem tổng hợp thống kê doanh thu, công nợ, bảo trì, biểu đồ doanh thu & chi phí, dịch vụ, tài sản',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thống kê tổng hợp',
    type: DashboardStatisticsDto,
  })
  async getDashboardStatistics(@Query() queryDto: QueryReportDto) {
    const statistics =
      await this.reportsService.getDashboardStatistics(queryDto);
    return plainToInstance(DashboardStatisticsDto, statistics);
  }
}
