import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from './service.entity';

@Entity('slot_availabilities')
export class SlotAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'service_id' })
  serviceId: number;

  @Column({ type: 'timestamp', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp', name: 'end_time' })
  endTime: Date;

  @Column({ type: 'int', name: 'remaining_slot' })
  remainingSlot: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Service, (service) => service.slots)
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
