import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CheckSlotAvailabilityDto } from './dtos/check-slot-availability.dto';
import { ReserveSlotDto } from './dtos/reserve-slot.dto';
import {
  ServiceResponseDto,
  SlotAvailabilityResponseDto,
} from './dtos/service-response.dto';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { ApiDoc } from 'src/decorators/api-doc.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';

@ApiTags('Services')
@Controller('services')
@UseInterceptors(ClassSerializerInterceptor, TransformInterceptor)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Lấy danh sách các dịch vụ đang active',
    description: 'Lấy danh sách tất cả dịch vụ với bộ lọc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of services retrieved successfully',
    type: [ServiceResponseDto],
  })
  async findAll(): Promise<ServiceResponseDto[]> {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Lấy thông tin chi tiết của 1 dịch vụ',
    description: 'Lấy thông tin chi tiết dịch vụ theo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service details retrieved successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.findOne(id);
  }

  @Get(':id/resident')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary:
      'Lấy thông tin chi tiết của 1 dịch vụ (view cư dân) - lấy luôn cả slot_availability theo ngày',
    description:
      'Lấy thông tin dịch vụ kèm slot có sẵn theo ngày để cư dân chọn',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service with availability retrieved successfully',
  })
  async findOneWithSlots(
    @Param('id', ParseIntPipe) id: number,
    @Query() checkSlotDto: CheckSlotAvailabilityDto,
  ): Promise<{
    service: ServiceResponseDto;
    slots: SlotAvailabilityResponseDto[];
  }> {
    const service = await this.servicesService.findOne(id);
    const slots = await this.servicesService.checkSlotAvailability(
      id,
      checkSlotDto,
    );

    return { service, slots };
  }

  @Post('slot/:id/reserve')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary:
      'Khi cư dân bấm đặt và còn chỗ thì reserve slot đấy và đồng thời tạo 1 booking mới',
    description:
      'Cư dân đặt slot, hệ thống giảm remaining_slot và tạo booking PENDING',
    auth: true,
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Slot reserved successfully, booking created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No available slots',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async reserveSlot(
    @Param('id', ParseIntPipe) serviceId: number,
    @Body() reserveSlotDto: ReserveSlotDto,
    @CurrentUser('id') accountId: number,
  ): Promise<any> {
    return this.servicesService.reserveSlot(
      serviceId,
      reserveSlotDto,
      accountId,
    );
  }
}
