import { Baseline } from '../entities/Baseline';
import { BaselineWorkPackage } from '../entities/BaselineWorkPackage';
import {
  BaselineRepository,
  createBaselineRepository,
  BaselineWithWorkPackages,
} from '../repositories/BaselineRepository';
import {
  WorkPackageRepository,
  createWorkPackageRepository,
} from '../repositories/WorkPackageRepository';
import {
  ProjectRepository,
  createProjectRepository,
} from '../repositories/ProjectRepository';

export interface CreateBaselineDTO {
  projectId: string;
  name: string;
  description?: string;
  createdBy: string;
}

export interface BaselineListItem {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  workPackageCount: number;
}

export interface WorkPackageVariance {
  workPackageId: string;
  subject: string;
  baselineStartDate?: Date;
  baselineDueDate?: Date;
  currentStartDate?: Date;
  currentDueDate?: Date;
  startVarianceDays: number;
  dueVarianceDays: number;
  status: 'ahead' | 'on_track' | 'behind' | 'no_baseline';
}

export interface VarianceReport {
  baselineId: string;
  baselineName: string;
  projectId: string;
  generatedAt: Date;
  totalWorkPackages: number;
  aheadCount: number;
  onTrackCount: number;
  behindCount: number;
  noBaselineCount: number;
  averageStartVarianceDays: number;
  averageDueVarianceDays: number;
  variances: WorkPackageVariance[];
}

export class BaselineService {
  private baselineRepository: BaselineRepository;
  private workPackageRepository: WorkPackageRepository;
  private projectRepository: ProjectRepository;

  constructor(
    baselineRepository?: BaselineRepository,
    workPackageRepository?: WorkPackageRepository,
    projectRepository?: ProjectRepository
  ) {
    this.baselineRepository = baselineRepository || createBaselineRepository();
    this.workPackageRepository = workPackageRepository || createWorkPackageRepository();
    this.projectRepository = projectRepository || createProjectRepository();
  }

  /**
   * Create a new baseline with work package snapshots
   */
  async createBaseline(data: CreateBaselineDTO): Promise<Baseline> {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Baseline name is required');
    }

    if (!data.projectId) {
      throw new Error('Project ID is required');
    }

    if (!data.createdBy) {
      throw new Error('Created by user ID is required');
    }

    // Verify project exists
    const project = await this.projectRepository.findById(data.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Create the baseline
    const baseline = await this.baselineRepository.create({
      projectId: data.projectId,
      name: data.name.trim(),
      description: data.description?.trim(),
      createdBy: data.createdBy,
    });

    // Get all work packages for the project
    const { workPackages } = await this.workPackageRepository.findAll({
      projectId: data.projectId,
      perPage: 10000, // Get all work packages
    });

    // Create snapshots for all work packages
    const snapshotPromises = workPackages.map((wp) =>
      this.baselineRepository.addWorkPackageSnapshot(
        baseline.id,
        wp.id,
        wp.subject,
        wp.startDate,
        wp.dueDate
      )
    );

    await Promise.all(snapshotPromises);

    return baseline;
  }

  /**
   * Get baseline by ID
   */
  async getBaselineById(id: string): Promise<Baseline | null> {
    if (!id) {
      throw new Error('Baseline ID is required');
    }

    return await this.baselineRepository.findById(id);
  }

  /**
   * Get baseline by ID with work package snapshots
   */
  async getBaselineWithWorkPackages(id: string): Promise<BaselineWithWorkPackages | null> {
    if (!id) {
      throw new Error('Baseline ID is required');
    }

    return await this.baselineRepository.findByIdWithWorkPackages(id);
  }

  /**
   * List all baselines for a project
   */
  async listBaselines(projectId: string): Promise<BaselineListItem[]> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Verify project exists
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const baselines = await this.baselineRepository.findByProjectId(projectId);

    // Get work package counts for each baseline
    const baselineListItems = await Promise.all(
      baselines.map(async (baseline) => {
        const workPackages = await this.baselineRepository.getWorkPackageSnapshots(
          baseline.id
        );

        return {
          id: baseline.id,
          projectId: baseline.projectId,
          name: baseline.name,
          description: baseline.description,
          createdBy: baseline.createdBy,
          createdAt: baseline.createdAt,
          workPackageCount: workPackages.length,
        };
      })
    );

