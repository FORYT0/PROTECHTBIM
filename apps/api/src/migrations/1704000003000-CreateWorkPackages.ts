import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkPackages1704000003000 implements MigrationInterface {
  name = 'CreateWorkPackages1704000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create work_packages table
    await queryRunner.query(`
      CREATE TABLE work_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        priority VARCHAR(50) NOT NULL DEFAULT 'normal',
        assignee_id UUID,
        accountable_id UUID,
        parent_id UUID,
        start_date DATE,
        due_date DATE,
        estimated_hours DECIMAL(10,2),
        spent_hours DECIMAL(10,2) DEFAULT 0,
        progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
        scheduling_mode VARCHAR(20) NOT NULL DEFAULT 'automatic',
        version_id UUID,
        sprint_id UUID,
        story_points INTEGER,
        custom_fields JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT valid_type CHECK (type IN ('task', 'milestone', 'phase', 'feature', 'bug')),
        CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        CONSTRAINT valid_scheduling CHECK (scheduling_mode IN ('automatic', 'manual')),
        CONSTRAINT fk_work_packages_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_work_packages_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_work_packages_accountable FOREIGN KEY (accountable_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_work_packages_parent FOREIGN KEY (parent_id) REFERENCES work_packages(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for work_packages
    await queryRunner.query(`CREATE INDEX idx_wp_project ON work_packages(project_id)`);
    await queryRunner.query(`CREATE INDEX idx_wp_assignee ON work_packages(assignee_id)`);
    await queryRunner.query(`CREATE INDEX idx_wp_parent ON work_packages(parent_id)`);
    await queryRunner.query(`CREATE INDEX idx_wp_status ON work_packages(status)`);
    await queryRunner.query(`CREATE INDEX idx_wp_dates ON work_packages(start_date, due_date)`);

    // Create work_package_relations table
    await queryRunner.query(`
      CREATE TABLE work_package_relations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_id UUID NOT NULL,
        to_id UUID NOT NULL,
        relation_type VARCHAR(50) NOT NULL,
        lag_days INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT valid_relation CHECK (relation_type IN ('successor', 'predecessor', 'blocks', 'blocked_by', 'relates_to', 'duplicates')),
        CONSTRAINT no_self_relation CHECK (from_id != to_id),
        CONSTRAINT fk_wpr_from FOREIGN KEY (from_id) REFERENCES work_packages(id) ON DELETE CASCADE,
        CONSTRAINT fk_wpr_to FOREIGN KEY (to_id) REFERENCES work_packages(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for work_package_relations
    await queryRunner.query(`CREATE INDEX idx_wpr_from ON work_package_relations(from_id)`);
    await queryRunner.query(`CREATE INDEX idx_wpr_to ON work_package_relations(to_id)`);

    // Create work_package_watchers table
    await queryRunner.query(`
      CREATE TABLE work_package_watchers (
        work_package_id UUID NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (work_package_id, user_id),
        CONSTRAINT fk_wpw_work_package FOREIGN KEY (work_package_id) REFERENCES work_packages(id) ON DELETE CASCADE,
        CONSTRAINT fk_wpw_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS work_package_watchers`);
    await queryRunner.query(`DROP TABLE IF EXISTS work_package_relations`);
    await queryRunner.query(`DROP TABLE IF EXISTS work_packages`);
  }
}
