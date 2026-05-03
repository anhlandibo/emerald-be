import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Backup } from './backup.entity';

export enum RestoreStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('restore_jobs')
export class RestoreJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'backup_id' })
  backupId: number;

  @ManyToOne(() => Backup)
  @JoinColumn({ name: 'backup_id' })
  backup: Backup;

  @Column({ type: 'varchar', default: RestoreStatus.PENDING })
  status: RestoreStatus;

  @Column({ type: 'varchar', name: 'initiated_by' })
  initiatedBy: string;

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
