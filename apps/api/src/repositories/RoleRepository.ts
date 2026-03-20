import { DataSource, Repository } from 'typeorm';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';

export class RoleRepository {
  private repository: Repository<Role>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Role);
  }

  async findAll(): Promise<Role[]> {
    return this.repository.find({
      relations: ['permissions'],
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['permissions'],
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.repository.findOne({
      where: { name },
      relations: ['permissions'],
    });
  }

  async create(data: {
    name: string;
    description?: string;
    isSystem?: boolean;
  }): Promise<Role> {
    const role = this.repository.create(data);
    return this.repository.save(role);
  }

  async update(
    id: string,
    data: Partial<Pick<Role, 'name' | 'description'>>
  ): Promise<Role | null> {
    const role = await this.findById(id);
    if (!role) return null;

    // Don't allow updating system roles
    if (role.isSystem) {
      throw new Error('Cannot update system roles');
    }

    Object.assign(role, data);
    return this.repository.save(role);
  }

  async delete(id: string): Promise<boolean> {
    const role = await this.findById(id);
    if (!role) return false;

    // Don't allow deleting system roles
    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    await this.repository.remove(role);
    return true;
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<Role | null> {
    const role = await this.repository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) return null;

    const permissionRepository = this.repository.manager.getRepository(Permission);
    const permissions = await permissionRepository.findByIds(permissionIds);

    role.permissions = permissions;
    return this.repository.save(role);
  }

  async removePermissions(roleId: string, permissionIds: string[]): Promise<Role | null> {
    const role = await this.repository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) return null;

    role.permissions = role.permissions.filter(
      (p) => !permissionIds.includes(p.id)
    );
    return this.repository.save(role);
  }

  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    const query = this.repository.createQueryBuilder('role').where('role.name = :name', { name });

    if (excludeId) {
      query.andWhere('role.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }
}
