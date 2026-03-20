import { RBACService } from '../../services/rbac.service';
import { RoleRepository } from '../../repositories/RoleRepository';
import { PermissionRepository } from '../../repositories/PermissionRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { User } from '../../entities/User';
import { Role } from '../../entities/Role';
import { Permission } from '../../entities/Permission';

// Mock the repositories
jest.mock('../../repositories/RoleRepository');
jest.mock('../../repositories/PermissionRepository');
jest.mock('../../repositories/UserRepository');

describe('RBACService', () => {
  let rbacService: RBACService;
  let mockRoleRepository: jest.Mocked<RoleRepository>;
  let mockPermissionRepository: jest.Mocked<PermissionRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockPermission: Permission = {
    id: 'perm-1',
    name: 'project:create',
    resource: 'project',
    action: 'create',
    description: 'Create projects',
    createdAt: new Date(),
    roles: [],
  };

  const mockRole: Role = {
    id: 'role-1',
    name: 'project_manager',
    description: 'Project Manager',
    isSystem: false,
    permissions: [mockPermission],
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hash',
    status: 'active',
    currency: 'USD',
    isPlaceholder: false,
    roles: [mockRole],
    groups: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRoleRepository = new RoleRepository({} as any) as jest.Mocked<RoleRepository>;
    mockPermissionRepository = new PermissionRepository({} as any) as jest.Mocked<PermissionRepository>;
    mockUserRepository = new UserRepository({} as any) as jest.Mocked<UserRepository>;

    rbacService = new RBACService(
      mockRoleRepository,
      mockPermissionRepository,
      mockUserRepository
    );
  });

  describe('userHasPermission', () => {
    it('should return true when user has the permission', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRoleRepository.findById.mockResolvedValue(mockRole);

      const result = await rbacService.userHasPermission('user-1', 'project:create');

      expect(result).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
    });

    it('should return false when user does not have the permission', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRoleRepository.findById.mockResolvedValue(mockRole);

      const result = await rbacService.userHasPermission('user-1', 'project:delete');

      expect(result).toBe(false);
    });

    it('should return false when user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await rbacService.userHasPermission('nonexistent', 'project:create');

      expect(result).toBe(false);
    });

    it('should return false when user has no roles', async () => {
      const userWithoutRoles = { ...mockUser, roles: [] };
      mockUserRepository.findById.mockResolvedValue(userWithoutRoles);

      const result = await rbacService.userHasPermission('user-1', 'project:create');

      expect(result).toBe(false);
    });

    it('should check multiple roles for permission', async () => {
      const additionalPermission: Permission = {
        id: 'perm-2',
        name: 'workpackage:edit',
        resource: 'workpackage',
        action: 'edit',
        description: 'Edit work packages',
        createdAt: new Date(),
        roles: [],
      };

      const additionalRole: Role = {
        id: 'role-2',
        name: 'team_member',
        description: 'Team Member',
        isSystem: false,
        permissions: [additionalPermission],
        users: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userWithMultipleRoles = {
        ...mockUser,
        roles: [mockRole, additionalRole],
      };

      mockUserRepository.findById.mockResolvedValue(userWithMultipleRoles);
      mockRoleRepository.findById
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce(additionalRole);

      const result = await rbacService.userHasPermission('user-1', 'workpackage:edit');

      expect(result).toBe(true);
    });
  });

  describe('userHasRole', () => {
    it('should return true when user has the role', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await rbacService.userHasRole('user-1', 'project_manager');

      expect(result).toBe(true);
    });

    it('should return false when user does not have the role', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await rbacService.userHasRole('user-1', 'admin');

      expect(result).toBe(false);
    });

    it('should return false when user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await rbacService.userHasRole('nonexistent', 'project_manager');

      expect(result).toBe(false);
    });
  });

  describe('userHasAnyRole', () => {
    it('should return true when user has at least one of the roles', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await rbacService.userHasAnyRole('user-1', ['admin', 'project_manager']);

      expect(result).toBe(true);
    });

    it('should return false when user has none of the roles', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await rbacService.userHasAnyRole('user-1', ['admin', 'viewer']);

      expect(result).toBe(false);
    });

    it('should return false when user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await rbacService.userHasAnyRole('nonexistent', ['admin']);

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions from all user roles', async () => {
      const permission2: Permission = {
        id: 'perm-2',
        name: 'project:edit',
        resource: 'project',
        action: 'edit',
        description: 'Edit projects',
        createdAt: new Date(),
        roles: [],
      };

      const role2: Role = {
        id: 'role-2',
        name: 'editor',
        description: 'Editor',
        isSystem: false,
        permissions: [permission2],
        users: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userWithMultipleRoles = {
        ...mockUser,
        roles: [mockRole, role2],
      };

      mockUserRepository.findById.mockResolvedValue(userWithMultipleRoles);
      mockRoleRepository.findById
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce(role2);

      const result = await rbacService.getUserPermissions('user-1');

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockPermission);
      expect(result).toContainEqual(permission2);
    });

    it('should deduplicate permissions from multiple roles', async () => {
      const role2: Role = {
        id: 'role-2',
        name: 'editor',
        description: 'Editor',
        isSystem: false,
        permissions: [mockPermission], // Same permission as role1
        users: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userWithMultipleRoles = {
        ...mockUser,
        roles: [mockRole, role2],
      };

      mockUserRepository.findById.mockResolvedValue(userWithMultipleRoles);
      mockRoleRepository.findById
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce(role2);

      const result = await rbacService.getUserPermissions('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockPermission.id);
    });

    it('should return empty array when user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await rbacService.getUserPermissions('nonexistent');

      expect(result).toEqual([]);
    });

    it('should return empty array when user has no roles', async () => {
      const userWithoutRoles = { ...mockUser, roles: [] };
      mockUserRepository.findById.mockResolvedValue(userWithoutRoles);

      const result = await rbacService.getUserPermissions('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('assignRolesToUser', () => {
    it('should assign roles to user', async () => {
      mockUserRepository.assignRoles.mockResolvedValue(mockUser);

      await rbacService.assignRolesToUser('user-1', ['role-1', 'role-2']);

      expect(mockUserRepository.assignRoles).toHaveBeenCalledWith('user-1', ['role-1', 'role-2']);
    });
  });

  describe('removeRolesFromUser', () => {
    it('should remove roles from user', async () => {
      const userWithMultipleRoles = {
        ...mockUser,
        roles: [
          mockRole,
          { id: 'role-2', name: 'editor' } as Role,
        ],
      };

      mockUserRepository.findById.mockResolvedValue(userWithMultipleRoles);
      mockUserRepository.update.mockResolvedValue(mockUser);

      await rbacService.removeRolesFromUser('user-1', ['role-2']);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          roles: expect.arrayContaining([
            expect.objectContaining({ id: 'role-1' }),
          ]),
        })
      );
    });

    it('should throw error when user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        rbacService.removeRolesFromUser('nonexistent', ['role-1'])
      ).rejects.toThrow('User not found');
    });
  });

  describe('createRole', () => {
    it('should create a new role without permissions', async () => {
      mockRoleRepository.nameExists.mockResolvedValue(false);
      mockRoleRepository.create.mockResolvedValue(mockRole);

      const result = await rbacService.createRole({
        name: 'new_role',
        description: 'New Role',
      });

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.create).toHaveBeenCalledWith({
        name: 'new_role',
        description: 'New Role',
        isSystem: false,
      });
    });

    it('should create a new role with permissions', async () => {
      mockRoleRepository.nameExists.mockResolvedValue(false);
      mockRoleRepository.create.mockResolvedValue(mockRole);
      mockRoleRepository.assignPermissions.mockResolvedValue(mockRole);

      const result = await rbacService.createRole({
        name: 'new_role',
        description: 'New Role',
        permissionIds: ['perm-1', 'perm-2'],
      });

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.assignPermissions).toHaveBeenCalledWith(
        mockRole.id,
        ['perm-1', 'perm-2']
      );
    });

    it('should throw error when role name already exists', async () => {
      mockRoleRepository.nameExists.mockResolvedValue(true);

      await expect(
        rbacService.createRole({
          name: 'existing_role',
          description: 'Existing Role',
        })
      ).rejects.toThrow('Role name already exists');
    });
  });

  describe('updateRole', () => {
    it('should update role name and description', async () => {
      mockRoleRepository.nameExists.mockResolvedValue(false);
      mockRoleRepository.update.mockResolvedValue(mockRole);

      const result = await rbacService.updateRole('role-1', {
        name: 'updated_role',
        description: 'Updated Role',
      });

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.update).toHaveBeenCalledWith('role-1', {
        name: 'updated_role',
        description: 'Updated Role',
      });
    });

    it('should throw error when new name already exists', async () => {
      mockRoleRepository.nameExists.mockResolvedValue(true);

      await expect(
        rbacService.updateRole('role-1', {
          name: 'existing_role',
        })
      ).rejects.toThrow('Role name already exists');
    });

    it('should throw error when role is not found', async () => {
      mockRoleRepository.nameExists.mockResolvedValue(false);
      mockRoleRepository.update.mockResolvedValue(null);

      await expect(
        rbacService.updateRole('nonexistent', {
          name: 'new_name',
        })
      ).rejects.toThrow('Role not found');
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      mockRoleRepository.delete.mockResolvedValue(true);

      await rbacService.deleteRole('role-1');

      expect(mockRoleRepository.delete).toHaveBeenCalledWith('role-1');
    });

    it('should throw error when role is not found', async () => {
      mockRoleRepository.delete.mockResolvedValue(false);

      await expect(
        rbacService.deleteRole('nonexistent')
      ).rejects.toThrow('Role not found');
    });
  });

  describe('assignPermissionsToRole', () => {
    it('should assign permissions to role', async () => {
      mockRoleRepository.assignPermissions.mockResolvedValue(mockRole);

      const result = await rbacService.assignPermissionsToRole('role-1', ['perm-1', 'perm-2']);

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.assignPermissions).toHaveBeenCalledWith('role-1', ['perm-1', 'perm-2']);
    });

    it('should throw error when role is not found', async () => {
      mockRoleRepository.assignPermissions.mockResolvedValue(null);

      await expect(
        rbacService.assignPermissionsToRole('nonexistent', ['perm-1'])
      ).rejects.toThrow('Role not found');
    });
  });

  describe('removePermissionsFromRole', () => {
    it('should remove permissions from role', async () => {
      mockRoleRepository.removePermissions.mockResolvedValue(mockRole);

      const result = await rbacService.removePermissionsFromRole('role-1', ['perm-1']);

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.removePermissions).toHaveBeenCalledWith('role-1', ['perm-1']);
    });

    it('should throw error when role is not found', async () => {
      mockRoleRepository.removePermissions.mockResolvedValue(null);

      await expect(
        rbacService.removePermissionsFromRole('nonexistent', ['perm-1'])
      ).rejects.toThrow('Role not found');
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const roles = [mockRole];
      mockRoleRepository.findAll.mockResolvedValue(roles);

      const result = await rbacService.getAllRoles();

      expect(result).toEqual(roles);
      expect(mockRoleRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getRoleById', () => {
    it('should return role by id', async () => {
      mockRoleRepository.findById.mockResolvedValue(mockRole);

      const result = await rbacService.getRoleById('role-1');

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.findById).toHaveBeenCalledWith('role-1');
    });

    it('should return null when role is not found', async () => {
      mockRoleRepository.findById.mockResolvedValue(null);

      const result = await rbacService.getRoleById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions', async () => {
      const permissions = [mockPermission];
      mockPermissionRepository.findAll.mockResolvedValue(permissions);

      const result = await rbacService.getAllPermissions();

      expect(result).toEqual(permissions);
      expect(mockPermissionRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      mockPermissionRepository.nameExists.mockResolvedValue(false);
      mockPermissionRepository.create.mockResolvedValue(mockPermission);

      const result = await rbacService.createPermission({
        name: 'project:create',
        resource: 'project',
        action: 'create',
        description: 'Create projects',
      });

      expect(result).toEqual(mockPermission);
      expect(mockPermissionRepository.create).toHaveBeenCalledWith({
        name: 'project:create',
        resource: 'project',
        action: 'create',
        description: 'Create projects',
      });
    });

    it('should throw error when permission name already exists', async () => {
      mockPermissionRepository.nameExists.mockResolvedValue(true);

      await expect(
        rbacService.createPermission({
          name: 'project:create',
          resource: 'project',
          action: 'create',
        })
      ).rejects.toThrow('Permission name already exists');
    });
  });
});
