import { ICalendarService } from '../../services/ICalendarService';
import { WorkPackageRepository } from '../../repositories/WorkPackageRepository';
import { ProjectRepository } from '../../repositories/ProjectRepository';
import { WorkPackage } from '../../entities/WorkPackage';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';

describe('ICalendarService', () => {
  let service: ICalendarService;
  let mockWorkPackageRepository: jest.Mocked<WorkPackageRepository>;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;

  beforeEach(() => {
    mockWorkPackageRepository = {
      findAll: jest.fn(),
    } as any;

    mockProjectRepository = {
      findById: jest.fn(),
    } as any;

    service = new ICalendarService(mockWorkPackageRepository, mockProjectRepository);
  });

  describe('generateProjectCalendar', () => {
    it('should generate iCalendar feed for a project', async () => {
      const projectId = 'project-1';
      const baseUrl = 'http://localhost:3001';

      const mockProject: Project = {
        id: projectId,
        name: 'Test Project',
        description: 'Test project description',
        ownerId: 'user-1',
        status: ProjectStatus.ACTIVE,
        lifecyclePhase: LifecyclePhase.EXECUTION,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      } as Project;

      const mockWorkPackages: WorkPackage[] = [
        {
          id: 'wp-1',
          projectId,
          type: 'task',
          subject: 'Test Task',
          description: 'Task description',
          status: 'open',
          priority: 'normal',
          startDate: new Date('2024-02-01'),
          dueDate: new Date('2024-02-15'),
          progressPercent: 50,
          estimatedHours: 40,
          spentHours: 20,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        } as WorkPackage,
        {
          id: 'wp-2',
          projectId,
          type: 'milestone',
          subject: 'Project Milestone',
          description: 'Important milestone',
          status: 'open',
          priority: 'high',
          dueDate: new Date('2024-03-01'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        } as WorkPackage,
      ];

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages,
        total: 2,
        page: 1,
        perPage: 10000,
      });

      const icsContent = await service.generateProjectCalendar({
        projectId,
        baseUrl,
      });

      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        projectId,
        perPage: 10000,
      });

      // Verify ICS content structure
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).toContain('PRODID');
      expect(icsContent).toContain('VERSION:2.0');

      // Verify task event
      expect(icsContent).toContain('BEGIN:VEVENT');
      expect(icsContent).toContain('SUMMARY:[TASK] Test Task');
      expect(icsContent).toContain('DESCRIPTION:Task description');

      // Verify milestone event
      expect(icsContent).toContain('SUMMARY:[MILESTONE] Project Milestone');
    });

    it('should throw error if project not found', async () => {
      const projectId = 'nonexistent';
      const baseUrl = 'http://localhost:3001';

      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(
        service.generateProjectCalendar({ projectId, baseUrl })
      ).rejects.toThrow('Project not found');
    });

    it('should skip work packages without dates', async () => {
      const projectId = 'project-1';
      const baseUrl = 'http://localhost:3001';

      const mockProject: Project = {
        id: projectId,
        name: 'Test Project',
        ownerId: 'user-1',
        status: ProjectStatus.ACTIVE,
        lifecyclePhase: LifecyclePhase.EXECUTION,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Project;

      const mockWorkPackages: WorkPackage[] = [
        {
          id: 'wp-1',
          projectId,
          type: 'task',
          subject: 'Task without dates',
          status: 'open',
          priority: 'normal',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as WorkPackage,
      ];

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages,
        total: 1,
        page: 1,
        perPage: 10000,
      });

      const icsContent = await service.generateProjectCalendar({
        projectId,
        baseUrl,
      });

      // Should have calendar but no events
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).not.toContain('BEGIN:VEVENT');
    });

    it('should include work package details in event description', async () => {
      const projectId = 'project-1';
      const baseUrl = 'http://localhost:3001';

      const mockProject: Project = {
        id: projectId,
        name: 'Test Project',
        ownerId: 'user-1',
        status: ProjectStatus.ACTIVE,
        lifecyclePhase: LifecyclePhase.EXECUTION,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Project;

      const mockWorkPackages: WorkPackage[] = [
        {
          id: 'wp-1',
          projectId,
          type: 'task',
          subject: 'Detailed Task',
          description: 'Task with all details',
          status: 'in_progress',
          priority: 'high',
          startDate: new Date('2024-02-01'),
          dueDate: new Date('2024-02-15'),
          progressPercent: 75,
          estimatedHours: 40,
          spentHours: 30,
          assignee: {
            id: 'user-1',
            email: 'assignee@example.com',
            name: 'John Doe',
          } as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as WorkPackage,
      ];

      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages,
        total: 1,
        page: 1,
        perPage: 10000,
      });

      const icsContent = await service.generateProjectCalendar({
        projectId,
        baseUrl,
      });

      // Verify details are included (note: ICS format may wrap lines)
      const normalizedContent = icsContent.replace(/\r?\n /g, ''); // Remove line wrapping
      expect(normalizedContent).toContain('Type: task');
      expect(normalizedContent).toContain('Status: in_progress');
      expect(normalizedContent).toContain('Priority: high');
      expect(normalizedContent).toContain('Progress: 75%');
      expect(normalizedContent).toContain('Estimated Hours: 40');
      expect(normalizedContent).toContain('Spent Hours: 30');
      expect(normalizedContent).toContain('Assignee: John Doe');
    });
  });

  describe('generateUserCalendar', () => {
    it('should generate iCalendar feed for user assigned work packages', async () => {
      const userId = 'user-1';
      const baseUrl = 'http://localhost:3001';

      const mockWorkPackages: WorkPackage[] = [
        {
          id: 'wp-1',
          projectId: 'project-1',
          type: 'task',
          subject: 'My Task',
          status: 'open',
          priority: 'normal',
          assigneeId: userId,
          startDate: new Date('2024-02-01'),
          dueDate: new Date('2024-02-15'),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as WorkPackage,
      ];

      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages,
        total: 1,
        page: 1,
        perPage: 10000,
      });

      const icsContent = await service.generateUserCalendar(userId, baseUrl);

      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        assigneeId: userId,
        perPage: 10000,
      });

      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('My Work Packages');
      expect(icsContent).toContain('SUMMARY:[TASK] My Task');
    });

    it('should handle empty work package list', async () => {
      const userId = 'user-1';
      const baseUrl = 'http://localhost:3001';

      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: [],
        total: 0,
        page: 1,
        perPage: 10000,
      });

      const icsContent = await service.generateUserCalendar(userId, baseUrl);

      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).not.toContain('BEGIN:VEVENT');
    });
  });
});
