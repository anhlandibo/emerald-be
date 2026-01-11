import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { AssetType } from '../asset-types/entities/asset-type.entity';
import { Block } from '../blocks/entities/block.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { QueryAssetDto } from './dto/query-asset.dto';
import { AssetStatus } from './enums/asset-status.enum';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(AssetType)
    private readonly assetTypeRepository: Repository<AssetType>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) {}

  async create(createAssetDto: CreateAssetDto) {
    // Validate asset type exists
    const assetType = await this.assetTypeRepository.findOne({
      where: { id: createAssetDto.typeId, isActive: true },
    });

    if (!assetType) {
      throw new HttpException(
        `Asset type with ID ${createAssetDto.typeId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate block exists
    const block = await this.blockRepository.findOne({
      where: { id: createAssetDto.blockId, isActive: true },
    });

    if (!block) {
      throw new HttpException(
        `Block with ID ${createAssetDto.blockId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Calculate warranty expiration date if warrantyYears is provided
    let warrantyExpirationDate: Date | undefined;
    if (createAssetDto.warrantyYears && createAssetDto.installationDate) {
      const installDate = new Date(createAssetDto.installationDate);
      warrantyExpirationDate = new Date(installDate);
      warrantyExpirationDate.setFullYear(
        installDate.getFullYear() + createAssetDto.warrantyYears,
      );
    }

    // Calculate next maintenance date if maintenanceIntervalMonths is provided
    let nextMaintenanceDate: Date | undefined;
    if (
      createAssetDto.maintenanceIntervalMonths &&
      createAssetDto.installationDate
    ) {
      const installDate = new Date(createAssetDto.installationDate);
      nextMaintenanceDate = new Date(installDate);
      nextMaintenanceDate.setMonth(
        installDate.getMonth() + createAssetDto.maintenanceIntervalMonths,
      );
    }

    const asset = this.assetRepository.create({
      name: createAssetDto.name,
      typeId: createAssetDto.typeId,
      blockId: createAssetDto.blockId,
      floor: createAssetDto.floor,
      locationDetail: createAssetDto.locationDetail,
      status: createAssetDto.status || AssetStatus.ACTIVE,
      installationDate: createAssetDto.installationDate
        ? new Date(createAssetDto.installationDate)
        : undefined,
      warrantyYears: createAssetDto.warrantyYears,
      warrantyExpirationDate,
      maintenanceIntervalMonths: createAssetDto.maintenanceIntervalMonths,
      nextMaintenanceDate,
      description: createAssetDto.description,
      note: createAssetDto.note,
    });

    const savedAsset = await this.assetRepository.save(asset);
    return this.findOne(savedAsset.id);
  }

  async findAll(query: QueryAssetDto) {
    const { search, blockId, typeId, status, floor } = query;

    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.type', 'assetType')
      .leftJoinAndSelect('asset.block', 'block')
      .where('asset.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere('asset.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (blockId) {
      queryBuilder.andWhere('asset.blockId = :blockId', { blockId });
    }

    if (typeId) {
      queryBuilder.andWhere('asset.typeId = :typeId', { typeId });
    }

    if (status) {
      queryBuilder.andWhere('asset.status = :status', { status });
    }

    if (floor !== undefined && floor !== null) {
      queryBuilder.andWhere('asset.floor = :floor', { floor });
    }

    queryBuilder.orderBy('asset.createdAt', 'DESC');

    const assets = await queryBuilder.getMany();

    // Transform to list response format
    const today = new Date();
    return assets.map((asset) => {
      const isWarrantyValid =
        asset.warrantyExpirationDate &&
        new Date(asset.warrantyExpirationDate) > today;

      return {
        id: asset.id,
        name: asset.name,
        typeName: asset.type?.name || 'N/A',
        blockName: asset.block?.name || 'N/A',
        floor: asset.floor,
        locationDetail: asset.locationDetail,
        status: asset.status,
        nextMaintenanceDate: asset.nextMaintenanceDate
          ? this.formatDate(asset.nextMaintenanceDate)
          : null,
        isWarrantyValid: !!isWarrantyValid,
      };
    });
  }

  async findOne(id: number) {
    const asset = await this.assetRepository.findOne({
      where: { id, isActive: true },
      relations: ['type', 'block'],
    });

    if (!asset) {
      throw new HttpException(
        `Asset with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const today = new Date();

    // Calculate warranty validity
    const isWarrantyValid =
      asset.warrantyExpirationDate &&
      new Date(asset.warrantyExpirationDate) > today;

    // Calculate maintenance status
    const isOverdueMaintenance =
      asset.nextMaintenanceDate && new Date(asset.nextMaintenanceDate) < today;

    // Calculate days until maintenance
    let daysUntilMaintenance: number | null = null;
    if (asset.nextMaintenanceDate) {
      const nextDate = new Date(asset.nextMaintenanceDate);
      const diffTime = nextDate.getTime() - today.getTime();
      daysUntilMaintenance = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Format floor display
    const floorDisplay = this.getFloorDisplay(asset.floor);

    return {
      id: asset.id,
      name: asset.name,
      description: asset.description,
      note: asset.note,
      status: asset.status,
      type: {
        id: asset.type.id,
        name: asset.type.name,
        description: asset.type.description,
      },
      location: {
        blockId: asset.block.id,
        blockName: asset.block.name,
        floor: asset.floor,
        floorDisplay: floorDisplay,
        detail: asset.locationDetail,
      },
      timeline: {
        installationDate: asset.installationDate
          ? this.formatDate(asset.installationDate)
          : null,
        warrantyExpirationDate: asset.warrantyExpirationDate
          ? this.formatDate(asset.warrantyExpirationDate)
          : null,
        lastMaintenanceDate: asset.lastMaintenanceDate
          ? this.formatDate(asset.lastMaintenanceDate)
          : null,
        nextMaintenanceDate: asset.nextMaintenanceDate
          ? this.formatDate(asset.nextMaintenanceDate)
          : null,
      },
      computed: {
        isWarrantyValid: !!isWarrantyValid,
        isOverdueMaintenance: !!isOverdueMaintenance,
        daysUntilMaintenance: daysUntilMaintenance,
      },
    };
  }

  async update(id: number, updateAssetDto: UpdateAssetDto) {
    const asset = await this.assetRepository.findOne({
      where: { id, isActive: true },
    });

    if (!asset) {
      throw new HttpException(
        `Asset with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate asset type if being updated
    if (updateAssetDto.typeId && updateAssetDto.typeId !== asset.typeId) {
      const assetType = await this.assetTypeRepository.findOne({
        where: { id: updateAssetDto.typeId, isActive: true },
      });

      if (!assetType) {
        throw new HttpException(
          `Asset type with ID ${updateAssetDto.typeId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Validate block if being updated
    if (updateAssetDto.blockId && updateAssetDto.blockId !== asset.blockId) {
      const block = await this.blockRepository.findOne({
        where: { id: updateAssetDto.blockId, isActive: true },
      });

      if (!block) {
        throw new HttpException(
          `Block with ID ${updateAssetDto.blockId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Calculate warranty expiration date if warrantyYears is provided
    if (updateAssetDto.warrantyYears !== undefined) {
      const installDate = updateAssetDto.installationDate
        ? new Date(updateAssetDto.installationDate)
        : asset.installationDate;

      if (installDate && updateAssetDto.warrantyYears > 0) {
        const warrantyExpiration = new Date(installDate);
        warrantyExpiration.setFullYear(
          installDate.getFullYear() + updateAssetDto.warrantyYears,
        );
        asset.warrantyYears = updateAssetDto.warrantyYears;
        asset.warrantyExpirationDate = warrantyExpiration;
      } else if (updateAssetDto.warrantyYears === 0) {
        asset.warrantyYears = 0;
        asset.warrantyExpirationDate = undefined;
      }
    }

    // Update lastMaintenanceDate if provided
    if (
      updateAssetDto.lastMaintenanceDate !== undefined &&
      updateAssetDto.lastMaintenanceDate !== null
    ) {
      asset.lastMaintenanceDate = new Date(updateAssetDto.lastMaintenanceDate);
    }

    // Calculate next maintenance date if maintenanceIntervalMonths is provided or lastMaintenanceDate is updated
    // Use stored maintenanceIntervalMonths if available, or calculate from new/existing values
    if (
      updateAssetDto.maintenanceIntervalMonths !== undefined ||
      (updateAssetDto.lastMaintenanceDate !== undefined &&
        updateAssetDto.lastMaintenanceDate !== null)
    ) {
      // Determine interval to use
      const interval =
        updateAssetDto.maintenanceIntervalMonths !== undefined
          ? updateAssetDto.maintenanceIntervalMonths
          : asset.maintenanceIntervalMonths;

      // Determine base date for calculation (prefer updated lastMaintenanceDate)
      const baseDate =
        (updateAssetDto.lastMaintenanceDate !== undefined &&
        updateAssetDto.lastMaintenanceDate !== null
          ? new Date(updateAssetDto.lastMaintenanceDate)
          : asset.lastMaintenanceDate) ||
        (updateAssetDto.installationDate
          ? new Date(updateAssetDto.installationDate)
          : asset.installationDate);

      // Calculate next maintenance date
      if (baseDate && interval && interval > 0) {
        const nextMaintenance = new Date(baseDate);
        nextMaintenance.setMonth(nextMaintenance.getMonth() + interval);
        asset.maintenanceIntervalMonths = interval;
        asset.nextMaintenanceDate = nextMaintenance;
      } else if (interval === 0) {
        asset.maintenanceIntervalMonths = 0;
        asset.nextMaintenanceDate = undefined;
      }
    }

    // Update other fields
    if (updateAssetDto.name !== undefined) asset.name = updateAssetDto.name;
    if (updateAssetDto.typeId !== undefined)
      asset.typeId = updateAssetDto.typeId;
    if (updateAssetDto.blockId !== undefined)
      asset.blockId = updateAssetDto.blockId;
    if (updateAssetDto.floor !== undefined) asset.floor = updateAssetDto.floor;
    if (updateAssetDto.locationDetail !== undefined)
      asset.locationDetail = updateAssetDto.locationDetail;
    if (updateAssetDto.status !== undefined)
      asset.status = updateAssetDto.status;
    if (updateAssetDto.installationDate !== undefined)
      asset.installationDate = new Date(updateAssetDto.installationDate);
    if (updateAssetDto.description !== undefined)
      asset.description = updateAssetDto.description;
    if (updateAssetDto.note !== undefined) asset.note = updateAssetDto.note;

    await this.assetRepository.save(asset);

    return this.findOne(id);
  }

  async remove(id: number) {
    const asset = await this.assetRepository.findOne({
      where: { id, isActive: true },
    });

    if (!asset) {
      throw new HttpException(
        `Asset with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete
    asset.isActive = false;
    await this.assetRepository.save(asset);

    return { message: 'Asset deleted successfully' };
  }

  async removeMany(ids: number[]) {
    const assets = await this.assetRepository.find({
      where: { id: In(ids), isActive: true },
    });

    if (assets.length === 0) {
      throw new HttpException(
        'No assets found with provided IDs',
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete all
    await this.assetRepository.update({ id: In(ids) }, { isActive: false });

    return {
      message: `Successfully deleted ${assets.length} asset(s)`,
      deletedCount: assets.length,
    };
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getFloorDisplay(floor: number): string {
    if (floor === 0) {
      return 'Tầng trệt';
    } else if (floor > 0) {
      return `Tầng ${floor}`;
    } else {
      return `Hầm B${Math.abs(floor)}`;
    }
  }
}
