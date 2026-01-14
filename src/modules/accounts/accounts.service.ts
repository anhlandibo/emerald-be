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
}
