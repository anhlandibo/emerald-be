import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { UserRole } from '../../accounts/enums/user-role.enum';

// Các module theo BRD Security Matrix (UC38)
export enum SystemModule {
  RESIDENT_APARTMENT = 'RESIDENT_APARTMENT',
  INVOICE_DEBT = 'INVOICE_DEBT',
  ASSET_EQUIPMENT = 'ASSET_EQUIPMENT',
  MAINTENANCE = 'MAINTENANCE',
  FEEDBACK = 'FEEDBACK',
  AMENITY_BOOKING = 'AMENITY_BOOKING',
  NOTIFICATIONS_VOTING = 'NOTIFICATIONS_VOTING',
  REPORTING = 'REPORTING',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

@Entity('role_permissions')
@Unique(['role', 'module']) // 1 row duy nhất cho mỗi cặp role + module
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  role: UserRole;

  @Column({ type: 'varchar' })
  module: SystemModule;

  @Column({ type: 'boolean', default: false, name: 'can_view' })
  canView: boolean;

  @Column({ type: 'boolean', default: false, name: 'can_create' })
  canCreate: boolean;

  @Column({ type: 'boolean', default: false, name: 'can_edit' })
  canEdit: boolean;

  @Column({ type: 'boolean', default: false, name: 'can_approve' })
  canApprove: boolean;

  @Column({ type: 'boolean', default: false, name: 'can_export' })
  canExport: boolean;

  @Column({ type: 'boolean', default: false, name: 'can_delete' })
  canDelete: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
