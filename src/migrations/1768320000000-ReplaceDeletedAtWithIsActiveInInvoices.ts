import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ReplaceDeletedAtWithIsActiveInInvoices1768320000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_active column
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: true,
        isNullable: false,
      }),
    );

    // Drop deleted_at column
    await queryRunner.dropColumn('invoices', 'deleted_at');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add deleted_at column back
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Drop is_active column
    await queryRunner.dropColumn('invoices', 'is_active');
  }
}
