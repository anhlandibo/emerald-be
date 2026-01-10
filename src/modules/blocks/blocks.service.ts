import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Block } from './entities/block.entity';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { QueryBlockDto } from './dto/query-block.dto';
import { BlockStatus } from './enums/block-status.enum';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) {}

  async create(createBlockDto: CreateBlockDto) {
    // Check if block with same name already exists
    const existingBlock = await this.blockRepository.findOne({
      where: { name: createBlockDto.name },
    });

    if (existingBlock) {
      throw new HttpException('Block name already exists', HttpStatus.CONFLICT);
    }

    const block = this.blockRepository.create({
      ...createBlockDto,
      status: createBlockDto.status || BlockStatus.OPERATING,
    });

    return this.blockRepository.save(block);
  }

  async findAll(query: QueryBlockDto) {
    const { search, status } = query;

    const where: FindOptionsWhere<Block> = {
      isActive: true,
      ...(status && { status }),
    };

    // Build query with search
    const queryBuilder = this.blockRepository
      .createQueryBuilder('block')
      .where('block.isActive = :isActive', { isActive: true });

    if (status) {
      queryBuilder.andWhere('block.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere('block.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy('block.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: number) {
    const block = await this.blockRepository.findOne({
      where: { id, isActive: true },
    });

    if (!block) {
      throw new HttpException(
        `Block with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return block;
  }

  async update(id: number, updateBlockDto: UpdateBlockDto) {
    const block = await this.findOne(id);

    // Check if name is being changed and if it already exists
    if (updateBlockDto.name && updateBlockDto.name !== block.name) {
      const existingBlock = await this.blockRepository.findOne({
        where: { name: updateBlockDto.name },
      });

      if (existingBlock) {
        throw new HttpException(
          'Block name already exists',
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(block, updateBlockDto);
    await this.blockRepository.save(block);

    return this.findOne(id);
  }

  async remove(id: number) {
    const block = await this.findOne(id);

    // Soft delete
    block.isActive = false;
    await this.blockRepository.save(block);

    return block;
  }
}
