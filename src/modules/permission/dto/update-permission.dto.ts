import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../accounts/enums/user-role.enum';
import { SystemModule } from '../entities/role-permission.entity';

export class UpdatePermissionEntryDto {
  @ApiProperty({ enum: UserRole, example: UserRole.OPERATIONS })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ enum: SystemModule, example: SystemModule.INVOICE_DEBT })
  @IsEnum(SystemModule)
  module: SystemModule;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  canView?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  canCreate?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  canApprove?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  canExport?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  canDelete?: boolean;
}

export class BulkUpdatePermissionsDto {
  @ApiProperty({ type: [UpdatePermissionEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePermissionEntryDto)
  permissions: UpdatePermissionEntryDto[];
}
