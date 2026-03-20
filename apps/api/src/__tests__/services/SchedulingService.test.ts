import { SchedulingService } from '../../services/SchedulingService';
import { WorkPackageRepository } from '../../repositories/WorkPackageRepository';
import { WorkPackageRelationRepository } from '../../repositories/WorkPackageRelationRepository';
import { WorkCalendarService } from '../../services/WorkCalendarService';
import { WorkPackage, WorkPackageType, Priority, SchedulingMode } from '../../entities/WorkPackage';
import { WorkPackageRelation, RelationType } from '../../entities/WorkPackageRelation';
import { WorkCalendar, DayOfWeek } from '../../entities/WorkCalendar';

describe('SchedulingService', () => {
  let service: SchedulingService;
  let mockWorkPackageRepository: jest.Mocked<WorkPackageRepository>;
  let mockRelationRepository: jest.Mocked<WorkPackageRelationRepository>;
  let mockCalendarService: jest.Mocked<WorkCalendarService>;

  // Default work calendar (Monday-Friday)
  const defaultCalendar: WorkCalendar = {
    id: 'cal-1',
    name: 'Default Calendar',
    description: 'Standard work week',
    isDefault: true,
    projectId: undefined,
    workingDays: [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ],
    workingHours: {
      startHour: 8,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
    },
    hoursPerDay: 8.0,
    holidays: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockWorkPackageRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as any;

    mockRelationRepository = {
      findByFromId: jest.fn(),
      findByToId: jest.fn(),
    } as any;

    mockCalendarService = {
      getCalendarForProject: jest.fn().mockResolvedValue(defaultCalendar),
      addWorkingDays: jest.fn((date: Date, days: number) => {
        // Simple implementation: just add calendar days (ignoring weekends for simplicity)
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      }),
      calculateWorkingDays: jest.fn((start: Date, end: Date) => {
        // Simple implementation: calculate calendar days
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const days = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
        return days;
      }),
      isWorkingDay: jest.fn().mockReturnValue(true),
    } as any;

    service = new SchedulingService(
      mockWorkPackageRepository,
      mockRelationRepository,
      mockCalendarService
    );
  });

  describe('recalculateSchedule', () => {
    it('should throw error if project ID is missing', async () => {
      await expect(service.recalculateSchedule('', ['wp-1'])).rejects.toThrow(
        'Project ID is required'
      );
    });

    it('should return empty array if no work package IDs provided', async () => {
      const result = await service.recalculateSchedule('project-1', []);
      expect(result).toEqual([]);
    });

    it('should recalculate successor dates when predecessor changes', async () => {
      const predecessor: Partial<WorkPackage> = {
        id: 'wp-1',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Predecessor Task',
        status: 'in_progress',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.MANUAL,
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-10'), // Changed to Jan 10
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const successor: Partial<WorkPackage> = {
        id: 'wp-2',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Successor Task',
        status: 'new',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.AUTOMATIC,
        startDate: new Date('2024-01-06'),
        dueDate: new Date('2024-01-10'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const relation: Partial<WorkPackageRelation> = {
        id: 'rel-1',
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
      };

      mockRelationRepository.findByFromId.mockResolvedValueOnce([
        relation as WorkPackageRelation,
      ]);
      mockWorkPackageRepository.findById
        .mockResolvedValueOnce(successor as WorkPackage)
        .mockResolvedValueOnce(predecessor as WorkPackage);
      mockWorkPackageRepository.update.mockResolvedValueOnce(successor as WorkPackage);
      mockRelationRepository.findByFromId.mockResolvedValueOnce([]);

      const updates = await service.recalculateSchedule('project-1', ['wp-1']);

      expect(updates).toHaveLength(1);
      expect(updates[0].workPackageId).toBe('wp-2');
      // New start date should be Jan 10 + 1 = Jan 11
      expect(updates[0].newStartDate).toEqual(new Date('2024-01-11'));
      // Duration is 5 days (Jan 6-10), so new due date is Jan 11 + 4 = Jan 15
      expect(updates[0].newDueDate).toEqual(new Date('2024-01-15'));
      expect(mockWorkPackageRepository.update).toHaveBeenCalledWith('wp-2', {
        startDate: new Date('2024-01-11'),
        dueDate: new Date('2024-01-15'),
      });
    });

    it('should apply lag days when recalculating', async () => {
      const predecessor: Partial<WorkPackage> = {
        id: 'wp-1',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Predecessor Task',
        status: 'in_progress',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.MANUAL,
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-05'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const successor: Partial<WorkPackage> = {
        id: 'wp-2',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Successor Task',
        status: 'new',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.AUTOMATIC,
        startDate: new Date('2024-01-06'),
        dueDate: new Date('2024-01-10'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const relation: Partial<WorkPackageRelation> = {
        id: 'rel-1',
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
        lagDays: 3, // 3 days lag
        createdAt: new Date(),
      };

      mockRelationRepository.findByFromId.mockResolvedValueOnce([
        relation as WorkPackageRelation,
      ]);
      mockWorkPackageRepository.findById
        .mockResolvedValueOnce(successor as WorkPackage)
        .mockResolvedValueOnce(predecessor as WorkPackage);
      mockWorkPackageRepository.update.mockResolvedValueOnce(successor as WorkPackage);
      mockRelationRepository.findByFromId.mockResolvedValueOnce([]);

      const updates = await service.recalculateSchedule('project-1', ['wp-1']);

      expect(updates).toHaveLength(1);
      // Start date should be predecessor due date (Jan 5) + lag days (3) + 1 = Jan 9
      expect(updates[0].newStartDate).toEqual(new Date('2024-01-09'));
      // Due date should be Jan 9 + 4 days (duration) = Jan 13
      expect(updates[0].newDueDate).toEqual(new Date('2024-01-13'));
    });

    it('should not update work packages in manual scheduling mode', async () => {
      const successor: Partial<WorkPackage> = {
        id: 'wp-2',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Successor Task',
        status: 'new',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.MANUAL, // Manual mode
        startDate: new Date('2024-01-06'),
        dueDate: new Date('2024-01-10'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const relation: Partial<WorkPackageRelation> = {
        id: 'rel-1',
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
      };

      mockRelationRepository.findByFromId.mockResolvedValueOnce([
        relation as WorkPackageRelation,
      ]);
      mockWorkPackageRepository.findById.mockResolvedValueOnce(successor as WorkPackage);

      const updates = await service.recalculateSchedule('project-1', ['wp-1']);

      expect(updates).toHaveLength(0);
      expect(mockWorkPackageRepository.update).not.toHaveBeenCalled();
    });

    it('should handle cascading updates through multiple successors', async () => {
      const wp1: Partial<WorkPackage> = {
        id: 'wp-1',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'in_progress',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.MANUAL,
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-10'), // Changed
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const wp2: Partial<WorkPackage> = {
        id: 'wp-2',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        status: 'new',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.AUTOMATIC,
        startDate: new Date('2024-01-06'),
        dueDate: new Date('2024-01-10'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const wp2Updated: Partial<WorkPackage> = {
        ...wp2,
        startDate: new Date('2024-01-11'),
        dueDate: new Date('2024-01-15'),
      };

      const wp3: Partial<WorkPackage> = {
        id: 'wp-3',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Task 3',
        status: 'new',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.AUTOMATIC,
        startDate: new Date('2024-01-11'),
        dueDate: new Date('2024-01-15'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const rel1: Partial<WorkPackageRelation> = {
        id: 'rel-1',
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
      };

      const rel2: Partial<WorkPackageRelation> = {
        id: 'rel-2',
        fromId: 'wp-2',
        toId: 'wp-3',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
      };

      // First call for wp-1
      mockRelationRepository.findByFromId.mockResolvedValueOnce([rel1 as WorkPackageRelation]);
      mockWorkPackageRepository.findById
        .mockResolvedValueOnce(wp2 as WorkPackage)
        .mockResolvedValueOnce(wp1 as WorkPackage);
      mockWorkPackageRepository.update.mockResolvedValueOnce(wp2Updated as WorkPackage);

      // Second call for wp-2
      mockRelationRepository.findByFromId.mockResolvedValueOnce([rel2 as WorkPackageRelation]);
      mockWorkPackageRepository.findById
        .mockResolvedValueOnce(wp3 as WorkPackage)
        .mockResolvedValueOnce(wp2Updated as WorkPackage);
      mockWorkPackageRepository.update.mockResolvedValueOnce(wp3 as WorkPackage);

      // Third call for wp-3
      mockRelationRepository.findByFromId.mockResolvedValueOnce([]);

      const updates = await service.recalculateSchedule('project-1', ['wp-1']);

      expect(updates).toHaveLength(2);
      expect(updates[0].workPackageId).toBe('wp-2');
      expect(updates[1].workPackageId).toBe('wp-3');
    });

    it('should skip work packages without due dates', async () => {
      const predecessor: Partial<WorkPackage> = {
        id: 'wp-1',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Predecessor Task',
        status: 'in_progress',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.MANUAL,
        startDate: new Date('2024-01-01'),
        dueDate: undefined, // No due date
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const successor: Partial<WorkPackage> = {
        id: 'wp-2',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Successor Task',
        status: 'new',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.AUTOMATIC,
        startDate: new Date('2024-01-06'),
        dueDate: new Date('2024-01-10'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const relation: Partial<WorkPackageRelation> = {
        id: 'rel-1',
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
      };

      mockRelationRepository.findByFromId.mockResolvedValueOnce([
        relation as WorkPackageRelation,
      ]);
      mockWorkPackageRepository.findById
        .mockResolvedValueOnce(successor as WorkPackage)
        .mockResolvedValueOnce(predecessor as WorkPackage);

      const updates = await service.recalculateSchedule('project-1', ['wp-1']);

      expect(updates).toHaveLength(0);
      expect(mockWorkPackageRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('detectCircularDependencies', () => {
    it('should throw error if project ID is missing', async () => {
      await expect(service.detectCircularDependencies('')).rejects.toThrow(
        'Project ID is required'
      );
    });

    it('should return empty array if no circular dependencies exist', async () => {
      const wp1: Partial<WorkPackage> = {
        id: 'wp-1',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'new',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.AUTOMATIC,
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-05'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const wp2: Partial<WorkPackage> = {
        id: 'wp-2',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        status: 'new',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.AUTOMATIC,
        startDate: new Date('2024-01-06'),
        dueDate: new Date('2024-01-10'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      mockWorkPackageRepository.findAll.mockResolvedValueOnce({
        workPackages: [wp1, wp2] as WorkPackage[],
        total: 2,
        page: 1,
        perPage: 10000,
      });

      // wp-1 -> wp-2 (no cycle)
      mockRelationRepository.findByFromId
        .mockResolvedValueOnce([
          {
            id: 'rel-1',
            fromId: 'wp-1',
            toId: 'wp-2',
            relationType: RelationType.SUCCESSOR,
            lagDays: 0,
          } as WorkPackageRelation,
        ])
        .mockResolvedValueOnce([]) // wp-2 has no successors
        .mockResolvedValueOnce([]); // wp-2 again when checking from start

      const result = await service.detectCircularDependencies('project-1');

      expect(result).toHaveLength(0);
    });

    it('should detect simple circular dependency', async () => {
      const wp1: Partial<WorkPackage> = {
        id: 'wp-1',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'new',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.AUTOMATIC,
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-05'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      const wp2: Partial<WorkPackage> = {
        id: 'wp-2',
        projectId: 'project-1',
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        status: 'new',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.AUTOMATIC,
        startDate: new Date('2024-01-06'),
        dueDate: new Date('2024-01-10'),
        estimatedHours: 40,
        spentHours: 0,
        progressPercent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {},
      };

      mockWorkPackageRepository.findAll.mockResolvedValueOnce({
        workPackages: [wp1, wp2] as WorkPackage[],
        total: 2,
        page: 1,
        perPage: 10000,
      });

      const rel1: WorkPackageRelation = {
        id: 'rel-1',
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
      } as WorkPackageRelation;

      const rel2: WorkPackageRelation = {
        id: 'rel-2',
        fromId: 'wp-2',
        toId: 'wp-1',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
        createdAt: new Date(),
      } as WorkPackageRelation;

      // wp-1 -> wp-2 -> wp-1 (cycle)
      mockRelationRepository.findByFromId
        .mockResolvedValueOnce([rel1]) // wp-1 successors
        .mockResolvedValueOnce([rel2]) // wp-2 successors (creates cycle)
        .mockResolvedValueOnce([]); // wp-2 when checking from start (after wp-1 is visited)

      const result = await service.detectCircularDependencies('project-1');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].workPackageIds).toContain('wp-1');
      expect(result[0].workPackageIds).toContain('wp-2');
    });
  });
});
