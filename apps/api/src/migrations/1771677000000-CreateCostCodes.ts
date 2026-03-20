import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCostCodes1771677000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cost_codes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'parent_code_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'level',
            type: 'int',
            default: 1,
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
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'cost_codes',
      new TableIndex({
        name: 'IDX_cost_codes_code',
        columnNames: ['code'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'cost_codes',
      new TableIndex({
        name: 'IDX_cost_codes_parent_code_id',
        columnNames: ['parent_code_id'],
      })
    );

    await queryRunner.createIndex(
      'cost_codes',
      new TableIndex({
        name: 'IDX_cost_codes_level',
        columnNames: ['level'],
      })
    );

    await queryRunner.createForeignKey(
      'cost_codes',
      new TableForeignKey({
        columnNames: ['parent_code_id'],
        referencedTableName: 'cost_codes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cost_codes');
  }
}
