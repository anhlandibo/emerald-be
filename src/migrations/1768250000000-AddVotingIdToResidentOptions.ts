import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddVotingIdToResidentOptions1768250000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add voting_id column as nullable first
    await queryRunner.addColumn(
      'resident_options',
      new TableColumn({
        name: 'voting_id',
        type: 'int',
        isNullable: true, // Nullable first to allow existing data
      }),
    );

    // Step 2: Populate voting_id from option's voting relationship
    await queryRunner.query(`
      UPDATE resident_options ro
      SET voting_id = o.voting_id
      FROM options o
      WHERE ro.option_id = o.id
    `);

    // Step 3: Set column to NOT NULL after populating data
    await queryRunner.query(`
      ALTER TABLE resident_options ALTER COLUMN voting_id SET NOT NULL
    `);

    // Step 4: Add foreign key constraint
    await queryRunner.createForeignKey(
      'resident_options',
      new TableForeignKey({
        columnNames: ['voting_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'votings',
        onDelete: 'CASCADE',
      }),
    );

    // Step 5: Create unique constraint on (resident_id, voting_id)
    await queryRunner.query(
      `ALTER TABLE resident_options ADD CONSTRAINT uk_resident_voting UNIQUE (resident_id, voting_id)`,
    );

    // Step 6: Create index on voting_id for better query performance
    await queryRunner.query(
      `CREATE INDEX idx_resident_options_voting_id ON resident_options(voting_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop constraints and column
    const table = await queryRunner.getTable('resident_options');
    const fkConstraint = table?.foreignKeys.find(
      (fk) => fk.columnNames[0] === 'voting_id',
    );

    if (fkConstraint) {
      await queryRunner.dropForeignKey('resident_options', fkConstraint);
    }

    // Drop unique constraint
    await queryRunner.query(
      `ALTER TABLE resident_options DROP CONSTRAINT IF EXISTS uk_resident_voting`,
    );

    // Drop index
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_resident_options_voting_id`,
    );

    // Drop column
    await queryRunner.dropColumn('resident_options', 'voting_id');
  }
}
