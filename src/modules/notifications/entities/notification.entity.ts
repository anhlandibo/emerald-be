import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { NotiType } from '../enums/noti-type.enum';
import { ScopeType } from '../enums/scope-type.enum';
import { TargetBlock } from './target-block.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({
    type: 'varchar',
    nullable: false,
    default: NotiType.GENERAL,
  })
  type: NotiType;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    name: 'is_urgent',
  })
  isUrgent: boolean;

  @Column({ type: 'simple-array', nullable: true, name: 'file_urls' })
  fileUrls: string[];

  @Column({
    type: 'varchar',
    nullable: false,
    default: ScopeType.ALL,
    name: 'target_scope',
  })
  targetScope: ScopeType;

  @Column({ type: 'simple-array', nullable: false })
  channels: string[];

  @OneToMany(() => TargetBlock, (targetBlock) => targetBlock.notification, {
    cascade: true,
  })
  targetBlocks: TargetBlock[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
