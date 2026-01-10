import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccountsService } from '../accounts/accounts.service';
import { RegisterDto } from './dto/register.dto';
import { Account } from '../accounts/entities/account.entity';
import { UserRole } from '../accounts/enums/user-role.enum';
import { AuthTokensDto } from './dto/auth-tokens.dto';

@Injectable()
export class AuthService {
  constructor(
    private accountsService: AccountsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.accountsService.findByEmail(email);
    if (!user) return null;

    if (!user.isActive)
      throw new HttpException('Account is inactive', HttpStatus.UNAUTHORIZED);

    const isPasswordValid = user.validatePassword(password);
    if (!isPasswordValid) return null;

    const { password: _, ...result } = user;
    return result;
  }

  generateTokens(user: Account): AuthTokensDto {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const refreshPayload = {
      email: user.email,
      sub: user.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_EXPIRATION') ||
        '15m') as any,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') ||
        '7d') as any,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  login(user: Account) {
    const tokens = this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.accountsService.findByEmail(
      registerDto.email,
    );
    if (existingUser)
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);

    // Force role to RESIDENT for registration
    const newUser = await this.accountsService.create({
      ...registerDto,
      role: UserRole.RESIDENT,
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return {
      ...userWithoutPassword,
    };
  }

  async refreshTokens(userId: number, email: string) {
    const user = await this.accountsService.findOne(userId);

    if (!user || !user.isActive)
      throw new HttpException(
        'Account not found or is inactive',
        HttpStatus.UNAUTHORIZED,
      );

    if (user.email !== email)
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);

    return this.generateTokens(user);
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.accountsService.findOne(userId);

    const isOldPasswordValid = user.validatePassword(oldPassword);
    if (!isOldPasswordValid)
      throw new HttpException(
        'Old password is incorrect',
        HttpStatus.BAD_REQUEST,
      );

    if (oldPassword === newPassword)
      throw new HttpException(
        'Password cannot be the same as the old password',
        HttpStatus.BAD_REQUEST,
      );

    await this.accountsService.update(userId, { password: newPassword });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: number) {
    const user = await this.accountsService.findOne(userId);
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
