import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IssueType } from '../enums/issue-type.enum';
import { IssueStatus } from '../enums/issue-status.enum';
import { Resident } from '../../residents/entities/resident.entity';
import { Block } from '../../blocks/entities/block.entity';

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'reporter_id' })
  reporterId: number;

  @Column({
    type: 'varchar',
    enum: IssueType,
  })
  type: IssueType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', name: 'block_id', nullable: true })
  blockId: number;

  @Column({ type: 'int', nullable: true })
  floor: number;

  @Column({ type: 'varchar', name: 'detail_location', nullable: true })
  detailLocation: string;

  @Column({ type: 'varchar', array: true, name: 'file_urls', default: [] })
  fileUrls: string[];

  @Column({
    type: 'varchar',
    enum: IssueStatus,
    default: IssueStatus.PENDING,
  })
  status: IssueStatus;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ type: 'boolean', name: 'is_urgent', default: false })
  isUrgent: boolean;

  @Column({
    type: 'timestamp',
    name: 'estimated_completion_date',
    nullable: true,
  })
  estimatedCompletionDate: Date;

  @Column({
    type: 'int',
    name: 'maintenance_ticket_id',
    nullable: true,
  })
  maintenanceTicketId: number;

  @Column({
    type: 'boolean',
    name: 'assigned_to_technician_department',
    default: false,
  })
  assignedToTechnicianDepartment: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Resident, { eager: true })
  @JoinColumn({ name: 'reporter_id' })
  reporter: Resident;

  @ManyToOne(() => Block, { eager: false })
  @JoinColumn({ name: 'block_id' })
  block: Block;
}
