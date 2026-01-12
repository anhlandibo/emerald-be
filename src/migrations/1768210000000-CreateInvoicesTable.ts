import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateInvoicesTable1768210000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'invoices',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'invoice_code',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'apartment_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'period',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'UNPAID'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['apartment_id'],
            referencedTableName: 'apartments',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('invoices');
  }
}
