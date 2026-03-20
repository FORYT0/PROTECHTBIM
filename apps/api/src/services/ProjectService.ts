import { Project, ProjectStatus, LifecyclePhase } from '../entities/Project';
import {
  ProjectRepository,
  ProjectFilters,
  ProjectListResult,
  createProjectRepository,
} from '../repositories/ProjectRepository';
import {
  WorkPackageRepository,
  createWorkPackageRepository,
} from '../repositories/WorkPackageRepository';
import {
  WorkPackageRelationRepository,
  createWorkPackageRelationRepository,
} from '../repositories/WorkPackageRelationRepository';
import { WorkPackage } from '../entities/WorkPackage';
import { WorkPackageRelation } from '../entities/WorkPackageRelation';
import { ActivityLogRepository, createActivityLogRepository } from '../repositories/ActivityLogRepository';
import { ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';

export interface CreateProjectDTO {
  name: string;
  description?: string;
  programId?: string;
  portfolioId?: string;
  ownerId: string;
  status?: ProjectStatus;
  lifecyclePhase?: LifecyclePhase;
  startDate?: Date;
  endDate?: Date;
  templateId?: string;
  customFields?: Record<string, any>;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  programId?: string;
  portfolioId?: string;
  status?: ProjectStatus;
  lifecyclePhase?: LifecyclePhase;
  startDate?: Date;
  endDate?: Date;
  customFields?: Record<string, any>;
}

export interface GanttDataFilters {
  startDate?: Date;
  endDate?: Date;
  includeRelations?: boolean;
}

export interface GanttDataResponse {
  workPackages: WorkPackage[];
  relations: WorkPackageRelation[];
}

export class ProjectService {
  private projectRepository: ProjectRepository;
  private workPackageRepository: WorkPackageRepository;
  private workPackageRelationRepository: WorkPackageRelationRepository;
  private activityLogRepository: ActivityLogRepository;

  constructor(
    projectRepository?: ProjectRepository,
    workPackageRepository?: WorkPackageRepository,
    workPackageRelationRepository?: WorkPackageRelationRepository,
    activityLogRepository?: ActivityLogRepository
  ) {
    this.projectRepository = projectRepository || createProjectRepository();
    this.workPackageRepository = workPackageRepository || createWorkPackageRepository();
    this.workPackageRelationRepository =
      workPackageRelationRepository || createWorkPackageRelationRepository();
    this.activityLogRepository = activityLogRepository || createActivityLogRepository();
  }

  /**
   * Validates if a phase transition is allowed based on the lifecycle phase order
   */
  private validatePhaseTransition(
    currentPhase: LifecyclePhase,
    newPhase: LifecyclePhase
  ): { valid: boolean; message?: string } {
    // Define the valid phase order
    const phaseOrder: LifecyclePhase[] = [
      LifecyclePhase.INITIATION,
      LifecyclePhase.PLANNING,
      LifecyclePhase.EXECUTION,
      LifecyclePhase.MONITORING,
      LifecyclePhase.CLOSURE,
    ];

    const currentIndex = phaseOrder.indexOf(currentPhase);
    const newIndex = phaseOrder.indexOf(newPhase);

    // Allow staying in the same phase
    if (currentPhase === newPhase) {
      return {
        valid: true,
        message: `Project is already in ${newPhase} phase`,
      };
    }

    // Allow moving forward to the next phase
    if (newIndex === currentIndex + 1) {
      return { valid: true };
    }

    // Allow moving backward (for corrections)
    if (newIndex < currentIndex) {
      return {
        valid: true,
        message: `Moving backward from ${currentPhase} to ${newPhase}`,
      };
    }

    // Disallow skipping phases forward
    if (newIndex > currentIndex + 1) {
      return {
        valid: false,
        message: `Cannot skip from ${currentPhase} to ${newPhase}. Must transition through intermediate phases.`,
      };
    }

    return {
      valid: false,
      message: `Invalid phase transition from ${currentPhase} to ${newPhase}`,
    };
  }

  /**
   * Transition a project to a new lifecycle phase with validation
   */
  async transitionPhase(
    projectId: string,
    newPhase: LifecyclePhase,
    userId: string
  ): Promise<Project> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Get the current project
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Validate the phase transition
    const validation = this.validatePhaseTransition(
      project.lifecyclePhase,
      newPhase
    );

    if (!validation.valid) {
      throw new Error(validation.message || 'Invalid phase transition');
    }

    // Update the project phase
    const updatedProject = await this.projectRepository.update(projectId, {
      lifecyclePhase: newPhase,
    });

    if (!updatedProject) {
      throw new Error('Failed to update project phase');
    }

    // Log activity
    await this.activityLogRepository.create({
      projectId: updatedProject.id,
      userId,
      actionType: ActivityActionType.TRANSITIONED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updatedProject.id,
      description: `transitioned project to ${newPhase} phase`,
      metadata: {
        oldPhase: project.lifecyclePhase,
        newPhase,
      },
    });

    return updatedProject;
  }

  async createProject(data: CreateProjectDTO, userId: string): Promise<Project> {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Project name is required');
    }

    if (!data.ownerId) {
      throw new Error('Project owner is required');
    }

    // Validate dates if provided
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (start > end) {
        throw new Error('Start date must be before end date');
      }
    }

    const projectData: Partial<Project> = {
      name: data.name.trim(),
      description: data.description?.trim(),
      programId: data.programId,
      portfolioId: data.portfolioId,
      ownerId: data.ownerId,
      status: data.status || ProjectStatus.ACTIVE,
      lifecyclePhase: data.lifecyclePhase || LifecyclePhase.INITIATION,
      startDate: data.startDate,
      endDate: data.endDate,
      templateId: data.templateId,
      customFields: data.customFields,
    };

    const project = await this.projectRepository.create(projectData);

    // Log activity
    await this.activityLogRepository.create({
      projectId: project.id,
      userId,
      actionType: ActivityActionType.CREATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: project.id,
      description: `created project: ${project.name}`,
      metadata: {
        name: project.name,
        status: project.status,
      },
    });

    return project;
  }

  async getProjectById(id: string): Promise<Project | null> {
    if (!id) {
      throw new Error('Project ID is required');
    }

    return await this.projectRepository.findById(id);
  }

  async listProjects(filters: ProjectFilters): Promise<ProjectListResult> {
    // Validate pagination parameters
    if (filters.page && filters.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (filters.perPage && (filters.perPage < 1 || filters.perPage > 100)) {
      throw new Error('Per page must be between 1 and 100');
    }

    return await this.projectRepository.findAll(filters);
  }

  async updateProject(id: string, data: UpdateProjectDTO, userId: string): Promise<Project> {
    if (!id) {
      throw new Error('Project ID is required');
    }

    // Check if project exists
    const existingProject = await this.projectRepository.findById(id);
    if (!existingProject) {
      throw new Error('Project not found');
    }

    // Validate dates if provided
    if (data.startDate || data.endDate) {
      const startDate = data.startDate
        ? new Date(data.startDate)
        : existingProject.startDate;
      const endDate = data.endDate ? new Date(data.endDate) : existingProject.endDate;

      if (startDate && endDate && startDate > endDate) {
        throw new Error('Start date must be before end date');
      }
    }

    // Validate name if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Project name cannot be empty');
    }

    const updateData: Partial<Project> = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim();
    }

    if (data.programId !== undefined) {
      updateData.programId = data.programId;
    }

    if (data.portfolioId !== undefined) {
      updateData.portfolioId = data.portfolioId;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.lifecyclePhase !== undefined) {
      updateData.lifecyclePhase = data.lifecyclePhase;
    }

    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate;
    }

    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate;
    }

    if (data.customFields !== undefined) {
      updateData.customFields = data.customFields;
    }

    const updatedProject = await this.projectRepository.update(id, updateData);

    if (!updatedProject) {
      throw new Error('Failed to update project');
    }

    // Log activity
    await this.activityLogRepository.create({
      projectId: updatedProject.id,
      userId,
      actionType: ActivityActionType.UPDATED,
      entityType: ActivityEntityType.PROJECT,
      entityId: updatedProject.id,
      description: `updated project: ${updatedProject.name}`,
      metadata: {
        changes: data,
      },
    });

    return updatedProject;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    if (!id) {
      throw new Error('Project ID is required');
    }

    // Check if project exists
    const exists = await this.projectRepository.exists(id);
    if (!exists) {
      throw new Error('Project not found');
    }

    const project = await this.projectRepository.findById(id);
    const result = await this.projectRepository.delete(id);

    if (result && project) {
      // Log activity (note: project is deleted, but we log it to the project ID that existed)
      await this.activityLogRepository.create({
        projectId: id,
        userId,
        actionType: ActivityActionType.DELETED,
        entityType: ActivityEntityType.PROJECT,
        entityId: id,
        description: `deleted project: ${project.name}`,
        metadata: {
          name: project.name,
        },
      });
    }

    return result;
  }

  /**
   * Get Gantt chart data for a project
   * Retrieves work packages and their relationships, optionally filtered by date range
   */
  async getGanttData(
    projectId: string,
    filters: GanttDataFilters = {}
  ): Promise<GanttDataResponse> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Verify project exists
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Build filters for work packages
    const wpFilters: any = {
      projectId,
      perPage: 1000, // Get all work packages for Gantt view
    };

    // Apply date range filtering if provided
    if (filters.startDate) {
      wpFilters.dueDateFrom = filters.startDate;
    }

    if (filters.endDate) {
      wpFilters.startDateTo = filters.endDate;
    }

    // Get work packages for the project
    const { workPackages } = await this.workPackageRepository.findAll(wpFilters);

    // Get relations if requested (default to true)
    let relations: WorkPackageRelation[] = [];
    if (filters.includeRelations !== false) {
      // Get all work package IDs
      const workPackageIds = workPackages.map((wp) => wp.id);

      // Get all relations for these work packages
      if (workPackageIds.length > 0) {
        const allRelations = await Promise.all(
          workPackageIds.map((id) =>
            this.workPackageRelationRepository.findByWorkPackageId(id)
          )
        );

        // Flatten and deduplicate relations
        const relationMap = new Map<string, WorkPackageRelation>();
        allRelations.flat().forEach((relation) => {
          relationMap.set(relation.id, relation);
        });

        relations = Array.from(relationMap.values());
      }
    }

    return {
      workPackages,
      relations,
    };
  }
}

export const createProjectService = (): ProjectService => {
  return new ProjectService();
};
