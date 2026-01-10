import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResidentsTable1704456800000 implements MigrationInterface {
  name = 'CreateResidentsTable1704456800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create gender enum type
    await queryRunner.query(`
      CREATE TYPE "gender_enum" AS ENUM ('MALE', 'FEMALE', 'OTHER')
    `);

    // Create residents table
    await queryRunner.query(`
      CREATE TABLE "residents" (
        "id" SERIAL PRIMARY KEY,
        "account_id" integer NOT NULL,
        "full_name" varchar NOT NULL,
        "citizen_id" varchar NOT NULL,
        "image_url" varchar,
        "dob" date NOT NULL,
        "gender" "gender_enum" NOT NULL,
        "phone_number" varchar NOT NULL,
        "nationality" varchar NOT NULL,
        "hometown" jsonb NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_residents_account_id" UNIQUE ("account_id"),
        CONSTRAINT "UQ_residents_citizen_id" UNIQUE ("citizen_id"),
        CONSTRAINT "FK_residents_account_id" FOREIGN KEY ("account_id") 
          REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create index on account_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_residents_account_id" ON "residents" ("account_id")
    `);

    // Create index on citizen_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_residents_citizen_id" ON "residents" ("citizen_id")
    `);

    // Create index on is_active for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_residents_is_active" ON "residents" ("is_active")
    `);

    // Create index on full_name for searching
    await queryRunner.query(`
      CREATE INDEX "IDX_residents_full_name" ON "residents" ("full_name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_residents_full_name"`);
    await queryRunner.query(`DROP INDEX "IDX_residents_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_residents_citizen_id"`);
    await queryRunner.query(`DROP INDEX "IDX_residents_account_id"`);
    await queryRunner.query(`DROP TABLE "residents"`);
    await queryRunner.query(`DROP TYPE "gender_enum"`);
  }
}
