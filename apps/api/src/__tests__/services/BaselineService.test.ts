import { BaselineService } from '../../services/BaselineService';
import { BaselineRepository } from '../../repositories/BaselineRepository';
import { WorkPackageRepository } from '../../repositories/WorkPackageRepository';
import { ProjectRepository } from '../../repositories/ProjectRepository';
import { Baseline } from '../../entities/Baseline';
import { BaselineWorkPackage } from '../../entities/BaselineWorkPackage';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { WorkPackage, WorkPackageType, Priority, SchedulingMode } from '../../entities/WorkPackage';
import { User } from '../../entities/User';

describe('BaselineService', () => {
  let service: BaselineService;
  let mockBaselineRepository: jest.Mocked<BaselineRepository>;
  let mockWorkPackageRepository: jest.Mocked<WorkPackageRepository>;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;

  const mockUser: User = {
    id: 'user-1',
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
    id: 'project-1',
    name: 'Test Project',
    description: 'Test Description',
    programId: undefined,
    portfolioId: undefined,
    ownerId: mockUser.id,
    status: ProjectStatus.ACTIVE,
    lifecyclePhase: LifecyclePhase.EXECUTION,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    templateId: undefined,
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: mockUser,
  };

  const mockBaseline: Baseline = {
    id: 'baseline-1',
    projectId: 'project-1',
    name: 'Sprint 1 Baseline',
    description: 'Baseline for Sprint 1',
    createdBy: 'user-1',
    createdAt: new Date('2024-01-01'),
    project: mockProject,
    creator: mockUser,
    workPackages: [],
  };

  const mockWorkPackages: WorkPackage[] = [
    {
      id: 'wp-1',
      projectId: 'project-1',
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
    } as WorkPackage,
    {
      id: 'wp-2',
      projectId: 'project-1',
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
    } as WorkPackage,
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockBaselineRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithWorkPackages: jest.fn(),
      findByProjectId: jest.fn(),
      addWorkPackageSnapshot: jest.fn(),
      getWorkPackageSnapshots: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as any;

    mockWorkPackageRepository = {
      findAll: jest.fn(),
    } as any;

    mockProjectRepository = {
      findById: jest.fn(),
    } as any;

    service = new BaselineService(
      mockBaselineRepository,
      mockWorkPackageRepository,
      mockProjectRepository
    );
  });

  // Helper function to create mock BaselineWorkPackage
  const createMockBaselineWorkPackage = (
    id: string,
    workPackageId: string,
    subject: string,
    startDate?: Date,
    dueDate?: Date
  ): BaselineWorkPackage => ({
    id,
    baselineId: 'baseline-1',
    workPackageId,
    subject,
    startDate,
    dueDate,
    baseline: mockBaseline,
  } as BaselineWorkPackage);

  describe('createBaseline', () => {
    it('should create a baseline with work package snapshots', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockBaselineRepository.create.mockResolvedValue(mockBaseline);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages,
        total: 2,
        page: 1,
        perPage: 10000,
      });
      mockBaselineRepository.addWorkPackageSnapshot.mockResolvedValue({} as any);

      const result = await service.createBaseline({
        projectId: 'project-1',
        name: 'Sprint 1 Baseline',
        description: 'Baseline for Sprint 1',
        createdBy: 'user-1',
      });

      expect(result).toEqual(mockBaseline);
      expect(mockProjectRepository.findById).toHaveBeenCalledWith('project-1');
      expect(mockBaselineRepository.create).toHaveBeenCalledWith({
        projectId: 'project-1',
        name: 'Sprint 1 Baseline',
        description: 'Baseline for Sprint 1',
        createdBy: 'user-1',
      });
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        projectId: 'project-1',
        perPage: 10000,
      });
      expect(mockBaselineRepository.addWorkPackageSnapshot).toHaveBeenCalledTimes(2);
    });

    it('should trim baseline name', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockBaselineRepository.create.mockResolvedValue(mockBaseline);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: [],
        total: 0,
        page: 1,
        perPage: 10000,
      });

      await service.createBaseline({
        projectId: 'project-1',
        name: '  Sprint 1 Baseline  ',
        createdBy: 'user-1',
      });

      expect(mockBaselineRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sprint 1 Baseline',
        })
      );
    });

    it('should throw error when name is empty', async () => {
      await expect(
        service.createBaseline({
          projectId: 'project-1',
          name: '',
          createdBy: 'user-1',
        })
      ).rejects.toThrow('Baseline name is required');

      expect(mockBaselineRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when name is only whitespace', async () => {
      await expect(
        service.createBaseline({
          projectId: 'project-1',
          name: '   ',
          createdBy: 'user-1',
        })
      ).rejects.toThrow('Baseline name is required');

      expect(mockBaselineRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when projectId is missing', async () => {
      await expect(
        service.createBaseline({
          projectId: '',
          name: 'Test Baseline',
          createdBy: 'user-1',
        })
      ).rejects.toThrow('Project ID is required');

      expect(mockProjectRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error when createdBy is missing', async () => {
      await expect(
        service.createBaseline({
          projectId: 'project-1',
          name: 'Test Baseline',
          createdBy: '',
        })
      ).rejects.toThrow('Created by user ID is required');

      expect(mockProjectRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error when project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(
        service.createBaseline({
          projectId: 'nonexistent',
          name: 'Test Baseline',
          createdBy: 'user-1',
        })
      ).rejects.toThrow('Project not found');

      expect(mockBaselineRepository.create).not.toHaveBeenCalled();
    });

    it('should create baseline with no work packages', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockBaselineRepository.create.mockResolvedValue(mockBaseline);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: [],
        total: 0,
        page: 1,
        perPage: 10000,
      });

      const result = await service.createBaseline({
        projectId: 'project-1',
        name: 'Empty Baseline',
        createdBy: 'user-1',
      });

      expect(result).toEqual(mockBaseline);
      expect(mockBaselineRepository.addWorkPackageSnapshot).not.toHaveBeenCalled();
    });

    it('should snapshot work packages with null dates', async () => {
      const wpWithNullDates: WorkPackage = {
        ...mockWorkPackages[0],
        startDate: undefined,
        dueDate: undefined,
      };

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockBaselineRepository.create.mockResolvedValue(mockBaseline);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: [wpWithNullDates],
        total: 1,
        page: 1,
        perPage: 10000,
      });
      mockBaselineRepository.addWorkPackageSnapshot.mockResolvedValue({} as any);

      await service.createBaseline({
        projectId: 'project-1',
        name: 'Test Baseline',
        createdBy: 'user-1',
      });

      expect(mockBaselineRepository.addWorkPackageSnapshot).toHaveBeenCalledWith(
        'baseline-1',
        wpWithNullDates.id,
        wpWithNullDates.subject,
        undefined,
        undefined
      );
    });
  });

  describe('getBaselineById', () => {
    it('should return baseline by ID', async () => {
      mockBaselineRepository.findById.mockResolvedValue(mockBaseline);

      const result = await service.getBaselineById('baseline-1');

      expect(result).toEqual(mockBaseline);
      expect(mockBaselineRepository.findById).toHaveBeenCalledWith('baseline-1');
    });

    it('should return null when baseline not found', async () => {
      mockBaselineRepository.findById.mockResolvedValue(null);

      const result = await service.getBaselineById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error when ID is missing', async () => {
      await expect(service.getBaselineById('')).rejects.toThrow('Baseline ID is required');

      expect(mockBaselineRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('getBaselineWithWorkPackages', () => {
    it('should return baseline with work package snapshots', async () => {
      const baselineWithWPs = {
        ...mockBaseline,
        workPackages: [
          createMockBaselineWorkPackage(
            'bwp-1',
            'wp-1',
            'Task 1',
            new Date('2024-01-01'),
            new Date('2024-01-15')
          ),
        ],
      };

      mockBaselineRepository.findByIdWithWorkPackages.mockResolvedValue(baselineWithWPs);

      const result = await service.getBaselineWithWorkPackages('baseline-1');

      expect(result).toEqual(baselineWithWPs);
      expect(mockBaselineRepository.findByIdWithWorkPackages).toHaveBeenCalledWith('baseline-1');
    });

    it('should return null when baseline not found', async () => {
      mockBaselineRepository.findByIdWithWorkPackages.mockResolvedValue(null);

      const result = await service.getBaselineWithWorkPackages('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error when ID is missing', async () => {
      await expect(service.getBaselineWithWorkPackages('')).rejects.toThrow(
        'Baseline ID is required'
      );

      expect(mockBaselineRepository.findByIdWithWorkPackages).not.toHaveBeenCalled();
    });
  });

  describe('listBaselines', () => {
    it('should list all baselines for a project with work package counts', async () => {
      const baselines = [mockBaseline];
      const snapshots: BaselineWorkPackage[] = [
        createMockBaselineWorkPackage(
          'bwp-1',
          'wp-1',
          'Task 1',
          new Date('2024-01-01'),
          new Date('2024-01-15')
        ),
        createMockBaselineWorkPackage(
          'bwp-2',
          'wp-2',
          'Task 2',
          new Date('2024-01-16'),
          new Date('2024-01-31')
        ),
      ];

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockBaselineRepository.findByProjectId.mockResolvedValue(baselines);
      mockBaselineRepository.getWorkPackageSnapshots.mockResolvedValue(snapshots);

      const result = await service.listBaselines('project-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'baseline-1',
        projectId: 'project-1',
        name: 'Sprint 1 Baseline',
        description: 'Baseline for Sprint 1',
        createdBy: 'user-1',
        createdAt: mockBaseline.createdAt,
        workPackageCount: 2,
      });
      expect(mockProjectRepository.findById).toHaveBeenCalledWith('project-1');
      expect(mockBaselineRepository.findByProjectId).toHaveBeenCalledWith('project-1');
    });

    it('should return empty array when no baselines exist', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockBaselineRepository.findByProjectId.mockResolvedValue([]);

      const result = await service.listBaselines('project-1');

      expect(result).toEqual([]);
    });

    it('should throw error when projectId is missing', async () => {
      await expect(service.listBaselines('')).rejects.toThrow('Project ID is required');

      expect(mockProjectRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error when project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(service.listBaselines('nonexistent')).rejects.toThrow('Project not found');

      expect(mockBaselineRepository.findByProjectId).not.toHaveBeenCalled();
    });
  });

  describe('getWorkPackageSnapshots', () => {
    it('should return work package snapshots for a baseline', async () => {
      const snapshots: BaselineWorkPackage[] = [
        createMockBaselineWorkPackage(
          'bwp-1',
          'wp-1',
          'Task 1',
          new Date('2024-01-01'),
          new Date('2024-01-15')
        ),
      ];

      mockBaselineRepository.findById.mockResolvedValue(mockBaseline);
      mockBaselineRepository.getWorkPackageSnapshots.mockResolvedValue(snapshots);

      const result = await service.getWorkPackageSnapshots('baseline-1');

      expect(result).toEqual(snapshots);
      expect(mockBaselineRepository.getWorkPackageSnapshots).toHaveBeenCalledWith('baseline-1');
    });

    it('should throw error when baselineId is missing', async () => {
      await expect(service.getWorkPackageSnapshots('')).rejects.toThrow(
        'Baseline ID is required'
      );

      expect(mockBaselineRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error when baseline not found', async () => {
      mockBaselineRepository.findById.mockResolvedValue(null);

      await expect(service.getWorkPackageSnapshots('nonexistent')).rejects.toThrow(
        'Baseline not found'
      );

      expect(mockBaselineRepository.getWorkPackageSnapshots).not.toHaveBeenCalled();
    });
  });

  describe('deleteBaseline', () => {
    it('should delete a baseline', async () => {
      mockBaselineRepository.exists.mockResolvedValue(true);
      mockBaselineRepository.delete.mockResolvedValue(true);

      const result = await service.deleteBaseline('baseline-1');

      expect(result).toBe(true);
      expect(mockBaselineRepository.exists).toHaveBeenCalledWith('baseline-1');
      expect(mockBaselineRepository.delete).toHaveBeenCalledWith('baseline-1');
    });

    it('should throw error when ID is missing', async () => {
      await expect(service.deleteBaseline('')).rejects.toThrow('Baseline ID is required');

      expect(mockBaselineRepository.exists).not.toHaveBeenCalled();
    });

    it('should throw error when baseline not found', async () => {
      mockBaselineRepository.exists.mockResolvedValue(false);

      await expect(service.deleteBaseline('nonexistent')).rejects.toThrow('Baseline not found');

      expect(mockBaselineRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('calculateVariance', () => {
    it('should calculate variance between baseline and current work packages', async () => {
      const baselineWithWPs = {
        ...mockBaseline,
        workPackages: [
          createMockBaselineWorkPackage(
            'bwp-1',
            'wp-1',
            'Task 1',
            new Date('2024-01-01'),
            new Date('2024-01-15')
          ),
          createMockBaselineWorkPackage(
            'bwp-2',
            'wp-2',
            'Task 2',
            new Date('2024-01-16'),
            new Date('2024-01-31')
          ),
        ],
      };

      // Current work packages with different dates (behind schedule)
      const currentWorkPackages: WorkPackage[] = [
        {
          ...mockWorkPackages[0],
          startDate: new Date('2024-01-03'), // 2 days late
          dueDate: new Date('2024-01-17'), // 2 days late
        },
        {
          ...mockWorkPackages[1],
          startDate: new Date('2024-01-16'), // on time
          dueDate: new Date('2024-01-31'), // on time
        },
      ];

      mockBaselineRepository.findByIdWithWorkPackages.mockResolvedValue(baselineWithWPs);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: currentWorkPackages,
        total: 2,
        page: 1,
        perPage: 10000,
      });

      const result = await service.calculateVariance('baseline-1');

      expect(result.baselineId).toBe('baseline-1');
      expect(result.baselineName).toBe('Sprint 1 Baseline');
      expect(result.projectId).toBe('project-1');
      expect(result.totalWorkPackages).toBe(2);
      expect(result.behindCount).toBe(1);
      expect(result.onTrackCount).toBe(1);
      expect(result.aheadCount).toBe(0);
      expect(result.noBaselineCount).toBe(0);
      expect(result.variances).toHaveLength(2);
      expect(result.variances[0].status).toBe('behind');
      expect(result.variances[0].startVarianceDays).toBe(2);
      expect(result.variances[0].dueVarianceDays).toBe(2);
      expect(result.variances[1].status).toBe('on_track');
    });

    it('should identify work packages ahead of schedule', async () => {
      const baselineWithWPs = {
        ...mockBaseline,
        workPackages: [
          createMockBaselineWorkPackage(
            'bwp-1',
            'wp-1',
            'Task 1',
            new Date('2024-01-05'),
            new Date('2024-01-20')
          ),
        ],
      };

      const currentWorkPackages: WorkPackage[] = [
        {
          ...mockWorkPackages[0],
          startDate: new Date('2024-01-01'), // 4 days early
          dueDate: new Date('2024-01-15'), // 5 days early
        },
      ];

      mockBaselineRepository.findByIdWithWorkPackages.mockResolvedValue(baselineWithWPs);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: currentWorkPackages,
        total: 1,
        page: 1,
        perPage: 10000,
      });

      const result = await service.calculateVariance('baseline-1');

      expect(result.aheadCount).toBe(1);
      expect(result.behindCount).toBe(0);
      expect(result.onTrackCount).toBe(0);
      expect(result.variances[0].status).toBe('ahead');
      expect(result.variances[0].startVarianceDays).toBe(-4);
      expect(result.variances[0].dueVarianceDays).toBe(-5);
    });

    it('should handle work packages created after baseline', async () => {
      const baselineWithWPs = {
        ...mockBaseline,
        workPackages: [
          createMockBaselineWorkPackage(
            'bwp-1',
            'wp-1',
            'Task 1',
            new Date('2024-01-01'),
            new Date('2024-01-15')
          ),
        ],
      };

      const currentWorkPackages: WorkPackage[] = [
        mockWorkPackages[0],
        {
          ...mockWorkPackages[1],
          id: 'wp-3', // New work package not in baseline
        },
      ];

      mockBaselineRepository.findByIdWithWorkPackages.mockResolvedValue(baselineWithWPs);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: currentWorkPackages,
        total: 2,
        page: 1,
        perPage: 10000,
      });

      const result = await service.calculateVariance('baseline-1');

      expect(result.totalWorkPackages).toBe(2);
      expect(result.noBaselineCount).toBe(1);
      expect(result.variances[1].status).toBe('no_baseline');
      expect(result.variances[1].workPackageId).toBe('wp-3');
    });

    it('should handle work packages with null dates', async () => {
      const baselineWithWPs = {
        ...mockBaseline,
        workPackages: [
          createMockBaselineWorkPackage('bwp-1', 'wp-1', 'Task 1', undefined, undefined),
        ],
      };

      const currentWorkPackages: WorkPackage[] = [
        {
          ...mockWorkPackages[0],
          startDate: undefined,
          dueDate: undefined,
        },
      ];

      mockBaselineRepository.findByIdWithWorkPackages.mockResolvedValue(baselineWithWPs);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: currentWorkPackages,
        total: 1,
        page: 1,
        perPage: 10000,
      });

      const result = await service.calculateVariance('baseline-1');

      expect(result.variances[0].startVarianceDays).toBe(0);
      expect(result.variances[0].dueVarianceDays).toBe(0);
      expect(result.variances[0].status).toBe('on_track');
    });

    it('should calculate average variance correctly', async () => {
      const baselineWithWPs = {
        ...mockBaseline,
        workPackages: [
          createMockBaselineWorkPackage(
            'bwp-1',
            'wp-1',
            'Task 1',
            new Date('2024-01-01'),
            new Date('2024-01-15')
          ),
          createMockBaselineWorkPackage(
            'bwp-2',
            'wp-2',
            'Task 2',
            new Date('2024-01-16'),
            new Date('2024-01-31')
          ),
        ],
      };

      const currentWorkPackages: WorkPackage[] = [
        {
          ...mockWorkPackages[0],
          startDate: new Date('2024-01-03'), // +2 days
          dueDate: new Date('2024-01-19'), // +4 days
        },
        {
          ...mockWorkPackages[1],
          startDate: new Date('2024-01-14'), // -2 days
          dueDate: new Date('2024-01-29'), // -2 days
        },
      ];

      mockBaselineRepository.findByIdWithWorkPackages.mockResolvedValue(baselineWithWPs);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: currentWorkPackages,
        total: 2,
        page: 1,
        perPage: 10000,
      });

      const result = await service.calculateVariance('baseline-1');

      // Average start variance: (2 + (-2)) / 2 = 0
      // Average due variance: (4 + (-2)) / 2 = 1
      expect(result.averageStartVarianceDays).toBe(0);
      expect(result.averageDueVarianceDays).toBe(1);
    });

    it('should throw error when baselineId is missing', async () => {
      await expect(service.calculateVariance('')).rejects.toThrow('Baseline ID is required');

      expect(mockBaselineRepository.findByIdWithWorkPackages).not.toHaveBeenCalled();
    });

    it('should throw error when baseline not found', async () => {
      mockBaselineRepository.findByIdWithWorkPackages.mockResolvedValue(null);

      await expect(service.calculateVariance('nonexistent')).rejects.toThrow(
        'Baseline not found'
      );

      expect(mockWorkPackageRepository.findAll).not.toHaveBeenCalled();
    });

    it('should handle empty baseline', async () => {
      const emptyBaseline = {
        ...mockBaseline,
        workPackages: [],
      };

      mockBaselineRepository.findByIdWithWorkPackages.mockResolvedValue(emptyBaseline);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: [],
        total: 0,
        page: 1,
        perPage: 10000,
      });

      const result = await service.calculateVariance('baseline-1');

      expect(result.totalWorkPackages).toBe(0);
      expect(result.variances).toHaveLength(0);
      expect(result.averageStartVarianceDays).toBe(0);
      expect(result.averageDueVarianceDays).toBe(0);
    });

    it('should use 1 day tolerance for on_track status', async () => {
      const baselineWithWPs = {
        ...mockBaseline,
        workPackages: [
          createMockBaselineWorkPackage(
            'bwp-1',
            'wp-1',
            'Task 1',
            new Date('2024-01-01'),
            new Date('2024-01-15')
          ),
        ],
      };

      const currentWorkPackages: WorkPackage[] = [
        {
          ...mockWorkPackages[0],
          startDate: new Date('2024-01-02'), // 1 day late (within tolerance)
          dueDate: new Date('2024-01-16'), // 1 day late (within tolerance)
        },
      ];

      mockBaselineRepository.findByIdWithWorkPackages.mockResolvedValue(baselineWithWPs);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: currentWorkPackages,
        total: 1,
        page: 1,
        perPage: 10000,
      });

      const result = await service.calculateVariance('baseline-1');

      expect(result.variances[0].status).toBe('on_track');
      expect(result.onTrackCount).toBe(1);
    });
  });
});
