import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIssuesTable1768119215099 implements MigrationInterface {
  name = 'CreateIssuesTable1768119215099';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "issues" (
                "id" SERIAL PRIMARY KEY,
                "reporter_id" INTEGER NOT NULL,
                "type" VARCHAR NOT NULL,
                "title" VARCHAR NOT NULL,
                "description" TEXT,
                "block_id" INTEGER,
                "floor" INTEGER,
                "detail_location" VARCHAR,
                "file_urls" VARCHAR ARRAY NOT NULL DEFAULT '{}',
                "status" VARCHAR NOT NULL DEFAULT 'PENDING',
                "rating" INTEGER,
                "feedback" TEXT,
                "is_urgent" BOOLEAN NOT NULL DEFAULT false,
                "estimated_completion_date" TIMESTAMP,
                "maintenance_ticket_id" INTEGER,
                "is_active" BOOLEAN NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                
                -- Foreign Keys
                CONSTRAINT "FK_issues_reporter" FOREIGN KEY ("reporter_id") 
                    REFERENCES "residents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_issues_block" FOREIGN KEY ("block_id") 
                    REFERENCES "blocks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(
      `CREATE INDEX "idx_issues_reporter_id" ON "issues" ("reporter_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_issues_block_id" ON "issues" ("block_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_issues_status" ON "issues" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_issues_type" ON "issues" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_issues_is_active" ON "issues" ("is_active")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_issues_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_issues_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_issues_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_issues_block_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_issues_reporter_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "issues"`);
  }
}
