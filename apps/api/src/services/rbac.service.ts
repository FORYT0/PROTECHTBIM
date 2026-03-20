import { RoleRepository } from '../repositories/RoleRepository';
import { PermissionRepository } from '../repositories/PermissionRepository';
import { UserRepository } from '../repositories/UserRepository';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';

export class RBACService {
  constructor(
    private roleRepository: RoleRepository,
    private permissionRepository: PermissionRepository,
    private userRepository: UserRepository
  ) {}

  /**
   * Check if a user has a specific permission
   */
  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) return false;

    // Check if any of the user's roles have the permission
    for (const role of user.roles) {
      const roleWithPermissions = await this.roleRepository.findById(role.id);
      if (roleWithPermissions) {
        const hasPermission = roleWithPermissions.permissions.some(
          (p) => p.name === permissionName
        );
        if (hasPermission) return true;
      }
    }

    return false;
  }

  /**
   * Check if a user has a specific role
   */
  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) return false;

    return user.roles.some((role) => role.name === roleName);
  }

  /**
   * Check if a user has any of the specified roles
   */
  async userHasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) return false;

    return user.roles.some((role) => roleNames.includes(role.name));
  }

  /**
   * Get all permissions for a user (from all their roles)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) return [];

    const permissionsMap = new Map<string, Permission>();

    for (const role of user.roles) {
      const roleWithPermissions = await this.roleRepository.findById(role.id);
      if (roleWithPermissions) {
        roleWithPermissions.permissions.forEach((permission) => {
          permissionsMap.set(permission.id, permission);
        });
      }
    }

    return Array.from(permissionsMap.values());
  }

  /**
   * Assign roles to a user
   */
  async assignRolesToUser(userId: string, roleIds: string[]): Promise<void> {
    await this.userRepository.assignRoles(userId, roleIds);
  }

  /**
   * Remove roles from a user
   */
  async removeRolesFromUser(userId: string, roleIds: string[]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    user.roles = user.roles.filter((role) => !roleIds.includes(role.id));
    await this.userRepository.update(userId, { roles: user.roles } as any);
  }

  /**
   * Create a new role
   */
  async createRole(data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }): Promise<Role> {
    const exists = await this.roleRepository.nameExists(data.name);
    if (exists) {
      throw new Error('Role name already exists');
    }

    const role = await this.roleRepository.create({
      name: data.name,
      description: data.description,
      isSystem: false,
    });

    if (data.permissionIds && data.permissionIds.length > 0) {
      await this.roleRepository.assignPermissions(role.id, data.permissionIds);
    }

    return role;
  }

  /**
   * Update a role
   */
  async updateRole(
    roleId: string,
    data: { name?: string; description?: string }
  ): Promise<Role> {
    if (data.name) {
      const exists = await this.roleRepository.nameExists(data.name, roleId);
      if (exists) {
        throw new Error('Role name already exists');
      }
    }

    const role = await this.roleRepository.update(roleId, data);
    if (!role) throw new Error('Role not found');

    return role;
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<void> {
    const deleted = await this.roleRepository.delete(roleId);
    if (!deleted) throw new Error('Role not found');
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.roleRepository.assignPermissions(roleId, permissionIds);
    if (!role) throw new Error('Role not found');
    return role;
  }

  /**
   * Remove permissions from a role
   */
  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.roleRepository.removePermissions(roleId, permissionIds);
    if (!role) throw new Error('Role not found');
    return role;
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<Role | null> {
    return this.roleRepository.findById(roleId);
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.findAll();
  }

  /**
   * Create a new permission
   */
  async createPermission(data: {
    name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<Permission> {
    const exists = await this.permissionRepository.nameExists(data.name);
    if (exists) {
      throw new Error('Permission name already exists');
    }

    return this.permissionRepository.create(data);
  }
}
