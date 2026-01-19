import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDueDateToInvoices1768320001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add due_date column with nullable first, then update existing records
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'due_date',
        type: 'date',
        isNullable: true,
        default: null,
      }),
    );

    // Update existing invoices: set due_date to created_at + 15 days
    await queryRunner.query(`
      UPDATE invoices 
      SET due_date = (created_at + INTERVAL '15 days')::date
      WHERE due_date IS NULL
    `);

    // Alter column to NOT NULL
    await queryRunner.query(`
      ALTER TABLE invoices ALTER COLUMN due_date SET NOT NULL
    `);

    // Create index on due_date and status for faster queries
    await queryRunner.query(`
      CREATE INDEX idx_invoices_due_date_status 
      ON invoices(due_date, status)
    `);

    // Create index on status and dueDate for OVERDUE queries
    await queryRunner.query(`
      CREATE INDEX idx_invoices_status_due_date
      ON invoices(status, due_date)
      WHERE status = 'UNPAID'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('invoices', 'idx_invoices_due_date_status');
    await queryRunner.dropIndex('invoices', 'idx_invoices_status_due_date');

    // Drop column
    await queryRunner.dropColumn('invoices', 'due_date');
  }
}
