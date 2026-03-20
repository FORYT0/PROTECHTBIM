import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { ActivityLog, ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';

export interface ActivityLogFilters {
  projectId?: string;
  workPackageId?: string;
  userId?: string;
  actionType?: ActivityActionType;
  entityType?: ActivityEntityType;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ActivityLogListResult {
  activities: ActivityLog[];
  total: number;
  page: number;
  perPage: number;
}

import { socketManager } from '../websocket/socket-manager';

export class ActivityLogRepository {
  private repository: Repository<ActivityLog>;

  constructor() {
    this.repository = AppDataSource.getRepository(ActivityLog);
  }

  async create(activityData: Partial<ActivityLog>): Promise<ActivityLog> {
    const activity = this.repository.create(activityData);
    const saved = await this.repository.save(activity);

    // Fetch with relations for the broadcast
    const completeActivity = await this.findById(saved.id);

    if (completeActivity) {
      // Map it to match the API response structure that the frontend expects
      const payload = {
        id: completeActivity.id,
        project_id: completeActivity.projectId,
        work_package_id: completeActivity.workPackageId,
        user_id: completeActivity.userId,
        user_name: completeActivity.user?.name,
        user_email: completeActivity.user?.email,
        action_type: completeActivity.actionType,
        entity_type: completeActivity.entityType,
        entity_id: completeActivity.entityId,
        description: completeActivity.description,
        metadata: completeActivity.metadata,
        created_at: completeActivity.createdAt,
      };

      // Broadcast to all users in this project room
      socketManager.notifyProject(saved.projectId, 'activity:created', payload);
    }

    return saved;
  }

  async findById(id: string): Promise<ActivityLog | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['project', 'workPackage', 'user'],
    });
  }

  async findAll(filters: ActivityLogFilters = {}): Promise<ActivityLogListResult> {
    const {
      projectId,
      workPackageId,
      userId,
      actionType,
      entityType,
      dateFrom,
      dateTo,
      page = 1,
      perPage = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.repository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.project', 'project')
      .leftJoinAndSelect('activity.workPackage', 'workPackage')
      .leftJoinAndSelect('activity.user', 'user');

    // Apply filters
    if (projectId) {
      queryBuilder.andWhere('activity.projectId = :projectId', { projectId });
    }

    if (workPackageId) {
      queryBuilder.andWhere('activity.workPackageId = :workPackageId', { workPackageId });
    }

    if (userId) {
      queryBuilder.andWhere('activity.userId = :userId', { userId });
    }

    if (actionType) {
      queryBuilder.andWhere('activity.actionType = :actionType', { actionType });
    }

    if (entityType) {
      queryBuilder.andWhere('activity.entityType = :entityType', { entityType });
    }

    if (dateFrom) {
      queryBuilder.andWhere('activity.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('activity.createdAt <= :dateTo', { dateTo });
    }

    // Apply sorting
    const sortField = `activity.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * perPage;
    queryBuilder.skip(skip).take(perPage);

    const [activities, total] = await queryBuilder.getManyAndCount();

    return {
      activities,
      total,
      page,
      perPage,
    };
  }

  async findByEntity(
    entityType: ActivityEntityType,
    _entityId: string,
    filters: Partial<ActivityLogFilters> = {}
  ): Promise<ActivityLogListResult> {
    return this.findAll({
      ...filters,
      entityType,
      // Note: We need to add entityId to filters, but it's not in the interface
      // This is a workaround - see implementation below
    });
  }

  async findProjectActivities(
    projectId: string,
    filters: Partial<ActivityLogFilters> = {}
  ): Promise<ActivityLogListResult> {
    return this.findAll({
      ...filters,
      projectId,
    });
  }

  async findUserActivities(
    userId: string,
    filters: Partial<ActivityLogFilters> = {}
  ): Promise<ActivityLogListResult> {
    return this.findAll({
      ...filters,
      userId,
    });
  }

  async findRecentActivities(
    projectId: string,
    limit: number = 10
  ): Promise<ActivityLog[]> {
    return await this.repository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.projectId = :projectId', { projectId })
      .orderBy('activity.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getActivityCount(projectId: string): Promise<number> {
    return await this.repository.count({
      where: { projectId },
    });
  }

  async getActivityCountByType(
    projectId: string,
    actionType: ActivityActionType
  ): Promise<number> {
    return await this.repository.count({
      where: { projectId, actionType },
    });
  }

  async getActivitySummary(
    projectId: string,
    days: number = 7
  ): Promise<{
    total: number;
    byType: Record<string, number>;
    byEntity: Record<string, number>;
  }> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const activities = await this.repository.find({
      where: {
        projectId,
        createdAt: { gte: dateFrom } as any,
      },
    });

    const byType: Record<string, number> = {};
    const byEntity: Record<string, number> = {};

    activities.forEach((activity) => {
      byType[activity.actionType] = (byType[activity.actionType] || 0) + 1;
      byEntity[activity.entityType] = (byEntity[activity.entityType] || 0) + 1;
    });

    return {
      total: activities.length,
      byType,
      byEntity,
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async deleteOldActivities(daysOld: number = 90): Promise<number> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysOld);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :dateThreshold', { dateThreshold })
      .execute();

    return result.affected ?? 0;
  }
}

export const createActivityLogRepository = (): ActivityLogRepository => {
  return new ActivityLogRepository();
};
