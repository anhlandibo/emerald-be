import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Fee } from './entities/fee.entity';
import { FeeTier } from './entities/fee-tier.entity';
import { CreateFeeDto } from './dto/create-fee.dto';
import { CreateFeeTierDto } from './dto/create-fee-tier.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';
import { QueryFeeDto } from './dto/query-fee.dto';

@Injectable()
export class FeesService {
  constructor(
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    @InjectRepository(FeeTier)
    private readonly feeTierRepository: Repository<FeeTier>,
  ) {}

  async create(createFeeDto: CreateFeeDto) {
    // Check if fee with same name already exists
    const existingFee = await this.feeRepository.findOne({
      where: { name: createFeeDto.name, isActive: true },
    });

    if (existingFee) {
      throw new HttpException('Fee name đã tồn tại', HttpStatus.CONFLICT);
    }

    // Validate tiers if provided
    if (createFeeDto.tiers && createFeeDto.tiers.length > 0) {
      this.validateTiers(createFeeDto.tiers);
    }

    // Create fee
    const fee = this.feeRepository.create({
      name: createFeeDto.name,
      unit: createFeeDto.unit,
      type: createFeeDto.type,
      description: createFeeDto.description,
    });

    const savedFee = await this.feeRepository.save(fee);

    // Create tiers if provided
    if (createFeeDto.tiers && createFeeDto.tiers.length > 0) {
      for (const tierDto of createFeeDto.tiers) {
        const tier = this.feeTierRepository.create({
          feeTypeId: savedFee.id,
          name: tierDto.name,
          fromValue: tierDto.fromValue,
          toValue: tierDto.toValue,
          unitPrice: tierDto.unitPrice,
        });
        await this.feeTierRepository.save(tier);
      }
    }

    return this.findOne(savedFee.id);
  }

