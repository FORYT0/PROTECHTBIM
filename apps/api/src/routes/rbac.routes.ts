import { Router, Request, Response } from 'express';
import { RBACService } from '../services/rbac.service';
import { RoleRepository } from '../repositories/RoleRepository';
import { PermissionRepository } from '../repositories/PermissionRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AppDataSource } from '../config/data-source';
import { authenticateToken, requireRole, createAuthService } from '../middleware/auth.middleware';

const router = Router();
const authService = createAuthService();

// Create service instances
const createRBACService = () => {
  const roleRepository = new RoleRepository(AppDataSource);
  const permissionRepository = new PermissionRepository(AppDataSource);
  const userRepository = new UserRepository(AppDataSource);
  return new RBACService(roleRepository, permissionRepository, userRepository);
};

// ============ Role Management ============

/**
 * GET /api/v1/roles
 * Get all roles
 */
router.get('/roles', authenticateToken(authService), async (_req: Request, res: Response) => {
  try {
    const rbacService = createRBACService();
    const roles = await rbacService.getAllRoles();

    return res.json({
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions.map((p) => ({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action,
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch roles',
    });
  }
});

/**
 * GET /api/v1/roles/:id
 * Get role by ID
 */
router.get('/roles/:id', authenticateToken(authService), async (req: Request, res: Response) => {
  try {
    const rbacService = createRBACService();
    const role = await rbacService.getRoleById(req.params.id);

    if (!role) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Role not found',
      });
    }

    return res.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions.map((p) => ({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action,
          description: p.description,
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch role',
    });
  }
});

/**
 * POST /api/v1/roles
 * Create a new role (Admin only)
 */
router.post(
  '/roles',
  authenticateToken(authService),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { name, description, permissionIds } = req.body;

      if (!name) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Role name is required',
        });
      }

      const rbacService = createRBACService();
      const role = await rbacService.createRole({
        name,
        description,
        permissionIds,
      });

      return res.status(201).json({
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          createdAt: role.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating role:', error);
      if (error.message === 'Role name already exists') {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create role',
      });
    }
  }
);

/**
 * PATCH /api/v1/roles/:id
 * Update a role (Admin only)
 */
router.patch(
  '/roles/:id',
  authenticateToken(authService),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;

      const rbacService = createRBACService();
      const role = await rbacService.updateRole(req.params.id, {
        name,
        description,
      });

      return res.json({
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          updatedAt: role.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      if (error.message === 'Role not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      if (error.message === 'Cannot update system roles') {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update role',
      });
    }
  }
);

/**
 * DELETE /api/v1/roles/:id
 * Delete a role (Admin only)
 */
router.delete(
  '/roles/:id',
  authenticateToken(authService),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const rbacService = createRBACService();
      await rbacService.deleteRole(req.params.id);

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      if (error.message === 'Role not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      if (error.message === 'Cannot delete system roles') {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete role',
      });
    }
  }
);

/**
 * POST /api/v1/roles/:id/permissions
 * Assign permissions to a role (Admin only)
 */
router.post(
  '/roles/:id/permissions',
  authenticateToken(authService),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'permissionIds must be a non-empty array',
        });
      }

      const rbacService = createRBACService();
      const role = await rbacService.assignPermissionsToRole(req.params.id, permissionIds);

      return res.json({
        role: {
          id: role.id,
          name: role.name,
          permissions: role.permissions.map((p) => ({
            id: p.id,
            name: p.name,
            resource: p.resource,
            action: p.action,
          })),
        },
      });
    } catch (error: any) {
      console.error('Error assigning permissions:', error);
      if (error.message === 'Role not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to assign permissions',
      });
    }
  }
);

/**
 * DELETE /api/v1/roles/:id/permissions
 * Remove permissions from a role (Admin only)
 */
router.delete(
  '/roles/:id/permissions',
  authenticateToken(authService),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'permissionIds must be a non-empty array',
        });
      }

      const rbacService = createRBACService();
      const role = await rbacService.removePermissionsFromRole(req.params.id, permissionIds);

      return res.json({
        role: {
          id: role.id,
          name: role.name,
          permissions: role.permissions.map((p) => ({
            id: p.id,
            name: p.name,
            resource: p.resource,
            action: p.action,
          })),
        },
      });
    } catch (error: any) {
      console.error('Error removing permissions:', error);
      if (error.message === 'Role not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove permissions',
      });
    }
  }
);

// ============ Permission Management ============

/**
 * GET /api/v1/permissions
 * Get all permissions
 */
router.get('/permissions', authenticateToken(authService), async (_req: Request, res: Response) => {
  try {
    const rbacService = createRBACService();
    const permissions = await rbacService.getAllPermissions();

    return res.json({
      permissions: permissions.map((p) => ({
        id: p.id,
        name: p.name,
        resource: p.resource,
        action: p.action,
        description: p.description,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch permissions',
    });
  }
});

/**
 * POST /api/v1/permissions
 * Create a new permission (Admin only)
 */
router.post(
  '/permissions',
  authenticateToken(authService),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { name, resource, action, description } = req.body;

      if (!name || !resource || !action) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'name, resource, and action are required',
        });
      }

      const rbacService = createRBACService();
      const permission = await rbacService.createPermission({
        name,
        resource,
        action,
        description,
      });

      return res.status(201).json({
        permission: {
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          createdAt: permission.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating permission:', error);
      if (error.message === 'Permission name already exists') {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create permission',
      });
    }
  }
);

// ============ User Role Assignment ============

/**
 * POST /api/v1/users/:userId/roles
 * Assign roles to a user (Admin only)
 */
router.post(
  '/users/:userId/roles',
  authenticateToken(authService),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { roleIds } = req.body;

      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'roleIds must be a non-empty array',
        });
      }

      const rbacService = createRBACService();
      await rbacService.assignRolesToUser(req.params.userId, roleIds);

      return res.json({
        message: 'Roles assigned successfully',
      });
    } catch (error: any) {
      console.error('Error assigning roles:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to assign roles',
      });
    }
  }
);

/**
 * GET /api/v1/users/:userId/permissions
 * Get all permissions for a user
 */
router.get(
  '/users/:userId/permissions',
  authenticateToken(authService),
  async (req: Request, res: Response) => {
    try {
      // Users can only view their own permissions unless they're admin
      if (req.user!.userId !== req.params.userId && !req.user!.roles.includes('admin')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view your own permissions',
        });
      }

      const rbacService = createRBACService();
      const permissions = await rbacService.getUserPermissions(req.params.userId);

      return res.json({
        permissions: permissions.map((p) => ({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action,
          description: p.description,
        })),
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch user permissions',
      });
    }
  }
);

export default router;
