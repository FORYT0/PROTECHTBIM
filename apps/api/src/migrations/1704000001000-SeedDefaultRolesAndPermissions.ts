import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultRolesAndPermissions1704000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Define default permissions
    const permissions = [
      // Project permissions
      { name: 'projects:create', resource: 'projects', action: 'create', description: 'Create new projects' },
      { name: 'projects:read', resource: 'projects', action: 'read', description: 'View projects' },
      { name: 'projects:update', resource: 'projects', action: 'update', description: 'Update projects' },
      { name: 'projects:delete', resource: 'projects', action: 'delete', description: 'Delete projects' },
      
      // Work package permissions
      { name: 'work_packages:create', resource: 'work_packages', action: 'create', description: 'Create work packages' },
      { name: 'work_packages:read', resource: 'work_packages', action: 'read', description: 'View work packages' },
      { name: 'work_packages:update', resource: 'work_packages', action: 'update', description: 'Update work packages' },
      { name: 'work_packages:delete', resource: 'work_packages', action: 'delete', description: 'Delete work packages' },
      
      // User management permissions
      { name: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
      { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
      { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
      { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
      
      // Role and permission management
      { name: 'roles:manage', resource: 'roles', action: 'manage', description: 'Manage roles and permissions' },
      
      // Time tracking permissions
      { name: 'time_entries:create', resource: 'time_entries', action: 'create', description: 'Log time' },
      { name: 'time_entries:read', resource: 'time_entries', action: 'read', description: 'View time entries' },
      { name: 'time_entries:update', resource: 'time_entries', action: 'update', description: 'Update time entries' },
      { name: 'time_entries:delete', resource: 'time_entries', action: 'delete', description: 'Delete time entries' },
      
      // Cost management permissions
      { name: 'costs:create', resource: 'costs', action: 'create', description: 'Create cost entries' },
      { name: 'costs:read', resource: 'costs', action: 'read', description: 'View cost entries' },
      { name: 'costs:update', resource: 'costs', action: 'update', description: 'Update cost entries' },
      { name: 'costs:delete', resource: 'costs', action: 'delete', description: 'Delete cost entries' },
      
      // BIM model permissions
      { name: 'models:create', resource: 'models', action: 'create', description: 'Upload BIM models' },
      { name: 'models:read', resource: 'models', action: 'read', description: 'View BIM models' },
      { name: 'models:update', resource: 'models', action: 'update', description: 'Update BIM models' },
      { name: 'models:delete', resource: 'models', action: 'delete', description: 'Delete BIM models' },
    ];

    // Insert permissions
    for (const permission of permissions) {
      await queryRunner.query(
        `INSERT INTO permissions (name, resource, action, description, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [permission.name, permission.resource, permission.action, permission.description]
      );
    }

    // Get all permission IDs for role assignment
    const allPermissions = await queryRunner.query(`SELECT id, name FROM permissions`);
    const permissionMap = new Map(allPermissions.map((p: any) => [p.name, p.id]));

    // Define default roles with their permissions
    const roles = [
      {
        name: 'admin',
        description: 'Full system access with all permissions',
        isSystem: true,
        permissions: Array.from(permissionMap.values()), // All permissions
      },
      {
        name: 'project_manager',
        description: 'Can manage projects, work packages, and team members',
        isSystem: true,
        permissions: [
          'projects:create',
          'projects:read',
          'projects:update',
          'work_packages:create',
          'work_packages:read',
          'work_packages:update',
          'work_packages:delete',
          'users:read',
          'time_entries:read',
          'costs:read',
          'costs:create',
          'costs:update',
          'models:create',
          'models:read',
          'models:update',
        ].map((name) => permissionMap.get(name)),
      },
      {
        name: 'team_member',
        description: 'Can work on assigned tasks and log time',
        isSystem: true,
        permissions: [
          'projects:read',
          'work_packages:create',
          'work_packages:read',
          'work_packages:update',
          'time_entries:create',
          'time_entries:read',
          'time_entries:update',
          'models:read',
        ].map((name) => permissionMap.get(name)),
      },
      {
        name: 'viewer',
        description: 'Read-only access to projects and work packages',
        isSystem: true,
        permissions: [
          'projects:read',
          'work_packages:read',
          'time_entries:read',
          'models:read',
        ].map((name) => permissionMap.get(name)),
      },
    ];

    // Insert roles and assign permissions
    for (const role of roles) {
      // Insert role
      const result = await queryRunner.query(
        `INSERT INTO roles (name, description, is_system, created_at, updated_at) 
         VALUES ($1, $2, $3, NOW(), NOW()) 
         RETURNING id`,
        [role.name, role.description, role.isSystem]
      );
      const roleId = result[0].id;

      // Assign permissions to role
      for (const permissionId of role.permissions) {
        if (permissionId) {
          await queryRunner.query(
            `INSERT INTO role_permissions (role_id, permission_id) 
             VALUES ($1, $2)`,
            [roleId, permissionId]
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role-permission associations
    await queryRunner.query(`DELETE FROM role_permissions`);
    
    // Remove system roles
    await queryRunner.query(`DELETE FROM roles WHERE is_system = true`);
    
    // Remove permissions
    await queryRunner.query(`DELETE FROM permissions`);
  }
}
