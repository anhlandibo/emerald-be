import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRejectionReasonToIssues1737013519000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'issues',
      new TableColumn({
        name: 'rejection_reason',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('issues', 'rejection_reason');
  }
}
