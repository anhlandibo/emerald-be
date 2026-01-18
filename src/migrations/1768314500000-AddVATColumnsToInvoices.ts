import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVATColumnsToInvoices1768314500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns to invoices table
    const invoicesTable = await queryRunner.getTable('invoices');

    if (invoicesTable && !invoicesTable.findColumnByName('subtotal_amount')) {
      await queryRunner.addColumn(
        'invoices',
        new TableColumn({
          name: 'subtotal_amount',
          type: 'decimal',
          precision: 12,
          scale: 2,
          isNullable: false,
          default: 0,
        }),
      );
    }

    if (invoicesTable && !invoicesTable.findColumnByName('vat_rate')) {
      await queryRunner.addColumn(
        'invoices',
        new TableColumn({
          name: 'vat_rate',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: false,
          default: 8,
        }),
      );
    }

    if (invoicesTable && !invoicesTable.findColumnByName('vat_amount')) {
      await queryRunner.addColumn(
        'invoices',
        new TableColumn({
          name: 'vat_amount',
          type: 'decimal',
          precision: 12,
          scale: 2,
          isNullable: false,
          default: 0,
        }),
      );
    }

    // Update invoice_details table
    const invoiceDetailsTable = await queryRunner.getTable('invoice_details');

    if (
      invoiceDetailsTable &&
      !invoiceDetailsTable.findColumnByName('vat_amount')
    ) {
      await queryRunner.addColumn(
        'invoice_details',
        new TableColumn({
          name: 'vat_amount',
          type: 'decimal',
          precision: 12,
          scale: 2,
          isNullable: false,
          default: 0,
        }),
      );
    }

    if (
      invoiceDetailsTable &&
      !invoiceDetailsTable.findColumnByName('total_with_vat')
    ) {
      await queryRunner.addColumn(
        'invoice_details',
        new TableColumn({
          name: 'total_with_vat',
          type: 'decimal',
          precision: 12,
          scale: 2,
          isNullable: false,
          default: 0,
        }),
      );
    }

    // Migrate existing data: set subtotal_amount = total_amount, calculate VAT
    await queryRunner.query(`
      UPDATE invoices 
      SET subtotal_amount = total_amount, 
          vat_amount = ROUND(total_amount * 8 / 100, 2),
          total_amount = ROUND(total_amount * 1.08, 2)
      WHERE deleted_at IS NULL
    `);

    // Migrate invoice_details: calculate vat_amount and total_with_vat
    await queryRunner.query(`
      UPDATE invoice_details
      SET vat_amount = ROUND(total_price * 8 / 100, 2),
          total_with_vat = ROUND(total_price * 1.08, 2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback for invoices
    const invoicesTable = await queryRunner.getTable('invoices');

    if (invoicesTable && invoicesTable.findColumnByName('subtotal_amount')) {
      // Restore total_amount from subtotal_amount before dropping
      await queryRunner.query(`
        UPDATE invoices 
        SET total_amount = subtotal_amount
        WHERE deleted_at IS NULL
      `);

      await queryRunner.dropColumn('invoices', 'subtotal_amount');
    }

    if (invoicesTable && invoicesTable.findColumnByName('vat_rate')) {
      await queryRunner.dropColumn('invoices', 'vat_rate');
    }

    if (invoicesTable && invoicesTable.findColumnByName('vat_amount')) {
      await queryRunner.dropColumn('invoices', 'vat_amount');
    }

    // Rollback for invoice_details
    const invoiceDetailsTable = await queryRunner.getTable('invoice_details');

    if (
      invoiceDetailsTable &&
      invoiceDetailsTable.findColumnByName('vat_amount')
    ) {
      await queryRunner.dropColumn('invoice_details', 'vat_amount');
    }

    if (
      invoiceDetailsTable &&
      invoiceDetailsTable.findColumnByName('total_with_vat')
    ) {
      await queryRunner.dropColumn('invoice_details', 'total_with_vat');
    }
  }
}
