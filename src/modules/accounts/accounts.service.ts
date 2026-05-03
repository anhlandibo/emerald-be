import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, In } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { QueryAccountDto } from './dto/query-account.dto';
import { ToggleActiveDto } from './dto/toggle-active.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(createAccountDto: CreateAccountDto) {
    const count = await this.accountRepository.count({
      where: { email: createAccountDto.email },
    });

    if (count > 0)
      throw new HttpException('Email đã tồn tại', HttpStatus.CONFLICT);

    const account = this.accountRepository.create(createAccountDto);
    return this.accountRepository.save(account);
  }

  async findAll(query: QueryAccountDto) {
    const { search, role, isActive } = query;

    const where: FindOptionsWhere<Account> = {
      ...(search && { email: ILike(`%${search}%`) }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
    };

    const data = await this.accountRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return data;
  }

  async findOne(id: number) {
    const account = await this.accountRepository.findOne({
      where: { id, isActive: true },
    });
    if (!account) {
      throw new HttpException(
        `Tài khoản với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }
    return account;
  }

  async findByEmail(email: string) {
    return this.accountRepository.findOne({ where: { email } });
  }

  async update(id: number, updateAccountDto: UpdateAccountDto) {
    const account = await this.findOne(id);

    // Chỉ check DB nếu email thay đổi
    if (updateAccountDto.email && updateAccountDto.email !== account.email) {
      const existingEmail = await this.findByEmail(updateAccountDto.email);
      if (existingEmail) {
        throw new HttpException('Email đã tồn tại', HttpStatus.CONFLICT);
      }
    }

    Object.assign(account, updateAccountDto);
    return this.accountRepository.save(account);
  }

  async remove(id: number) {
    const account = await this.findOne(id);
    account.isActive = false;
    return this.accountRepository.save(account);
  }

  async removeMany(ids: number[]) {
    const accounts = await this.accountRepository.find({
      where: { id: In(ids), isActive: true },
    });

    if (accounts.length === 0) {
      throw new HttpException(
        'Không tìm thấy tài khoản nào với các ID đã cung cấp',
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete all accounts
    await this.accountRepository.update({ id: In(ids) }, { isActive: false });

    return {
      message: `Đã xóa thành công ${accounts.length} tài khoản`,
      deletedCount: accounts.length,
    };
  }

  async restore(id: number) {
    const account = await this.accountRepository.findOne({
      where: { id, isActive: false },
    });
    if (!account) {
      throw new HttpException(
        `Tài khoản với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }
    account.isActive = true;
    return this.accountRepository.save(account);
  }

  //ADD
  async toggleActive(id: number, isActive: boolean): Promise<Account> {
    // Dùng findOne không filter isActive để tìm được cả inactive accounts
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new HttpException(
        `Tài khoản với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Ngăn ADMIN tự deactivate chính mình (cần truyền currentUserId từ controller)
    account.isActive = isActive;
    return this.accountRepository.save(account);

    // ℹ️ JWT invalidation là tự động:
    // JwtStrategy.validate() kiểm tra isActive=true mỗi request
    // → account bị deactivate sẽ nhận 401 ngay lập tức ở request tiếp theo
  }

  async assignRole(id: number, role: UserRole): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new HttpException(
        `Tài khoản với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }
    account.role = role;
    return this.accountRepository.save(account);
  }
}
