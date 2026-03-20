import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBaselines1704200000000 implements MigrationInterface {
  name = 'CreateBaselines1704200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create baselines table
    await queryRunner.query(`
      CREATE TABLE baselines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by UUID NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_baselines_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_baselines_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create index for baselines
    await queryRunner.query(`CREATE INDEX idx_baselines_project ON baselines(project_id)`);

    // Create baseline_work_packages table to store snapshots
    await queryRunner.query(`
      CREATE TABLE baseline_work_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        baseline_id UUID NOT NULL,
        work_package_id UUID NOT NULL,
        subject VARCHAR(500) NOT NULL,
        start_date DATE,
        due_date DATE,
        CONSTRAINT fk_bwp_baseline FOREIGN KEY (baseline_id) REFERENCES baselines(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for baseline_work_packages
    await queryRunner.query(
      `CREATE INDEX idx_bwp_baseline ON baseline_work_packages(baseline_id)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_bwp_work_package ON baseline_work_packages(work_package_id)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS baseline_work_packages`);
    await queryRunner.query(`DROP TABLE IF EXISTS baselines`);
  }
}
