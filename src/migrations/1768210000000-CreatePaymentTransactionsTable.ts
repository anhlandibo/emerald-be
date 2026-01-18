import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreatePaymentTransactionsTable1768210000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payment_transactions',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'txn_ref',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'target_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'target_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'account_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'VND'",
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'PENDING'",
            isNullable: false,
          },
          {
            name: 'gateway_txn_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'gateway_response_code',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'raw_log',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'payment_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'pay_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key to accounts table
    await queryRunner.createForeignKey(
      'payment_transactions',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX idx_payment_target ON payment_transactions(target_type, target_id);
      CREATE INDEX idx_payment_account ON payment_transactions(account_id);
      CREATE INDEX idx_payment_status ON payment_transactions(status);
      CREATE INDEX idx_payment_created_at ON payment_transactions(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_payment_target;
      DROP INDEX IF EXISTS idx_payment_account;
      DROP INDEX IF EXISTS idx_payment_status;
      DROP INDEX IF EXISTS idx_payment_created_at;
    `);

    const table = await queryRunner.getTable('payment_transactions');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('account_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('payment_transactions', foreignKey);
      }
    }

    await queryRunner.dropTable('payment_transactions');
  }
}
