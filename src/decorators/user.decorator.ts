import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../modules/accounts/enums/user-role.enum';
import { Request } from 'express';

export interface ActiveUser {
  id: number;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (data: keyof ActiveUser | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: ActiveUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
