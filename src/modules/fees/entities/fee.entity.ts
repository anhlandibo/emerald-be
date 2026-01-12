import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { FeeType } from '../enums/fee-type.enum';
import { FeeTier } from './fee-tier.entity';

@Entity('fees')
export class Fee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  unit: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  type: FeeType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => FeeTier, (feeTier) => feeTier.fee, { cascade: true })
  tiers: FeeTier[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
