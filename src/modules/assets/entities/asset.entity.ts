import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AssetStatus } from '../enums/asset-status.enum';
import { AssetType } from '../../asset-types/entities/asset-type.entity';
import { Block } from '../../blocks/entities/block.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'int', nullable: false, name: 'type_id' })
  typeId: number;

  @ManyToOne(() => AssetType)
  @JoinColumn({ name: 'type_id' })
  type: AssetType;

  @Column({ type: 'int', nullable: false, name: 'block_id' })
  blockId: number;

  @ManyToOne(() => Block)
  @JoinColumn({ name: 'block_id' })
  block: Block;

  @Column({ type: 'int', nullable: false })
  floor: number;

  @Column({ type: 'varchar', nullable: true, name: 'location_detail' })
  locationDetail?: string;

  @Column({
    type: 'varchar',
    default: AssetStatus.ACTIVE,
    nullable: false,
  })
  status: AssetStatus;

  @Column({ type: 'date', nullable: true, name: 'installation_date' })
  installationDate?: Date;

  @Column({ type: 'int', nullable: true, name: 'warranty_years' })
  warrantyYears?: number;

  @Column({ type: 'date', nullable: true, name: 'warranty_expiration_date' })
  warrantyExpirationDate?: Date;

  @Column({ type: 'int', nullable: true, name: 'maintenance_interval_months' })
  maintenanceIntervalMonths?: number;

  @Column({ type: 'date', nullable: true, name: 'last_maintenance_date' })
  lastMaintenanceDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'next_maintenance_date' })
  nextMaintenanceDate?: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
