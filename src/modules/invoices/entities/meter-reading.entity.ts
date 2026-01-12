import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Apartment } from '../../apartments/entities/apartment.entity';
import { Fee } from '../../fees/entities/fee.entity';

@Entity('meter_readings')
export class MeterReading {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, name: 'apartment_id' })
  apartmentId: number;

  @ManyToOne(() => Apartment)
  @JoinColumn({ name: 'apartment_id' })
  apartment: Apartment;

  @Column({ type: 'int', nullable: false, name: 'fee_type_id' })
  feeTypeId: number;

  @ManyToOne(() => Fee)
  @JoinColumn({ name: 'fee_type_id' })
  feeType: Fee;

  @Column({ type: 'date', nullable: false, name: 'reading_date' })
  readingDate: Date;

  @Column({ type: 'date', nullable: false, name: 'billing_month' })
  billingMonth: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    name: 'old_index',
  })
  oldIndex: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    name: 'new_index',
  })
  newIndex: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    name: 'usage_amount',
  })
  usageAmount: number;

  @Column({ type: 'varchar', nullable: true, name: 'image_proof_url' })
  imageProofUrl: string;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
