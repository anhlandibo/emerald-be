import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
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

    if (count > 0) throw new ConflictException('Email already exists');

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
      throw new NotFoundException(`Account with ID ${id} not found`);
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
        throw new ConflictException('Email already exists');
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

  async restore(id: number) {
    const account = await this.accountRepository.findOne({
      where: { id, isActive: false },
    });
    if (!account) {
      throw new NotFoundException(`Deleted account with ID ${id} not found`);
    }
    account.isActive = true;
    return this.accountRepository.save(account);
  }
}
