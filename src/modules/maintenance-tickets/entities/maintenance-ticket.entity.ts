import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TicketType } from '../enums/ticket-type.enum';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { MaintenanceResult } from '../enums/maintenance-result.enum';
import { Block } from '../../blocks/entities/block.entity';
import { Asset } from '../../assets/entities/asset.entity';
import { Technician } from '../../technicians/entities/technician.entity';

@Entity('maintenance_tickets')
export class MaintenanceTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  type: TicketType;

  @Column({
    type: 'varchar',
    nullable: false,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Vị trí/Đối tượng
  @Column({ type: 'int', nullable: false, name: 'block_id' })
  blockId: number;

  @ManyToOne(() => Block)
  @JoinColumn({ name: 'block_id' })
  block: Block;

  @Column({ type: 'int', nullable: false })
  floor: number;

  @Column({ type: 'int', nullable: true, name: 'asset_id' })
  assetId?: number;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset?: Asset;

  // Con người
  @Column({ type: 'int', nullable: true, name: 'technician_id' })
  technicianId?: number;

  @ManyToOne(() => Technician)
  @JoinColumn({ name: 'technician_id' })
  technician?: Technician;

  // Tiến độ
  @Column({
    type: 'varchar',
    nullable: false,
    default: TicketStatus.PENDING,
  })
  status: TicketStatus;

  @Column({ type: 'jsonb', nullable: true, name: 'checklist_items' })
  checklistItems?: Array<{ task: string; isChecked: boolean }>;

  @Column({ type: 'timestamp', nullable: true, name: 'assigned_date' })
  assignedDate?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'started_date' })
  startedDate?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_date' })
  completedDate?: Date;

  // Kết quả & Nghiệm thu
  @Column({ type: 'varchar', nullable: true })
  result?: MaintenanceResult;

  @Column({ type: 'text', nullable: true, name: 'result_note' })
  resultNote?: string;

  @Column({ type: 'boolean', default: false, name: 'has_issue' })
  hasIssue: boolean;

  @Column({ type: 'text', nullable: true, name: 'issue_detail' })
  issueDetail?: string;

  // Chi phí
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    name: 'estimated_cost',
  })
  estimatedCost?: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    name: 'actual_cost',
  })
  actualCost?: number;

  // Chứng minh cho incident
  @Column({ type: 'varchar', nullable: true, name: 'evidence_image' })
  evidenceImage?: string;

  @Column({ type: 'varchar', nullable: true, name: 'evidence_video' })
  evidenceVideo?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;
}
