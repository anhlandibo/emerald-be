import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BlockStatus } from '../enums/block-status.enum';

@Entity('blocks')
export class Block {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'manager_name' })
  managerName: string;

  @Column({ type: 'varchar', nullable: true, name: 'manager_phone' })
  managerPhone: string;

  @Column({ type: 'int', nullable: true, name: 'total_floors' })
  totalFloors: number;

  @Column({
    type: 'varchar',
    default: BlockStatus.OPERATING,
    nullable: false,
  })
  status: BlockStatus;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
