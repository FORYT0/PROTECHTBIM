import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { WorkPackageWatcher } from '../entities/WorkPackageWatcher';

export class WorkPackageWatcherRepository {
  private repository: Repository<WorkPackageWatcher>;

  constructor() {
    this.repository = AppDataSource.getRepository(WorkPackageWatcher);
  }

  /**
   * Add a watcher to a work package
   */
  async addWatcher(workPackageId: string, userId: string): Promise<WorkPackageWatcher> {
    const watcher = this.repository.create({
      workPackageId,
      userId,
    });
    return await this.repository.save(watcher);
  }

  /**
   * Remove a watcher from a work package
   */
  async removeWatcher(workPackageId: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({
      workPackageId,
      userId,
    });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Get all watchers for a work package
   */
  async getWatchers(workPackageId: string): Promise<WorkPackageWatcher[]> {
    return await this.repository.find({
      where: { workPackageId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Check if a user is watching a work package
   */
  async isWatching(workPackageId: string, userId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { workPackageId, userId },
    });
    return count > 0;
  }

  /**
   * Get all work packages a user is watching
   */
  async getWatchedWorkPackages(userId: string): Promise<WorkPackageWatcher[]> {
    return await this.repository.find({
      where: { userId },
      relations: ['workPackage'],
      order: { createdAt: 'DESC' },
    });
  }
}

export const createWorkPackageWatcherRepository = (): WorkPackageWatcherRepository => {
  return new WorkPackageWatcherRepository();
};
