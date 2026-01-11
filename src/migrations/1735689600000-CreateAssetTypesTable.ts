import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssetTypesTable1735689600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE asset_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create index on name for faster searches
    await queryRunner.query(`
      CREATE INDEX idx_asset_types_name ON asset_types(name)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_asset_types_name`);
    await queryRunner.query(`DROP TABLE IF EXISTS asset_types`);
  }
}
