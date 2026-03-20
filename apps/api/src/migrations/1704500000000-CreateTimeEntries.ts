import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimeEntries1704500000000 implements MigrationInterface {
  name = 'CreateTimeEntries1704500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create time_entries table
    await queryRunner.query(`
      CREATE TABLE time_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        work_package_id UUID NOT NULL,
        user_id UUID NOT NULL,
        hours DECIMAL(10,2) NOT NULL CHECK (hours > 0),
        date DATE NOT NULL,
        comment TEXT,
        billable BOOLEAN DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_time_entries_work_package FOREIGN KEY (work_package_id) REFERENCES work_packages(id) ON DELETE CASCADE,
        CONSTRAINT fk_time_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for time_entries
    await queryRunner.query(`CREATE INDEX idx_time_wp ON time_entries(work_package_id)`);
    await queryRunner.query(`CREATE INDEX idx_time_user ON time_entries(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_time_date ON time_entries(date)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop time_entries table
    await queryRunner.query(`DROP TABLE IF EXISTS time_entries`);
  }
}
