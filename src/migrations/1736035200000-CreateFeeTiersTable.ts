import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeeTiersTable1736035200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE fee_tiers (
        id SERIAL PRIMARY KEY,
        fee_type_id INT NOT NULL,
        name VARCHAR NOT NULL,
        from_value DECIMAL(10,2) NOT NULL,
        to_value DECIMAL(10,2),
        unit_price DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT fk_fee_tier_fee FOREIGN KEY (fee_type_id) REFERENCES fees(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX idx_fee_tiers_fee_type_id ON fee_tiers(fee_type_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_fee_tiers_from_value ON fee_tiers(from_value)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fee_tiers_from_value`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fee_tiers_fee_type_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS fee_tiers`);
  }
}
