import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorResidentsAddressFields1768200000100 implements MigrationInterface {
  name = 'RefactorResidentsAddressFields1768200000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new address columns
    await queryRunner.query(`
      ALTER TABLE "residents"
      ADD COLUMN "province" varchar NOT NULL DEFAULT 'Unknown'
    `);

    await queryRunner.query(`
      ALTER TABLE "residents"
      ADD COLUMN "district" varchar NOT NULL DEFAULT 'Unknown'
    `);

    await queryRunner.query(`
      ALTER TABLE "residents"
      ADD COLUMN "ward" varchar NOT NULL DEFAULT 'Unknown'
    `);

    await queryRunner.query(`
      ALTER TABLE "residents"
      ADD COLUMN "detail_address" text
    `);

    // Migrate data from hometown JSONB to flat columns
    await queryRunner.query(`
      UPDATE "residents"
      SET 
        "province" = COALESCE(hometown->>'province', 'Unknown'),
        "district" = COALESCE(hometown->>'district', 'Unknown'),
        "ward" = COALESCE(hometown->>'ward', 'Unknown')
      WHERE hometown IS NOT NULL
    `);

    // Drop the old hometown column
    await queryRunner.query(`
      ALTER TABLE "residents"
      DROP COLUMN "hometown"
    `);

    // Create indexes for new columns
    await queryRunner.query(`
      CREATE INDEX "IDX_residents_province" ON "residents" ("province")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_residents_district" ON "residents" ("district")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_residents_district"`);
    await queryRunner.query(`DROP INDEX "IDX_residents_province"`);

    // Add hometown column back
    await queryRunner.query(`
      ALTER TABLE "residents"
      ADD COLUMN "hometown" jsonb NOT NULL DEFAULT '{}'::jsonb
    `);

    // Migrate data back
    await queryRunner.query(`
      UPDATE "residents"
      SET hometown = jsonb_build_object(
        'province', province,
        'district', district,
        'ward', ward
      )
    `);

    // Drop new columns
    await queryRunner.query(
      `ALTER TABLE "residents" DROP COLUMN "detail_address"`,
    );
    await queryRunner.query(`ALTER TABLE "residents" DROP COLUMN "ward"`);
    await queryRunner.query(`ALTER TABLE "residents" DROP COLUMN "district"`);
    await queryRunner.query(`ALTER TABLE "residents" DROP COLUMN "province"`);
  }
}
