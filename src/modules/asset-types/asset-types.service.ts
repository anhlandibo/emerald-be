import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AssetType } from './entities/asset-type.entity';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';
import { QueryAssetTypeDto } from './dto/query-asset-type.dto';

@Injectable()
export class AssetTypesService {
  constructor(
    @InjectRepository(AssetType)
    private readonly assetTypeRepository: Repository<AssetType>,
  ) {}

  async create(createAssetTypeDto: CreateAssetTypeDto) {
    // Check if asset type with same name already exists
    const existingAssetType = await this.assetTypeRepository.findOne({
      where: { name: createAssetTypeDto.name, isActive: true },
    });

    if (existingAssetType) {
      throw new HttpException(
        'Tên loại tài sản đã tồn tại',
        HttpStatus.CONFLICT,
      );
    }

    const assetType = this.assetTypeRepository.create(createAssetTypeDto);
    return await this.assetTypeRepository.save(assetType);
  }

  async findAll(query: QueryAssetTypeDto) {
    const { search } = query;

    const queryBuilder = this.assetTypeRepository
      .createQueryBuilder('asset_type')
      .where('asset_type.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere('asset_type.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy('asset_type.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async findOne(id: number) {
    const assetType = await this.assetTypeRepository.findOne({
      where: { id, isActive: true },
    });

    if (!assetType) {
      throw new HttpException(
        `Loại tài sản với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    return assetType;
  }

  async update(id: number, updateAssetTypeDto: UpdateAssetTypeDto) {
    const assetType = await this.assetTypeRepository.findOne({
      where: { id, isActive: true },
    });

    if (!assetType) {
      throw new HttpException(
        `Loại tài sản với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if name is being changed and if it already exists
    if (updateAssetTypeDto.name && updateAssetTypeDto.name !== assetType.name) {
      const existingAssetType = await this.assetTypeRepository.findOne({
        where: { name: updateAssetTypeDto.name, isActive: true },
      });

      if (existingAssetType) {
        throw new HttpException(
          'Tên loại tài sản đã tồn tại',
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(assetType, updateAssetTypeDto);
    return await this.assetTypeRepository.save(assetType);
  }

  async remove(id: number) {
    const assetType = await this.assetTypeRepository.findOne({
      where: { id, isActive: true },
    });

    if (!assetType) {
      throw new HttpException(
        `Loại tài sản với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete
    assetType.isActive = false;
    await this.assetTypeRepository.save(assetType);

    return { message: 'Asset type deleted successfully' };
  }

  async removeMany(ids: number[]) {
    const assetTypes = await this.assetTypeRepository.find({
      where: { id: In(ids), isActive: true },
    });

    if (assetTypes.length === 0) {
      throw new HttpException(
        'Không tìm thấy loại tài sản nào với các ID đã cung cấp',
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete all
    await this.assetTypeRepository.update({ id: In(ids) }, { isActive: false });

    return {
      message: `Đã xóa thành công ${assetTypes.length} loại tài sản`,
      deletedCount: assetTypes.length,
    };
  }
}
