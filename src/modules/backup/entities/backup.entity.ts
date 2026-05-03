import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum BackupStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  INVALID = 'INVALID',
}

export enum BackupType {
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
}

@Entity('backups')
export class Backup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', default: BackupType.MANUAL })
  type: BackupType;

  @Column({ type: 'varchar', default: BackupStatus.PENDING })
  status: BackupStatus;

  @Column({ type: 'varchar', nullable: true, name: 'storage_path' })
  storagePath: string; // path trong Supabase Storage

  @Column({ type: 'varchar', nullable: true, name: 'download_url' })
  downloadUrl: string; // signed URL

  @Column({ type: 'varchar', nullable: true })
  checksum: string; // SHA-256

  @Column({ type: 'bigint', nullable: true, name: 'size_bytes' })
  sizeBytes: number;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'varchar', nullable: true, name: 'initiated_by' })
  initiatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
