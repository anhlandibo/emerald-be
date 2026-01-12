import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Notification } from './notification.entity';
import { Block } from '../../blocks/entities/block.entity';

@Entity('target_blocks')
export class TargetBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true, name: 'notification_id' })
  notificationId: number;

  @ManyToOne(() => Notification, (notification) => notification.targetBlocks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column({ type: 'int', nullable: true, name: 'voting_id' })
  votingId: number;

  @Column({ type: 'int', nullable: false, name: 'block_id' })
  blockId: number;

  @ManyToOne(() => Block)
  @JoinColumn({ name: 'block_id' })
  block: Block;

  @Column({
    type: 'simple-array',
    nullable: true,
    name: 'target_floor_numbers',
  })
  targetFloorNumbers: number[];
}
