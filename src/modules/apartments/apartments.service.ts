import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Apartment } from './entities/apartment.entity';
import { ApartmentResident } from './entities/apartment-resident.entity';
import { Block } from '../blocks/entities/block.entity';
import { Resident } from '../residents/entities/resident.entity';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';
import { QueryApartmentDto } from './dto/query-apartment.dto';
import { RelationshipType } from './enums/relationship-type.enum';
import { Gender } from '../residents/enums/gender.enum';

@Injectable()
export class ApartmentsService {
  constructor(
    @InjectRepository(Apartment)
    private apartmentRepository: Repository<Apartment>,
    @InjectRepository(ApartmentResident)
    private apartmentResidentRepository: Repository<ApartmentResident>,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
    @InjectRepository(Resident)
    private residentRepository: Repository<Resident>,
  ) {}

  async create(createApartmentDto: CreateApartmentDto) {
    // Find block by ID
    const block = await this.blockRepository.findOne({
      where: { id: createApartmentDto.blockId, isActive: true },
    });

    if (!block) {
      throw new HttpException('Block not found', HttpStatus.NOT_FOUND);
    }

    // Check if apartment name already exists in this block
    const existingApartment = await this.apartmentRepository.findOne({
      where: {
        name: createApartmentDto.roomName,
        blockId: createApartmentDto.blockId,
        isActive: true,
      },
    });

    if (existingApartment) {
      throw new HttpException(
        'Apartment name already exists in this block',
        HttpStatus.CONFLICT,
      );
    }

    // Verify owner exists
    const owner = await this.residentRepository.findOne({
      where: { id: createApartmentDto.owner_id, isActive: true },
    });

    if (!owner) {
      throw new HttpException('Owner resident not found', HttpStatus.NOT_FOUND);
    }

    // Verify all residents exist
    if (
      createApartmentDto.residents &&
      createApartmentDto.residents.length > 0
    ) {
      for (const residentDto of createApartmentDto.residents) {
        const resident = await this.residentRepository.findOne({
          where: { id: residentDto.id, isActive: true },
        });
        if (!resident) {
          throw new HttpException(
            `Resident with ID ${residentDto.id} not found`,
            HttpStatus.NOT_FOUND,
          );
        }
      }
    }

    // Create apartment
    const apartment = this.apartmentRepository.create({
      name: createApartmentDto.roomName,
      blockId: createApartmentDto.blockId,
      floor: createApartmentDto.floor,
      type: createApartmentDto.type,
      area: createApartmentDto.area,
    });

    const savedApartment = await this.apartmentRepository.save(apartment);

    // Create owner relationship
    const ownerRelation = this.apartmentResidentRepository.create({
      apartmentId: savedApartment.id,
      residentId: createApartmentDto.owner_id,
      relationship: RelationshipType.OWNER,
    });
    await this.apartmentResidentRepository.save(ownerRelation);

    // Create other resident relationships
    if (
      createApartmentDto.residents &&
      createApartmentDto.residents.length > 0
    ) {
      for (const residentDto of createApartmentDto.residents) {
        const relation = this.apartmentResidentRepository.create({
          apartmentId: savedApartment.id,
          residentId: residentDto.id,
          relationship: residentDto.relationship,
        });
        await this.apartmentResidentRepository.save(relation);
      }
    }

    return this.findOne(savedApartment.id);
  }

