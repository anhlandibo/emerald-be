import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserNotificationsTable1768314435266 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "user_notifications" (
                "id" SERIAL PRIMARY KEY,
                "account_id" INTEGER NOT NULL,
                "notification_id" INTEGER NOT NULL,
                "is_read" BOOLEAN NOT NULL DEFAULT false,
                "is_deleted" BOOLEAN NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                
                CONSTRAINT "FK_user_notifications_account" FOREIGN KEY ("account_id") 
                    REFERENCES "accounts"("id") ON DELETE CASCADE,
                
                CONSTRAINT "FK_user_notifications_noti" FOREIGN KEY ("notification_id") 
                    REFERENCES "notifications"("id") ON DELETE CASCADE
            )
        `);

    await queryRunner.query(
      `CREATE INDEX "idx_user_notis_account_id" ON "user_notifications" ("account_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_notis_noti_id" ON "user_notifications" ("notification_id")`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_unique_user_noti" ON "user_notifications" ("account_id", "notification_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_notifications"`);
  }
}
