import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { QueryAccountDto } from './dto/query-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';
import { DeleteManyAccountsDto } from './dto/delete-many-accounts.dto';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { plainToInstance } from 'class-transformer';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from './enums/user-role.enum';
import { RolesGuard } from 'src/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Accounts')
@Controller('accounts')
@UseInterceptors(ClassSerializerInterceptor, TransformInterceptor)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Account created successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(@Body() createAccountDto: CreateAccountDto) {
    const account = await this.accountsService.create(createAccountDto);
    return plainToInstance(AccountResponseDto, account);
  }

  @Get()
  // @Roles(UserRole.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all accounts with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of accounts retrieved successfully',
  })
  async findAll(@Query() queryAccountDto: QueryAccountDto) {
    const result = await this.accountsService.findAll(queryAccountDto);
    return plainToInstance(AccountResponseDto, result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an account by ID' })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account retrieved successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const account = await this.accountsService.findOne(id);
    return plainToInstance(AccountResponseDto, account);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an account by ID' })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account updated successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const account = await this.accountsService.update(id, updateAccountDto);
    return plainToInstance(AccountResponseDto, account);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete an account by ID' })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account deleted successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const account = await this.accountsService.remove(id);
    return plainToInstance(AccountResponseDto, account);
  }

  @Post('delete-many')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete multiple accounts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Accounts deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No accounts found with provided IDs',
  })
  removeMany(@Body() deleteManyDto: DeleteManyAccountsDto) {
    return this.accountsService.removeMany(deleteManyDto.ids);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a deleted account by ID' })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account restored successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deleted account not found',
  })
  async restore(@Param('id', ParseIntPipe) id: number) {
    const account = await this.accountsService.restore(id);
    return plainToInstance(AccountResponseDto, account);
  }
}
