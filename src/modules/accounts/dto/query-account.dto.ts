import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';
import { Transform } from 'class-transformer';
import { QueryDto } from 'src/dtos/query.dto';

export class QueryAccountDto extends QueryDto {
  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: UserRole,
    example: UserRole.RESIDENT,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === undefined || value === null) return undefined;
    return Boolean(value);
  })
  isActive?: boolean;
}
