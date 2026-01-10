import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Gender } from '../enums/gender.enum';
import { Account } from '../../accounts/entities/account.entity';

@Entity('residents')
export class Resident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true, name: 'account_id' })
  accountId: number;

  @OneToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'varchar', nullable: false, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', unique: true, nullable: false, name: 'citizen_id' })
  citizenId: string;

  @Column({ type: 'varchar', nullable: true, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'date', nullable: false })
  dob: Date;

  @Column({ type: 'varchar', nullable: false })
  gender: Gender;

  @Column({ type: 'varchar', nullable: false, name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'varchar', nullable: false })
  nationality: string;

  @Column({ type: 'jsonb', nullable: false })
  hometown: {
    province: string;
    district: string;
    ward: string;
  };

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