  async findAll(query: QueryApartmentDto) {
    const queryBuilder = this.apartmentRepository
      .createQueryBuilder('apartment')
      .leftJoinAndSelect('apartment.block', 'block')
      .leftJoinAndSelect('apartment.apartmentResidents', 'apartmentResidents')
      .leftJoinAndSelect('apartmentResidents.resident', 'resident')
      .where('apartment.isActive = :isActive', { isActive: true });

    if (query.search) {
      queryBuilder.andWhere(
        '(apartment.name ILIKE :search OR block.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.type) {
      queryBuilder.andWhere('apartment.type = :type', { type: query.type });
    }

    if (query.blockId) {
      queryBuilder.andWhere('apartment.blockId = :blockId', {
        blockId: query.blockId,
      });
    }

    queryBuilder.orderBy('apartment.createdAt', 'DESC');

    const apartments = await queryBuilder.getMany();

    // Transform to list response format
    return apartments.map((apartment) => {
      const owner = apartment.apartmentResidents.find(
        (ar) => ar.relationship === RelationshipType.OWNER,
      );
      const hasResidents = apartment.apartmentResidents.length > 1;

      return {
        id: apartment.id,
        roomName: apartment.name,
        type: apartment.type,
        block: apartment.block.name,
        floor: apartment.floor,
        area: apartment.area,
        owner: owner?.resident?.fullName || 'N/A',
        status: hasResidents ? 'Đang ở' : 'Trống',
      };
    });
  }

  async findOne(id: number) {
    const apartment = await this.apartmentRepository.findOne({
      where: { id, isActive: true },
      relations: ['block', 'apartmentResidents', 'apartmentResidents.resident'],
    });

    if (!apartment) {
      throw new HttpException('Apartment not found', HttpStatus.NOT_FOUND);
    }

    // Find owner
    const ownerRelation = apartment.apartmentResidents.find(
      (ar) => ar.relationship === RelationshipType.OWNER,
    );

    const owner = ownerRelation?.resident;

    // Get all residents including owner
    const residents = apartment.apartmentResidents.map((ar) => ({
      id: ar.resident.id,
      fullName: ar.resident.fullName,
      gender: this.getGenderLabel(ar.resident.gender),
      phone: ar.resident.phoneNumber,
      relationship: this.getRelationshipLabel(ar.relationship),
    }));

    const hasResidents = apartment.apartmentResidents.length > 1;

    return {
      generalInfo: {
        apartmentName: apartment.name,
        building: apartment.block.name,
        floor: apartment.floor,
        area: `${apartment.area}m2`,
        type: apartment.type,
        status: hasResidents ? 'Đang ở' : 'Trống',
      },
      owner: {
        fullName: owner?.fullName,
        phone: owner?.phoneNumber,
        identityCard: owner?.citizenId,
      },
      residents,
    };
  }

  async update(id: number, updateApartmentDto: UpdateApartmentDto) {
    const apartment = await this.apartmentRepository.findOne({
      where: { id, isActive: true },
    });

    if (!apartment) {
      throw new HttpException('Apartment not found', HttpStatus.NOT_FOUND);
    }

    // If block is being changed, verify the new block exists
    if (updateApartmentDto.blockId) {
      const block = await this.blockRepository.findOne({
        where: { id: updateApartmentDto.blockId, isActive: true },
      });

      if (!block) {
        throw new HttpException('Block not found', HttpStatus.NOT_FOUND);
      }

      apartment.blockId = updateApartmentDto.blockId;
    }

    // Check if apartment name is being changed and if it already exists
    if (
      updateApartmentDto.roomName &&
      updateApartmentDto.roomName !== apartment.name
    ) {
      const existingApartment = await this.apartmentRepository.findOne({
        where: {
          name: updateApartmentDto.roomName,
          blockId: apartment.blockId,
          isActive: true,
        },
      });

      if (existingApartment && existingApartment.id !== id) {
        throw new HttpException(
          'Apartment name already exists in this block',
          HttpStatus.CONFLICT,
        );
      }

      apartment.name = updateApartmentDto.roomName;
    }

    // Update other fields
    if (updateApartmentDto.floor !== undefined) {
      apartment.floor = updateApartmentDto.floor;
    }
    if (updateApartmentDto.type) {
      apartment.type = updateApartmentDto.type;
    }
    if (updateApartmentDto.area !== undefined) {
      apartment.area = updateApartmentDto.area;
    }

    await this.apartmentRepository.save(apartment);

    // Update residents if provided
    if (updateApartmentDto.owner_id || updateApartmentDto.residents) {
      // Remove all existing relationships
      await this.apartmentResidentRepository.delete({ apartmentId: id });

      // Add new owner
      if (updateApartmentDto.owner_id) {
        const owner = await this.residentRepository.findOne({
          where: { id: updateApartmentDto.owner_id, isActive: true },
        });

        if (!owner) {
          throw new HttpException(
            'Owner resident not found',
            HttpStatus.NOT_FOUND,
          );
        }

        const ownerRelation = this.apartmentResidentRepository.create({
          apartmentId: id,
          residentId: updateApartmentDto.owner_id,
          relationship: RelationshipType.OWNER,
        });
        await this.apartmentResidentRepository.save(ownerRelation);
      }

      // Add new residents
      if (
        updateApartmentDto.residents &&
        updateApartmentDto.residents.length > 0
      ) {
        for (const residentDto of updateApartmentDto.residents) {
          const resident = await this.residentRepository.findOne({
            where: { id: residentDto.id, isActive: true },
          });

          if (!resident) {
            throw new HttpException(
              `Resident with ID ${residentDto.id} not found`,
              HttpStatus.NOT_FOUND,
            );
          }

          const relation = this.apartmentResidentRepository.create({
            apartmentId: id,
            residentId: residentDto.id,
            relationship: residentDto.relationship,
          });
          await this.apartmentResidentRepository.save(relation);
        }
      }
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const apartment = await this.apartmentRepository.findOne({
      where: { id, isActive: true },
    });

    if (!apartment) {
      throw new HttpException('Apartment not found', HttpStatus.NOT_FOUND);
    }

    apartment.isActive = false;
    await this.apartmentRepository.save(apartment);

    return { message: 'Apartment deleted successfully' };
  }

  async removeMany(ids: number[]) {
    const apartments = await this.apartmentRepository.find({
      where: { id: In(ids), isActive: true },
    });

    if (apartments.length === 0) {
      throw new HttpException(
        'No apartments found with provided IDs',
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete all apartments
    await this.apartmentRepository.update({ id: In(ids) }, { isActive: false });

    return {
      message: `Successfully deleted ${apartments.length} apartment(s)`,
      deletedCount: apartments.length,
    };
  }

  private getGenderLabel(gender: Gender): string {
    const genderMap = {
      [Gender.MALE]: 'Nam',
      [Gender.FEMALE]: 'Nữ',
      [Gender.OTHER]: 'Khác',
    };
    return genderMap[gender] || gender;
  }

  private getRelationshipLabel(relationship: RelationshipType): string {
    const relationshipMap = {
      [RelationshipType.OWNER]: 'Chủ hộ',
      [RelationshipType.SPOUSE]: 'Vợ/chồng',
      [RelationshipType.CHILD]: 'Con',
      [RelationshipType.PARTNER]: 'Bạn đời',
    };
    return relationshipMap[relationship] || relationship;
  }
}
