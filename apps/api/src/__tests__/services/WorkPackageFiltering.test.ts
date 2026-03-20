import { WorkPackageService } from '../../services/WorkPackageService';
import { WorkPackageRepository } from '../../repositories/WorkPackageRepository';
import { ProjectRepository } from '../../repositories/ProjectRepository';
import { WorkPackage, WorkPackageType, Priority, SchedulingMode } from '../../entities/WorkPackage';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { User } from '../../entities/User';

describe('WorkPackageService - Filtering and Search', () => {
  let workPackageService: WorkPackageService;
  let mockWorkPackageRepository: jest.Mocked<WorkPackageRepository>;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;

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

  const createMockWorkPackage = (overrides: Partial<WorkPackage> = {}): WorkPackage => ({
    id: 'wp-123',
    projectId: mockProject.id,
    type: WorkPackageType.TASK,
    subject: 'Test Task',
    description: 'Test Description',
    status: 'new',
    priority: Priority.NORMAL,
    assigneeId: mockUser.id,
    accountableId: undefined,
    parentId: undefined,
    startDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-31'),
    estimatedHours: 10,
    spentHours: 0,
    progressPercent: 0,
    schedulingMode: SchedulingMode.MANUAL,
    versionId: undefined,
    sprintId: undefined,
    storyPoints: undefined,
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    project: mockProject,
    assignee: mockUser,
    accountable: undefined,
    parent: undefined,
    children: [],
    relationsFrom: [],
    relationsTo: [],
    watchers: [],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockWorkPackageRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findByIds: jest.fn(),
    } as any;

    mockProjectRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as any;

    workPackageService = new WorkPackageService(
      mockWorkPackageRepository,
      mockProjectRepository
    );
  });

  describe('Filtering by type', () => {
    it('should filter work packages by single type', async () => {
      const mockResult = {
        workPackages: [createMockWorkPackage({ type: WorkPackageType.TASK })],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        type: [WorkPackageType.TASK],
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        type: [WorkPackageType.TASK],
      });
    });

    it('should filter work packages by multiple types', async () => {
      const mockResult = {
        workPackages: [
          createMockWorkPackage({ type: WorkPackageType.TASK }),
          createMockWorkPackage({ id: 'wp-124', type: WorkPackageType.BUG }),
        ],
        total: 2,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        type: [WorkPackageType.TASK, WorkPackageType.BUG],
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        type: [WorkPackageType.TASK, WorkPackageType.BUG],
      });
    });
  });

  describe('Filtering by status', () => {
    it('should filter work packages by single status', async () => {
      const mockResult = {
        workPackages: [createMockWorkPackage({ status: 'in_progress' })],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        status: ['in_progress'],
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        status: ['in_progress'],
      });
    });

    it('should filter work packages by multiple statuses', async () => {
      const mockResult = {
        workPackages: [
          createMockWorkPackage({ status: 'new' }),
          createMockWorkPackage({ id: 'wp-124', status: 'in_progress' }),
        ],
        total: 2,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        status: ['new', 'in_progress'],
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Filtering by priority', () => {
    it('should filter work packages by priority', async () => {
      const mockResult = {
        workPackages: [createMockWorkPackage({ priority: Priority.HIGH })],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        priority: [Priority.HIGH],
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        priority: [Priority.HIGH],
      });
    });

    it('should filter work packages by multiple priorities', async () => {
      const mockResult = {
        workPackages: [
          createMockWorkPackage({ priority: Priority.HIGH }),
          createMockWorkPackage({ id: 'wp-124', priority: Priority.URGENT }),
        ],
        total: 2,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        priority: [Priority.HIGH, Priority.URGENT],
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Filtering by assignee', () => {
    it('should filter work packages by assignee', async () => {
      const mockResult = {
        workPackages: [createMockWorkPackage({ assigneeId: mockUser.id })],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        assigneeId: mockUser.id,
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        assigneeId: mockUser.id,
      });
    });
  });

  describe('Filtering by date ranges', () => {
    it('should filter work packages by start date range', async () => {
      const startDateFrom = new Date('2024-01-01');
      const startDateTo = new Date('2024-01-31');

      const mockResult = {
        workPackages: [
          createMockWorkPackage({ startDate: new Date('2024-01-15') }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        startDateFrom,
        startDateTo,
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        startDateFrom,
        startDateTo,
      });
    });

    it('should filter work packages by due date range', async () => {
      const dueDateFrom = new Date('2024-02-01');
      const dueDateTo = new Date('2024-02-28');

      const mockResult = {
        workPackages: [
          createMockWorkPackage({ dueDate: new Date('2024-02-15') }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        dueDateFrom,
        dueDateTo,
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        dueDateFrom,
        dueDateTo,
      });
    });

    it('should filter work packages by both start and due date ranges', async () => {
      const startDateFrom = new Date('2024-01-01');
      const startDateTo = new Date('2024-01-31');
      const dueDateFrom = new Date('2024-02-01');
      const dueDateTo = new Date('2024-02-28');

      const mockResult = {
        workPackages: [
          createMockWorkPackage({
            startDate: new Date('2024-01-15'),
            dueDate: new Date('2024-02-15'),
          }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        startDateFrom,
        startDateTo,
        dueDateFrom,
        dueDateTo,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Filtering by parent', () => {
    it('should filter work packages by parent ID', async () => {
      const parentId = 'parent-wp-123';
      const mockResult = {
        workPackages: [createMockWorkPackage({ parentId })],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        parentId,
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        parentId,
      });
    });

    it('should filter work packages with no parent', async () => {
      const mockResult = {
        workPackages: [createMockWorkPackage({ parentId: undefined })],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        parentId: null as any,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Search functionality', () => {
    it('should search work packages by subject', async () => {
      const mockResult = {
        workPackages: [
          createMockWorkPackage({ subject: 'Implement authentication feature' }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        search: 'authentication',
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        search: 'authentication',
      });
    });

    it('should search work packages by description', async () => {
      const mockResult = {
        workPackages: [
          createMockWorkPackage({
            subject: 'Task 1',
            description: 'This task involves implementing authentication',
          }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        search: 'authentication',
      });

      expect(result).toEqual(mockResult);
    });

    it('should return empty results when search term does not match', async () => {
      const mockResult = {
        workPackages: [],
        total: 0,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        search: 'nonexistent',
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Custom field filtering', () => {
    it('should filter work packages by single custom field', async () => {
      const mockResult = {
        workPackages: [
          createMockWorkPackage({
            customFields: { department: 'Engineering' },
          }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        customFields: { department: 'Engineering' },
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        customFields: { department: 'Engineering' },
      });
    });

    it('should filter work packages by multiple custom fields', async () => {
      const mockResult = {
        workPackages: [
          createMockWorkPackage({
            customFields: {
              department: 'Engineering',
              team: 'Backend',
            },
          }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        customFields: {
          department: 'Engineering',
          team: 'Backend',
        },
      });

      expect(result).toEqual(mockResult);
    });

    it('should filter work packages by custom field with null value', async () => {
      const mockResult = {
        workPackages: [
          createMockWorkPackage({
            customFields: { department: null },
          }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        customFields: { department: null },
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Combined filtering', () => {
    it('should apply multiple filters simultaneously', async () => {
      const mockResult = {
        workPackages: [
          createMockWorkPackage({
            type: WorkPackageType.TASK,
            status: 'in_progress',
            priority: Priority.HIGH,
            assigneeId: mockUser.id,
          }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        type: [WorkPackageType.TASK],
        status: ['in_progress'],
        priority: [Priority.HIGH],
        assigneeId: mockUser.id,
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        type: [WorkPackageType.TASK],
        status: ['in_progress'],
        priority: [Priority.HIGH],
        assigneeId: mockUser.id,
      });
    });

    it('should combine filters with search', async () => {
      const mockResult = {
        workPackages: [
          createMockWorkPackage({
            type: WorkPackageType.BUG,
            subject: 'Fix authentication bug',
          }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        type: [WorkPackageType.BUG],
        search: 'authentication',
      });

      expect(result).toEqual(mockResult);
    });

    it('should combine filters with date ranges and custom fields', async () => {
      const startDateFrom = new Date('2024-01-01');
      const dueDateTo = new Date('2024-12-31');

      const mockResult = {
        workPackages: [
          createMockWorkPackage({
            type: WorkPackageType.FEATURE,
            startDate: new Date('2024-06-01'),
            dueDate: new Date('2024-06-30'),
            customFields: { sprint: 'Sprint 5' },
          }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        type: [WorkPackageType.FEATURE],
        startDateFrom,
        dueDateTo,
        customFields: { sprint: 'Sprint 5' },
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Pagination and sorting', () => {
    it('should paginate results', async () => {
      const mockResult = {
        workPackages: [createMockWorkPackage()],
        total: 50,
        page: 2,
        perPage: 10,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        page: 2,
        perPage: 10,
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        page: 2,
        perPage: 10,
      });
    });

    it('should sort results by specified field', async () => {
      const mockResult = {
        workPackages: [createMockWorkPackage()],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        sortBy: 'dueDate',
        sortOrder: 'ASC',
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        sortBy: 'dueDate',
        sortOrder: 'ASC',
      });
    });

    it('should handle empty results', async () => {
      const mockResult = {
        workPackages: [],
        total: 0,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        type: [WorkPackageType.MILESTONE],
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Project filtering', () => {
    it('should filter work packages by project ID', async () => {
      const mockResult = {
        workPackages: [createMockWorkPackage({ projectId: mockProject.id })],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        projectId: mockProject.id,
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        projectId: mockProject.id,
      });
    });
  });
});
