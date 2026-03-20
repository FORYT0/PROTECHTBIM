import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateResourceRates1771677200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'resource_rates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'role',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'hourly_rate',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'overtime_rate',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'overtime_multiplier',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'cost_category',
            type: 'enum',
            enum: ['LABOR', 'MATERIAL', 'EQUIPMENT', 'SUBCONTRACTOR', 'OVERHEAD', 'OTHER'],
            default: "'LABOR'",
          },
          {
            name: 'cost_code_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'effective_from',
            type: 'date',
          },
          {
            name: 'effective_to',
            type: 'date',
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
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'resource_rates',
      new TableIndex({
        name: 'IDX_resource_rates_user_id_effective_from',
        columnNames: ['user_id', 'effective_from'],
      })
    );

    await queryRunner.createIndex(
      'resource_rates',
      new TableIndex({
        name: 'IDX_resource_rates_is_active',
        columnNames: ['is_active'],
      })
    );

    await queryRunner.createForeignKey(
      'resource_rates',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'resource_rates',
      new TableForeignKey({
        columnNames: ['cost_code_id'],
        referencedTableName: 'cost_codes',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('resource_rates');
  }
}
