import { Repository, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { SprintBurndown } from '../entities/SprintBurndown';
import { Sprint, SprintStatus } from '../entities/Sprint';
import { WorkPackage } from '../entities/WorkPackage';

export interface BurndownDataPoint {
  date: string;
  remaining: number;
  completed: number;
  ideal: number;
}

export interface BurndownChartData {
  sprintId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  dataPoints: BurndownDataPoint[];
}

export class BurndownService {
  private burndownRepository: Repository<SprintBurndown>;
  private sprintRepository: Repository<Sprint>;
  private workPackageRepository: Repository<WorkPackage>;

  constructor() {
    this.burndownRepository = AppDataSource.getRepository(SprintBurndown);
    this.sprintRepository = AppDataSource.getRepository(Sprint);
    this.workPackageRepository = AppDataSource.getRepository(WorkPackage);
  }

  /**
   * Record a daily burndown snapshot for a sprint
   */
  async recordBurndownSnapshot(
    sprintId: string,
    date?: Date
  ): Promise<SprintBurndown> {
    const sprint = await this.sprintRepository.findOne({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const snapshotDate = date || new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    // Get all work packages in the sprint
    const workPackages = await this.workPackageRepository.find({
      where: { sprintId },
    });

    // Calculate story points
    const totalStoryPoints = workPackages.reduce(
      (sum, wp) => sum + (wp.storyPoints || 0),
      0
    );

    const completedStoryPoints = workPackages
      .filter((wp) => wp.progressPercent === 100)
      .reduce((sum, wp) => sum + (wp.storyPoints || 0), 0);

    const remainingStoryPoints = totalStoryPoints - completedStoryPoints;

    // Check if snapshot already exists for this date
    const existing = await this.burndownRepository.findOne({
      where: {
        sprintId,
        date: snapshotDate,
      },
    });

    if (existing) {
      // Update existing snapshot
      existing.remainingStoryPoints = remainingStoryPoints;
      existing.completedStoryPoints = completedStoryPoints;
      existing.totalStoryPoints = totalStoryPoints;
      return await this.burndownRepository.save(existing);
    }

    // Create new snapshot
    const snapshot = this.burndownRepository.create({
      sprintId,
      date: snapshotDate,
      remainingStoryPoints,
      completedStoryPoints,
      totalStoryPoints,
    });

    return await this.burndownRepository.save(snapshot);
  }

  /**
   * Get burndown chart data for a sprint
   */
  async getSprintBurndown(sprintId: string): Promise<BurndownChartData> {
    const sprint = await this.sprintRepository.findOne({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    // Get all burndown snapshots for the sprint
    const snapshots = await this.burndownRepository.find({
      where: { sprintId },
      order: { date: 'ASC' },
    });

    // If no snapshots exist, create one for today
    if (snapshots.length === 0) {
      const snapshot = await this.recordBurndownSnapshot(sprintId);
      snapshots.push(snapshot);
    }

    const totalStoryPoints = snapshots[0]?.totalStoryPoints || 0;

    // Calculate ideal burndown line
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = this.getDaysBetween(startDate, endDate);

    // Generate data points
    const dataPoints: BurndownDataPoint[] = [];

    // Fill in all dates from start to end
    const currentDate = new Date(startDate);
    let dayIndex = 0;

    while (currentDate <= endDate) {
      const dateStr = this.formatDate(currentDate);

      // Find snapshot for this date
      const snapshot = snapshots.find(
        (s) => this.formatDate(new Date(s.date)) === dateStr
      );

      // Calculate ideal remaining (linear burndown)
      const idealRemaining =
        totalStoryPoints - (totalStoryPoints * dayIndex) / totalDays;

      dataPoints.push({
        date: dateStr,
        remaining: snapshot?.remainingStoryPoints ?? totalStoryPoints,
        completed: snapshot?.completedStoryPoints ?? 0,
        ideal: Math.max(0, Math.round(idealRemaining)),
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex++;
    }

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      startDate: this.formatDate(sprint.startDate),
      endDate: this.formatDate(sprint.endDate),
      totalStoryPoints,
      dataPoints,
    };
  }

  /**
   * Get release burndown chart data (across multiple sprints or by date range)
   */
  async getReleaseBurndown(
    projectId: string,
    options: {
      versionId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<BurndownChartData> {
    const { versionId, startDate, endDate } = options;

    // Build query for work packages
    const queryBuilder = this.workPackageRepository
      .createQueryBuilder('wp')
      .where('wp.project_id = :projectId', { projectId });

    if (versionId) {
      queryBuilder.andWhere('wp.version_id = :versionId', { versionId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'wp.due_date BETWEEN :startDate AND :endDate',
        { startDate, endDate }
      );
    }

    const workPackages = await queryBuilder.getMany();

    // Calculate total story points
    const totalStoryPoints = workPackages.reduce(
      (sum, wp) => sum + (wp.storyPoints || 0),
      0
    );

    // Group by due date and calculate cumulative completion
    const dateMap = new Map<string, { completed: number; total: number }>();

    const releaseStartDate = startDate || new Date();
    const releaseEndDate = endDate || new Date();

    // Initialize all dates
    const currentDate = new Date(releaseStartDate);
    while (currentDate <= releaseEndDate) {
      const dateStr = this.formatDate(currentDate);
      dateMap.set(dateStr, { completed: 0, total: totalStoryPoints });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate completed story points by date
    for (const wp of workPackages) {
      if (wp.progressPercent === 100 && wp.updatedAt) {
        const completionDate = this.formatDate(wp.updatedAt);
        const entry = dateMap.get(completionDate);
        if (entry) {
          entry.completed += wp.storyPoints || 0;
        }
      }
    }

    // Calculate cumulative and generate data points
    const dataPoints: BurndownDataPoint[] = [];
    let cumulativeCompleted = 0;
    const totalDays = this.getDaysBetween(releaseStartDate, releaseEndDate);
    let dayIndex = 0;

    for (const [date, data] of Array.from(dateMap.entries()).sort()) {
      cumulativeCompleted += data.completed;
      const remaining = totalStoryPoints - cumulativeCompleted;
      const idealRemaining =
        totalStoryPoints - (totalStoryPoints * dayIndex) / totalDays;

      dataPoints.push({
        date,
        remaining: Math.max(0, remaining),
        completed: cumulativeCompleted,
        ideal: Math.max(0, Math.round(idealRemaining)),
      });

      dayIndex++;
    }

    return {
      sprintId: versionId || projectId,
      sprintName: versionId ? `Release ${versionId}` : 'Release Burndown',
      startDate: this.formatDate(releaseStartDate),
      endDate: this.formatDate(releaseEndDate),
      totalStoryPoints,
      dataPoints,
    };
  }

  /**
   * Auto-record burndown snapshots for all active sprints
   * This should be called daily via a cron job
   */
  async recordDailySnapshots(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all active sprints
    const activeSprints = await this.sprintRepository.find({
      where: {
        status: SprintStatus.ACTIVE,
        startDate: LessThanOrEqual(today),
      },
    });

    // Record snapshot for each active sprint
    for (const sprint of activeSprints) {
      try {
        await this.recordBurndownSnapshot(sprint.id, today);
      } catch (error) {
        console.error(`Failed to record snapshot for sprint ${sprint.id}:`, error);
      }
    }
  }

  /**
   * Helper: Calculate days between two dates
   */
  private getDaysBetween(start: Date, end: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const startMs = new Date(start).setHours(0, 0, 0, 0);
    const endMs = new Date(end).setHours(0, 0, 0, 0);
    return Math.round((endMs - startMs) / msPerDay);
  }

  /**
   * Helper: Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Factory function to create BurndownService instance
 */
export function createBurndownService(): BurndownService {
  return new BurndownService();
}
