import { WorkPackage, WorkPackageType, Priority, SchedulingMode } from '../entities/WorkPackage';
import { WorkPackageWatcher } from '../entities/WorkPackageWatcher';
import {
  WorkPackageRepository,
  WorkPackageFilters,
  WorkPackageListResult,
  createWorkPackageRepository,
} from '../repositories/WorkPackageRepository';
import { createProjectRepository, ProjectRepository } from '../repositories/ProjectRepository';
import {
  WorkPackageWatcherRepository,
  createWorkPackageWatcherRepository,
} from '../repositories/WorkPackageWatcherRepository';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { ActivityLogRepository, createActivityLogRepository } from '../repositories/ActivityLogRepository';
import { ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
// TODO: Re-enable when SchedulingService.recalculateSchedule is implemented
// import { SchedulingService, createSchedulingService } from './SchedulingService';

export interface CreateWorkPackageDTO {
  projectId: string;
  type: WorkPackageType;
  subject: string;
  description?: string;
  status?: string;
  priority?: Priority;
  assigneeId?: string;
  accountableId?: string;
  parentId?: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  schedulingMode?: SchedulingMode;
  versionId?: string;
  sprintId?: string;
  storyPoints?: number;
  customFields?: Record<string, any>;
}

export interface UpdateWorkPackageDTO {
  subject?: string;
  description?: string;
  status?: string;
  priority?: Priority;
  assigneeId?: string;
  accountableId?: string;
  parentId?: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  progressPercent?: number;
  schedulingMode?: SchedulingMode;
  versionId?: string;
  sprintId?: string;
  storyPoints?: number;
  customFields?: Record<string, any>;
}

export class WorkPackageService {
  private workPackageRepository: WorkPackageRepository;
  private projectRepository: ProjectRepository;
  private watcherRepository: WorkPackageWatcherRepository;
  private activityLogRepository: ActivityLogRepository;
  // TODO: Re-enable when SchedulingService.recalculateSchedule is implemented
  // private schedulingService: SchedulingService;

  constructor(
    workPackageRepository?: WorkPackageRepository,
    projectRepository?: ProjectRepository,
    watcherRepository?: WorkPackageWatcherRepository,
    activityLogRepository?: ActivityLogRepository
    // schedulingService?: SchedulingService
  ) {
    this.workPackageRepository = workPackageRepository || createWorkPackageRepository();
    this.projectRepository = projectRepository || createProjectRepository();
    this.watcherRepository = watcherRepository || createWorkPackageWatcherRepository();
    this.activityLogRepository = activityLogRepository || createActivityLogRepository();
    // this.schedulingService = schedulingService || createSchedulingService();
  }

  async createWorkPackage(data: CreateWorkPackageDTO, userId: string): Promise<WorkPackage> {
    // Validate required fields
    if (!data.subject || data.subject.trim().length === 0) {
      throw new Error('Work package subject is required');
    }

    if (!data.projectId) {
      throw new Error('Project ID is required');
    }

    if (!data.type) {
      throw new Error('Work package type is required');
    }

    // Validate project exists
    const projectExists = await this.projectRepository.exists(data.projectId);
    if (!projectExists) {
      throw new Error('Project not found');
    }

    // Validate parent work package if provided
    if (data.parentId) {
      const parentExists = await this.workPackageRepository.exists(data.parentId);
      if (!parentExists) {
        throw new Error('Parent work package not found');
      }
    }

    // Validate dates if provided
    if (data.startDate && data.dueDate) {
      const start = new Date(data.startDate);
      const due = new Date(data.dueDate);
      if (start > due) {
        throw new Error('Start date must be before due date');
      }
    }

    // Validate progress percent if provided
    if (data.estimatedHours !== undefined && data.estimatedHours < 0) {
      throw new Error('Estimated hours must be non-negative');
    }

    const workPackageData: Partial<WorkPackage> = {
      projectId: data.projectId,
      type: data.type,
      subject: data.subject.trim(),
      description: data.description?.trim(),
      status: data.status || 'new',
      priority: data.priority || Priority.NORMAL,
      assigneeId: data.assigneeId,
      accountableId: data.accountableId,
      parentId: data.parentId,
      startDate: data.startDate,
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
      schedulingMode: data.schedulingMode || SchedulingMode.MANUAL,
      versionId: data.versionId,
      sprintId: data.sprintId,
      storyPoints: data.storyPoints,
      customFields: data.customFields,
    };

    const workPackage = await this.workPackageRepository.create(workPackageData);

    // Log activity
    await this.activityLogRepository.create({
      projectId: workPackage.projectId,
      workPackageId: workPackage.id,
      userId,
      actionType: ActivityActionType.CREATED,
      entityType: ActivityEntityType.WORK_PACKAGE,
      entityId: workPackage.id,
      description: `created work package: ${workPackage.subject}`,
      metadata: {
        subject: workPackage.subject,
        type: workPackage.type,
        status: workPackage.status,
      },
    });

    return workPackage;
  }

  async getWorkPackageById(id: string): Promise<WorkPackage | null> {
    if (!id) {
      throw new Error('Work package ID is required');
    }

    return await this.workPackageRepository.findById(id);
  }

  async listWorkPackages(filters: WorkPackageFilters): Promise<WorkPackageListResult> {
    // Validate pagination parameters
    if (filters.page !== undefined && filters.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (filters.perPage !== undefined && (filters.perPage < 1 || filters.perPage > 100)) {
      throw new Error('Per page must be between 1 and 100');
    }

    return await this.workPackageRepository.findAll(filters);
  }

  async updateWorkPackage(id: string, data: UpdateWorkPackageDTO, userId: string): Promise<WorkPackage> {
    if (!id) {
      throw new Error('Work package ID is required');
    }

    // Check if work package exists
    const existingWorkPackage = await this.workPackageRepository.findById(id);
    if (!existingWorkPackage) {
      throw new Error('Work package not found');
    }

    // Validate parent work package if provided
    if (data.parentId !== undefined && data.parentId !== null) {
      // Prevent self-referencing
      if (data.parentId === id) {
        throw new Error('Work package cannot be its own parent');
      }

      const parentExists = await this.workPackageRepository.exists(data.parentId);
      if (!parentExists) {
        throw new Error('Parent work package not found');
      }
    }

    // Validate dates if provided
    if (data.startDate || data.dueDate) {
      const startDate = data.startDate
        ? new Date(data.startDate)
        : existingWorkPackage.startDate;
      const dueDate = data.dueDate ? new Date(data.dueDate) : existingWorkPackage.dueDate;

      if (startDate && dueDate && startDate > dueDate) {
        throw new Error('Start date must be before due date');
      }
    }

    // Validate subject if provided
    if (data.subject !== undefined && data.subject.trim().length === 0) {
      throw new Error('Work package subject cannot be empty');
    }

    // Validate progress percent if provided
    if (data.progressPercent !== undefined) {
      if (data.progressPercent < 0 || data.progressPercent > 100) {
        throw new Error('Progress percent must be between 0 and 100');
      }
    }

    // Validate estimated hours if provided
    if (data.estimatedHours !== undefined && data.estimatedHours < 0) {
      throw new Error('Estimated hours must be non-negative');
    }

    const updateData: Partial<WorkPackage> = {};

    if (data.subject !== undefined) {
      updateData.subject = data.subject.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim();
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.assigneeId !== undefined) {
      updateData.assigneeId = data.assigneeId;
    }

    if (data.accountableId !== undefined) {
      updateData.accountableId = data.accountableId;
    }

    if (data.parentId !== undefined) {
      updateData.parentId = data.parentId;
    }

    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
    }

    if (data.estimatedHours !== undefined) {
      updateData.estimatedHours = data.estimatedHours;
    }

    if (data.progressPercent !== undefined) {
      updateData.progressPercent = data.progressPercent;
    }

    if (data.schedulingMode !== undefined) {
      updateData.schedulingMode = data.schedulingMode;
    }

    if (data.versionId !== undefined) {
      updateData.versionId = data.versionId;
    }

    if (data.sprintId !== undefined) {
      updateData.sprintId = data.sprintId;
    }

    if (data.storyPoints !== undefined) {
      updateData.storyPoints = data.storyPoints;
    }

    if (data.customFields !== undefined) {
      updateData.customFields = data.customFields;
    }

    const updatedWorkPackage = await this.workPackageRepository.update(id, updateData);

    if (!updatedWorkPackage) {
      throw new Error('Failed to update work package');
    }

    // Log activity
    await this.activityLogRepository.create({
      projectId: updatedWorkPackage.projectId,
      workPackageId: updatedWorkPackage.id,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.WORK_PACKAGE,
      entityId: updatedWorkPackage.id,
      description: `updated work package: ${updatedWorkPackage.subject}`,
      metadata: {
        changes: data, // In a real app we'd compare old and new
      },
    });

    return updatedWorkPackage;
  }

  async deleteWorkPackage(id: string, userId: string): Promise<boolean> {
    if (!id) {
      throw new Error('Work package ID is required');
    }

    // Check if work package exists
    const exists = await this.workPackageRepository.exists(id);
    if (!exists) {
      throw new Error('Work package not found');
    }

    const workPackage = await this.workPackageRepository.findById(id);
    const result = await this.workPackageRepository.delete(id);

    if (result && workPackage) {
      await this.activityLogRepository.create({
        projectId: workPackage.projectId,
        workPackageId: workPackage.id,
        userId,
        actionType: ActivityActionType.DELETED,
        entityType: ActivityEntityType.WORK_PACKAGE,
        entityId: workPackage.id,
        description: `deleted work package: ${workPackage.subject}`,
        metadata: {
          subject: workPackage.subject,
        },
      });
    }

    return result;
  }

  /**
   * Add a watcher to a work package
   */
  async addWatcher(workPackageId: string, userId: string): Promise<WorkPackageWatcher> {
    if (!workPackageId) {
      throw new Error('Work package ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if work package exists
    const workPackageExists = await this.workPackageRepository.exists(workPackageId);
    if (!workPackageExists) {
      throw new Error('Work package not found');
    }

    // Check if user exists
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already watching
    const isWatching = await this.watcherRepository.isWatching(workPackageId, userId);
    if (isWatching) {
      throw new Error('User is already watching this work package');
    }

    return await this.watcherRepository.addWatcher(workPackageId, userId);
  }

  /**
   * Remove a watcher from a work package
   */
  async removeWatcher(workPackageId: string, userId: string): Promise<boolean> {
    if (!workPackageId) {
      throw new Error('Work package ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if work package exists
    const workPackageExists = await this.workPackageRepository.exists(workPackageId);
    if (!workPackageExists) {
      throw new Error('Work package not found');
    }

    // Check if user is watching
    const isWatching = await this.watcherRepository.isWatching(workPackageId, userId);
    if (!isWatching) {
      throw new Error('User is not watching this work package');
    }

    return await this.watcherRepository.removeWatcher(workPackageId, userId);
  }

  /**
   * Get all watchers for a work package
   */
  async getWatchers(workPackageId: string): Promise<WorkPackageWatcher[]> {
    if (!workPackageId) {
      throw new Error('Work package ID is required');
    }

    // Check if work package exists
    const workPackageExists = await this.workPackageRepository.exists(workPackageId);
    if (!workPackageExists) {
      throw new Error('Work package not found');
    }

    return await this.watcherRepository.getWatchers(workPackageId);
  }
}

export const createWorkPackageService = (): WorkPackageService => {
  return new WorkPackageService();
};
