import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMeterReadingsTable1768200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'meter_readings',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'apartment_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'fee_type_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'reading_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'billing_month',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'old_index',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'new_index',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'usage_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'image_proof_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['apartment_id'],
            referencedTableName: 'apartments',
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
    await queryRunner.dropTable('meter_readings');
  }
}
