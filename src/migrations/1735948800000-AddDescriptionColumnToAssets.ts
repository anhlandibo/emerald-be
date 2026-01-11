import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDescriptionColumnToAssets1735948800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'assets',
      new TableColumn({
        name: 'description',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('assets', 'description');
  }
}