    return baselineListItems;
  }

  /**
   * Get work package snapshots for a baseline
   */
  async getWorkPackageSnapshots(baselineId: string): Promise<BaselineWorkPackage[]> {
    if (!baselineId) {
      throw new Error('Baseline ID is required');
    }

    // Verify baseline exists
    const baseline = await this.baselineRepository.findById(baselineId);
    if (!baseline) {
      throw new Error('Baseline not found');
    }

    return await this.baselineRepository.getWorkPackageSnapshots(baselineId);
  }

  /**
   * Delete a baseline
   */
  async deleteBaseline(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Baseline ID is required');
    }

    // Check if baseline exists
    const exists = await this.baselineRepository.exists(id);
    if (!exists) {
      throw new Error('Baseline not found');
    }

    return await this.baselineRepository.delete(id);
  }

  /**
   * Calculate schedule variance between baseline and current work packages
   */
  async calculateVariance(baselineId: string): Promise<VarianceReport> {
    if (!baselineId) {
      throw new Error('Baseline ID is required');
    }

    // Get baseline with work packages
    const baseline = await this.baselineRepository.findByIdWithWorkPackages(baselineId);
    if (!baseline) {
      throw new Error('Baseline not found');
    }

    // Get current work packages for the project
    const { workPackages: currentWorkPackages } = await this.workPackageRepository.findAll({
      projectId: baseline.projectId,
      perPage: 10000,
    });

    // Create a map of baseline work packages by work package ID
    const baselineMap = new Map(
      baseline.workPackages.map((bwp) => [bwp.workPackageId, bwp])
    );

    // Calculate variance for each current work package
    const variances: WorkPackageVariance[] = currentWorkPackages.map((wp) => {
      const baselineWp = baselineMap.get(wp.id);

      if (!baselineWp) {
        // Work package created after baseline
        return {
          workPackageId: wp.id,
          subject: wp.subject,
          currentStartDate: wp.startDate,
          currentDueDate: wp.dueDate,
          startVarianceDays: 0,
          dueVarianceDays: 0,
          status: 'no_baseline' as const,
        };
      }

      // Calculate variance in days
      const startVarianceDays = this.calculateDateVariance(
        baselineWp.startDate,
        wp.startDate
      );
      const dueVarianceDays = this.calculateDateVariance(
        baselineWp.dueDate,
        wp.dueDate
      );

      // Determine status based on variance
      // Ahead: negative variance (current date is earlier than baseline)
      // Behind: positive variance (current date is later than baseline)
      // On track: within 1 day tolerance
      let status: 'ahead' | 'on_track' | 'behind' = 'on_track';
      const maxVariance = Math.max(Math.abs(startVarianceDays), Math.abs(dueVarianceDays));

      if (maxVariance <= 1) {
        status = 'on_track';
      } else if (startVarianceDays > 1 || dueVarianceDays > 1) {
        status = 'behind';
      } else if (startVarianceDays < -1 || dueVarianceDays < -1) {
        status = 'ahead';
      }

      return {
        workPackageId: wp.id,
        subject: wp.subject,
        baselineStartDate: baselineWp.startDate,
        baselineDueDate: baselineWp.dueDate,
        currentStartDate: wp.startDate,
        currentDueDate: wp.dueDate,
        startVarianceDays,
        dueVarianceDays,
        status,
      };
    });

    // Calculate summary statistics
    const aheadCount = variances.filter((v) => v.status === 'ahead').length;
    const onTrackCount = variances.filter((v) => v.status === 'on_track').length;
    const behindCount = variances.filter((v) => v.status === 'behind').length;
    const noBaselineCount = variances.filter((v) => v.status === 'no_baseline').length;

    // Calculate average variance (excluding no_baseline items)
    const variancesWithBaseline = variances.filter((v) => v.status !== 'no_baseline');
    const averageStartVarianceDays =
      variancesWithBaseline.length > 0
        ? variancesWithBaseline.reduce((sum, v) => sum + v.startVarianceDays, 0) /
          variancesWithBaseline.length
        : 0;
    const averageDueVarianceDays =
      variancesWithBaseline.length > 0
        ? variancesWithBaseline.reduce((sum, v) => sum + v.dueVarianceDays, 0) /
          variancesWithBaseline.length
        : 0;

    return {
      baselineId: baseline.id,
      baselineName: baseline.name,
      projectId: baseline.projectId,
      generatedAt: new Date(),
      totalWorkPackages: variances.length,
      aheadCount,
      onTrackCount,
      behindCount,
      noBaselineCount,
      averageStartVarianceDays: Math.round(averageStartVarianceDays * 10) / 10,
      averageDueVarianceDays: Math.round(averageDueVarianceDays * 10) / 10,
      variances,
    };
  }

  /**
   * Calculate variance in days between two dates
   * Returns positive if current is later than baseline (behind schedule)
   * Returns negative if current is earlier than baseline (ahead of schedule)
   */
  private calculateDateVariance(baselineDate?: Date, currentDate?: Date): number {
    if (!baselineDate || !currentDate) {
      return 0;
    }

    const baselineTime = new Date(baselineDate).getTime();
    const currentTime = new Date(currentDate).getTime();
    const diffMs = currentTime - baselineTime;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return Math.round(diffDays);
  }
}

export const createBaselineService = (): BaselineService => {
  return new BaselineService();
};
