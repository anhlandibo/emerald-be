import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeesTable1735948800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE fees (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        unit VARCHAR,
        type VARCHAR NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX idx_fees_name ON fees(name)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_fees_type ON fees(type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fees_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fees_name`);
    await queryRunner.query(`DROP TABLE IF EXISTS fees`);
  }
}
