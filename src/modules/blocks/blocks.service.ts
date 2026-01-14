import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, In } from 'typeorm';
import { Block } from './entities/block.entity';
import { Apartment } from '../apartments/entities/apartment.entity';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { QueryBlockDto } from './dto/query-block.dto';
import { BlockStatus } from './enums/block-status.enum';
import { ApartmentType } from '../apartments/enums/apartment-type.enum';
import { CreateBlockApartmentDto } from './dto/create-block-apartment.dto';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(Apartment)
    private readonly apartmentRepository: Repository<Apartment>,
  ) {}

  async create(createBlockDto: CreateBlockDto) {
    // Check if block with same name already exists
    const existingBlock = await this.blockRepository.findOne({
      where: { name: createBlockDto.buildingName },
    });

    if (existingBlock) {
      throw new HttpException('Tên block đã tồn tại', HttpStatus.CONFLICT);
    }

    // Calculate total floors from apartments if not provided
    let totalFloors = 0;
    if (createBlockDto.apartments && createBlockDto.apartments.length > 0) {
      const floors = createBlockDto.apartments.map((apt) => Number(apt.floor));
      totalFloors = Math.max(...floors);
    }

    const block = this.blockRepository.create({
      name: createBlockDto.buildingName,
      managerName: createBlockDto.managerName,
      managerPhone: createBlockDto.managerPhone,
      totalFloors: totalFloors,
      status: createBlockDto.status || BlockStatus.OPERATING,
    });

    const savedBlock = await this.blockRepository.save(block);

    // Create apartments if provided
    if (createBlockDto.apartments && createBlockDto.apartments.length > 0) {
      for (const apartmentDto of createBlockDto.apartments) {
        const apartment = this.apartmentRepository.create({
          name: apartmentDto.roomName,
          blockId: savedBlock.id,
          floor: apartmentDto.floor,
          type: apartmentDto.type,
          area: apartmentDto.area,
        });
        await this.apartmentRepository.save(apartment);
      }
    }

    return this.findOne(savedBlock.id);
  }

  async findAll(query: QueryBlockDto) {
    const { search, status } = query;

    const queryBuilder = this.blockRepository
      .createQueryBuilder('block')
      .leftJoinAndSelect(
        'block.apartments',
        'apartments',
        'apartments.isActive = :isActive',
        { isActive: true },
      )
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

    const blocks = await queryBuilder.getMany();

    // Transform to list response format
    return blocks.map((block) => {
      const roomDetails = {
        studio: 0,
        oneBedroom: 0,
        twoBedroom: 0,
        penthouse: 0,
      };

      block.apartments.forEach((apt) => {
        switch (apt.type) {
          case ApartmentType.STUDIO:
            roomDetails.studio++;
            break;
          case ApartmentType.ONE_BEDROOM:
            roomDetails.oneBedroom++;
            break;
          case ApartmentType.TWO_BEDROOM:
            roomDetails.twoBedroom++;
            break;
          case ApartmentType.PENTHOUSE:
            roomDetails.penthouse++;
            break;
        }
      });

      return {
        id: block.id,
        buildingName: block.name,
        status: this.getStatusLabel(block.status),
        totalFloors: block.totalFloors,
        managerName: block.managerName,
        managerPhone: block.managerPhone,
        totalRooms: block.apartments.length,
        roomDetails,
      };
    });
  }

  async findOne(id: number) {
    const block = await this.blockRepository.findOne({
      where: { id, isActive: true },
      relations: ['apartments'],
    });

    if (!block) {
      throw new HttpException(
        `Block với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    const apartments = block.apartments
      .filter((apt) => apt.isActive)
      .map((apt) => ({
        id: apt.id,
        roomName: apt.name,
        type: apt.type,
        area: apt.area,
        floor: apt.floor,
      }));

    return {
      id: block.id,
      buildingName: block.name,
      status: this.getStatusLabel(block.status),
      totalFloors: block.totalFloors,
      managerName: block.managerName,
      managerPhone: block.managerPhone,
      totalRooms: apartments.length,
      apartments,
    };
  }

  async update(id: number, updateBlockDto: UpdateBlockDto) {
    const blockData = await this.blockRepository.findOne({
      where: { id, isActive: true },
    });

    if (!blockData) {
      throw new HttpException(
        `Block với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if name is being changed and if it already exists
    if (
      updateBlockDto.buildingName &&
      updateBlockDto.buildingName !== blockData.name
    ) {
      const existingBlock = await this.blockRepository.findOne({
        where: { name: updateBlockDto.buildingName },
      });

      if (existingBlock) {
        throw new HttpException('Tên block đã tồn tại', HttpStatus.CONFLICT);
      }

      blockData.name = updateBlockDto.buildingName;
    }

    // Update basic fields
    if (updateBlockDto.managerName) {
      blockData.managerName = updateBlockDto.managerName;
    }
    if (updateBlockDto.managerPhone) {
      blockData.managerPhone = updateBlockDto.managerPhone;
    }
    if (updateBlockDto.status) {
      blockData.status = updateBlockDto.status;
    }

    // Calculate total floors from apartments if provided
    if (updateBlockDto.apartments && updateBlockDto.apartments.length > 0) {
      const floors = updateBlockDto.apartments.map((apt) => Number(apt.floor));
      blockData.totalFloors = Math.max(...floors);

      // Remove old apartments and create new ones
      await this.apartmentRepository.update(
        { blockId: id },
        { isActive: false },
      );

      for (const apartmentDto of updateBlockDto.apartments) {
        const apartment = this.apartmentRepository.create({
          name: apartmentDto.roomName,
          blockId: id,
          floor: apartmentDto.floor,
          type: apartmentDto.type,
          area: apartmentDto.area,
        });
        await this.apartmentRepository.save(apartment);
      }
    }

    await this.blockRepository.save(blockData);

    return this.findOne(id);
  }

  async remove(id: number) {
    const block = await this.blockRepository.findOne({
      where: { id, isActive: true },
    });

    if (!block) {
      throw new HttpException(
        `Block với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete
    block.isActive = false;
    await this.blockRepository.save(block);

    // Also soft delete all apartments in this block
    await this.apartmentRepository.update({ blockId: id }, { isActive: false });

    return { message: 'Xóa block thành công' };
  }

  async removeMany(ids: number[]) {
    const blocks = await this.blockRepository.find({
      where: { id: In(ids), isActive: true },
    });

    if (blocks.length === 0) {
      throw new HttpException(
        'Không tìm thấy block nào với các ID đã cung cấp',
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete all blocks
    await this.blockRepository.update({ id: In(ids) }, { isActive: false });

    // Also soft delete all apartments in these blocks
    await this.apartmentRepository.update(
      { blockId: In(ids) },
      { isActive: false },
    );

    return {
      message: `Xóa thành công ${blocks.length} block(s)`,
      deletedCount: blocks.length,
    };
  }

  async hasResidents(id: number) {
    // Check if block exists and is active
    const block = await this.blockRepository.findOne({
      where: { id, isActive: true },
    });

    if (!block) {
      throw new HttpException('Block không tồn tại', HttpStatus.NOT_FOUND);
    }

    // Count residents in this block through apartments
    const residentCount = await this.apartmentRepository
      .createQueryBuilder('apartment')
      .innerJoin('apartment.apartmentResidents', 'apartmentResident')
      .where('apartment.blockId = :blockId', { blockId: id })
      .andWhere('apartment.isActive = :isActive', { isActive: true })
      .select('COUNT(DISTINCT apartmentResident.residentId)', 'count')
      .getRawOne();

    return {
      hasResidents: residentCount && parseInt(residentCount.count, 10) > 0,
    };
  }

  private getStatusLabel(status: BlockStatus): string {
    const statusMap = {
      [BlockStatus.OPERATING]: 'OPERATING',
      [BlockStatus.UNDER_CONSTRUCTION]: 'UNDER_CONSTRUCTION',
      [BlockStatus.UNDER_MAINTENANCE]: 'UNDER_MAINTENANCE',
    };
    return statusMap[status] || status;
  }
}
