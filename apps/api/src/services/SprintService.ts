import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Sprint, SprintStatus } from '../entities/Sprint';
import { Project } from '../entities/Project';
import { WorkPackage } from '../entities/WorkPackage';

export interface CreateSprintData {
  projectId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  capacity?: number;
}

export interface UpdateSprintData {
  name?: string;
  description?: string;
  status?: SprintStatus;
  startDate?: Date;
  endDate?: Date;
  capacity?: number;
}

export interface ListSprintsOptions {
  status?: SprintStatus;
  page?: number;
  perPage?: number;
}

export class SprintService {
  private sprintRepository: Repository<Sprint>;
  private projectRepository: Repository<Project>;
  private workPackageRepository: Repository<WorkPackage>;

  constructor() {
    this.sprintRepository = AppDataSource.getRepository(Sprint);
    this.projectRepository = AppDataSource.getRepository(Project);
    this.workPackageRepository = AppDataSource.getRepository(WorkPackage);
  }

  /**
   * Create a new sprint
   */
  async createSprint(data: CreateSprintData): Promise<Sprint> {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Validate dates
    if (data.endDate < data.startDate) {
      throw new Error('End date must be after start date');
    }

    // Create sprint
    const sprint = this.sprintRepository.create({
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      capacity: data.capacity,
      status: SprintStatus.PLANNED,
    });

    return await this.sprintRepository.save(sprint);
  }

  /**
   * List sprints for a project
   */
  async listSprints(
    projectId: string,
    options: ListSprintsOptions = {}
  ): Promise<{ sprints: Sprint[]; total: number }> {
    const { status, page = 1, perPage = 50 } = options;

    const queryBuilder = this.sprintRepository
      .createQueryBuilder('sprint')
      .where('sprint.project_id = :projectId', { projectId })
      .orderBy('sprint.start_date', 'DESC');

    if (status) {
      queryBuilder.andWhere('sprint.status = :status', { status });
    }

    const total = await queryBuilder.getCount();

    const sprints = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    return { sprints, total };
  }

  /**
   * Get a sprint by ID with work packages
   */
  async getSprintById(sprintId: string): Promise<Sprint | null> {
    return await this.sprintRepository.findOne({
      where: { id: sprintId },
      relations: ['workPackages'],
    });
  }

  /**
   * Get sprint with calculated story points
   */
  async getSprintWithStats(sprintId: string): Promise<{
    sprint: Sprint;
    workPackages: WorkPackage[];
    totalStoryPoints: number;
  } | null> {
    const sprint = await this.sprintRepository.findOne({
      where: { id: sprintId },
    });

    if (!sprint) {
      return null;
    }

    const workPackages = await this.workPackageRepository.find({
      where: { sprintId },
      relations: ['assignee'],
    });

    // Calculate total story points
    const totalStoryPoints = workPackages.reduce((sum, wp) => {
      return sum + (wp.storyPoints || 0);
    }, 0);

    // Update sprint story points if changed
    if (sprint.storyPoints !== totalStoryPoints) {
      sprint.storyPoints = totalStoryPoints;
      await this.sprintRepository.save(sprint);
    }

    return {
      sprint,
      workPackages,
      totalStoryPoints,
    };
  }

  /**
   * Update a sprint
   */
  async updateSprint(sprintId: string, data: UpdateSprintData): Promise<Sprint | null> {
    const sprint = await this.sprintRepository.findOne({
      where: { id: sprintId },
    });

    if (!sprint) {
      return null;
    }

    // Validate dates if both are provided or being updated
    const startDate = data.startDate || sprint.startDate;
    const endDate = data.endDate || sprint.endDate;

    if (endDate < startDate) {
      throw new Error('End date must be after start date');
    }

    // Update fields
    if (data.name !== undefined) sprint.name = data.name;
    if (data.description !== undefined) sprint.description = data.description;
    if (data.status !== undefined) sprint.status = data.status;
    if (data.startDate !== undefined) sprint.startDate = data.startDate;
    if (data.endDate !== undefined) sprint.endDate = data.endDate;
    if (data.capacity !== undefined) sprint.capacity = data.capacity;

    return await this.sprintRepository.save(sprint);
  }

  /**
   * Delete a sprint
   */
  async deleteSprint(sprintId: string): Promise<boolean> {
    const sprint = await this.sprintRepository.findOne({
      where: { id: sprintId },
    });

    if (!sprint) {
      return false;
    }

    // Remove sprint reference from work packages (will be set to NULL due to ON DELETE SET NULL)
    await this.sprintRepository.remove(sprint);
    return true;
  }

  /**
   * Add work packages to a sprint
   */
  async addWorkPackagesToSprint(
    sprintId: string,
    workPackageIds: string[]
  ): Promise<void> {
    const sprint = await this.sprintRepository.findOne({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    // Update work packages
    await this.workPackageRepository
      .createQueryBuilder()
      .update(WorkPackage)
      .set({ sprintId })
      .where('id IN (:...ids)', { ids: workPackageIds })
      .andWhere('project_id = :projectId', { projectId: sprint.projectId })
      .execute();

    // Recalculate story points
    await this.recalculateStoryPoints(sprintId);
  }

  /**
   * Remove work packages from a sprint
   */
  async removeWorkPackagesFromSprint(workPackageIds: string[]): Promise<void> {
    await this.workPackageRepository
      .createQueryBuilder()
      .update(WorkPackage)
      .set({ sprintId: () => 'NULL' })
      .where('id IN (:...ids)', { ids: workPackageIds })
      .execute();
  }

  /**
   * Recalculate total story points for a sprint
   */
  private async recalculateStoryPoints(sprintId: string): Promise<void> {
    const result = await this.workPackageRepository
      .createQueryBuilder('wp')
      .select('SUM(wp.story_points)', 'total')
      .where('wp.sprint_id = :sprintId', { sprintId })
      .getRawOne();

    const totalStoryPoints = parseInt(result?.total || '0', 10);

    await this.sprintRepository.update(sprintId, {
      storyPoints: totalStoryPoints,
    });
  }
}

/**
 * Factory function to create SprintService instance
 */
export function createSprintService(): SprintService {
  return new SprintService();
}
