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

    // Seed Phí giữ xe máy (fixed monthly)
    await queryRunner.query(`
      INSERT INTO fees (name, unit, type, description) 
      VALUES 
      ('Phí giữ xe máy', 'xe', 'FIXED_MONTH', 'Phí giữ xe máy hàng tháng'),
      ('Phí giữ xe ô tô', 'xe', 'FIXED_MONTH', 'Phí giữ xe ô tô hàng tháng'),
      ('Phí xe đạp', 'xe', 'FIXED_MONTH', 'Phí giữ xe đạp hàng tháng')
    `);

    // Get IDs for parking fees
    const motorbikeResult = await queryRunner.query(`
      SELECT id FROM fees WHERE name = 'Phí giữ xe máy' ORDER BY id DESC LIMIT 1
    `);
    const carResult = await queryRunner.query(`
      SELECT id FROM fees WHERE name = 'Phí giữ xe ô tô' ORDER BY id DESC LIMIT 1
    `);
    const bicycleResult = await queryRunner.query(`
      SELECT id FROM fees WHERE name = 'Phí xe đạp' ORDER BY id DESC LIMIT 1
    `);

    // Add tiers for parking fees
    await queryRunner.query(`
      INSERT INTO fee_tiers (fee_type_id, name, from_value, to_value, unit_price) VALUES
      (${motorbikeResult[0].id}, 'Giá tháng', 0, NULL, 100000),
      (${carResult[0].id}, 'Giá tháng', 0, NULL, 1200000),
      (${bicycleResult[0].id}, 'Giá tháng', 0, NULL, 20000)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM fee_tiers WHERE fee_type_id IN (
        SELECT id FROM fees WHERE name IN (
          'Tiền điện',
          'Tiền nước',
          'Phí quản lý',
          'Phí giữ xe máy',
          'Phí giữ xe ô tô',
          'Phí xe đạp'
        )
      )
    `);

    await queryRunner.query(`
      DELETE FROM fees WHERE name IN (
        'Tiền điện',
        'Tiền nước',
        'Phí quản lý',
        'Phí giữ xe máy',
        'Phí giữ xe ô tô',
        'Phí xe đạp'
      )
    `);
  }
}
