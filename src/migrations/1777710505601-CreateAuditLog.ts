import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLog1777710505601 implements MigrationInterface {
  name = 'CreateAuditLog1777710505601';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"    VARCHAR,
        "userEmail" VARCHAR,
        "userRole"  VARCHAR,
        method      VARCHAR NOT NULL,
        path        VARCHAR NOT NULL,
        payload     JSONB,
        "ipAddress" VARCHAR,
        status      VARCHAR NOT NULL DEFAULT 'initiated',
        "errorMessage" VARCHAR,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX idx_audit_user ON audit_logs ("userId");`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_audit_created ON audit_logs ("createdAt" DESC);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_audit_method ON audit_logs (method);`,
    );

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_modification()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION
          'Audit log is append-only. Modification of audit_logs is prohibited.'
          USING ERRCODE = 'insufficient_privilege';
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER audit_immutability_guard
      BEFORE UPDATE OR DELETE OR TRUNCATE
      ON audit_logs
      FOR EACH STATEMENT
      EXECUTE FUNCTION prevent_audit_modification();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS audit_immutability_guard ON audit_logs;`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS prevent_audit_modification;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs;`);
  }
}
