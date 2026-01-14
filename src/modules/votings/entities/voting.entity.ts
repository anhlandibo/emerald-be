import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ScopeType } from '../../notifications/enums/scope-type.enum';
import { Option } from './option.entity';

@Entity('votings')
export class Voting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({
    type: 'varchar',
    nullable: false,
    default: ScopeType.ALL,
    name: 'target_scope',
  })
  targetScope: ScopeType;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    name: 'is_required',
  })
  isRequired: boolean;

  @Column({ type: 'timestamp', nullable: false, name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: false, name: 'end_time' })
  endTime: Date;

  @Column({ type: 'json', nullable: true, name: 'file_urls' })
  fileUrls: string[] | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => Option, (option) => option.voting, { cascade: true })
  options: Option[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
