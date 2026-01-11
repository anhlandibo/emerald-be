import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ServiceType } from '../enums/service-type.enum';
import { SlotAvailability } from './slot-availability.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'time', name: 'open_hour' })
  openHour: string;

  @Column({ type: 'time', name: 'close_hour' })
  closeHour: string;

  @Column({ type: 'varchar', name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'int', name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'int', name: 'unit_time_block' })
  unitTimeBlock: number;

  @Column({ type: 'int', name: 'total_slot' })
  totalSlot: number;

  @Column({
    type: 'varchar',
    enum: ServiceType,
    default: ServiceType.NORMAL,
  })
  type: ServiceType;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SlotAvailability, (slot) => slot.service)
  slots: SlotAvailability[];
}
