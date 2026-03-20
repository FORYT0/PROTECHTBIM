import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSprints1704400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sprints table
    await queryRunner.createTable(
      new Table({
        name: 'sprints',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'project_id',
            type: 'uuid',
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
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'planned'",
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'capacity',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'story_points',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "idx_sprints_project" ON "sprints" ("project_id")`
    );
    await queryRunner.query(`CREATE INDEX "idx_sprints_status" ON "sprints" ("status")`);

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'sprints',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedTableName: 'projects',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Add check constraint for status
    await queryRunner.query(
      `ALTER TABLE "sprints" ADD CONSTRAINT "valid_sprint_status" CHECK (status IN ('planned', 'active', 'completed', 'cancelled'))`
    );

    // Add check constraint for dates
    await queryRunner.query(
      `ALTER TABLE "sprints" ADD CONSTRAINT "valid_sprint_dates" CHECK (end_date >= start_date)`
    );

    // Add foreign key constraint from work_packages to sprints
    await queryRunner.createForeignKey(
      'work_packages',
      new TableForeignKey({
        columnNames: ['sprint_id'],
        referencedTableName: 'sprints',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key from work_packages
    const workPackagesTable = await queryRunner.getTable('work_packages');
    const sprintForeignKey = workPackagesTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('sprint_id') !== -1
    );
    if (sprintForeignKey) {
      await queryRunner.dropForeignKey('work_packages', sprintForeignKey);
    }

    // Drop sprints table (cascades will handle foreign keys)
    await queryRunner.dropTable('sprints', true);
  }
}
