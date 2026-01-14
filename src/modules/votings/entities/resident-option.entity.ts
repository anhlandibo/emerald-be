import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Resident } from '../../residents/entities/resident.entity';
import { Option } from './option.entity';

@Entity('resident_options')
export class ResidentOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, name: 'resident_id' })
  residentId: number;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'resident_id' })
  resident: Resident;

  @Column({ type: 'int', nullable: false, name: 'option_id' })
  optionId: number;

  @ManyToOne(() => Option, (option) => option.residentOptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_id' })
  option: Option;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
