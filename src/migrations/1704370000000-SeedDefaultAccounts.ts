import { MigrationInterface, QueryRunner } from 'typeorm';
import { hashSync } from 'bcrypt';

export class SeedDefaultAccounts1704370000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminPassword = hashSync('admin123', 10);
    const residentPassword = hashSync('resident123', 10);
    const technicianPassword = hashSync('technician123', 10);

    await queryRunner.query(`
      INSERT INTO accounts (email, password, role, is_active, created_at, updated_at)
      VALUES 
        ('admin@emerald.com', '${adminPassword}', 'ADMIN', true, NOW(), NOW()),
        ('resident@emerald.com', '${residentPassword}', 'RESIDENT', true, NOW(), NOW()),
        ('technician@emerald.com', '${technicianPassword}', 'TECHNICIAN', true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM accounts 
      WHERE email IN ('admin@emerald.com', 'resident@emerald.com', 'technician@emerald.com');
    `);
  }
}
