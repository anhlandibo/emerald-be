import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { hashSync, compareSync } from 'bcrypt';
import { Exclude } from 'class-transformer';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  @Exclude()
  password: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      // Only hash if not already hashed
      this.password = hashSync(this.password, 10);
    }
  }

  validatePassword(password: string): boolean {
    return compareSync(password, this.password);
  }
}
