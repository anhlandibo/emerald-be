import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlocksTable1704529600000 implements MigrationInterface {
  name = 'CreateBlocksTable1704529600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create block status enum type
    await queryRunner.query(`
      CREATE TYPE "block_status_enum" AS ENUM ('OPERATING', 'UNDER_CONSTRUCTION', 'UNDER_MAINTENANCE')
    `);

    // Create blocks table
    await queryRunner.query(`
      CREATE TABLE "blocks" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL,
        "manager_name" varchar,
        "manager_phone" varchar,
        "total_floors" integer,
        "status" "block_status_enum" NOT NULL DEFAULT 'OPERATING',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create index on name for searching
    await queryRunner.query(`
      CREATE INDEX "IDX_blocks_name" ON "blocks" ("name")
    `);

    // Create index on status for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_blocks_status" ON "blocks" ("status")
    `);

    // Create index on is_active for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_blocks_is_active" ON "blocks" ("is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_blocks_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_blocks_status"`);
    await queryRunner.query(`DROP INDEX "IDX_blocks_name"`);
    await queryRunner.query(`DROP TABLE "blocks"`);
    await queryRunner.query(`DROP TYPE "block_status_enum"`);
  }
}
