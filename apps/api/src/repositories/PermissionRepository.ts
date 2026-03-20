import { DataSource, Repository } from 'typeorm';
import { Permission } from '../entities/Permission';

export class PermissionRepository {
  private repository: Repository<Permission>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Permission);
  }

  async findAll(): Promise<Permission[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<Permission | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.repository.findOne({
      where: { name },
    });
  }

  async findByResource(resource: string): Promise<Permission[]> {
    return this.repository.find({
      where: { resource },
    });
  }

  async create(data: {
    name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<Permission> {
    const permission = this.repository.create(data);
    return this.repository.save(permission);
  }

  async update(
    id: string,
    data: Partial<Pick<Permission, 'description'>>
  ): Promise<Permission | null> {
    const permission = await this.findById(id);
    if (!permission) return null;

    Object.assign(permission, data);
    return this.repository.save(permission);
  }

  async delete(id: string): Promise<boolean> {
    const permission = await this.findById(id);
    if (!permission) return false;

    await this.repository.remove(permission);
    return true;
  }

  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('permission')
      .where('permission.name = :name', { name });

    if (excludeId) {
      query.andWhere('permission.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }
}
