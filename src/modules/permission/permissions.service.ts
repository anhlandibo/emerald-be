import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RolePermission,
  SystemModule,
} from './entities/role-permission.entity';
import { UserRole } from '../accounts/enums/user-role.enum';
import {
  UpdatePermissionEntryDto,
  BulkUpdatePermissionsDto,
} from './dto/update-permission.dto';

// Default matrix theo BRD Security Matrix (UC38)
const BRD_DEFAULT_MATRIX: UpdatePermissionEntryDto[] = [
  // SYS_ADMIN — full access on system module, read-only on others
  {
    role: UserRole.ADMIN,
    module: SystemModule.SYSTEM_ADMIN,
    canView: true,
    canCreate: true,
    canEdit: true,
    canApprove: true,
    canExport: true,
    canDelete: true,
  },
  {
    role: UserRole.ADMIN,
    module: SystemModule.RESIDENT_APARTMENT,
    canView: true,
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.ADMIN,
    module: SystemModule.INVOICE_DEBT,
    canView: true,
    canCreate: false,
    canEdit: false,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.ADMIN,
    module: SystemModule.AMENITY_BOOKING,
    canView: true,
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.ADMIN,
    module: SystemModule.REPORTING,
    canView: true,
    canCreate: false,
    canEdit: false,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },

  // OPERATIONS — operational day-to-day modules
  {
    role: UserRole.OPERATIONS,
    module: SystemModule.RESIDENT_APARTMENT,
    canView: true,
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.OPERATIONS,
    module: SystemModule.INVOICE_DEBT,
    canView: true,
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canExport: true,
    canDelete: false,
  },
  {
    role: UserRole.OPERATIONS,
    module: SystemModule.ASSET_EQUIPMENT,
    canView: true,
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.OPERATIONS,
    module: SystemModule.MAINTENANCE,
    canView: true,
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canExport: true,
    canDelete: false,
  },
  {
    role: UserRole.OPERATIONS,
    module: SystemModule.FEEDBACK,
    canView: true,
    canCreate: false,
    canEdit: true,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.OPERATIONS,
    module: SystemModule.AMENITY_BOOKING,
    canView: true,
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.OPERATIONS,
    module: SystemModule.NOTIFICATIONS_VOTING,
    canView: true,
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.OPERATIONS,
    module: SystemModule.REPORTING,
    canView: true,
    canCreate: true,
    canEdit: false,
    canApprove: false,
    canExport: true,
    canDelete: false,
  },

  // MANAGEMENT_BOARD — oversight + approve
  {
    role: UserRole.MANAGEMENT_BOARD,
    module: SystemModule.INVOICE_DEBT,
    canView: true,
    canCreate: false,
    canEdit: false,
    canApprove: true,
    canExport: true,
    canDelete: false,
  },
  {
    role: UserRole.MANAGEMENT_BOARD,
    module: SystemModule.MAINTENANCE,
    canView: true,
    canCreate: false,
    canEdit: false,
    canApprove: true,
    canExport: true,
    canDelete: false,
  },
  {
    role: UserRole.MANAGEMENT_BOARD,
    module: SystemModule.NOTIFICATIONS_VOTING,
    canView: true,
    canCreate: true,
    canEdit: true,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.MANAGEMENT_BOARD,
    module: SystemModule.REPORTING,
    canView: true,
    canCreate: true,
    canEdit: false,
    canApprove: false,
    canExport: true,
    canDelete: false,
  },

  // RESIDENT — self-service
  {
    role: UserRole.RESIDENT,
    module: SystemModule.RESIDENT_APARTMENT,
    canView: true,
    canCreate: false,
    canEdit: true,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.RESIDENT,
    module: SystemModule.INVOICE_DEBT,
    canView: true,
    canCreate: false,
    canEdit: false,
    canApprove: true,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.RESIDENT,
    module: SystemModule.FEEDBACK,
    canView: true,
    canCreate: true,
    canEdit: false,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.RESIDENT,
    module: SystemModule.AMENITY_BOOKING,
    canView: true,
    canCreate: true,
    canEdit: false,
    canApprove: false,
    canExport: false,
    canDelete: false,
  },
  {
    role: UserRole.RESIDENT,
    module: SystemModule.NOTIFICATIONS_VOTING,
    canView: true,
    canCreate: false,
    canEdit: false,
    canApprove: true,
    canExport: false,
    canDelete: false,
  },
];

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly permRepo: Repository<RolePermission>,
  ) {}

  /** Toàn bộ matrix dưới dạng: { [role]: { [module]: { canView, ... } } } */
  async getMatrix(): Promise<Record<string, Record<string, object>>> {
    const rows = await this.permRepo.find({
      order: { role: 'ASC', module: 'ASC' },
    });

    const matrix: Record<string, Record<string, object>> = {};
    for (const row of rows) {
      matrix[row.role] ??= {};
      matrix[row.role][row.module] = {
        canView: row.canView,
        canCreate: row.canCreate,
        canEdit: row.canEdit,
        canApprove: row.canApprove,
        canExport: row.canExport,
        canDelete: row.canDelete,
      };
    }
    return matrix;
  }

  /** Upsert 1 entry role + module */
  async updateOne(dto: UpdatePermissionEntryDto): Promise<RolePermission> {
    let row = await this.permRepo.findOne({
      where: { role: dto.role, module: dto.module },
    });

    if (!row) {
      row = this.permRepo.create({ role: dto.role, module: dto.module });
    }

    // Chỉ ghi đè field nào được gửi lên
    if (dto.canView !== undefined) row.canView = dto.canView;
    if (dto.canCreate !== undefined) row.canCreate = dto.canCreate;
    if (dto.canEdit !== undefined) row.canEdit = dto.canEdit;
    if (dto.canApprove !== undefined) row.canApprove = dto.canApprove;
    if (dto.canExport !== undefined) row.canExport = dto.canExport;
    if (dto.canDelete !== undefined) row.canDelete = dto.canDelete;

    return this.permRepo.save(row);
  }

  /** Bulk upsert nhiều entries cùng lúc */
  async bulkUpdate(
    dto: BulkUpdatePermissionsDto,
  ): Promise<{ updated: number }> {
    const results = await Promise.all(
      dto.permissions.map((entry) => this.updateOne(entry)),
    );
    return { updated: results.length };
  }

  /** Seed matrix mặc định từ BRD. Safe to run nhiều lần (upsert). */
  async seedDefaultMatrix(): Promise<{ seeded: number }> {
    const results = await Promise.all(
      BRD_DEFAULT_MATRIX.map((entry) => this.updateOne(entry)),
    );
    return { seeded: results.length };
  }
}
