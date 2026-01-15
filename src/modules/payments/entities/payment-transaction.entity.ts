import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentTargetType } from '../enums/payment-target-type.enum';
import { PaymentGateway } from '../enums/payment-gateway.enum';
import { Account } from '../../accounts/entities/account.entity';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    unique: true,
    nullable: false,
    name: 'txn_ref',
  })
  txnRef: string;

  @Column({
    type: 'varchar',
    nullable: false,
    name: 'target_type',
  })
  targetType: PaymentTargetType;

  @Column({ type: 'int', nullable: false, name: 'target_id' })
  targetId: number;

  @Column({ type: 'int', nullable: false, name: 'account_id' })
  accountId: number;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  amount: number;

  @Column({
    type: 'varchar',
    nullable: false,
    default: 'VND',
  })
  currency: string;

  @Column({
    type: 'varchar',
    nullable: false,
    name: 'payment_method',
  })
  paymentMethod: PaymentGateway;

  @Column({
    type: 'varchar',
    nullable: false,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'gateway_txn_id',
  })
  gatewayTxnId: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'gateway_response_code',
  })
  gatewayResponseCode: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'raw_log',
  })
  rawLog: Record<string, any> | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'payment_url',
  })
  paymentUrl: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'expires_at',
  })
  expiresAt: Date | null;

  @Column({
    type: 'int',
    nullable: false,
    default: 0,
    name: 'retry_count',
  })
  retryCount: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'pay_date',
  })
  payDate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
