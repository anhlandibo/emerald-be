import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSystemNotificationsTable1705484400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'system_notifications',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            default: "'INFO'",
            isNullable: false,
          },
          {
            name: 'target_user_ids',
            type: 'text',
            isNullable: true,
            comment: 'Comma-separated user IDs. NULL = broadcast to all',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional data for the notification',
          },
          {
            name: 'is_sent',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create index on title for faster search
    await queryRunner.createIndex(
      'system_notifications',
      new TableIndex({
        name: 'IDX_SYSTEM_NOTIFICATIONS_TITLE',
        columnNames: ['title'],
      }),
    );

    // Create index on type for filtering
    await queryRunner.createIndex(
      'system_notifications',
      new TableIndex({
        name: 'IDX_SYSTEM_NOTIFICATIONS_TYPE',
        columnNames: ['type'],
      }),
    );

    // Create index on created_at for sorting
    await queryRunner.createIndex(
      'system_notifications',
      new TableIndex({
        name: 'IDX_SYSTEM_NOTIFICATIONS_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );

    // Create index on is_sent for filtering
    await queryRunner.createIndex(
      'system_notifications',
      new TableIndex({
        name: 'IDX_SYSTEM_NOTIFICATIONS_IS_SENT',
        columnNames: ['is_sent'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('system_notifications');
  }
}
