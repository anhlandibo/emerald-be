import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Technician } from './entities/technician.entity';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { QueryTechnicianDto } from './dto/query-technician.dto';
import { TechnicianStatus } from './enums/technician-status.enum';

@Injectable()
export class TechniciansService {
  constructor(
    @InjectRepository(Technician)
    private technicianRepository: Repository<Technician>,
  ) {}

  /**
   * API 1: Create a new technician
   */
  async create(createTechnicianDto: CreateTechnicianDto): Promise<Technician> {
    const { phoneNumber } = createTechnicianDto;

    // Check if technician with same phone number already exists
    const existingTechnician = await this.technicianRepository.findOne({
      where: { phoneNumber },
    });

    if (existingTechnician) {
      throw new HttpException('Số điện thoại đã tồn tại', HttpStatus.CONFLICT);
    }

    const technician = this.technicianRepository.create({
      ...createTechnicianDto,
      status: createTechnicianDto.status || TechnicianStatus.AVAILABLE,
    });

    const savedTechnician = await this.technicianRepository.save(technician);
    return savedTechnician;
  }

  /**
   * API 2: Get all technicians with filters (only active technicians)
   */
  async findAll(queryTechnicianDto: QueryTechnicianDto): Promise<Technician[]> {
    const { search, status } = queryTechnicianDto;

    const query = this.technicianRepository.createQueryBuilder('technician');

    // Only get active technicians
    query.where('technician.isActive = :isActive', { isActive: true });

    if (search) {
      query.andWhere('technician.fullName ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (status) {
      query.andWhere('technician.status = :status', { status });
    }

    query.orderBy('technician.id', 'DESC');

    const data = await query.getMany();
    return data;
  }

  /**
   * API 3: Get a technician by ID (only active)
   */
  async findOne(id: number): Promise<Technician> {
    const technician = await this.technicianRepository.findOne({
      where: { id, isActive: true },
    });

    if (!technician) {
      throw new HttpException(
        'Không tìm thấy kỹ thuật viên',
        HttpStatus.NOT_FOUND,
      );
    }

    return technician;
  }

  /**
   * API 4: Update a technician
   */
  async update(
    id: number,
    updateTechnicianDto: UpdateTechnicianDto,
  ): Promise<Technician> {
    const technician = await this.findOne(id);

    // If updating phone number, check for duplicates
    if (
      updateTechnicianDto.phoneNumber &&
      updateTechnicianDto.phoneNumber !== technician.phoneNumber
    ) {
      const existingTechnician = await this.technicianRepository.findOne({
        where: { phoneNumber: updateTechnicianDto.phoneNumber },
      });

      if (existingTechnician) {
        throw new HttpException(
          'Số điện thoại đã tồn tại',
          HttpStatus.CONFLICT,
        );
      }
    }

    const updatedTechnician = await this.technicianRepository.save({
      ...technician,
      ...updateTechnicianDto,
    });

    return updatedTechnician;
  }

  /**
   * API 5: Soft delete a technician
   */
  async remove(id: number): Promise<Technician> {
    const technician = await this.findOne(id);
    technician.isActive = false;
    const deletedTechnician = await this.technicianRepository.save(technician);
    return deletedTechnician;
  }

  /**
   * API 7: Soft delete multiple technicians
   */
  async removeMany(ids: number[]) {
    const technicians = await this.technicianRepository.find({
      where: { id: In(ids), isActive: true },
    });

    if (technicians.length === 0) {
      throw new HttpException(
        'Không tìm thấy kỹ thuật viên nào để xóa',
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete all technicians
    await this.technicianRepository.update(
      { id: In(ids) },
      { isActive: false },
    );

    return {
      message: `Xóa ${technicians.length} kỹ thuật viên thành công`,
      deletedCount: technicians.length,
    };
  }

  /**
   * Optional: Restore a deleted technician
   */
  async restore(id: number): Promise<Technician> {
    const technician = await this.technicianRepository.findOne({
      where: { id, isActive: false },
    });

    if (!technician) {
      throw new HttpException(
        'Không tìm thấy kỹ thuật viên đã xóa',
        HttpStatus.NOT_FOUND,
      );
    }

    technician.isActive = true;
    const restoredTechnician = await this.technicianRepository.save(technician);
    return restoredTechnician;
  }

  /**
   * API 6: Update technician status (e.g., AVAILABLE -> BUSY -> OFF_DUTY -> RESIGNED)
   */
  async updateStatus(
    id: number,
    status: TechnicianStatus,
  ): Promise<Technician> {
    const technician = await this.findOne(id);

    // Validation: cannot change from RESIGNED to another status
    if (
      technician.status === TechnicianStatus.RESIGNED &&
      status !== TechnicianStatus.RESIGNED
    ) {
      throw new HttpException(
        'Không thể thay đổi trạng thái của kỹ thuật viên đã từng bỏ việc',
        HttpStatus.BAD_REQUEST,
      );
    }

    technician.status = status;
    const updatedTechnician = await this.technicianRepository.save(technician);

    return updatedTechnician;
  }
}
