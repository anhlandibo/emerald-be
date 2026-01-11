import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssetsTable1735776000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE assets (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        type_id INT NOT NULL,
        block_id INT NOT NULL,
        floor INT NOT NULL,
        location_detail VARCHAR,
        status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
        installation_date DATE,
        warranty_expiration_date DATE,
        last_maintenance_date DATE,
        next_maintenance_date DATE,
        note TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT fk_asset_type FOREIGN KEY (type_id) REFERENCES asset_types(id) ON DELETE RESTRICT,
        CONSTRAINT fk_asset_block FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE RESTRICT
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX idx_assets_type_id ON assets(type_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_assets_block_id ON assets(block_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_assets_status ON assets(status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_assets_name ON assets(name)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_assets_name`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_assets_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_assets_block_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_assets_type_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS assets`);
  }
}
