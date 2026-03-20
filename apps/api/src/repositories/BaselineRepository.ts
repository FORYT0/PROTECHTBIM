import { Repository, DataSource } from 'typeorm';
import { Baseline } from '../entities/Baseline';
import { BaselineWorkPackage } from '../entities/BaselineWorkPackage';
import { AppDataSource } from '../config/data-source';

export interface CreateBaselineData {
  projectId: string;
  name: string;
  description?: string;
  createdBy: string;
}

export interface BaselineWithWorkPackages extends Baseline {
  workPackages: BaselineWorkPackage[];
}

export class BaselineRepository {
  private repository: Repository<Baseline>;
  private workPackageRepository: Repository<BaselineWorkPackage>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Baseline);
    this.workPackageRepository = dataSource.getRepository(BaselineWorkPackage);
  }

  /**
   * Create a new baseline
   */
  async create(data: CreateBaselineData): Promise<Baseline> {
    const baseline = this.repository.create({
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      createdBy: data.createdBy,
    });

    return await this.repository.save(baseline);
  }

  /**
   * Find baseline by ID
   */
  async findById(id: string): Promise<Baseline | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['project', 'creator'],
    });
  }

  /**
   * Find baseline by ID with work packages
   */
  async findByIdWithWorkPackages(id: string): Promise<BaselineWithWorkPackages | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['project', 'creator', 'workPackages'],
    });
  }

  /**
   * Find all baselines for a project
   */
  async findByProjectId(projectId: string): Promise<Baseline[]> {
    return await this.repository.find({
      where: { projectId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Add work package snapshot to baseline
   */
  async addWorkPackageSnapshot(
    baselineId: string,
    workPackageId: string,
    subject: string,
    startDate?: Date,
    dueDate?: Date
  ): Promise<BaselineWorkPackage> {
    const snapshot = this.workPackageRepository.create({
      baselineId,
      workPackageId,
      subject,
      startDate,
      dueDate,
    });

    return await this.workPackageRepository.save(snapshot);
  }

  /**
   * Get work package snapshots for a baseline
   */
  async getWorkPackageSnapshots(baselineId: string): Promise<BaselineWorkPackage[]> {
    return await this.workPackageRepository.find({
      where: { baselineId },
      order: { subject: 'ASC' },
    });
  }

  /**
   * Delete a baseline
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== undefined && result.affected !== null && result.affected > 0;
  }

  /**
   * Check if baseline exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }
}

export const createBaselineRepository = (
  dataSource: DataSource = AppDataSource
): BaselineRepository => {
  return new BaselineRepository(dataSource);
};
