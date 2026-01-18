import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { Apartment } from '../../apartments/entities/apartment.entity';
import { InvoiceDetail } from './invoice-detail.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    unique: true,
    nullable: false,
    name: 'invoice_code',
  })
  invoiceCode: string;

  @Column({ type: 'int', nullable: false, name: 'apartment_id' })
  apartmentId: number;

  @ManyToOne(() => Apartment)
  @JoinColumn({ name: 'apartment_id' })
  apartment: Apartment;

  @Column({ type: 'date', nullable: false })
  period: Date;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    name: 'subtotal_amount',
  })
  subtotalAmount: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
    default: 8,
    name: 'vat_rate',
  })
  vatRate: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    default: 0,
    name: 'vat_amount',
  })
  vatAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    name: 'total_amount',
  })
  totalAmount: number;

  @Column({
    type: 'varchar',
    nullable: false,
    default: 'UNPAID',
  })
  status: InvoiceStatus;

  @OneToMany(() => InvoiceDetail, (detail) => detail.invoice, { cascade: true })
  invoiceDetails: InvoiceDetail[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
