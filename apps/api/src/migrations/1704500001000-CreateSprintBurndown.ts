import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSprintBurndown1704500001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sprint_burndown table to track daily story points
    await queryRunner.createTable(
      new Table({
        name: 'sprint_burndown',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'sprint_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'remaining_story_points',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'completed_story_points',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'total_story_points',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['sprint_id'],
            referencedTableName: 'sprints',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'sprint_burndown',
      new TableIndex({
        name: 'idx_sprint_burndown_sprint',
        columnNames: ['sprint_id'],
      })
    );

    await queryRunner.createIndex(
      'sprint_burndown',
      new TableIndex({
        name: 'idx_sprint_burndown_date',
        columnNames: ['date'],
      })
    );

    // Create unique constraint on sprint_id + date
    await queryRunner.createIndex(
      'sprint_burndown',
      new TableIndex({
        name: 'idx_sprint_burndown_sprint_date',
        columnNames: ['sprint_id', 'date'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sprint_burndown');
  }
}
