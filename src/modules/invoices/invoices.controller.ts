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
  UseGuards,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceAdminDto } from './dto/create-invoice-admin.dto';
import { CreateInvoiceClientDto } from './dto/create-invoice-client.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { VerifyMeterReadingDto } from './dto/verify-meter-reading.dto';
import { VerifyInvoiceReadingsDto } from './dto/verify-invoice-readings.dto';
import { InvoiceListResponseDto } from './dto/invoice-list-response.dto';
import { InvoiceDetailResponseDto } from './dto/invoice-detail-response.dto';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from '../accounts/enums/user-role.enum';
import { CurrentUser } from 'src/decorators/user.decorator';
import { Invoice } from './entities/invoice.entity';

@ApiTags('Invoices')
@Controller('invoices')
@UseInterceptors(ClassSerializerInterceptor, TransformInterceptor)
//@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Tạo hóa đơn mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Hóa đơn được tạo thành công',
    type: InvoiceDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Hóa đơn cho kỳ này đã tồn tại',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy căn hộ hoặc cấu hình phí',
  })
  async createByAdmin(@Body() createInvoiceDto: CreateInvoiceAdminDto) {
    const invoice =
      await this.invoicesService.createInvoiceByAdmin(createInvoiceDto);
    return this.transformInvoiceDetail(invoice);
  }

  @Post('client')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.RESIDENT)
  @ApiOperation({
    summary: '[CLIENT] Tạo hóa đơn với ảnh chứng minh',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        waterIndex: {
          type: 'number',
          example: 100,
          description: 'Chỉ số nước mới',
        },
        electricityIndex: {
          type: 'number',
          example: 200,
          description: 'Chỉ số điện mới',
        },
        period: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-05T10:15:30Z',
          description: 'Kỳ thanh toán',
        },
        waterImage: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh chứng minh chỉ số nước',
        },
        electricityImage: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh chứng minh chỉ số điện',
        },
      },
      required: ['waterIndex', 'electricityIndex', 'period'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Hóa đơn được tạo thành công',
    type: InvoiceDetailResponseDto,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'waterImage', maxCount: 1 },
      { name: 'electricityImage', maxCount: 1 },
    ]),
  )
  async createByClient(
    @CurrentUser('id') accountId: number,
    @Body() createInvoiceDto: CreateInvoiceClientDto,
    @UploadedFiles()
    files: {
      waterImage?: Express.Multer.File[];
      electricityImage?: Express.Multer.File[];
    },
  ) {
    const allFiles = [
      ...(files?.waterImage || []),
      ...(files?.electricityImage || []),
    ];
    const invoice = await this.invoicesService.createInvoiceByClient(
      accountId,
      createInvoiceDto,
      allFiles,
    );
    return this.transformInvoiceDetail(invoice);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách hóa đơn' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách hóa đơn',
    type: [InvoiceListResponseDto],
  })
  async findAll(@Query() queryDto: QueryInvoiceDto) {
    const invoices = await this.invoicesService.findAll(queryDto);
    return plainToInstance(InvoiceListResponseDto, invoices, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết hóa đơn' })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chi tiết hóa đơn',
    type: InvoiceDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hóa đơn',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const invoice = await this.invoicesService.findOne(id);
    return this.transformInvoiceDetail(invoice);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Cập nhật hóa đơn' })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hóa đơn được cập nhật thành công',
    type: InvoiceDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hóa đơn',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    const invoice = await this.invoicesService.updateInvoice(
      id,
      updateInvoiceDto,
    );
    return this.transformInvoiceDetail(invoice);
  }

  @Post('verify-meter-reading')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Xác nhận chỉ số điện nước' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chỉ số đã được xác nhận',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy chỉ số meter',
  })
  async verifyMeterReading(@Body() dto: VerifyMeterReadingDto) {
    return this.invoicesService.verifyMeterReading(dto.meterReadingId);
  }

  @Post('verify-invoice-readings')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Xác nhận chỉ số và tính toán lại hóa đơn' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chỉ số đã được xác nhận và hóa đơn được tính toán lại',
    type: InvoiceDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hóa đơn hoặc loại phí',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
  })
  async verifyInvoiceReadings(@Body() dto: VerifyInvoiceReadingsDto) {
    const invoice = await this.invoicesService.verifyInvoiceReadings(
      dto.invoiceId,
      dto.meterReadings,
    );
    return this.transformInvoiceDetail(invoice);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Xóa mềm hóa đơn' })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Hóa đơn đã được xóa',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hóa đơn',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.invoicesService.remove(id);
  }

  /**
   * Helper method to transform invoice to detail response
   */
  private transformInvoiceDetail(invoice: Invoice): InvoiceDetailResponseDto {
    const invoiceWithDetails = invoice as any;
    const transformed = {
      ...invoice,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      invoiceDetails: invoiceWithDetails.invoiceDetails?.map((detail: any) => ({
        ...detail,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        feeTypeName: detail.feeType?.name,
      })),
    };

    return plainToInstance(InvoiceDetailResponseDto, transformed, {
      excludeExtraneousValues: true,
    });
  }
}
