import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentMethod } from '../enums/payment-method.enum';
import { Booking } from './booking.entity';

@Entity('booking_payments')
export class BookingPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'booking_id' })
  bookingId: number;

  @Column({ type: 'int' })
  amount: number;

  @Column({
    type: 'varchar',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'paid_at' })
  paidAt: Date;

  @ManyToOne(() => Booking, (booking) => booking.payments)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
}
