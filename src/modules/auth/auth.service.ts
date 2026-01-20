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

  /**
   * Generate only access token
   * @param user - User account
   * @returns Access token string
   */
  private generateAccessToken(user: Account): string {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_EXPIRATION') ||
        '15m') as any,
    });
  }

  /**
   * Generate only refresh token
   * @param user - User account
   * @returns Refresh token string
   */
  private generateRefreshToken(user: Account): string {
    const payload = {
      email: user.email,
      sub: user.id,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') ||
        '7d') as any,
    });
  }

  /**
   * Generate both access and refresh tokens (internal use)
   * @param user - User account
   * @returns AuthTokensDto with both tokens
   */
  generateTokens(user: Account): AuthTokensDto {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * [LOGIN] Generate tokens and return user profile + access token only
   * Refresh token will be set in cookie by controller
   * @param user - User account
   * @returns User profile with access token (refresh token excluded)
   */
  login(user: Account) {
    const accessToken = this.generateAccessToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      accessToken,
    };
  }

  /**
   * [REFRESH] Generate new tokens and return access token only
   * Refresh token will be set in cookie by controller
   * @param userId - User ID
   * @param email - User email
   * @returns AuthTokensDto with both tokens (for internal use)
   * Controller will only return accessToken in response
   */
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
