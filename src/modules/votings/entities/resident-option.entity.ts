import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Resident } from '../../residents/entities/resident.entity';
import { Option } from './option.entity';
import { Voting } from './voting.entity';

@Entity('resident_options')
@Unique('uk_resident_voting', ['residentId', 'votingId'])
@Index('idx_voting_id', ['votingId'])
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

  @Column({ type: 'int', nullable: false, name: 'voting_id' })
  votingId: number;

  @ManyToOne(() => Voting, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'voting_id' })
  voting: Voting;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
