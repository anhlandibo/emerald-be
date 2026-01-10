import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountsTable1704283200000 implements MigrationInterface {
  name = 'CreateAccountsTable1704283200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create accounts table
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" SERIAL PRIMARY KEY,
        "email" varchar NOT NULL,
        "password" varchar NOT NULL,
        "role" varchar NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_accounts_email" UNIQUE ("email")
      )
    `);

    // Create index on email for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_accounts_email" ON "accounts" ("email")
    `);

    // Create index on role for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_accounts_role" ON "accounts" ("role")
    `);

    // Create index on is_active for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_accounts_is_active" ON "accounts" ("is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_accounts_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_role"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_email"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
  }
}
