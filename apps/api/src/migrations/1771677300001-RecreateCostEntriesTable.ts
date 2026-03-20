import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class RecreateCostEntriesTable1771677300001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old cost_entries table completely
    await queryRunner.dropTable('cost_entries', true);

    // Create the new cost_entries table with the correct structure
    await queryRunner.createTable(
      new Table({
        name: 'cost_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'entry_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'project_id',
            type: 'uuid',
          },
          {
            name: 'work_package_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'cost_code_id',
            type: 'uuid',
          },
          {
            name: 'cost_category',
            type: 'enum',
            enum: ['LABOR', 'MATERIAL', 'EQUIPMENT', 'SUBCONTRACTOR', 'OVERHEAD', 'OTHER'],
            default: "'LABOR'",
          },
          {
            name: 'vendor_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'unit_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'total_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'invoice_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'invoice_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'payment_status',
            type: 'enum',
            enum: ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'],
            default: "'UNPAID'",
          },
          {
            name: 'is_billable',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_committed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'commitment_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'entry_date',
            type: 'date',
          },
          {
            name: 'entry_source',
            type: 'enum',
            enum: ['MANUAL', 'TIME_ENTRY', 'PURCHASE_ORDER', 'IMPORT', 'API'],
            default: "'MANUAL'",
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'attachment_ids',
            type: 'jsonb',
            isNullable: true,
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

    // Create indexes
    await queryRunner.createIndex(
      'cost_entries',
      new TableIndex({
        name: 'IDX_cost_entries_entry_number',
        columnNames: ['entry_number'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'cost_entries',
      new TableIndex({
        name: 'IDX_cost_entries_project_id',
        columnNames: ['project_id'],
      })
    );

    await queryRunner.createIndex(
      'cost_entries',
      new TableIndex({
        name: 'IDX_cost_entries_work_package_id',
        columnNames: ['work_package_id'],
      })
    );

    await queryRunner.createIndex(
      'cost_entries',
      new TableIndex({
        name: 'IDX_cost_entries_cost_code_id',
        columnNames: ['cost_code_id'],
      })
    );

    await queryRunner.createIndex(
      'cost_entries',
      new TableIndex({
        name: 'IDX_cost_entries_entry_date',
        columnNames: ['entry_date'],
      })
    );

    await queryRunner.createIndex(
      'cost_entries',
      new TableIndex({
        name: 'IDX_cost_entries_payment_status',
        columnNames: ['payment_status'],
      })
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'cost_entries',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'cost_entries',
      new TableForeignKey({
        columnNames: ['work_package_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'work_packages',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'cost_entries',
      new TableForeignKey({
        columnNames: ['cost_code_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cost_codes',
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'cost_entries',
      new TableForeignKey({
        columnNames: ['vendor_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'vendors',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'cost_entries',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'cost_entries',
      new TableForeignKey({
        columnNames: ['approved_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new cost_entries table
    await queryRunner.dropTable('cost_entries', true);

    // Recreate the old cost_entries table structure
    await queryRunner.createTable(
      new Table({
        name: 'cost_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'workPackageId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['LABOR', 'MATERIAL', 'EQUIPMENT', 'OTHER'],
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'billable',
            type: 'boolean',
            default: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );
  }
}
