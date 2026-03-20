import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { UserGroup } from '../entities/UserGroup';

export class UserGroupRepository {
  private repository: Repository<UserGroup>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserGroup);
  }

  /**
   * Create a new user group
   */
  async create(groupData: Partial<UserGroup>): Promise<UserGroup> {
    const group = this.repository.create(groupData);
    return await this.repository.save(group);
  }

  /**
   * Find group by ID
   */
  async findById(id: string): Promise<UserGroup | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['users'],
    });
  }

  /**
   * Find all groups
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
  }): Promise<{ groups: UserGroup[]; total: number }> {
    const [groups, total] = await this.repository.findAndCount({
      relations: ['users'],
      skip: options?.skip,
      take: options?.take,
      order: { name: 'ASC' },
    });

    return { groups, total };
  }

  /**
   * Update group
   */
  async update(id: string, groupData: Partial<UserGroup>): Promise<UserGroup | null> {
    await this.repository.update(id, groupData);
    return await this.findById(id);
  }

  /**
   * Delete group
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Add users to group
   */
  async addUsers(groupId: string, userIds: string[]): Promise<UserGroup | null> {
    const group = await this.repository.findOne({
      where: { id: groupId },
      relations: ['users'],
    });

    if (!group) {
      return null;
    }

    // Load users by IDs
    const users = await this.repository.manager
      .getRepository('User')
      .find({
        where: userIds.map(id => ({ id })),
      });

    // Add new users (avoid duplicates)
    const existingUserIds = new Set(group.users.map(u => u.id));
    const newUsers = users.filter(u => !existingUserIds.has(u.id));
    
    group.users = [...group.users, ...newUsers] as any;
    await this.repository.save(group);

    return await this.findById(groupId);
  }

  /**
   * Remove users from group
   */
  async removeUsers(groupId: string, userIds: string[]): Promise<UserGroup | null> {
    const group = await this.repository.findOne({
      where: { id: groupId },
      relations: ['users'],
    });

    if (!group) {
      return null;
    }

    const userIdsToRemove = new Set(userIds);
    group.users = group.users.filter(u => !userIdsToRemove.has(u.id));
    
    await this.repository.save(group);

    return await this.findById(groupId);
  }

  /**
   * Check if group name exists
   */
  async nameExists(name: string, excludeGroupId?: string): Promise<boolean> {
    const where: FindOptionsWhere<UserGroup> = { name };
    
    const count = await this.repository.count({ where });
    
    if (excludeGroupId) {
      const group = await this.repository.findOne({ where: { name } });
      return count > 0 && group?.id !== excludeGroupId;
    }
    
    return count > 0;
  }
}
