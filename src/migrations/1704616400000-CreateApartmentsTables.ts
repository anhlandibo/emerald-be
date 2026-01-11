import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApartmentsTables1704616400000 implements MigrationInterface {
  name = 'CreateApartmentsTables1704616400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create apartment type enum
    await queryRunner.query(`
      CREATE TYPE "apartment_type_enum" AS ENUM ('STUDIO', 'ONE_BEDROOM', 'TWO_BEDROOM', 'PENTHOUSE')
    `);

    // Create relationship type enum
    await queryRunner.query(`
      CREATE TYPE "relationship_type_enum" AS ENUM ('OWNER', 'SPOUSE', 'CHILD', 'PARTNER')
    `);

    // Create apartments table
    await queryRunner.query(`
      CREATE TABLE "apartments" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL,
        "block_id" integer NOT NULL,
        "floor" integer NOT NULL,
        "type" "apartment_type_enum" NOT NULL,
        "area" decimal(10,2),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_apartments_block" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE
      )
    `);

    // Create apartment_residents table
    await queryRunner.query(`
      CREATE TABLE "apartment_residents" (
        "id" SERIAL PRIMARY KEY,
        "apartment_id" integer NOT NULL,
        "resident_id" integer NOT NULL,
        "relationship" "relationship_type_enum" NOT NULL,
        CONSTRAINT "FK_apartment_residents_apartment" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_apartment_residents_resident" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for apartments
    await queryRunner.query(`
      CREATE INDEX "IDX_apartments_block_id" ON "apartments" ("block_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_apartments_name" ON "apartments" ("name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_apartments_type" ON "apartments" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_apartments_is_active" ON "apartments" ("is_active")
    `);

    // Create indexes for apartment_residents
    await queryRunner.query(`
      CREATE INDEX "IDX_apartment_residents_apartment_id" ON "apartment_residents" ("apartment_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_apartment_residents_resident_id" ON "apartment_residents" ("resident_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_apartment_residents_relationship" ON "apartment_residents" ("relationship")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_apartment_residents_relationship"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_apartment_residents_resident_id"`);
    await queryRunner.query(
      `DROP INDEX "IDX_apartment_residents_apartment_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_apartments_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_apartments_type"`);
    await queryRunner.query(`DROP INDEX "IDX_apartments_name"`);
    await queryRunner.query(`DROP INDEX "IDX_apartments_block_id"`);
    await queryRunner.query(`DROP TABLE "apartment_residents"`);
    await queryRunner.query(`DROP TABLE "apartments"`);
    await queryRunner.query(`DROP TYPE "relationship_type_enum"`);
    await queryRunner.query(`DROP TYPE "apartment_type_enum"`);
  }
}
