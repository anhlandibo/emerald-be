import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateVotingsTables1768200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create votings table
    await queryRunner.createTable(
      new Table({
        name: 'votings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'target_scope',
            type: 'enum',
            enum: ['ALL', 'BLOCK', 'FLOOR'],
            isNullable: false,
          },
          {
            name: 'is_required',
            type: 'boolean',
            default: false,
          },
          {
            name: 'start_time',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'file_urls',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create options table
    await queryRunner.createTable(
      new Table({
        name: 'options',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'voting_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create resident_options table (junction table for votes)
    await queryRunner.createTable(
      new Table({
        name: 'resident_options',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'resident_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'option_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'options',
      new TableForeignKey({
        columnNames: ['voting_id'],
        referencedTableName: 'votings',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_options_voting',
      }),
    );

    await queryRunner.createForeignKey(
      'resident_options',
      new TableForeignKey({
        columnNames: ['resident_id'],
        referencedTableName: 'residents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_resident_options_resident',
      }),
    );

    await queryRunner.createForeignKey(
      'resident_options',
      new TableForeignKey({
        columnNames: ['option_id'],
        referencedTableName: 'options',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_resident_options_option',
      }),
    );

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX idx_votings_start_time ON votings(start_time);
      CREATE INDEX idx_votings_end_time ON votings(end_time);
      CREATE INDEX idx_votings_is_active ON votings(is_active);
      CREATE INDEX idx_options_voting_id ON options(voting_id);
      CREATE INDEX idx_resident_options_resident_id ON resident_options(resident_id);
      CREATE INDEX idx_resident_options_option_id ON resident_options(option_id);
      CREATE UNIQUE INDEX idx_resident_options_unique ON resident_options(resident_id, option_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX idx_resident_options_unique ON resident_options;
      DROP INDEX idx_resident_options_option_id ON resident_options;
      DROP INDEX idx_resident_options_resident_id ON resident_options;
      DROP INDEX idx_options_voting_id ON options;
      DROP INDEX idx_votings_is_active ON votings;
      DROP INDEX idx_votings_end_time ON votings;
      DROP INDEX idx_votings_start_time ON votings;
    `);

    // Drop foreign keys
    const residentOptionsTable = await queryRunner.getTable('resident_options');
    const optionsTable = await queryRunner.getTable('options');

    if (residentOptionsTable) {
      const residentFk = residentOptionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('resident_id') !== -1,
      );
      const optionFk = residentOptionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('option_id') !== -1,
      );
      if (residentFk)
        await queryRunner.dropForeignKey('resident_options', residentFk);
      if (optionFk)
        await queryRunner.dropForeignKey('resident_options', optionFk);
    }

    if (optionsTable) {
      const votingFk = optionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('voting_id') !== -1,
      );
      if (votingFk) await queryRunner.dropForeignKey('options', votingFk);
    }

    // Drop tables
    await queryRunner.dropTable('resident_options', true);
    await queryRunner.dropTable('options', true);
    await queryRunner.dropTable('votings', true);
  }
}
