import { ProjectService } from '../../services/ProjectService';
import { ProjectRepository } from '../../repositories/ProjectRepository';
import { WorkPackageRepository } from '../../repositories/WorkPackageRepository';
import { WorkPackageRelationRepository } from '../../repositories/WorkPackageRelationRepository';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { WorkPackage, WorkPackageType, Priority, SchedulingMode } from '../../entities/WorkPackage';
import { WorkPackageRelation, RelationType } from '../../entities/WorkPackageRelation';
import { User } from '../../entities/User';

describe('ProjectService', () => {
  let projectService: ProjectService;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;
  let mockWorkPackageRepository: jest.Mocked<WorkPackageRepository>;
  let mockWorkPackageRelationRepository: jest.Mocked<WorkPackageRelationRepository>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hash',
    status: 'active',
    currency: 'USD',
    isPlaceholder: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
    groups: [],
  };

  const mockProject: Project = {
    id: 'project-123',
    name: 'Test Project',
    description: 'Test Description',
    programId: undefined,
    portfolioId: undefined,
    ownerId: mockUser.id,
    status: ProjectStatus.ACTIVE,
    lifecyclePhase: LifecyclePhase.INITIATION,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    templateId: undefined,
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository
    mockProjectRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as any;

    mockWorkPackageRepository = {
      findAll: jest.fn(),
    } as any;

    mockWorkPackageRelationRepository = {
      findByWorkPackageId: jest.fn(),
    } as any;

    projectService = new ProjectService(
      mockProjectRepository,
      mockWorkPackageRepository,
      mockWorkPackageRelationRepository
    );
  });

  describe('transitionPhase', () => {
    it('should transition from initiation to planning', async () => {
      const updatedProject = {
        ...mockProject,
        lifecyclePhase: LifecyclePhase.PLANNING,
      };

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.update.mockResolvedValue(updatedProject);

      const result = await projectService.transitionPhase(
        'project-123',
        LifecyclePhase.PLANNING
      );

      expect(result.lifecyclePhase).toBe(LifecyclePhase.PLANNING);
      expect(mockProjectRepository.update).toHaveBeenCalledWith('project-123', {
        lifecyclePhase: LifecyclePhase.PLANNING,
      });
    });

    it('should transition from planning to execution', async () => {
      const projectInPlanning = {
        ...mockProject,
        lifecyclePhase: LifecyclePhase.PLANNING,
      };
      const updatedProject = {
        ...projectInPlanning,
        lifecyclePhase: LifecyclePhase.EXECUTION,
      };

      mockProjectRepository.findById.mockResolvedValue(projectInPlanning);
      mockProjectRepository.update.mockResolvedValue(updatedProject);

      const result = await projectService.transitionPhase(
        'project-123',
        LifecyclePhase.EXECUTION
      );

      expect(result.lifecyclePhase).toBe(LifecyclePhase.EXECUTION);
    });

    it('should transition from execution to monitoring', async () => {
      const projectInExecution = {
        ...mockProject,
        lifecyclePhase: LifecyclePhase.EXECUTION,
      };
      const updatedProject = {
        ...projectInExecution,
        lifecyclePhase: LifecyclePhase.MONITORING,
      };

      mockProjectRepository.findById.mockResolvedValue(projectInExecution);
      mockProjectRepository.update.mockResolvedValue(updatedProject);

      const result = await projectService.transitionPhase(
        'project-123',
        LifecyclePhase.MONITORING
      );

      expect(result.lifecyclePhase).toBe(LifecyclePhase.MONITORING);
    });

    it('should transition from monitoring to closure', async () => {
      const projectInMonitoring = {
        ...mockProject,
        lifecyclePhase: LifecyclePhase.MONITORING,
      };
      const updatedProject = {
        ...projectInMonitoring,
        lifecyclePhase: LifecyclePhase.CLOSURE,
      };

      mockProjectRepository.findById.mockResolvedValue(projectInMonitoring);
      mockProjectRepository.update.mockResolvedValue(updatedProject);

      const result = await projectService.transitionPhase(
        'project-123',
        LifecyclePhase.CLOSURE
      );

      expect(result.lifecyclePhase).toBe(LifecyclePhase.CLOSURE);
    });

    it('should allow backward phase transition', async () => {
      const projectInExecution = {
        ...mockProject,
        lifecyclePhase: LifecyclePhase.EXECUTION,
      };
      const updatedProject = {
        ...projectInExecution,
        lifecyclePhase: LifecyclePhase.PLANNING,
      };

      mockProjectRepository.findById.mockResolvedValue(projectInExecution);
      mockProjectRepository.update.mockResolvedValue(updatedProject);

      const result = await projectService.transitionPhase(
        'project-123',
        LifecyclePhase.PLANNING
      );

      expect(result.lifecyclePhase).toBe(LifecyclePhase.PLANNING);
    });

    it('should allow staying in the same phase', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.update.mockResolvedValue(mockProject);

      const result = await projectService.transitionPhase(
        'project-123',
        LifecyclePhase.INITIATION
      );

      expect(result.lifecyclePhase).toBe(LifecyclePhase.INITIATION);
    });

    it('should reject skipping phases forward', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        projectService.transitionPhase('project-123', LifecyclePhase.EXECUTION)
      ).rejects.toThrow(
        'Cannot skip from initiation to execution. Must transition through intermediate phases.'
      );

      expect(mockProjectRepository.update).not.toHaveBeenCalled();
    });

    it('should reject skipping multiple phases forward', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        projectService.transitionPhase('project-123', LifecyclePhase.CLOSURE)
      ).rejects.toThrow('Cannot skip from initiation to closure');

      expect(mockProjectRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.transitionPhase('non-existent', LifecyclePhase.PLANNING)
      ).rejects.toThrow('Project not found');

      expect(mockProjectRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when project ID is missing', async () => {
      await expect(
        projectService.transitionPhase('', LifecyclePhase.PLANNING)
      ).rejects.toThrow('Project ID is required');

      expect(mockProjectRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.update.mockResolvedValue(null);

      await expect(
        projectService.transitionPhase('project-123', LifecyclePhase.PLANNING)
      ).rejects.toThrow('Failed to update project phase');
    });
  });

  describe('createProject', () => {
    it('should create project with default lifecycle phase', async () => {
      mockProjectRepository.create.mockResolvedValue(mockProject);

      const result = await projectService.createProject({
        name: 'Test Project',
        ownerId: mockUser.id,
      });

      expect(result.lifecyclePhase).toBe(LifecyclePhase.INITIATION);
      expect(mockProjectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lifecyclePhase: LifecyclePhase.INITIATION,
        })
      );
    });

    it('should create project with specified lifecycle phase', async () => {
      const projectInPlanning = {
        ...mockProject,
        lifecyclePhase: LifecyclePhase.PLANNING,
      };
      mockProjectRepository.create.mockResolvedValue(projectInPlanning);

      const result = await projectService.createProject({
        name: 'Test Project',
        ownerId: mockUser.id,
        lifecyclePhase: LifecyclePhase.PLANNING,
      });

      expect(result.lifecyclePhase).toBe(LifecyclePhase.PLANNING);
    });

    it('should throw error when name is missing', async () => {
      await expect(
        projectService.createProject({
          name: '',
          ownerId: mockUser.id,
        })
      ).rejects.toThrow('Project name is required');

      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when ownerId is missing', async () => {
      await expect(
        projectService.createProject({
          name: 'Test Project',
          ownerId: '',
        })
      ).rejects.toThrow('Project owner is required');

      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when start date is after end date', async () => {
      await expect(
        projectService.createProject({
          name: 'Test Project',
          ownerId: mockUser.id,
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01'),
        })
      ).rejects.toThrow('Start date must be before end date');

      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });

    it('should create project with valid date range', async () => {
      mockProjectRepository.create.mockResolvedValue(mockProject);

      const result = await projectService.createProject({
        name: 'Test Project',
        ownerId: mockUser.id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(result).toEqual(mockProject);
      expect(mockProjectRepository.create).toHaveBeenCalled();
    });

    it('should create project with program assignment', async () => {
      const projectWithProgram = {
        ...mockProject,
        programId: 'program-123',
      };
      mockProjectRepository.create.mockResolvedValue(projectWithProgram);

      const result = await projectService.createProject({
        name: 'Test Project',
        ownerId: mockUser.id,
        programId: 'program-123',
      });

      expect(result.programId).toBe('program-123');
      expect(mockProjectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          programId: 'program-123',
        })
      );
    });

    it('should create project with portfolio assignment', async () => {
      const projectWithPortfolio = {
        ...mockProject,
        portfolioId: 'portfolio-123',
      };
      mockProjectRepository.create.mockResolvedValue(projectWithPortfolio);

      const result = await projectService.createProject({
        name: 'Test Project',
        ownerId: mockUser.id,
        portfolioId: 'portfolio-123',
      });

      expect(result.portfolioId).toBe('portfolio-123');
      expect(mockProjectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          portfolioId: 'portfolio-123',
        })
      );
    });

    it('should create project with both program and portfolio', async () => {
      const projectWithHierarchy = {
        ...mockProject,
        programId: 'program-123',
        portfolioId: 'portfolio-123',
      };
      mockProjectRepository.create.mockResolvedValue(projectWithHierarchy);

      const result = await projectService.createProject({
        name: 'Test Project',
        ownerId: mockUser.id,
        programId: 'program-123',
        portfolioId: 'portfolio-123',
      });

      expect(result.programId).toBe('program-123');
      expect(result.portfolioId).toBe('portfolio-123');
    });

    it('should create project with custom fields', async () => {
      const projectWithCustomFields = {
        ...mockProject,
        customFields: { budget: 100000, priority: 'high', region: 'North' },
      };
      mockProjectRepository.create.mockResolvedValue(projectWithCustomFields);

      const result = await projectService.createProject({
        name: 'Test Project',
        ownerId: mockUser.id,
        customFields: { budget: 100000, priority: 'high', region: 'North' },
      });

      expect(result.customFields).toEqual({
        budget: 100000,
        priority: 'high',
        region: 'North',
      });
    });

    it('should create project with all optional fields', async () => {
      const completeProject = {
        ...mockProject,
        description: 'Complete Description',
        programId: 'program-123',
        portfolioId: 'portfolio-123',
        status: ProjectStatus.ACTIVE,
        lifecyclePhase: LifecyclePhase.PLANNING,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        templateId: 'template-123',
        customFields: { key: 'value' },
      };
      mockProjectRepository.create.mockResolvedValue(completeProject);

      const result = await projectService.createProject({
        name: 'Test Project',
        description: 'Complete Description',
        ownerId: mockUser.id,
        programId: 'program-123',
        portfolioId: 'portfolio-123',
        status: ProjectStatus.ACTIVE,
        lifecyclePhase: LifecyclePhase.PLANNING,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        templateId: 'template-123',
        customFields: { key: 'value' },
      });

      expect(result).toEqual(completeProject);
    });
  });

  describe('updateProject', () => {
    it('should update project lifecycle phase directly', async () => {
      const updatedProject = {
        ...mockProject,
        lifecyclePhase: LifecyclePhase.EXECUTION,
      };

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.update.mockResolvedValue(updatedProject);

      const result = await projectService.updateProject('project-123', {
        lifecyclePhase: LifecyclePhase.EXECUTION,
      });

      expect(result.lifecyclePhase).toBe(LifecyclePhase.EXECUTION);
      expect(mockProjectRepository.update).toHaveBeenCalledWith(
        'project-123',
        expect.objectContaining({
          lifecyclePhase: LifecyclePhase.EXECUTION,
        })
      );
    });
  });

  describe('getGanttData', () => {
    const mockWorkPackages: Partial<WorkPackage>[] = [
      {
        id: 'wp-1',
        projectId: 'project-123',
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        description: 'First task',
        status: 'open',
        priority: Priority.NORMAL,
        assigneeId: mockUser.id,
        accountableId: undefined,
        parentId: undefined,
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-15'),
        estimatedHours: 40,
        spentHours: 10,
        progressPercent: 25,
        schedulingMode: SchedulingMode.AUTOMATIC,
        versionId: undefined,
        sprintId: undefined,
        storyPoints: undefined,
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: mockUser,
      },
      {
        id: 'wp-2',
        projectId: 'project-123',
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        description: 'Second task',
        status: 'in_progress',
        priority: Priority.HIGH,
        assigneeId: mockUser.id,
        accountableId: undefined,
        parentId: undefined,
        startDate: new Date('2024-01-16'),
        dueDate: new Date('2024-01-31'),
        estimatedHours: 60,
        spentHours: 20,
        progressPercent: 33,
        schedulingMode: SchedulingMode.MANUAL,
        versionId: undefined,
        sprintId: undefined,
        storyPoints: 5,
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: mockUser,
      },
    ];

    const mockRelations: Partial<WorkPackageRelation>[] = [
      {
        id: 'rel-1',
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
      },
    ];

    it('should return Gantt data with work packages and relations', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        total: 2,
        page: 1,
        perPage: 1000,
      });
      mockWorkPackageRelationRepository.findByWorkPackageId
        .mockResolvedValueOnce(mockRelations as WorkPackageRelation[])
        .mockResolvedValueOnce([]);

      const result = await projectService.getGanttData('project-123');

      expect(result.workPackages).toHaveLength(2);
      expect(result.relations).toHaveLength(1);
      expect(mockProjectRepository.findById).toHaveBeenCalledWith('project-123');
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        projectId: 'project-123',
        perPage: 1000,
      });
    });

    it('should filter work packages by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-15');

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: [mockWorkPackages[0]] as WorkPackage[],
        total: 1,
        page: 1,
        perPage: 1000,
      });
      mockWorkPackageRelationRepository.findByWorkPackageId.mockResolvedValue([]);

      const result = await projectService.getGanttData('project-123', {
        startDate,
        endDate,
      });

      expect(result.workPackages).toHaveLength(1);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        projectId: 'project-123',
        perPage: 1000,
        dueDateFrom: startDate,
        startDateTo: endDate,
      });
    });

    it('should exclude relations when includeRelations is false', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        total: 2,
        page: 1,
        perPage: 1000,
      });

      const result = await projectService.getGanttData('project-123', {
        includeRelations: false,
      });

      expect(result.workPackages).toHaveLength(2);
      expect(result.relations).toHaveLength(0);
      expect(mockWorkPackageRelationRepository.findByWorkPackageId).not.toHaveBeenCalled();
    });

    it('should include relations by default', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        total: 2,
        page: 1,
        perPage: 1000,
      });
      mockWorkPackageRelationRepository.findByWorkPackageId
        .mockResolvedValueOnce(mockRelations as WorkPackageRelation[])
        .mockResolvedValueOnce([]);

      const result = await projectService.getGanttData('project-123');

      expect(result.relations).toHaveLength(1);
      expect(mockWorkPackageRelationRepository.findByWorkPackageId).toHaveBeenCalledTimes(2);
    });

    it('should handle empty work packages', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: [],
        total: 0,
        page: 1,
        perPage: 1000,
      });

      const result = await projectService.getGanttData('project-123');

      expect(result.workPackages).toHaveLength(0);
      expect(result.relations).toHaveLength(0);
      expect(mockWorkPackageRelationRepository.findByWorkPackageId).not.toHaveBeenCalled();
    });

    it('should deduplicate relations', async () => {
      const duplicateRelations = [mockRelations[0], mockRelations[0]];

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        total: 2,
        page: 1,
        perPage: 1000,
      });
      mockWorkPackageRelationRepository.findByWorkPackageId
        .mockResolvedValueOnce(duplicateRelations as WorkPackageRelation[])
        .mockResolvedValueOnce([]);

      const result = await projectService.getGanttData('project-123');

      expect(result.relations).toHaveLength(1);
    });

    it('should throw error when project ID is missing', async () => {
      await expect(projectService.getGanttData('')).rejects.toThrow(
        'Project ID is required'
      );
    });

    it('should throw error when project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(projectService.getGanttData('nonexistent')).rejects.toThrow(
        'Project not found'
      );
    });

    it('should apply only start date filter', async () => {
      const startDate = new Date('2024-01-01');

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        total: 2,
        page: 1,
        perPage: 1000,
      });
      mockWorkPackageRelationRepository.findByWorkPackageId.mockResolvedValue([]);

      await projectService.getGanttData('project-123', { startDate });

      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        projectId: 'project-123',
        perPage: 1000,
        dueDateFrom: startDate,
      });
    });

    it('should apply only end date filter', async () => {
      const endDate = new Date('2024-12-31');

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        total: 2,
        page: 1,
        perPage: 1000,
      });
      mockWorkPackageRelationRepository.findByWorkPackageId.mockResolvedValue([]);

      await projectService.getGanttData('project-123', { endDate });

      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        projectId: 'project-123',
        perPage: 1000,
        startDateTo: endDate,
      });
    });
  });
});
