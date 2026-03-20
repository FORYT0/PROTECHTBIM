import { Repository, DataSource, FindOptionsWhere, Like } from 'typeorm';
import { User } from '../entities/User';

export class UserRepository {
  private repository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  /**
   * Create a new user
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['roles', 'groups'],
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email },
      relations: ['roles', 'groups'],
    });
  }

  /**
   * Find all users with optional filtering
   */
  async findAll(options?: {
    status?: 'active' | 'inactive' | 'suspended';
    isPlaceholder?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ users: User[]; total: number }> {
    const where: FindOptionsWhere<User> = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.isPlaceholder !== undefined) {
      where.isPlaceholder = options.isPlaceholder;
    }

    const [users, total] = await this.repository.findAndCount({
      where,
      relations: ['roles', 'groups'],
      skip: options?.skip,
      take: options?.take,
      order: { name: 'ASC' },
    });

    return { users, total };
  }

  async search(query: string, limit: number = 10): Promise<User[]> {
    return await this.repository.find({
      where: [
        { name: Like(`%${query}%`) },
        { email: Like(`%${query}%`) },
      ],
      take: limit,
      order: { name: 'ASC' },
      select: ['id', 'name', 'email', 'avatarUrl'],
    });
  }

  /**
   * Update user
   */
  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, userData);
    return await this.findById(id);
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.repository.update(id, { lastLoginAt: new Date() });
  }

  /**
   * Assign roles to user
   */
  async assignRoles(userId: string, roleIds: string[]): Promise<User | null> {
    const user = await this.repository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      return null;
    }

    // Load roles by IDs
    const roles = await this.repository.manager
      .getRepository('Role')
      .find({
        where: roleIds.map(id => ({ id })),
      });

    user.roles = roles as any;
    await this.repository.save(user);

    return await this.findById(userId);
  }

  /**
   * Assign groups to user
   */
  async assignGroups(userId: string, groupIds: string[]): Promise<User | null> {
    const user = await this.repository.findOne({
      where: { id: userId },
      relations: ['groups'],
    });

    if (!user) {
      return null;
    }

    // Load groups by IDs
    const groups = await this.repository.manager
      .getRepository('UserGroup')
      .find({
        where: groupIds.map(id => ({ id })),
      });

    user.groups = groups as any;
    await this.repository.save(user);

    return await this.findById(userId);
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const where: FindOptionsWhere<User> = { email };

    const count = await this.repository.count({ where });

    if (excludeUserId) {
      const user = await this.repository.findOne({ where: { email } });
      return count > 0 && user?.id !== excludeUserId;
    }

    return count > 0;
  }
}
