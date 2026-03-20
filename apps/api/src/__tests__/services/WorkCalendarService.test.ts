import { WorkCalendarService } from '../../services/WorkCalendarService';
import { WorkCalendarRepository } from '../../repositories/WorkCalendarRepository';
import { WorkCalendar, DayOfWeek } from '../../entities/WorkCalendar';

describe('WorkCalendarService', () => {
  let service: WorkCalendarService;
  let mockRepository: jest.Mocked<WorkCalendarRepository>;

  const mockDefaultCalendar: WorkCalendar = {
    id: 'default-calendar-id',
    name: 'Default Work Calendar',
    description: 'Standard Monday-Friday work week',
    projectId: undefined,
    isDefault: true,
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
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockProjectCalendar: WorkCalendar = {
    id: 'project-calendar-id',
    name: 'Project Calendar',
    description: '6-day work week',
    projectId: 'project-123',
    isDefault: false,
    workingDays: [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ],
    workingHours: {
      startHour: 7,
      startMinute: 0,
      endHour: 16,
      endMinute: 0,
    },
    hoursPerDay: 9.0,
    holidays: [{ date: '2024-01-01', name: 'New Year' }],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByProjectId: jest.fn(),
      findDefault: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    } as any;

    service = new WorkCalendarService(mockRepository);
  });

  describe('getCalendarForProject', () => {
    it('should return project-specific calendar if it exists', async () => {
      mockRepository.findByProjectId.mockResolvedValue(mockProjectCalendar);

      const result = await service.getCalendarForProject('project-123');

      expect(result).toEqual(mockProjectCalendar);
      expect(mockRepository.findByProjectId).toHaveBeenCalledWith('project-123');
      expect(mockRepository.findDefault).not.toHaveBeenCalled();
    });

    it('should return default calendar if project calendar does not exist', async () => {
      mockRepository.findByProjectId.mockResolvedValue(null);
      mockRepository.findDefault.mockResolvedValue(mockDefaultCalendar);

      const result = await service.getCalendarForProject('project-123');

      expect(result).toEqual(mockDefaultCalendar);
      expect(mockRepository.findByProjectId).toHaveBeenCalledWith('project-123');
      expect(mockRepository.findDefault).toHaveBeenCalled();
    });

    it('should create default calendar if none exists', async () => {
      mockRepository.findByProjectId.mockResolvedValue(null);
      mockRepository.findDefault.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockDefaultCalendar);

      const result = await service.getCalendarForProject('project-123');

      expect(result).toEqual(mockDefaultCalendar);
      expect(mockRepository.create).toHaveBeenCalled();
    });
  });

  describe('isWorkingDay', () => {
    it('should return true for working days', () => {
      const monday = new Date('2024-01-08'); // Monday
      const result = service.isWorkingDay(monday, mockDefaultCalendar);
      expect(result).toBe(true);
    });

    it('should return false for weekends', () => {
      const saturday = new Date('2024-01-06'); // Saturday
      const result = service.isWorkingDay(saturday, mockDefaultCalendar);
      expect(result).toBe(false);
    });

    it('should return false for holidays', () => {
      const newYear = new Date('2024-01-01'); // Monday, but a holiday
      const result = service.isWorkingDay(newYear, mockProjectCalendar);
      expect(result).toBe(false);
    });

    it('should respect custom working days', () => {
      const saturday = new Date('2024-01-06'); // Saturday
      const result = service.isWorkingDay(saturday, mockProjectCalendar);
      expect(result).toBe(true); // Project calendar includes Saturday
    });
  });

  describe('addWorkingDays', () => {
    it('should add working days correctly', () => {
      const friday = new Date('2024-01-05'); // Friday
      const result = service.addWorkingDays(friday, 3, mockDefaultCalendar);
      
      // Friday + 3 working days = Wednesday (skipping weekend)
      const expected = new Date('2024-01-10'); // Wednesday
      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('should handle zero days', () => {
      const monday = new Date('2024-01-08');
      const result = service.addWorkingDays(monday, 0, mockDefaultCalendar);
      expect(result.toDateString()).toBe(monday.toDateString());
    });

    it('should handle negative days', () => {
      const wednesday = new Date('2024-01-10'); // Wednesday
      const result = service.addWorkingDays(wednesday, -3, mockDefaultCalendar);
      
      // Wednesday - 3 working days = Friday (previous week)
      const expected = new Date('2024-01-05'); // Friday
      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('should skip holidays when adding days', () => {
      const thursday = new Date('2023-12-28'); // Thursday before New Year
      const result = service.addWorkingDays(thursday, 2, mockProjectCalendar);
      
      // Thursday + 2 working days = Saturday (Fri + Sat, both working days in project calendar)
      const expected = new Date('2023-12-30'); // Saturday
      expect(result.toDateString()).toBe(expected.toDateString());
    });
  });

  describe('calculateWorkingDays', () => {
    it('should calculate working days between dates', () => {
      const start = new Date('2024-01-08'); // Monday
      const end = new Date('2024-01-12'); // Friday
      
      const result = service.calculateWorkingDays(start, end, mockDefaultCalendar);
      expect(result).toBe(5); // Mon, Tue, Wed, Thu, Fri
    });

    it('should exclude weekends', () => {
      const start = new Date('2024-01-05'); // Friday
      const end = new Date('2024-01-10'); // Wednesday (next week)
      
      const result = service.calculateWorkingDays(start, end, mockDefaultCalendar);
      expect(result).toBe(4); // Fri, Mon, Tue, Wed
    });

    it('should exclude holidays', () => {
      const start = new Date('2023-12-29'); // Friday
      const end = new Date('2024-01-03'); // Wednesday
      
      const result = service.calculateWorkingDays(start, end, mockProjectCalendar);
      // Fri, Sat (working in project calendar), Tue, Wed
      // Excludes: Sun (not working), Mon (holiday)
      expect(result).toBe(4);
    });

    it('should return 0 if start is after end', () => {
      const start = new Date('2024-01-10');
      const end = new Date('2024-01-05');
      
      const result = service.calculateWorkingDays(start, end, mockDefaultCalendar);
      expect(result).toBe(0);
    });
  });

  describe('getNextWorkingDay', () => {
    it('should return next working day', () => {
      const friday = new Date('2024-01-05'); // Friday
      const result = service.getNextWorkingDay(friday, mockDefaultCalendar);
      
      const expected = new Date('2024-01-08'); // Monday
      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('should skip holidays', () => {
      const sunday = new Date('2023-12-31'); // Sunday before New Year
      const result = service.getNextWorkingDay(sunday, mockProjectCalendar);
      
      const expected = new Date('2024-01-02'); // Tuesday (skipping Monday holiday)
      expect(result.toDateString()).toBe(expected.toDateString());
    });
  });

  describe('getPreviousWorkingDay', () => {
    it('should return previous working day', () => {
      const monday = new Date('2024-01-08'); // Monday
      const result = service.getPreviousWorkingDay(monday, mockDefaultCalendar);
      
      const expected = new Date('2024-01-05'); // Friday
      expect(result.toDateString()).toBe(expected.toDateString());
    });
  });

  describe('setProjectCalendar', () => {
    it('should create new calendar for project', async () => {
      mockRepository.findByProjectId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockProjectCalendar);

      const result = await service.setProjectCalendar('project-123', {
        name: 'Project Calendar',
        workingDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
      });

      expect(result).toEqual(mockProjectCalendar);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-123',
          isDefault: false,
        })
      );
    });

    it('should update existing calendar for project', async () => {
      mockRepository.findByProjectId.mockResolvedValue(mockProjectCalendar);
      mockRepository.update.mockResolvedValue(mockProjectCalendar);

      const result = await service.setProjectCalendar('project-123', {
        name: 'Updated Calendar',
      });

      expect(result).toEqual(mockProjectCalendar);
      expect(mockRepository.update).toHaveBeenCalledWith(
        'project-calendar-id',
        expect.objectContaining({
          projectId: 'project-123',
          isDefault: false,
        })
      );
    });
  });

  describe('deleteCalendar', () => {
    it('should delete non-default calendar', async () => {
      mockRepository.findById.mockResolvedValue(mockProjectCalendar);
      mockRepository.delete.mockResolvedValue(true);

      const result = await service.deleteCalendar('project-calendar-id');

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith('project-calendar-id');
    });

    it('should not delete the only default calendar', async () => {
      mockRepository.findById.mockResolvedValue(mockDefaultCalendar);
      mockRepository.findAll.mockResolvedValue([mockDefaultCalendar]);

      await expect(service.deleteCalendar('default-calendar-id')).rejects.toThrow(
        'Cannot delete the only default calendar'
      );
    });

    it('should return false if calendar not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.deleteCalendar('non-existent-id');

      expect(result).toBe(false);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
