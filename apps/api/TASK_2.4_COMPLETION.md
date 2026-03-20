# Task 2.4: Role-Based Access Control (RBAC) Implementation

## Overview

Implemented a comprehensive Role-Based Access Control (RBAC) system for the PROTECHT BIM platform. The system provides granular permission management with default roles and flexible permission assignment capabilities.

## Implementation Details

### 1. Database Schema (Already Existed)

The following tables were already created in the initial migration:

- **roles** - Stores role definitions
  - Fields: id, name, description, is_system, created_at, updated_at
  - System roles cannot be modified or deleted
  
- **permissions** - Stores permission definitions
  - Fields: id, name, resource, action, description, created_at
  - Permissions follow the pattern: `resource:action` (e.g., `projects:create`)
  
- **role_permissions** - Junction table linking roles to permissions
  - Many-to-many relationship between roles and permissions
  
- **user_roles** - Junction table linking users to roles
  - Many-to-many relationship between users and roles

### 2. Repository Layer

Created two new repositories for RBAC management:

**RoleRepository** (`apps/api/src/repositories/RoleRepository.ts`)
- `findAll()` - Get all roles with permissions
- `findById(id)` - Get role by ID with permissions
- `findByName(name)` - Get role by name
- `create(data)` - Create new role
- `update(id, data)` - Update role (system roles protected)
- `delete(id)` - Delete role (system roles protected)
- `assignPermissions(roleId, permissionIds)` - Assign permissions to role
- `removePermissions(roleId, permissionIds)` - Remove permissions from role
- `nameExists(name, excludeId?)` - Check role name uniqueness

**PermissionRepository** (`apps/api/src/repositories/PermissionRepository.ts`)
- `findAll()` - Get all permissions
- `findById(id)` - Get permission by ID
- `findByName(name)` - Get permission by name
- `findByResource(resource)` - Get permissions for a resource
- `create(data)` - Create new permission
- `update(id, data)` - Update permission
- `delete(id)` - Delete permission
- `nameExists(name, excludeId?)` - Check permission name uniqueness

### 3. Service Layer

**RBACService** (`apps/api/src/services/rbac.service.ts`)

Provides high-level RBAC operations:

**Permission Checking:**
- `userHasPermission(userId, permissionName)` - Check if user has specific permission
- `userHasRole(userId, roleName)` - Check if user has specific role
- `userHasAnyRole(userId, roleNames)` - Check if user has any of the specified roles
- `getUserPermissions(userId)` - Get all permissions for a user (aggregated from all roles)

**Role Management:**
- `createRole(data)` - Create new role with optional permissions
- `updateRole(roleId, data)` - Update role details
- `deleteRole(roleId)` - Delete role (protected for system roles)
- `getAllRoles()` - Get all roles
- `getRoleById(roleId)` - Get role by ID

**Permission Management:**
- `assignPermissionsToRole(roleId, permissionIds)` - Assign permissions to role
- `removePermissionsFromRole(roleId, permissionIds)` - Remove permissions from role
- `getAllPermissions()` - Get all permissions
- `createPermission(data)` - Create new permission

**User Role Assignment:**
- `assignRolesToUser(userId, roleIds)` - Assign roles to user
- `removeRolesFromUser(userId, roleIds)` - Remove roles from user

### 4. Middleware

Enhanced authentication middleware (`apps/api/src/middleware/auth.middleware.ts`):

