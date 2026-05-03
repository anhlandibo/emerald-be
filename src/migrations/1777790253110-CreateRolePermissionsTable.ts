import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolePermissionsTable1777790253110 implements MigrationInterface {
  name = 'CreateRolePermissionsTable1777790253110';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "id"          SERIAL NOT NULL,
                "role"        character varying NOT NULL,
                "module"      character varying NOT NULL,
                "can_view"    boolean NOT NULL DEFAULT false,
                "can_create"  boolean NOT NULL DEFAULT false,
                "can_edit"    boolean NOT NULL DEFAULT false,
                "can_approve" boolean NOT NULL DEFAULT false,
                "can_export"  boolean NOT NULL DEFAULT false,
                "can_delete"  boolean NOT NULL DEFAULT false,
                "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_role_module" UNIQUE ("role", "module"),
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_role_permissions_role" ON "role_permissions" ("role")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_role_permissions_role"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
  }
}
