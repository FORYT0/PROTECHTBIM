import { WorkPackageService } from '../../services/WorkPackageService';
import { WorkPackageRepository } from '../../repositories/WorkPackageRepository';
import { ProjectRepository } from '../../repositories/ProjectRepository';
import { WorkPackage, WorkPackageType, Priority, SchedulingMode } from '../../entities/WorkPackage';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { User } from '../../entities/User';

describe('WorkPackageService', () => {
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

  const mockWorkPackage: WorkPackage = {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repositories
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

  describe('createWorkPackage', () => {
    it('should create work package with required fields', async () => {
      mockProjectRepository.exists.mockResolvedValue(true);
      mockWorkPackageRepository.create.mockResolvedValue(mockWorkPackage);

      const result = await workPackageService.createWorkPackage({
        projectId: mockProject.id,
        type: WorkPackageType.TASK,
        subject: 'Test Task',
      });

      expect(result).toEqual(mockWorkPackage);
      expect(mockWorkPackageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: mockProject.id,
          type: WorkPackageType.TASK,
          subject: 'Test Task',
          status: 'new',
          priority: Priority.NORMAL,
          schedulingMode: SchedulingMode.MANUAL,
        })
      );
    });

    it('should throw error when subject is missing', async () => {
      await expect(
        workPackageService.createWorkPackage({
          projectId: mockProject.id,
          type: WorkPackageType.TASK,
          subject: '',
        })
      ).rejects.toThrow('Work package subject is required');

      expect(mockWorkPackageRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when project ID is missing', async () => {
      await expect(
        workPackageService.createWorkPackage({
          projectId: '',
          type: WorkPackageType.TASK,
          subject: 'Test Task',
        })
      ).rejects.toThrow('Project ID is required');

      expect(mockWorkPackageRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when type is missing', async () => {
      await expect(
        workPackageService.createWorkPackage({
          projectId: mockProject.id,
          type: undefined as any,
          subject: 'Test Task',
        })
      ).rejects.toThrow('Work package type is required');

      expect(mockWorkPackageRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when project does not exist', async () => {
      mockProjectRepository.exists.mockResolvedValue(false);

      await expect(
        workPackageService.createWorkPackage({
          projectId: 'non-existent',
          type: WorkPackageType.TASK,
          subject: 'Test Task',
        })
      ).rejects.toThrow('Project not found');

      expect(mockWorkPackageRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when parent work package does not exist', async () => {
      mockProjectRepository.exists.mockResolvedValue(true);
      mockWorkPackageRepository.exists.mockResolvedValue(false);

      await expect(
        workPackageService.createWorkPackage({
          projectId: mockProject.id,
          type: WorkPackageType.TASK,
          subject: 'Test Task',
          parentId: 'non-existent',
        })
      ).rejects.toThrow('Parent work package not found');

      expect(mockWorkPackageRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when start date is after due date', async () => {
      mockProjectRepository.exists.mockResolvedValue(true);

      await expect(
        workPackageService.createWorkPackage({
          projectId: mockProject.id,
          type: WorkPackageType.TASK,
          subject: 'Test Task',
          startDate: new Date('2024-02-01'),
          dueDate: new Date('2024-01-01'),
        })
      ).rejects.toThrow('Start date must be before due date');

      expect(mockWorkPackageRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when estimated hours is negative', async () => {
      mockProjectRepository.exists.mockResolvedValue(true);

      await expect(
        workPackageService.createWorkPackage({
          projectId: mockProject.id,
          type: WorkPackageType.TASK,
          subject: 'Test Task',
          estimatedHours: -5,
        })
      ).rejects.toThrow('Estimated hours must be non-negative');

      expect(mockWorkPackageRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getWorkPackageById', () => {
    it('should return work package by ID', async () => {
      mockWorkPackageRepository.findById.mockResolvedValue(mockWorkPackage);

      const result = await workPackageService.getWorkPackageById('wp-123');

      expect(result).toEqual(mockWorkPackage);
      expect(mockWorkPackageRepository.findById).toHaveBeenCalledWith('wp-123');
    });

    it('should return null when work package not found', async () => {
      mockWorkPackageRepository.findById.mockResolvedValue(null);

      const result = await workPackageService.getWorkPackageById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error when ID is missing', async () => {
      await expect(workPackageService.getWorkPackageById('')).rejects.toThrow(
        'Work package ID is required'
      );

      expect(mockWorkPackageRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('listWorkPackages', () => {
    it('should list work packages with filters', async () => {
      const mockResult = {
        workPackages: [mockWorkPackage],
        total: 1,
        page: 1,
        perPage: 20,
      };

      mockWorkPackageRepository.findAll.mockResolvedValue(mockResult);

      const result = await workPackageService.listWorkPackages({
        projectId: mockProject.id,
        page: 1,
        perPage: 20,
      });

      expect(result).toEqual(mockResult);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        projectId: mockProject.id,
        page: 1,
        perPage: 20,
      });
    });

    it('should throw error when page is less than 1', async () => {
      await expect(
        workPackageService.listWorkPackages({ page: 0 })
      ).rejects.toThrow('Page must be greater than 0');

      expect(mockWorkPackageRepository.findAll).not.toHaveBeenCalled();
    });

    it('should throw error when perPage is out of range', async () => {
      await expect(
        workPackageService.listWorkPackages({ perPage: 101 })
      ).rejects.toThrow('Per page must be between 1 and 100');

      expect(mockWorkPackageRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('updateWorkPackage', () => {
    it('should update work package', async () => {
      const updatedWorkPackage = {
        ...mockWorkPackage,
        subject: 'Updated Task',
      };

      mockWorkPackageRepository.findById.mockResolvedValue(mockWorkPackage);
      mockWorkPackageRepository.update.mockResolvedValue(updatedWorkPackage);

      const result = await workPackageService.updateWorkPackage('wp-123', {
        subject: 'Updated Task',
      });

      expect(result.subject).toBe('Updated Task');
      expect(mockWorkPackageRepository.update).toHaveBeenCalledWith(
        'wp-123',
        expect.objectContaining({
          subject: 'Updated Task',
        })
      );
    });

    it('should throw error when work package not found', async () => {
      mockWorkPackageRepository.findById.mockResolvedValue(null);

      await expect(
        workPackageService.updateWorkPackage('non-existent', {
          subject: 'Updated Task',
        })
      ).rejects.toThrow('Work package not found');

      expect(mockWorkPackageRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when ID is missing', async () => {
      await expect(
        workPackageService.updateWorkPackage('', { subject: 'Updated Task' })
      ).rejects.toThrow('Work package ID is required');

      expect(mockWorkPackageRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error when work package is set as its own parent', async () => {
      mockWorkPackageRepository.findById.mockResolvedValue(mockWorkPackage);

      await expect(
        workPackageService.updateWorkPackage('wp-123', {
          parentId: 'wp-123',
        })
      ).rejects.toThrow('Work package cannot be its own parent');

      expect(mockWorkPackageRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when parent work package does not exist', async () => {
      mockWorkPackageRepository.findById.mockResolvedValue(mockWorkPackage);
      mockWorkPackageRepository.exists.mockResolvedValue(false);

      await expect(
        workPackageService.updateWorkPackage('wp-123', {
          parentId: 'non-existent',
        })
      ).rejects.toThrow('Parent work package not found');

      expect(mockWorkPackageRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when start date is after due date', async () => {
      mockWorkPackageRepository.findById.mockResolvedValue(mockWorkPackage);

      await expect(
        workPackageService.updateWorkPackage('wp-123', {
          startDate: new Date('2024-02-01'),
          dueDate: new Date('2024-01-01'),
        })
      ).rejects.toThrow('Start date must be before due date');

      expect(mockWorkPackageRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when subject is empty', async () => {
      mockWorkPackageRepository.findById.mockResolvedValue(mockWorkPackage);

      await expect(
        workPackageService.updateWorkPackage('wp-123', {
          subject: '',
        })
      ).rejects.toThrow('Work package subject cannot be empty');

      expect(mockWorkPackageRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when progress percent is out of range', async () => {
      mockWorkPackageRepository.findById.mockResolvedValue(mockWorkPackage);

      await expect(
        workPackageService.updateWorkPackage('wp-123', {
          progressPercent: 101,
        })
      ).rejects.toThrow('Progress percent must be between 0 and 100');

      expect(mockWorkPackageRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when estimated hours is negative', async () => {
      mockWorkPackageRepository.findById.mockResolvedValue(mockWorkPackage);

      await expect(
        workPackageService.updateWorkPackage('wp-123', {
          estimatedHours: -5,
        })
      ).rejects.toThrow('Estimated hours must be non-negative');

      expect(mockWorkPackageRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteWorkPackage', () => {
    it('should delete work package', async () => {
      mockWorkPackageRepository.exists.mockResolvedValue(true);
      mockWorkPackageRepository.delete.mockResolvedValue(true);

      const result = await workPackageService.deleteWorkPackage('wp-123');

      expect(result).toBe(true);
      expect(mockWorkPackageRepository.delete).toHaveBeenCalledWith('wp-123');
    });

    it('should throw error when work package not found', async () => {
      mockWorkPackageRepository.exists.mockResolvedValue(false);

      await expect(
        workPackageService.deleteWorkPackage('non-existent')
      ).rejects.toThrow('Work package not found');

      expect(mockWorkPackageRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when ID is missing', async () => {
      await expect(workPackageService.deleteWorkPackage('')).rejects.toThrow(
        'Work package ID is required'
      );

      expect(mockWorkPackageRepository.exists).not.toHaveBeenCalled();
    });
  });
});
