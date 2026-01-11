import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

@Injectable()
export class AuthGuard extends JwtAuthGuard {}
