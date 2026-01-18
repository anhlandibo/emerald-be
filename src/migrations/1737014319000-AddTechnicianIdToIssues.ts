import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAssignedToTechnicianDepartmentToIssues1737014319000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'issues',
      new TableColumn({
        name: 'assigned_to_technician_department',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('issues', 'assigned_to_technician_department');
  }
}
