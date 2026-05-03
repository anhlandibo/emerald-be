import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class AssignRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.OPERATIONS })
  @IsEnum(UserRole)
  role: UserRole;
}