**Existing Middleware:**
- `authenticateToken(authService)` - Verify JWT token and attach user to request
- `requireRole(...roles)` - Check if user has any of the specified roles
- `optionalAuth(authService)` - Optional authentication (doesn't fail if no token)

**New Middleware:**
- `requirePermission(rbacService, permissionName)` - Check if user has specific permission
- `requireAnyPermission(rbacService, permissionNames)` - Check if user has any of the specified permissions

### 5. API Routes

**RBAC Routes** (`apps/api/src/routes/rbac.routes.ts`)

#### Role Management
- `GET /api/v1/roles` - Get all roles (authenticated users)
- `GET /api/v1/roles/:id` - Get role by ID (authenticated users)
- `POST /api/v1/roles` - Create new role (admin only)
- `PATCH /api/v1/roles/:id` - Update role (admin only)
- `DELETE /api/v1/roles/:id` - Delete role (admin only)
- `POST /api/v1/roles/:id/permissions` - Assign permissions to role (admin only)
- `DELETE /api/v1/roles/:id/permissions` - Remove permissions from role (admin only)

#### Permission Management
- `GET /api/v1/permissions` - Get all permissions (authenticated users)
- `POST /api/v1/permissions` - Create new permission (admin only)

#### User Role Assignment
- `POST /api/v1/users/:userId/roles` - Assign roles to user (admin only)
- `GET /api/v1/users/:userId/permissions` - Get user's permissions (self or admin)

### 6. Default Roles and Permissions

**Migration** (`apps/api/src/migrations/1704000001000-SeedDefaultRolesAndPermissions.ts`)

Seeds the database with default permissions and roles:

#### Default Permissions (24 total)

**Projects:**
- `projects:create` - Create new projects
- `projects:read` - View projects
- `projects:update` - Update projects
- `projects:delete` - Delete projects

**Work Packages:**
- `work_packages:create` - Create work packages
- `work_packages:read` - View work packages
- `work_packages:update` - Update work packages
- `work_packages:delete` - Delete work packages

**Users:**
- `users:create` - Create users
- `users:read` - View users
- `users:update` - Update users
- `users:delete` - Delete users

**Roles:**
- `roles:manage` - Manage roles and permissions

**Time Tracking:**
- `time_entries:create` - Log time
- `time_entries:read` - View time entries
- `time_entries:update` - Update time entries
- `time_entries:delete` - Delete time entries

**Cost Management:**
- `costs:create` - Create cost entries
- `costs:read` - View cost entries
- `costs:update` - Update cost entries
- `costs:delete` - Delete cost entries

**BIM Models:**
- `models:create` - Upload BIM models
- `models:read` - View BIM models
- `models:update` - Update BIM models
- `models:delete` - Delete BIM models

#### Default Roles (4 system roles)

**1. Admin**
- Description: Full system access with all permissions
- Permissions: ALL (24 permissions)
- System Role: Yes (cannot be modified or deleted)

**2. Project Manager**
- Description: Can manage projects, work packages, and team members
- Permissions:
  - projects:create, projects:read, projects:update
  - work_packages:create, work_packages:read, work_packages:update, work_packages:delete
  - users:read
  - time_entries:read
  - costs:read, costs:create, costs:update
  - models:create, models:read, models:update
- System Role: Yes

**3. Team Member**
- Description: Can work on assigned tasks and log time
- Permissions:
  - projects:read
  - work_packages:create, work_packages:read, work_packages:update
  - time_entries:create, time_entries:read, time_entries:update
  - models:read
- System Role: Yes

**4. Viewer**
- Description: Read-only access to projects and work packages
- Permissions:
  - projects:read
  - work_packages:read
  - time_entries:read
  - models:read
- System Role: Yes

## Usage Examples

### 1. Using Role-Based Middleware

```typescript
import { authenticateToken, requireRole, createAuthService } from './middleware/auth.middleware';

const authService = createAuthService();

// Require admin role
app.delete('/api/v1/projects/:id',
  authenticateToken(authService),
  requireRole('admin'),
  projectController.deleteProject
);

// Require any of multiple roles
app.post('/api/v1/projects',
  authenticateToken(authService),
  requireRole('admin', 'project_manager'),
  projectController.createProject
);
```

### 2. Using Permission-Based Middleware

```typescript
import { authenticateToken, requirePermission } from './middleware/auth.middleware';
import { RBACService } from './services/rbac.service';

const rbacService = createRBACService();

// Require specific permission
app.post('/api/v1/projects',
  authenticateToken(authService),
  requirePermission(rbacService, 'projects:create'),
  projectController.createProject
);

// Require any of multiple permissions
app.get('/api/v1/reports',
  authenticateToken(authService),
  requireAnyPermission(rbacService, ['costs:read', 'time_entries:read']),
  reportController.getReports
);
```

### 3. Programmatic Permission Checking

```typescript
const rbacService = new RBACService(roleRepo, permissionRepo, userRepo);

// Check if user has permission
const canCreate = await rbacService.userHasPermission(userId, 'projects:create');

// Check if user has role
const isAdmin = await rbacService.userHasRole(userId, 'admin');

// Get all user permissions
const permissions = await rbacService.getUserPermissions(userId);
```

### 4. Managing Roles via API

```typescript
// Create a new custom role
POST /api/v1/roles
{
  "name": "contractor",
  "description": "External contractor with limited access",
  "permissionIds": ["projects:read", "work_packages:read", "models:read"]
}

// Assign permissions to role
POST /api/v1/roles/{roleId}/permissions
{
  "permissionIds": ["time_entries:create", "time_entries:read"]
}

// Assign roles to user
POST /api/v1/users/{userId}/roles
{
  "roleIds": ["contractor-role-id"]
}
```

## Security Features

1. **System Role Protection**: System roles (admin, project_manager, team_member, viewer) cannot be modified or deleted
2. **Admin-Only Management**: Only admins can create/update/delete roles and permissions
3. **Self-Service Permissions**: Users can view their own permissions without admin access
4. **Granular Access Control**: Permissions follow resource:action pattern for fine-grained control
5. **Role Aggregation**: Users can have multiple roles, and permissions are aggregated from all roles

## Testing

To run the migration and seed default roles:

```bash
# Start database (if using Docker)
docker compose up -d postgres

# Run migrations
npm run migration:run
```

## Requirements Satisfied

✅ **Requirement 8.9** - Role-based permissions with granular access control
- Implemented comprehensive RBAC system
- Granular permissions for all major resources
- Flexible role assignment and management

✅ **Task 2.4 Acceptance Criteria:**
- ✅ Create roles and permissions tables (already existed from migration)
- ✅ Implement permission checking middleware (requirePermission, requireAnyPermission)
- ✅ Define default roles: Admin, Project Manager, Team Member, Viewer
- ✅ Create permission assignment API (complete RBAC API with 11 endpoints)

## Next Steps

1. Run the migration to seed default roles and permissions
2. Assign roles to existing users
3. Update existing route handlers to use permission-based middleware
4. Write unit tests for RBAC service and middleware (Task 2.5)
5. Implement permission caching in Redis for better performance

## Files Created/Modified

### Created:
- `apps/api/src/repositories/RoleRepository.ts`
- `apps/api/src/repositories/PermissionRepository.ts`
- `apps/api/src/services/rbac.service.ts`
- `apps/api/src/routes/rbac.routes.ts`
- `apps/api/src/migrations/1704000001000-SeedDefaultRolesAndPermissions.ts`
- `apps/api/scripts/run-migrations.ts`
- `apps/api/TASK_2.4_COMPLETION.md`

### Modified:
- `apps/api/src/middleware/auth.middleware.ts` - Added permission checking middleware
- `apps/api/src/repositories/index.ts` - Exported new repositories
- `apps/api/src/services/index.ts` - Exported RBAC service
- `apps/api/src/routes/index.ts` - Exported RBAC routes
- `apps/api/src/main.ts` - Registered RBAC routes
- `apps/api/package.json` - Updated migration:run script

## API Documentation

All RBAC endpoints are now available at:
- Base URL: `http://localhost:3000/api/v1`
- Roles: `/roles`, `/roles/:id`
- Permissions: `/permissions`
- User Roles: `/users/:userId/roles`, `/users/:userId/permissions`

See the routes file for complete API documentation with request/response formats.
