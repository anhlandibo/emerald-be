import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddApartmentStatusColumn1737564000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add status column to apartments table
    await queryRunner.addColumn(
      'apartments',
      new TableColumn({
        name: 'status',
        type: 'varchar',
        default: "'VACANT'",
        isNullable: false,
      }),
    );

    // Update existing apartments: set OCCUPIED if has residents, VACANT otherwise
    await queryRunner.query(`
      UPDATE apartments a
      SET status = CASE
        WHEN EXISTS (
          SELECT 1 FROM apartment_residents ar
          WHERE ar.apartment_id = a.id
        ) THEN 'OCCUPIED'
        ELSE 'VACANT'
      END
      WHERE a.is_active = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('apartments', 'status');
  }
}
