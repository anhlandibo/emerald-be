import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Voting } from './voting.entity';
import { ResidentOption } from './resident-option.entity';

@Entity('options')
export class Option {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, name: 'voting_id' })
  votingId: number;

  @ManyToOne(() => Voting, (voting) => voting.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voting_id' })
  voting: Voting;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => ResidentOption, (residentOption) => residentOption.option)
  residentOptions: ResidentOption[];
}
