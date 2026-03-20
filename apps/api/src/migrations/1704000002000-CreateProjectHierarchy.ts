import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectHierarchy1704000002000 implements MigrationInterface {
  name = 'CreateProjectHierarchy1704000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create portfolios table
    await queryRunner.query(`
      CREATE TABLE "portfolios" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "owner_id" UUID NOT NULL REFERENCES "users"("id"),
        "custom_fields" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_portfolios_owner" ON "portfolios" ("owner_id")
    `);

    // Create programs table
    await queryRunner.query(`
      CREATE TABLE "programs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "portfolio_id" UUID REFERENCES "portfolios"("id") ON DELETE CASCADE,
        "owner_id" UUID NOT NULL REFERENCES "users"("id"),
        "custom_fields" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_programs_portfolio" ON "programs" ("portfolio_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_programs_owner" ON "programs" ("owner_id")
    `);

    // Create projects table
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "program_id" UUID REFERENCES "programs"("id") ON DELETE SET NULL,
        "portfolio_id" UUID REFERENCES "portfolios"("id") ON DELETE SET NULL,
        "owner_id" UUID NOT NULL REFERENCES "users"("id"),
        "status" VARCHAR(50) NOT NULL DEFAULT 'active',
        "lifecycle_phase" VARCHAR(50) NOT NULL DEFAULT 'initiation',
        "start_date" DATE,
        "end_date" DATE,
        "template_id" UUID,
        "custom_fields" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "valid_status" CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
        CONSTRAINT "valid_phase" CHECK (lifecycle_phase IN ('initiation', 'planning', 'execution', 'monitoring', 'closure'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_projects_program" ON "projects" ("program_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_projects_portfolio" ON "projects" ("portfolio_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_projects_owner" ON "projects" ("owner_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_projects_status" ON "projects" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to respect foreign key constraints
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "programs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "portfolios"`);
  }
}
