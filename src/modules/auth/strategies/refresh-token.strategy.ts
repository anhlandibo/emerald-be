import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountsService } from '../../accounts/accounts.service';

export interface RefreshTokenPayload {
  sub: number;
  email: string;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private accountsService: AccountsService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: RefreshTokenPayload): Promise<{ id: number; email: string }> {
    const user = await this.accountsService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account not found or is inactive');
    }
    return { 
      id: payload.sub, 
      email: payload.email,
    };
  }
}
