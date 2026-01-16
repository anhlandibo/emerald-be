import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveCostColumnsFromMaintenanceTickets1736403600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('maintenance_tickets', 'material_cost');
    await queryRunner.dropColumn('maintenance_tickets', 'labor_cost');
    await queryRunner.dropColumn('maintenance_tickets', 'total_cost');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'maintenance_tickets',
      new TableColumn({
        name: 'material_cost',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'maintenance_tickets',
      new TableColumn({
        name: 'labor_cost',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'maintenance_tickets',
      new TableColumn({
        name: 'total_cost',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      }),
    );
  }
}
