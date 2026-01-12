import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTargetBlocksTable1768200100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE target_blocks (
        id SERIAL PRIMARY KEY,
        notification_id INT,
        voting_id INT,
        block_id INT NOT NULL,
        target_floor_numbers TEXT,
        CONSTRAINT fk_target_blocks_notification 
          FOREIGN KEY (notification_id) 
          REFERENCES notifications(id) 
          ON DELETE CASCADE,
        CONSTRAINT fk_target_blocks_block 
          FOREIGN KEY (block_id) 
          REFERENCES blocks(id) 
          ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX idx_target_blocks_notification_id ON target_blocks(notification_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_target_blocks_voting_id ON target_blocks(voting_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_target_blocks_block_id ON target_blocks(block_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_target_blocks_block_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_target_blocks_voting_id`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_target_blocks_notification_id`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS target_blocks`);
  }
}
