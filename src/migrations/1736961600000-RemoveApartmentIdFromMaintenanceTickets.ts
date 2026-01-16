import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveApartmentIdFromMaintenanceTickets1736961600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('maintenance_tickets', 'apartment_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'maintenance_tickets',
      new TableColumn({
        name: 'apartment_id',
        type: 'int',
        isNullable: true,
      }),
    );
  }
}
