import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWarrantyAndMaintenanceColumnsToAssets1736035200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'assets',
      new TableColumn({
        name: 'warranty_years',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'assets',
      new TableColumn({
        name: 'maintenance_interval_months',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('assets', 'warranty_years');
    await queryRunner.dropColumn('assets', 'maintenance_interval_months');
  }
}
