/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/modules/accounts/enums/user-role.enum';
import { ROLES_KEY } from 'src/decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  // dung de lay metadata tu decorator
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    // lay user duoc gan tu auth.guard truoc do
    if (!user || !requiredRoles.includes(user.role as UserRole))
      throw new HttpException('You do not have permission to access this resource', HttpStatus.FORBIDDEN);
    return true;
  }
}
