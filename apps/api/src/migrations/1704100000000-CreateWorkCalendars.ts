import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateWorkCalendars1704100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create work_calendars table
    await queryRunner.createTable(
      new Table({
        name: 'work_calendars',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
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
            name: 'project_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'working_days',
            type: 'jsonb',
            default: "'[1,2,3,4,5]'",
            isNullable: false,
          },
          {
            name: 'working_hours',
            type: 'jsonb',
            default: "'{ \"startHour\": 8, \"startMinute\": 0, \"endHour\": 17, \"endMinute\": 0 }'",
            isNullable: false,
          },
          {
            name: 'hours_per_day',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 8.0,
            isNullable: false,
          },
          {
            name: 'holidays',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create index on project_id
    await queryRunner.createIndex(
      'work_calendars',
      new TableIndex({
        name: 'IDX_work_calendars_project_id',
        columnNames: ['project_id'],
      })
    );

    // Create index on is_default
    await queryRunner.createIndex(
      'work_calendars',
      new TableIndex({
        name: 'IDX_work_calendars_is_default',
        columnNames: ['is_default'],
      })
    );

    // Create foreign key to projects table
    await queryRunner.createForeignKey(
      'work_calendars',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
      })
    );

    // Insert default work calendar
    await queryRunner.query(`
      INSERT INTO work_calendars (name, description, is_default, working_days, working_hours, hours_per_day, holidays)
      VALUES (
        'Default Work Calendar',
        'Standard Monday-Friday work week, 8:00 AM - 5:00 PM',
        true,
        '[1,2,3,4,5]'::jsonb,
        '{"startHour":8,"startMinute":0,"endHour":17,"endMinute":0}'::jsonb,
        8.0,
        '[]'::jsonb
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('work_calendars');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('project_id') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('work_calendars', foreignKey);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex('work_calendars', 'IDX_work_calendars_project_id');
    await queryRunner.dropIndex('work_calendars', 'IDX_work_calendars_is_default');

    // Drop table
    await queryRunner.dropTable('work_calendars');
  }
}
