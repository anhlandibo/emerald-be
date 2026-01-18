import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { Fee } from '../../fees/entities/fee.entity';

@Entity('invoice_details')
export class InvoiceDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, name: 'invoice_id' })
  invoiceId: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.invoiceDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'int', nullable: false, name: 'fee_type_id' })
  feeTypeId: number;

  @ManyToOne(() => Fee)
  @JoinColumn({ name: 'fee_type_id' })
  feeType: Fee;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'unit_price',
  })
  unitPrice: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    name: 'total_price',
  })
  totalPrice: number;

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
    default: 0,
    name: 'total_with_vat',
  })
  totalWithVat: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'calculation_breakdown',
  })
  calculationBreakdown: Record<string, string>;
}
