import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBackupTables1777796896598 implements MigrationInterface {
  name = 'CreateBackupTables1777796896598';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
  CREATE TABLE "backups" (
    "id"            SERIAL NOT NULL,
    "type"          character varying NOT NULL DEFAULT 'MANUAL',
    "status"        character varying NOT NULL DEFAULT 'PENDING',
    "storage_path"  character varying,
    "download_url"  character varying,
    "checksum"      character varying,
    "size_bytes"    bigint,
    "error_message" text,
    "initiated_by"  character varying,
    "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_backups" PRIMARY KEY ("id")
  )
`);

    await queryRunner.query(`
  CREATE INDEX "IDX_backups_status" ON "backups" ("status")
`);

    await queryRunner.query(`
  CREATE TABLE "restore_jobs" (
    "id"            SERIAL NOT NULL,
    "backup_id"     integer NOT NULL,
    "status"        character varying NOT NULL DEFAULT 'PENDING',
    "initiated_by"  character varying NOT NULL,
    "started_at"    TIMESTAMP,
    "completed_at"  TIMESTAMP,
    "error_message" text,
    "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_restore_jobs" PRIMARY KEY ("id"),
    CONSTRAINT "FK_restore_jobs_backup" FOREIGN KEY ("backup_id") REFERENCES "backups"("id")
  )
`);

    await queryRunner.query(`
  CREATE INDEX "IDX_restore_jobs_backup_id" ON "restore_jobs" ("backup_id")
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_restore_jobs_backup_id"`);
    await queryRunner.query(`DROP TABLE "restore_jobs"`);
    await queryRunner.query(`DROP INDEX "IDX_backups_status"`);
    await queryRunner.query(`DROP TABLE "backups"`);
  }
}
