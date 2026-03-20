import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateTimeEntriesForCostTracking1771677400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'time_entries',
      new TableColumn({
        name: 'hourly_rate',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'time_entries',
      new TableColumn({
        name: 'labor_cost',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'time_entries',
      new TableColumn({
        name: 'cost_entry_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'time_entries',
      new TableColumn({
        name: 'is_overtime',
        type: 'boolean',
        default: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('time_entries', 'hourly_rate');
    await queryRunner.dropColumn('time_entries', 'labor_cost');
    await queryRunner.dropColumn('time_entries', 'cost_entry_id');
    await queryRunner.dropColumn('time_entries', 'is_overtime');
  }
}
