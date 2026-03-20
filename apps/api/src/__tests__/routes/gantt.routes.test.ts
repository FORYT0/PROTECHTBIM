import request from 'supertest';
import express, { Express } from 'express';
import { createProjectRouter } from '../../routes/projects.routes';
import { ProjectService } from '../../services/ProjectService';
import { WorkPackage, WorkPackageType, Priority, SchedulingMode } from '../../entities/WorkPackage';
import { WorkPackageRelation, RelationType } from '../../entities/WorkPackageRelation';
import { User } from '../../entities/User';

// Mock the auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateToken: () => (req: any, _res: any, next: any) => {
    req.user = { userId: 'test-user-id' };
    next();
  },
  createAuthService: jest.fn(),
}));

describe('GET /api/v1/projects/:id/gantt - Gantt Data API', () => {
  let app: Express;
  let mockProjectService: jest.Mocked<ProjectService>;

  const mockUser: Partial<User> = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWorkPackages: Partial<WorkPackage>[] = [
    {
      id: 'wp-1',
      projectId: 'project-1',
      type: WorkPackageType.TASK,
      subject: 'Task 1',
      description: 'First task',
      status: 'open',
      priority: Priority.NORMAL,
      assigneeId: 'test-user-id',
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
      assignee: mockUser as User,
    },
    {
      id: 'wp-2',
      projectId: 'project-1',
      type: WorkPackageType.TASK,
      subject: 'Task 2',
      description: 'Second task',
      status: 'in_progress',
      priority: Priority.HIGH,
      assigneeId: 'test-user-id',
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
      assignee: mockUser as User,
    },
    {
      id: 'wp-3',
      projectId: 'project-1',
      type: WorkPackageType.MILESTONE,
      subject: 'Milestone 1',
      description: 'First milestone',
      status: 'open',
      priority: Priority.URGENT,
      assigneeId: undefined,
      accountableId: undefined,
      parentId: undefined,
      startDate: new Date('2024-02-01'),
      dueDate: new Date('2024-02-01'),
      estimatedHours: 0,
      spentHours: 0,
      progressPercent: 0,
      schedulingMode: SchedulingMode.MANUAL,
      versionId: undefined,
      sprintId: undefined,
      storyPoints: undefined,
      customFields: {},
      createdAt: new Date(),
      updatedAt: new Date(),
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
    {
      id: 'rel-2',
      fromId: 'wp-2',
      toId: 'wp-3',
      relationType: RelationType.PREDECESSOR,
      lagDays: 2,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    // Create mock service
    mockProjectService = {
      getGanttData: jest.fn(),
    } as any;

    // Create Express app with mocked service
    app = express();
    app.use(express.json());
    app.use('/api/v1/projects', createProjectRouter(mockProjectService));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should return Gantt data with work packages and relations', async () => {
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        relations: mockRelations as WorkPackageRelation[],
      });

      const response = await request(app).get('/api/v1/projects/project-1/gantt');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('work_packages');
      expect(response.body).toHaveProperty('relations');
      expect(response.body.work_packages).toHaveLength(3);
      expect(response.body.relations).toHaveLength(2);

      // Verify work package structure
      const wp1 = response.body.work_packages[0];
      expect(wp1).toMatchObject({
        id: 'wp-1',
        project_id: 'project-1',
        type: 'task',
        subject: 'Task 1',
        status: 'open',
        priority: 'normal',
        progress_percent: 25,
        scheduling_mode: 'automatic',
      });
      expect(wp1.assignee).toMatchObject({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      });

      // Verify relation structure
      const rel1 = response.body.relations[0];
      expect(rel1).toMatchObject({
        id: 'rel-1',
        from_id: 'wp-1',
        to_id: 'wp-2',
        relation_type: 'successor',
        lag_days: 0,
      });

      expect(mockProjectService.getGanttData).toHaveBeenCalledWith('project-1', {});
    });

    it('should filter work packages by date range', async () => {
      const filteredWorkPackages = [mockWorkPackages[0]];
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: filteredWorkPackages as WorkPackage[],
        relations: [],
      });

      const response = await request(app)
        .get('/api/v1/projects/project-1/gantt')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-15',
        });

      expect(response.status).toBe(200);
      expect(response.body.work_packages).toHaveLength(1);
      expect(response.body.work_packages[0].id).toBe('wp-1');

      expect(mockProjectService.getGanttData).toHaveBeenCalledWith('project-1', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
      });
    });

    it('should exclude relations when include_relations=false', async () => {
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        relations: [],
      });

      const response = await request(app)
        .get('/api/v1/projects/project-1/gantt')
        .query({ include_relations: 'false' });

      expect(response.status).toBe(200);
      expect(response.body.work_packages).toHaveLength(3);
      expect(response.body.relations).toHaveLength(0);

      expect(mockProjectService.getGanttData).toHaveBeenCalledWith('project-1', {
        includeRelations: false,
      });
    });

    it('should include relations by default', async () => {
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        relations: mockRelations as WorkPackageRelation[],
      });

      const response = await request(app).get('/api/v1/projects/project-1/gantt');

      expect(response.status).toBe(200);
      expect(response.body.relations).toHaveLength(2);
      expect(mockProjectService.getGanttData).toHaveBeenCalledWith('project-1', {});
    });

    it('should handle empty work packages', async () => {
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: [],
        relations: [],
      });

      const response = await request(app).get('/api/v1/projects/project-1/gantt');

      expect(response.status).toBe(200);
      expect(response.body.work_packages).toHaveLength(0);
      expect(response.body.relations).toHaveLength(0);
    });

    it('should handle work packages without assignees', async () => {
      const wpWithoutAssignee = { ...mockWorkPackages[2], assignee: undefined };
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: [wpWithoutAssignee] as WorkPackage[],
        relations: [],
      });

      const response = await request(app).get('/api/v1/projects/project-1/gantt');

      expect(response.status).toBe(200);
      expect(response.body.work_packages[0].assignee).toBeUndefined();
    });
  });

  describe('Error Cases', () => {
    it('should return 404 when project not found', async () => {
      mockProjectService.getGanttData.mockRejectedValue(new Error('Project not found'));

      const response = await request(app).get('/api/v1/projects/nonexistent/gantt');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: 'Project not found',
      });
    });

    it('should return 400 for invalid start_date format', async () => {
      const response = await request(app)
        .get('/api/v1/projects/project-1/gantt')
        .query({ start_date: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Bad Request',
        message: 'Invalid start_date format',
      });
    });

    it('should return 400 for invalid end_date format', async () => {
      const response = await request(app)
        .get('/api/v1/projects/project-1/gantt')
        .query({ end_date: 'not-a-date' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Bad Request',
        message: 'Invalid end_date format',
      });
    });

    it('should return 400 for service errors', async () => {
      mockProjectService.getGanttData.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app).get('/api/v1/projects/project-1/gantt');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Bad Request',
        message: 'Database connection failed',
      });
    });
  });

  describe('Query Parameter Combinations', () => {
    it('should handle all query parameters together', async () => {
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: [mockWorkPackages[0]] as WorkPackage[],
        relations: [],
      });

      const response = await request(app)
        .get('/api/v1/projects/project-1/gantt')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          include_relations: 'false',
        });

      expect(response.status).toBe(200);
      expect(mockProjectService.getGanttData).toHaveBeenCalledWith('project-1', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        includeRelations: false,
      });
    });

    it('should handle only start_date', async () => {
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        relations: mockRelations as WorkPackageRelation[],
      });

      const response = await request(app)
        .get('/api/v1/projects/project-1/gantt')
        .query({ start_date: '2024-01-01' });

      expect(response.status).toBe(200);
      expect(mockProjectService.getGanttData).toHaveBeenCalledWith('project-1', {
        startDate: new Date('2024-01-01'),
      });
    });

    it('should handle only end_date', async () => {
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        relations: mockRelations as WorkPackageRelation[],
      });

      const response = await request(app)
        .get('/api/v1/projects/project-1/gantt')
        .query({ end_date: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(mockProjectService.getGanttData).toHaveBeenCalledWith('project-1', {
        endDate: new Date('2024-12-31'),
      });
    });
  });

  describe('Data Transformation', () => {
    it('should correctly transform snake_case to camelCase and back', async () => {
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: mockWorkPackages as WorkPackage[],
        relations: mockRelations as WorkPackageRelation[],
      });

      const response = await request(app).get('/api/v1/projects/project-1/gantt');

      expect(response.status).toBe(200);

      // Check that response uses snake_case
      const wp = response.body.work_packages[0];
      expect(wp).toHaveProperty('project_id');
      expect(wp).toHaveProperty('assignee_id');
      expect(wp).toHaveProperty('start_date');
      expect(wp).toHaveProperty('due_date');
      expect(wp).toHaveProperty('estimated_hours');
      expect(wp).toHaveProperty('spent_hours');
      expect(wp).toHaveProperty('progress_percent');
      expect(wp).toHaveProperty('scheduling_mode');
      expect(wp).toHaveProperty('created_at');
      expect(wp).toHaveProperty('updated_at');

      const rel = response.body.relations[0];
      expect(rel).toHaveProperty('from_id');
      expect(rel).toHaveProperty('to_id');
      expect(rel).toHaveProperty('relation_type');
      expect(rel).toHaveProperty('lag_days');
      expect(rel).toHaveProperty('created_at');
    });

    it('should preserve all work package fields', async () => {
      mockProjectService.getGanttData.mockResolvedValue({
        workPackages: [mockWorkPackages[1]] as WorkPackage[], // Task with story points
        relations: [],
      });

      const response = await request(app).get('/api/v1/projects/project-1/gantt');

      expect(response.status).toBe(200);
      const wp = response.body.work_packages[0];

      expect(wp).toMatchObject({
        id: 'wp-2',
        project_id: 'project-1',
        type: 'task',
        subject: 'Task 2',
        description: 'Second task',
        status: 'in_progress',
        priority: 'high',
        assignee_id: 'test-user-id',
        estimated_hours: 60,
        spent_hours: 20,
        progress_percent: 33,
        scheduling_mode: 'manual',
        story_points: 5,
      });
    });
  });
});
