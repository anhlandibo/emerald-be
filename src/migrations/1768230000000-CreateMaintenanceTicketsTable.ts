import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateMaintenanceTicketsTable1768230000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ticket_type enum
    await queryRunner.query(`
      CREATE TYPE ticket_type AS ENUM ('INCIDENT', 'MAINTENANCE');
    `);

    // Create ticket_status enum
    await queryRunner.query(`
      CREATE TYPE ticket_status AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
    `);

    // Create ticket_priority enum
    await queryRunner.query(`
      CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
    `);

    // Create maintenance_result enum
    await queryRunner.query(`
      CREATE TYPE maintenance_result AS ENUM ('GOOD', 'NEEDS_REPAIR', 'MONITORING');
    `);

    // Create maintenance_tickets table
    await queryRunner.createTable(
      new Table({
        name: 'maintenance_tickets',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'ticket_type',
            isNullable: false,
          },
          {
            name: 'priority',
            type: 'ticket_priority',
            isNullable: false,
            default: "'MEDIUM'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'block_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'floor',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'apartment_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'asset_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'technician_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'ticket_status',
            isNullable: false,
            default: "'PENDING'",
          },
          {
            name: 'checklist_items',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'assigned_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'started_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'result',
            type: 'maintenance_result',
            isNullable: true,
          },
          {
            name: 'result_note',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'has_issue',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'issue_detail',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'material_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'labor_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'total_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'estimated_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'actual_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'maintenance_tickets',
      new TableForeignKey({
        columnNames: ['block_id'],
        referencedTableName: 'blocks',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'maintenance_tickets',
      new TableForeignKey({
        columnNames: ['apartment_id'],
        referencedTableName: 'apartments',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'maintenance_tickets',
      new TableForeignKey({
        columnNames: ['asset_id'],
        referencedTableName: 'assets',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'maintenance_tickets',
      new TableForeignKey({
        columnNames: ['technician_id'],
        referencedTableName: 'technicians',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Seed data
    await queryRunner.query(`
      INSERT INTO maintenance_tickets (
        title, type, priority, description, block_id, floor, asset_id, 
        status, created_at
      ) VALUES
      (
        'Bảo trì định kỳ thang máy A1',
        'MAINTENANCE',
        'MEDIUM',
        'Kiểm tra hệ thống phanh, dây cáp, và hệ thống điện',
        1,
        0,
        (SELECT id FROM assets WHERE name LIKE '%Thang máy%' LIMIT 1),
        'PENDING',
        NOW() - INTERVAL '5 days'
      ),
      (
        'Sửa chữa máy bơm nước tầng hầm',
        'INCIDENT',
        'HIGH',
        'Máy bơm phát ra tiếng kêu bất thường, áp lực nước yếu',
        1,
        -1,
        (SELECT id FROM assets WHERE name LIKE '%Máy bơm%' LIMIT 1),
        'ASSIGNED',
        NOW() - INTERVAL '3 days'
      ),
      (
        'Kiểm tra camera an ninh tầng 5',
        'MAINTENANCE',
        'LOW',
        'Kiểm tra định kỳ hệ thống camera, làm sạch ống kính',
        1,
        5,
        (SELECT id FROM assets WHERE name LIKE '%Camera%' LIMIT 1),
        'COMPLETED',
        NOW() - INTERVAL '10 days'
      );
    `);

    // Update the COMPLETED ticket with more details
    await queryRunner.query(`
      UPDATE maintenance_tickets
      SET 
        technician_id = (SELECT id FROM technicians LIMIT 1),
        assigned_date = NOW() - INTERVAL '10 days',
        started_date = NOW() - INTERVAL '9 days',
        completed_date = NOW() - INTERVAL '9 days',
        result = 'GOOD',
        result_note = 'Camera hoạt động tốt, đã vệ sinh ống kính',
        material_cost = 0,
        labor_cost = 200000,
        total_cost = 200000,
        actual_cost = 200000
      WHERE status = 'COMPLETED';
    `);

    // Update the ASSIGNED ticket
    await queryRunner.query(`
      UPDATE maintenance_tickets
      SET 
        technician_id = (SELECT id FROM technicians LIMIT 1),
        assigned_date = NOW() - INTERVAL '2 days',
        estimated_cost = 1500000
      WHERE status = 'ASSIGNED';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable('maintenance_tickets');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('maintenance_tickets', foreignKey);
      }
    }

    // Drop table
    await queryRunner.dropTable('maintenance_tickets');

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS maintenance_result;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ticket_priority;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ticket_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ticket_type;`);
  }
}
