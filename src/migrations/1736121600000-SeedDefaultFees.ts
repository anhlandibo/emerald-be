import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultFees1736121600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed Tiền điện with tiers (EVN pricing structure)
    const electricityResult = await queryRunner.query(`
      INSERT INTO fees (name, unit, type, description) 
      VALUES ('Tiền điện', 'kwh', 'METERED', 'Phí tiền điện sinh hoạt theo bậc thang EVN')
      RETURNING id
    `);
    const electricityId = electricityResult[0].id;

    await queryRunner.query(`
      INSERT INTO fee_tiers (fee_type_id, name, from_value, to_value, unit_price) VALUES
      (${electricityId}, 'Bậc 1', 0, 50, 1806),
      (${electricityId}, 'Bậc 2', 50, 100, 1866),
      (${electricityId}, 'Bậc 3', 100, 200, 2167),
      (${electricityId}, 'Bậc 4', 200, 300, 2729),
      (${electricityId}, 'Bậc 5', 300, 400, 3050),
      (${electricityId}, 'Bậc 6', 400, NULL, 3151)
    `);

    // Seed Tiền nước with tiers
    const waterResult = await queryRunner.query(`
      INSERT INTO fees (name, unit, type, description) 
      VALUES ('Tiền nước', 'm3', 'METERED', 'Phí tiền nước sinh hoạt theo bậc thang')
      RETURNING id
    `);
    const waterId = waterResult[0].id;

    await queryRunner.query(`
      INSERT INTO fee_tiers (fee_type_id, name, from_value, to_value, unit_price) VALUES
      (${waterId}, 'Bậc 1', 0, 10, 5973),
      (${waterId}, 'Bậc 2', 10, 20, 7052),
      (${waterId}, 'Bậc 3', 20, 30, 8669),
      (${waterId}, 'Bậc 4', 30, NULL, 15929)
    `);

    // Seed Phí quản lý (fixed by area)
    const managementResult = await queryRunner.query(`
      INSERT INTO fees (name, unit, type, description) 
      VALUES ('Phí quản lý', 'm2', 'FIXED_AREA', 'Phí quản lý chung cư theo diện tích')
      RETURNING id
    `);
    const managementId = managementResult[0].id;

    await queryRunner.query(`
      INSERT INTO fee_tiers (fee_type_id, name, from_value, to_value, unit_price) VALUES
      (${managementId}, 'Giá chuẩn', 0, NULL, 12000)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM fee_tiers WHERE fee_type_id IN (
        SELECT id FROM fees WHERE name IN (
          'Tiền điện',
          'Tiền nước',
          'Phí quản lý'
        )
      )
    `);

    await queryRunner.query(`
      DELETE FROM fees WHERE name IN (
        'Tiền điện',
        'Tiền nước',
        'Phí quản lý'
      )
    `);
  }
}
