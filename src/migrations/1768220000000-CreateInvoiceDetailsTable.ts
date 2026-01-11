import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateInvoiceDetailsTable1768220000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'invoice_details',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'invoice_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'fee_type_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'unit_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'total_price',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'calculation_breakdown',
            type: 'jsonb',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['invoice_id'],
            referencedTableName: 'invoices',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['fee_type_id'],
            referencedTableName: 'fees',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('invoice_details');
  }
}
