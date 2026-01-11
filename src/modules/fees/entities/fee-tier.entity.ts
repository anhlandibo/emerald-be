import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Fee } from './fee.entity';

@Entity('fee_tiers')
export class FeeTier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, name: 'fee_type_id' })
  feeTypeId: number;

  @ManyToOne(() => Fee, (fee) => fee.tiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fee_type_id' })
  fee: Fee;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    name: 'from_value',
  })
  fromValue: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'to_value',
  })
  toValue: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    name: 'unit_price',
  })
  unitPrice: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
