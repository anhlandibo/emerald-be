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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { QueryBlockDto } from './dto/query-block.dto';
import { BlockResponseDto } from './dto/block-response.dto';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { plainToInstance } from 'class-transformer';

@ApiTags('Blocks')
@Controller('blocks')
@UseInterceptors(ClassSerializerInterceptor, TransformInterceptor)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new block' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Block created successfully',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Block name already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(@Body() createBlockDto: CreateBlockDto) {
    const block = await this.blocksService.create(createBlockDto);
    return plainToInstance(BlockResponseDto, block);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all blocks with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of blocks retrieved successfully',
    type: [BlockResponseDto],
  })
  async findAll(@Query() queryBlockDto: QueryBlockDto) {
    const result = await this.blocksService.findAll(queryBlockDto);
    return plainToInstance(BlockResponseDto, result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a block by ID' })
  @ApiParam({
    name: 'id',
    description: 'Block ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Block retrieved successfully',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Block not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const block = await this.blocksService.findOne(id);
    return plainToInstance(BlockResponseDto, block);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a block by ID' })
  @ApiParam({
    name: 'id',
    description: 'Block ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Block updated successfully',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Block not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Block name already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBlockDto: UpdateBlockDto,
  ) {
    const block = await this.blocksService.update(id, updateBlockDto);
    return plainToInstance(BlockResponseDto, block);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a block by ID' })
  @ApiParam({
    name: 'id',
    description: 'Block ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Block deleted successfully',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Block not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const block = await this.blocksService.remove(id);
    return plainToInstance(BlockResponseDto, block);
  }
}
