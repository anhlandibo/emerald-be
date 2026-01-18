import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, In } from 'typeorm';
import { Resident } from './entities/resident.entity';
import { Account } from '../accounts/entities/account.entity';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { QueryResidentDto } from './dto/query-resident.dto';
import { UserRole } from '../accounts/enums/user-role.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { PaymentTransaction } from '../payments/entities/payment-transaction.entity';
import { ApartmentResident } from '../apartments/entities/apartment-resident.entity';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(ApartmentResident)
    private readonly apartmentResidentRepository: Repository<ApartmentResident>,
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
      throw new HttpException('Citizen ID đã tồn tại', HttpStatus.CONFLICT);

    // Check if email already exists
    const existingEmail = await this.accountRepository.findOne({
      where: { email: createResidentDto.email },
    });

    if (existingEmail) {
      throw new HttpException('Email đã tồn tại', HttpStatus.CONFLICT);
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
        throw new HttpException(
          'Upload ảnh không thành công',
          HttpStatus.BAD_REQUEST,
        );
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
      province: createResidentDto.province,
      district: createResidentDto.district,
      ward: createResidentDto.ward,
      detailAddress: createResidentDto.detailAddress,
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
        `Resident với ID ${id} không tồn tại`,
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
        throw new HttpException('Citizen ID đã tồn tại', HttpStatus.CONFLICT);
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
        throw new HttpException('Failed to upload ảnh', HttpStatus.BAD_REQUEST);
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

  async removeMany(ids: number[]) {
    const residents = await this.residentRepository.find({
      where: { id: In(ids), isActive: true },
      relations: ['account'],
    });

    if (residents.length === 0) {
      throw new HttpException(
        'Không tìm thấy cư dân với các ID đã cung cấp',
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete all residents
    await this.residentRepository.update({ id: In(ids) }, { isActive: false });

    // Soft delete associated accounts
    const accountIds = residents
      .map((r) => r.accountId)
      .filter((id) => id !== null && id !== undefined);
    if (accountIds.length > 0) {
      await this.accountRepository.update(
        { id: In(accountIds) },
        { isActive: false },
      );
    }

    return {
      message: `Đã xóa thành công ${residents.length} cư dân`,
      deletedCount: residents.length,
    };
  }

  async getMyProfile(accountId: number) {
    // Find resident by account ID
    const resident = await this.residentRepository.findOne({
      where: { accountId, isActive: true },
      relations: ['account'],
    });

    if (!resident) {
      throw new HttpException('Cư dân không tồn tại', HttpStatus.NOT_FOUND);
    }

    // Get all apartments for this resident via ApartmentResident table
    const apartmentResidents = await this.apartmentResidentRepository.find({
      where: { residentId: resident.id },
    });

    const apartmentIds = apartmentResidents.map((ar) => ar.apartmentId);

    // Get invoices for all apartments
    const invoices =
      apartmentIds.length > 0
        ? await this.invoiceRepository.find({
            where: { apartmentId: In(apartmentIds) },
            order: { createdAt: 'DESC' },
          })
        : [];

    // Get bookings for this resident
    const bookings = await this.bookingRepository.find({
      where: { residentId: resident.id },
      order: { createdAt: 'DESC' },
    });

    // Get payment transactions for this resident (by accountId)
    const payments = await this.paymentTransactionRepository.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });

    // Return resident with related data
    return {
      ...resident,
      invoices,
      bookings,
      payments,
    };
  }
}
