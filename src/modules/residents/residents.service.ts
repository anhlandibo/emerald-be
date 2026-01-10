import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Resident } from './entities/resident.entity';
import { Account } from '../accounts/entities/account.entity';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { QueryResidentDto } from './dto/query-resident.dto';
import { UserRole } from '../accounts/enums/user-role.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Convert CCCD to password (remove Vietnamese accents and spaces)
   */
  private generatePasswordFromCCCD(citizenId: string): string {
    // Just use the citizen ID as password
    return citizenId;
  }

  async create(
    createResidentDto: CreateResidentDto,
    imageFile?: Express.Multer.File,
  ) {
    // Check if citizen ID already exists
    const existingCitizen = await this.residentRepository.findOne({
      where: { citizenId: createResidentDto.citizenId },
    });

    if (existingCitizen)
      throw new HttpException('Citizen ID already exists', HttpStatus.CONFLICT);

    // Check if email already exists
    const existingEmail = await this.accountRepository.findOne({
      where: { email: createResidentDto.email },
    });

    if (existingEmail) {
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    }

    // Generate password from CCCD
    const password = this.generatePasswordFromCCCD(createResidentDto.citizenId);

    // Upload image if provided
    let imageUrl: string | undefined = undefined;
    if (imageFile) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(imageFile);
        if (uploadResult) {
          imageUrl = uploadResult.secure_url;
        }
      } catch (error) {
        throw new BadRequestException('Failed to upload image');
      }
    }

    // Create account first
    const account = this.accountRepository.create({
      email: createResidentDto.email,
      password,
      role: UserRole.RESIDENT,
      isActive: true,
    });

    const savedAccount = await this.accountRepository.save(account);

    // Create resident
    const resident = this.residentRepository.create({
      fullName: createResidentDto.fullName,
      citizenId: createResidentDto.citizenId,
      dob: new Date(createResidentDto.dob),
      gender: createResidentDto.gender,
      phoneNumber: createResidentDto.phoneNumber,
      nationality: createResidentDto.nationality,
      hometown: createResidentDto.hometown,
      accountId: savedAccount.id,
      imageUrl,
    });

    const savedResident = await this.residentRepository.save(resident);

    // Return with account information
    return this.findOne(savedResident.id);
  }

  async findAll(query: QueryResidentDto) {
    const { search, gender, nationality } = query;

    const where: FindOptionsWhere<Resident> = {
      isActive: true,
      ...(gender && { gender }),
      ...(nationality && { nationality }),
    };

    // Build query with search
    const queryBuilder = this.residentRepository
      .createQueryBuilder('resident')
      .leftJoinAndSelect('resident.account', 'account')
      .where('resident.isActive = :isActive', { isActive: true });

    if (gender) {
      queryBuilder.andWhere('resident.gender = :gender', { gender });
    }

    if (nationality) {
      queryBuilder.andWhere('resident.nationality = :nationality', {
        nationality,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(resident.fullName ILIKE :search OR resident.citizenId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('resident.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: number) {
    const resident = await this.residentRepository.findOne({
      where: { id, isActive: true },
      relations: ['account'],
    });

    if (!resident) {
      throw new HttpException(
        `Resident with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return resident;
  }

  async findByCitizenId(citizenId: string) {
    return this.residentRepository.findOne({
      where: { citizenId, isActive: true },
      relations: ['account'],
    });
  }

  async update(
    id: number,
    updateResidentDto: UpdateResidentDto,
    imageFile?: Express.Multer.File,
  ) {
    const resident = await this.findOne(id);

    // Check if citizen ID is being changed and if it already exists
    if (
      updateResidentDto.citizenId &&
      updateResidentDto.citizenId !== resident.citizenId
    ) {
      const existingCitizen = await this.findByCitizenId(
        updateResidentDto.citizenId,
      );
      if (existingCitizen) {
        throw new HttpException(
          'Citizen ID already exists',
          HttpStatus.CONFLICT,
        );
      }
    }

    // Upload new image if provided
    if (imageFile) {
      try {
        // Delete old image if exists
        if (resident.imageUrl) {
          const publicId = resident.imageUrl.split('/').pop()?.split('.')[0];
          if (publicId) {
            await this.cloudinaryService.deleteFile(publicId);
          }
        }

        // Upload new image
        const uploadResult = await this.cloudinaryService.uploadFile(imageFile);
        if (uploadResult) {
          updateResidentDto.image = uploadResult.secure_url;
        }
      } catch (error) {
        throw new HttpException(
          'Failed to upload image',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Update resident
    Object.assign(resident, {
      ...updateResidentDto,
      ...(updateResidentDto.dob && { dob: new Date(updateResidentDto.dob) }),
      ...(updateResidentDto.image && { imageUrl: updateResidentDto.image }),
    });

    await this.residentRepository.save(resident);

    return this.findOne(id);
  }

  async remove(id: number) {
    const resident = await this.findOne(id);

    // Soft delete resident
    resident.isActive = false;
    await this.residentRepository.save(resident);

    // Soft delete associated account
    const account = await this.accountRepository.findOne({
      where: { id: resident.accountId },
    });

    if (account) {
      account.isActive = false;
      await this.accountRepository.save(account);
    }

    return resident;
  }
}
