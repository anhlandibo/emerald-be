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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { QueryTechnicianDto } from './dto/query-technician.dto';
import { DeleteManyTechniciansDto } from './dto/delete-many-technicians.dto';
import { TechnicianResponseDto } from './dto/technician-response.dto';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { plainToInstance } from 'class-transformer';
import { TechnicianStatus } from './enums/technician-status.enum';

@ApiTags('Technicians')
@Controller('technicians')
@UseInterceptors(ClassSerializerInterceptor, TransformInterceptor)
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  /**
   * API 1: Create a new technician
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new technician' })
  @ApiBody({
    type: CreateTechnicianDto,
    description: 'Technician data to create',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Technician created successfully',
    type: TechnicianResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Phone number already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(@Body() createTechnicianDto: CreateTechnicianDto) {
    const technician =
      await this.techniciansService.create(createTechnicianDto);
    return plainToInstance(TechnicianResponseDto, technician);
  }

  /**
   * API 2: Get all technicians with filters
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all technicians with filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of technicians retrieved successfully',
    type: [TechnicianResponseDto],
  })
  async findAll(@Query() queryTechnicianDto: QueryTechnicianDto) {
    const data = await this.techniciansService.findAll(queryTechnicianDto);
    return plainToInstance(TechnicianResponseDto, data);
  }

  /**
   * API 3: Get a technician by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a technician by ID' })
  @ApiParam({
    name: 'id',
    description: 'Technician ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Technician retrieved successfully',
    type: TechnicianResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Technician not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const technician = await this.techniciansService.findOne(id);
    return plainToInstance(TechnicianResponseDto, technician);
  }

  /**
   * API 4: Update a technician
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a technician' })
  @ApiParam({
    name: 'id',
    description: 'Technician ID',
    type: Number,
  })
  @ApiBody({
    type: UpdateTechnicianDto,
    description: 'Updated technician data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Technician updated successfully',
    type: TechnicianResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Technician not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Phone number already exists',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTechnicianDto: UpdateTechnicianDto,
  ) {
    const technician = await this.techniciansService.update(
      id,
      updateTechnicianDto,
    );
    return plainToInstance(TechnicianResponseDto, technician);
  }

  /**
   * API 5: Soft delete a technician
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a technician' })
  @ApiParam({
    name: 'id',
    description: 'Technician ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Technician deleted successfully',
    type: TechnicianResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Technician not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const technician = await this.techniciansService.remove(id);
    return plainToInstance(TechnicianResponseDto, technician);
  }

  /**
   * API 7: Soft delete multiple technicians
   */
  @Post('delete-many')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete multiple technicians' })
  @ApiBody({
    type: DeleteManyTechniciansDto,
    description: 'Array of technician IDs to delete',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Technicians deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No technicians found with provided IDs',
  })
  async removeMany(@Body() deleteManyDto: DeleteManyTechniciansDto) {
    return await this.techniciansService.removeMany(deleteManyDto.ids);
  }

  /**
   * Optional: Restore a deleted technician
   */
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a deleted technician' })
  @ApiParam({
    name: 'id',
    description: 'Technician ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Technician restored successfully',
    type: TechnicianResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deleted technician not found',
  })
  async restore(@Param('id', ParseIntPipe) id: number) {
    const technician = await this.techniciansService.restore(id);
    return plainToInstance(TechnicianResponseDto, technician);
  }

  /**
   * API 6: Update technician status
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update technician status' })
  @ApiParam({
    name: 'id',
    description: 'Technician ID',
    type: Number,
  })
  @ApiBody({
    schema: {
      example: { status: TechnicianStatus.BUSY },
      properties: {
        status: {
          type: 'string',
          enum: Object.values(TechnicianStatus),
          description: 'New status for the technician',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Technician status updated successfully',
    type: TechnicianResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Technician not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: TechnicianStatus,
  ) {
    const technician = await this.techniciansService.updateStatus(id, status);
    return plainToInstance(TechnicianResponseDto, technician);
  }
}
