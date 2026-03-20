import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialUserAuthentication1704000000000 implements MigrationInterface {
  name = 'InitialUserAuthentication1704000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "name" VARCHAR(255) NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'active',
        "language" VARCHAR(10),
        "timezone" VARCHAR(50),
        "hourly_rate" DECIMAL(10,2),
        "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
        "avatar_url" VARCHAR(500),
        "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
        "last_login_at" TIMESTAMP,
        "preferences" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "valid_status" CHECK (status IN ('active', 'inactive', 'suspended'))
      )
    `);

    // Create index on email for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users" ("email")
    `);

    // Create user_groups table
    await queryRunner.query(`
      CREATE TABLE "user_groups" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "description" TEXT,
        "is_system" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "resource" VARCHAR(100) NOT NULL,
        "action" VARCHAR(50) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create user_group_members junction table
    await queryRunner.query(`
      CREATE TABLE "user_group_members" (
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "group_id" UUID NOT NULL REFERENCES "user_groups"("id") ON DELETE CASCADE,
        PRIMARY KEY ("user_id", "group_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_group_members_user" ON "user_group_members" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_group_members_group" ON "user_group_members" ("group_id")
    `);

    // Create user_roles junction table
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        PRIMARY KEY ("user_id", "role_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_roles_user" ON "user_roles" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_roles_role" ON "user_roles" ("role_id")
    `);

    // Create role_permissions junction table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        PRIMARY KEY ("role_id", "permission_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_role_permissions_role" ON "role_permissions" ("role_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_role_permissions_permission" ON "role_permissions" ("permission_id")
    `);

    // Insert default roles
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "description", "is_system") VALUES
        ('Admin', 'System administrator with full access', true),
        ('Project Manager', 'Can manage projects and teams', true),
        ('Team Member', 'Can work on assigned tasks', true),
        ('Viewer', 'Read-only access to projects', true)
    `);

    // Insert default permissions
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "resource", "action", "description") VALUES
        ('projects.create', 'projects', 'create', 'Create new projects'),
        ('projects.read', 'projects', 'read', 'View projects'),
        ('projects.update', 'projects', 'update', 'Update projects'),
        ('projects.delete', 'projects', 'delete', 'Delete projects'),
        ('work_packages.create', 'work_packages', 'create', 'Create work packages'),
        ('work_packages.read', 'work_packages', 'read', 'View work packages'),
        ('work_packages.update', 'work_packages', 'update', 'Update work packages'),
        ('work_packages.delete', 'work_packages', 'delete', 'Delete work packages'),
        ('users.create', 'users', 'create', 'Create users'),
        ('users.read', 'users', 'read', 'View users'),
        ('users.update', 'users', 'update', 'Update users'),
        ('users.delete', 'users', 'delete', 'Delete users'),
        ('roles.manage', 'roles', 'manage', 'Manage roles and permissions')
    `);

    // Assign permissions to Admin role (all permissions)
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Admin'
    `);

    // Assign permissions to Project Manager role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Project Manager'
        AND p.name IN (
          'projects.create', 'projects.read', 'projects.update',
          'work_packages.create', 'work_packages.read', 'work_packages.update', 'work_packages.delete',
          'users.read'
        )
    `);

    // Assign permissions to Team Member role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Team Member'
        AND p.name IN (
          'projects.read',
          'work_packages.create', 'work_packages.read', 'work_packages.update',
          'users.read'
        )
    `);

    // Assign permissions to Viewer role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Viewer'
        AND p.name IN ('projects.read', 'work_packages.read', 'users.read')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to respect foreign key constraints
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_group_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_groups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
