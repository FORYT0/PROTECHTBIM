import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class UpdateBudgetStructure1771678000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update budgets table
    await queryRunner.query(`
      ALTER TABLE budgets
      ALTER COLUMN name SET DEFAULT 'Project Budget',
      ALTER COLUMN currency SET DEFAULT 'USD',
      ALTER COLUMN currency SET NOT NULL,
      ALTER COLUMN "startDate" DROP NOT NULL,
      ALTER COLUMN "endDate" DROP NOT NULL,
      ADD COLUMN IF NOT EXISTS "contingencyPercentage" DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "contingencyAmount" DECIMAL(12,2) DEFAULT 0,
      DROP COLUMN IF EXISTS breakdown;
    `);

    // Create budget_lines table
    await queryRunner.createTable(
      new Table({
        name: 'budget_lines',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'budgetId',
            type: 'uuid',
          },
          {
            name: 'costCodeId',
            type: 'uuid',
          },
          {
            name: 'budgetedAmount',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'actualCost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'committedCost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
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

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_budget_lines_budgetId" ON budget_lines ("budgetId");
      CREATE INDEX "IDX_budget_lines_costCodeId" ON budget_lines ("costCodeId");
    `);

    // Add foreign keys
    await queryRunner.createForeignKey(
      'budget_lines',
      new TableForeignKey({
        columnNames: ['budgetId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'budgets',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'budget_lines',
      new TableForeignKey({
        columnNames: ['costCodeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cost_codes',
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop budget_lines table
    await queryRunner.dropTable('budget_lines', true);

    // Revert budgets table changes
    await queryRunner.query(`
      ALTER TABLE budgets
      ALTER COLUMN name DROP DEFAULT,
      ALTER COLUMN currency DROP DEFAULT,
      ALTER COLUMN currency DROP NOT NULL,
      ALTER COLUMN "startDate" SET NOT NULL,
      ALTER COLUMN "endDate" SET NOT NULL,
      DROP COLUMN IF EXISTS "contingencyPercentage",
      DROP COLUMN IF EXISTS "contingencyAmount",
      ADD COLUMN IF NOT EXISTS breakdown JSON;
    `);
  }
}
