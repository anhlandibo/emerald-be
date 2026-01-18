import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SystemNotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
}

export enum SystemNotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('system_notifications')
@Index(['type', 'createdAt'])
@Index(['isSent', 'scheduledFor'])
export class SystemNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({
    type: 'enum',
    enum: SystemNotificationType,
    nullable: false,
    default: SystemNotificationType.INFO,
  })
  @Index()
  type: SystemNotificationType;

  @Column({
    type: 'enum',
    enum: SystemNotificationPriority,
    nullable: false,
    default: SystemNotificationPriority.NORMAL,
  })
  priority: SystemNotificationPriority;

  @Column({ type: 'simple-array', nullable: true, name: 'target_user_ids' })
  targetUserIds: number[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false, name: 'is_sent' })
  @Index()
  isSent: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'scheduled_for' })
  scheduledFor: Date;

  @Column({ type: 'int', nullable: false, name: 'created_by' })
  createdBy: number;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'action_url' })
  actionUrl: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'action_text' })
  actionText: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_persistent' })
  isPersistent: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
