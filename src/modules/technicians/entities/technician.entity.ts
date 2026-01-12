import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { TechnicianStatus } from '../enums/technician-status.enum';

@Entity('technicians')
export class Technician {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', nullable: false, name: 'phone_number' })
  phoneNumber: string;

  @Column({
    type: 'varchar',
    default: TechnicianStatus.AVAILABLE,
    name: 'status',
  })
  status: TechnicianStatus;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
