import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEvidenceColumnsToMaintenanceTickets1768139000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'maintenance_tickets',
      new TableColumn({
        name: 'evidence_image',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'maintenance_tickets',
      new TableColumn({
        name: 'evidence_video',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('maintenance_tickets', 'evidence_video');
    await queryRunner.dropColumn('maintenance_tickets', 'evidence_image');
  }
}