  async findAll(query: QueryFeeDto) {
    const { search, type } = query;

    const queryBuilder = this.feeRepository
      .createQueryBuilder('fee')
      .leftJoinAndSelect('fee.tiers', 'tiers', 'tiers.isActive = :isActive', {
        isActive: true,
      })
      .where('fee.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere('fee.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (type) {
      queryBuilder.andWhere('fee.type = :type', { type });
    }

    queryBuilder.orderBy('fee.createdAt', 'DESC');

    const fees = await queryBuilder.getMany();

    // Transform to list response format
    return fees.map((fee) => ({
      id: fee.id,
      name: fee.name,
      unit: fee.unit,
      type: fee.type,
      description: fee.description,
      tierCount: fee.tiers ? fee.tiers.length : 0,
      createdAt: fee.createdAt,
    }));
  }

  async findOne(id: number) {
    const fee = await this.feeRepository.findOne({
      where: { id, isActive: true },
      relations: ['tiers'],
    });

    if (!fee) {
      throw new HttpException(
        `Fee với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Filter active tiers and sort by fromValue
    const activeTiers = fee.tiers
      ? fee.tiers
          .filter((tier) => tier.isActive)
          .sort((a, b) => Number(a.fromValue) - Number(b.fromValue))
      : [];

    return {
      id: fee.id,
      name: fee.name,
      unit: fee.unit,
      type: fee.type,
      description: fee.description,
      tiers: activeTiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        fromValue: Number(tier.fromValue),
        toValue: tier.toValue ? Number(tier.toValue) : null,
        unitPrice: Number(tier.unitPrice),
      })),
      createdAt: fee.createdAt,
      updatedAt: fee.updatedAt,
    };
  }

  async update(id: number, updateFeeDto: UpdateFeeDto) {
    const fee = await this.feeRepository.findOne({
      where: { id, isActive: true },
    });

    if (!fee) {
      throw new HttpException(
        `Fee với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if name is being changed and if it already exists
    if (updateFeeDto.name && updateFeeDto.name !== fee.name) {
      const existingFee = await this.feeRepository.findOne({
        where: { name: updateFeeDto.name, isActive: true },
      });

      if (existingFee) {
        throw new HttpException('Tên phí đã tồn tại', HttpStatus.CONFLICT);
      }
    }

    // Validate tiers if provided
    if (updateFeeDto.tiers && updateFeeDto.tiers.length > 0) {
      this.validateTiers(updateFeeDto.tiers);
    }

    // Update basic fields
    if (updateFeeDto.name) fee.name = updateFeeDto.name;
    if (updateFeeDto.unit !== undefined) fee.unit = updateFeeDto.unit;
    if (updateFeeDto.type) fee.type = updateFeeDto.type;
    if (updateFeeDto.description !== undefined)
      fee.description = updateFeeDto.description;

    await this.feeRepository.save(fee);

    // Update tiers if provided
    if (updateFeeDto.tiers) {
      // Soft delete old tiers
      await this.feeTierRepository.update(
        { feeTypeId: id },
        { isActive: false },
      );

      // Create new tiers
      for (const tierDto of updateFeeDto.tiers) {
        const tier = this.feeTierRepository.create({
          feeTypeId: id,
          name: tierDto.name,
          fromValue: tierDto.fromValue,
          toValue: tierDto.toValue,
          unitPrice: tierDto.unitPrice,
        });
        await this.feeTierRepository.save(tier);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const fee = await this.feeRepository.findOne({
      where: { id, isActive: true },
    });

    if (!fee) {
      throw new HttpException(
        `Fee với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete fee
    fee.isActive = false;
    await this.feeRepository.save(fee);

    // Soft delete all related tiers
    await this.feeTierRepository.update({ feeTypeId: id }, { isActive: false });

    return { message: 'Fee deleted successfully' };
  }

  async removeMany(ids: number[]) {
    const fees = await this.feeRepository.find({
      where: { id: In(ids), isActive: true },
    });

    if (fees.length === 0) {
      throw new HttpException(
        'Không tìm thấy phí nào với các ID đã cung cấp',
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete all fees
    await this.feeRepository.update({ id: In(ids) }, { isActive: false });

    // Soft delete all related tiers
    await this.feeTierRepository.update(
      { feeTypeId: In(ids) },
      { isActive: false },
    );

    return {
      message: `Successfully deleted ${fees.length} fee(s)`,
      deletedCount: fees.length,
    };
  }

  private validateTiers(tiers: CreateFeeTierDto[]) {
    // Sort tiers by fromValue
    const sortedTiers = [...tiers].sort(
      (a, b) => Number(a.fromValue) - Number(b.fromValue),
    );

    // Check for overlaps and gaps
    for (let i = 0; i < sortedTiers.length; i++) {
      const currentTier = sortedTiers[i];

      // Check if fromValue is negative
      if (Number(currentTier.fromValue) < 0) {
        throw new HttpException(
          `Tier "${currentTier.name}": fromValue không được âm`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if toValue is less than fromValue
      if (
        currentTier.toValue !== null &&
        currentTier.toValue !== undefined &&
        Number(currentTier.toValue) <= Number(currentTier.fromValue)
      ) {
        throw new HttpException(
          `Tier "${currentTier.name}": toValue phải lớn hơn fromValue`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if unitPrice is non-negative
      if (Number(currentTier.unitPrice) < 0) {
        throw new HttpException(
          `Tier "${currentTier.name}": unitPrice không được âm`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check continuity with next tier
      if (i < sortedTiers.length - 1) {
        const nextTier = sortedTiers[i + 1];

        // Current tier should have a toValue if it's not the last tier
        if (currentTier.toValue === null || currentTier.toValue === undefined) {
          throw new HttpException(
            `Tier "${currentTier.name}": Chỉ tier cuối cùng mới có thể có toValue là null`,
            HttpStatus.BAD_REQUEST,
          );
        }

        // Next tier's fromValue should equal current tier's toValue
        if (Number(nextTier.fromValue) !== Number(currentTier.toValue)) {
          throw new HttpException(
            `Phát hiện khoảng trống hoặc chồng chéo giữa tier "${currentTier.name}" và "${nextTier.name}"`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    // First tier should start from 0
    if (sortedTiers.length > 0 && Number(sortedTiers[0].fromValue) !== 0) {
      throw new HttpException(
        'Tier đầu tiên phải bắt đầu từ 0',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
