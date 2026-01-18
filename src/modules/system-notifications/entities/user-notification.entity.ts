import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SystemNotification } from './system-notification.entity';

@Entity('system_user_notifications')
@Index(['userId', 'isRead'])
@Index(['userId', 'createdAt'])
export class SystemUserNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, name: 'user_id' })
  @Index()
  userId: number;

  @Column({ type: 'int', nullable: false, name: 'notification_id' })
  notificationId: number;

  @ManyToOne(() => SystemNotification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: SystemNotification;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  @Index()
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
