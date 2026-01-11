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
import { AssetTypesService } from './asset-types.service';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';
import { QueryAssetTypeDto } from './dto/query-asset-type.dto';
import { AssetTypeResponseDto } from './dto/asset-type-response.dto';
import { DeleteManyAssetTypesDto } from './dto/delete-many-asset-types.dto';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { plainToInstance } from 'class-transformer';

@ApiTags('Asset Types')
@Controller('asset-types')
@UseInterceptors(ClassSerializerInterceptor, TransformInterceptor)
export class AssetTypesController {
  constructor(private readonly assetTypesService: AssetTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new asset type' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Asset type created successfully',
    type: AssetTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Asset type name already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(@Body() createAssetTypeDto: CreateAssetTypeDto) {
    const assetType = await this.assetTypesService.create(createAssetTypeDto);
    return plainToInstance(AssetTypeResponseDto, assetType);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all asset types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of asset types retrieved successfully',
    type: [AssetTypeResponseDto],
  })
  async findAll(@Query() queryAssetTypeDto: QueryAssetTypeDto) {
    const assetTypes = await this.assetTypesService.findAll(queryAssetTypeDto);
    return plainToInstance(AssetTypeResponseDto, assetTypes);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an asset type by ID' })
  @ApiParam({
    name: 'id',
    description: 'Asset type ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Asset type retrieved successfully',
    type: AssetTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset type not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const assetType = await this.assetTypesService.findOne(id);
    return plainToInstance(AssetTypeResponseDto, assetType);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an asset type by ID' })
  @ApiParam({
    name: 'id',
    description: 'Asset type ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Asset type updated successfully',
    type: AssetTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset type not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Asset type name already exists',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssetTypeDto: UpdateAssetTypeDto,
  ) {
    const assetType = await this.assetTypesService.update(
      id,
      updateAssetTypeDto,
    );
    return plainToInstance(AssetTypeResponseDto, assetType);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete an asset type by ID' })
  @ApiParam({
    name: 'id',
    description: 'Asset type ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Asset type deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset type not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.assetTypesService.remove(id);
  }

  @Post('delete-many')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete multiple asset types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Asset types deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No asset types found with provided IDs',
  })
  async removeMany(@Body() deleteManyDto: DeleteManyAssetTypesDto) {
    return this.assetTypesService.removeMany(deleteManyDto.ids);
  }
}
