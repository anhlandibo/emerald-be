import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BookingStatus } from '../enums/booking-status.enum';
import { Service } from '../../services/entities/service.entity';
import { Resident } from '../../residents/entities/resident.entity';
import { BookingPayment } from './booking-payment.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'int', name: 'resident_id' })
  residentId: number;

  @Column({ type: 'int', name: 'service_id' })
  serviceId: number;

  @Column({ type: 'date', name: 'booking_date' })
  bookingDate: Date;

  @Column({ type: 'jsonb', name: 'timestamps', nullable: false })
  timestamps: { startTime: string; endTime: string }[]; // Array of {startTime: 'HH:mm', endTime: 'HH:mm'}

  @Column({ type: 'int', name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'int', name: 'total_price' })
  totalPrice: number;

  @Column({
    type: 'varchar',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    type: 'timestamp',
    name: 'expires_at',
    nullable: true,
  })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Resident, { eager: false })
  @JoinColumn({ name: 'resident_id' })
  resident: Resident;

  @ManyToOne(() => Service, { eager: false })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @OneToMany(() => BookingPayment, (payment) => payment.booking)
  payments: BookingPayment[];
}
