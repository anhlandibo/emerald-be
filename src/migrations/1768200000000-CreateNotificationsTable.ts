import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1768200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR NOT NULL DEFAULT 'GENERAL',
        is_urgent BOOLEAN DEFAULT false NOT NULL,
        file_urls TEXT,
        target_scope VARCHAR NOT NULL DEFAULT 'ALL',
        channels TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX idx_notifications_type ON notifications(type)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_notifications_target_scope ON notifications(target_scope)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_notifications_is_urgent ON notifications(is_urgent)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_notifications_is_active ON notifications(is_active)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_notifications_created_at ON notifications(created_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notifications_created_at`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_is_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_is_urgent`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notifications_target_scope`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_type`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
  }
}
