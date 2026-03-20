import request from 'supertest';
import express from 'express';
import { SprintStatus } from '../../entities/Sprint';
import { createSprintService } from '../../services/SprintService';
import sprintRoutes from '../../routes/sprints.routes';

// Mock the auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateToken: jest.fn((req, _res, next) => {
    req.user = { userId: 'test-user-id' };
    next();
  }),
}));

// Mock the SprintService
jest.mock('../../services/SprintService');

describe('Sprint Routes', () => {
  let mockSprintService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock service
    mockSprintService = {
      createSprint: jest.fn(),
      listSprints: jest.fn(),
      getSprintWithStats: jest.fn(),
      updateSprint: jest.fn(),
      deleteSprint: jest.fn(),
      addWorkPackagesToSprint: jest.fn(),
      removeWorkPackagesFromSprint: jest.fn(),
    };

    (createSprintService as jest.Mock).mockReturnValue(mockSprintService);
  });

  describe('POST /api/v1/projects/:id/sprints', () => {
    it('should create a new sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        projectId: 'project-1',
        name: 'Sprint 1',
        description: 'First sprint',
        status: SprintStatus.PLANNED,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
        capacity: 40,
        storyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSprintService.createSprint.mockResolvedValue(mockSprint);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/projects/project-1/sprints')
        .send({
          name: 'Sprint 1',
          description: 'First sprint',
          start_date: '2024-01-01',
          end_date: '2024-01-14',
          capacity: 40,
        });

      expect(response.status).toBe(201);
      expect(response.body.sprint).toBeDefined();
      expect(response.body.sprint.name).toBe('Sprint 1');
      expect(mockSprintService.createSprint).toHaveBeenCalledWith({
        projectId: 'project-1',
        name: 'Sprint 1',
        description: 'First sprint',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
        capacity: 40,
      });
    });

    it('should return 400 if name is missing', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/projects/project-1/sprints')
        .send({
          start_date: '2024-01-01',
          end_date: '2024-01-14',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Sprint name is required');
    });

    it('should return 400 if start_date is missing', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/projects/project-1/sprints')
        .send({
          name: 'Sprint 1',
          end_date: '2024-01-14',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Start date is required');
    });

    it('should return 400 if end_date is missing', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/projects/project-1/sprints')
        .send({
          name: 'Sprint 1',
          start_date: '2024-01-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('End date is required');
    });

    it('should return 400 if end_date is before start_date', async () => {
      mockSprintService.createSprint.mockRejectedValue(
        new Error('End date must be after start date')
      );

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/projects/project-1/sprints')
        .send({
          name: 'Sprint 1',
          start_date: '2024-01-14',
          end_date: '2024-01-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('End date must be after start date');
    });

    it('should return 404 if project does not exist', async () => {
      mockSprintService.createSprint.mockRejectedValue(new Error('Project not found'));

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/projects/non-existent-id/sprints')
        .send({
          name: 'Sprint 1',
          start_date: '2024-01-01',
          end_date: '2024-01-14',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('GET /api/v1/projects/:id/sprints', () => {
    it('should list all sprints for a project', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          projectId: 'project-1',
          name: 'Sprint 1',
          status: SprintStatus.COMPLETED,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-14'),
        },
        {
          id: 'sprint-2',
          projectId: 'project-1',
          name: 'Sprint 2',
          status: SprintStatus.ACTIVE,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-28'),
        },
      ];

      mockSprintService.listSprints.mockResolvedValue({
        sprints: mockSprints,
        total: 2,
      });

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app).get('/api/v1/projects/project-1/sprints');

      expect(response.status).toBe(200);
      expect(response.body.sprints).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(mockSprintService.listSprints).toHaveBeenCalledWith('project-1', {
        status: undefined,
        page: undefined,
        perPage: undefined,
      });
    });

    it('should filter sprints by status', async () => {
      const mockSprints = [
        {
          id: 'sprint-2',
          projectId: 'project-1',
          name: 'Sprint 2',
          status: SprintStatus.ACTIVE,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-28'),
        },
      ];

      mockSprintService.listSprints.mockResolvedValue({
        sprints: mockSprints,
        total: 1,
      });

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app).get(
        '/api/v1/projects/project-1/sprints?status=active'
      );

      expect(response.status).toBe(200);
      expect(response.body.sprints).toHaveLength(1);
      expect(response.body.sprints[0].status).toBe(SprintStatus.ACTIVE);
      expect(mockSprintService.listSprints).toHaveBeenCalledWith('project-1', {
        status: SprintStatus.ACTIVE,
        page: undefined,
        perPage: undefined,
      });
    });

    it('should return 400 for invalid status', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app).get(
        '/api/v1/projects/project-1/sprints?status=invalid'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status');
    });

    it('should support pagination', async () => {
      mockSprintService.listSprints.mockResolvedValue({
        sprints: [],
        total: 0,
      });

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app).get(
        '/api/v1/projects/project-1/sprints?page=2&per_page=10'
      );

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.per_page).toBe(10);
      expect(mockSprintService.listSprints).toHaveBeenCalledWith('project-1', {
        status: undefined,
        page: 2,
        perPage: 10,
      });
    });

    it('should return 404 if project does not exist', async () => {
      mockSprintService.listSprints.mockRejectedValue(new Error('Project not found'));

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app).get('/api/v1/projects/non-existent-id/sprints');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('GET /api/v1/sprints/:id', () => {
    it('should get a sprint with work packages and stats', async () => {
      const mockResult = {
        sprint: {
          id: 'sprint-1',
          projectId: 'project-1',
          name: 'Sprint 1',
          status: SprintStatus.ACTIVE,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-14'),
          capacity: 40,
          storyPoints: 13,
        },
        workPackages: [
          {
            id: 'wp-1',
            subject: 'Task 1',
            storyPoints: 5,
          },
          {
            id: 'wp-2',
            subject: 'Task 2',
            storyPoints: 8,
          },
        ],
        totalStoryPoints: 13,
      };

      mockSprintService.getSprintWithStats.mockResolvedValue(mockResult);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app).get('/api/v1/sprints/sprint-1');

      expect(response.status).toBe(200);
      expect(response.body.sprint).toBeDefined();
      expect(response.body.work_packages).toHaveLength(2);
      expect(response.body.total_story_points).toBe(13);
      expect(mockSprintService.getSprintWithStats).toHaveBeenCalledWith('sprint-1');
    });

    it('should return 404 if sprint does not exist', async () => {
      mockSprintService.getSprintWithStats.mockResolvedValue(null);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app).get('/api/v1/sprints/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Sprint not found');
    });
  });

  describe('PATCH /api/v1/sprints/:id', () => {
    it('should update a sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        projectId: 'project-1',
        name: 'Updated Sprint',
        description: 'Updated description',
        status: SprintStatus.ACTIVE,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
        capacity: 50,
      };

      mockSprintService.updateSprint.mockResolvedValue(mockSprint);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .patch('/api/v1/sprints/sprint-1')
        .send({
          name: 'Updated Sprint',
          description: 'Updated description',
          status: SprintStatus.ACTIVE,
          capacity: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.sprint.name).toBe('Updated Sprint');
      expect(response.body.sprint.status).toBe(SprintStatus.ACTIVE);
      expect(mockSprintService.updateSprint).toHaveBeenCalledWith('sprint-1', {
        name: 'Updated Sprint',
        description: 'Updated description',
        status: SprintStatus.ACTIVE,
        startDate: undefined,
        endDate: undefined,
        capacity: 50,
      });
    });

    it('should return 400 for invalid status', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .patch('/api/v1/sprints/sprint-1')
        .send({
          status: 'invalid-status',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status');
    });

    it('should return 400 if end_date is before start_date', async () => {
      mockSprintService.updateSprint.mockRejectedValue(
        new Error('End date must be after start date')
      );

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .patch('/api/v1/sprints/sprint-1')
        .send({
          start_date: '2024-01-14',
          end_date: '2024-01-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('End date must be after start date');
    });

    it('should return 404 if sprint does not exist', async () => {
      mockSprintService.updateSprint.mockRejectedValue(new Error('Sprint not found'));

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .patch('/api/v1/sprints/non-existent-id')
        .send({
          name: 'Updated Sprint',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Sprint not found');
    });
  });

  describe('DELETE /api/v1/sprints/:id', () => {
    it('should delete a sprint', async () => {
      mockSprintService.deleteSprint.mockResolvedValue(true);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app).delete('/api/v1/sprints/sprint-1');

      expect(response.status).toBe(204);
      expect(mockSprintService.deleteSprint).toHaveBeenCalledWith('sprint-1');
    });

    it('should return 404 if sprint does not exist', async () => {
      mockSprintService.deleteSprint.mockResolvedValue(false);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app).delete('/api/v1/sprints/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Sprint not found');
    });
  });

  describe('POST /api/v1/sprints/:id/work-packages', () => {
    it('should add work packages to a sprint', async () => {
      mockSprintService.addWorkPackagesToSprint.mockResolvedValue(undefined);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/sprints/sprint-1/work-packages')
        .send({
          work_package_ids: ['wp-1', 'wp-2', 'wp-3'],
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Work packages added to sprint');
      expect(mockSprintService.addWorkPackagesToSprint).toHaveBeenCalledWith('sprint-1', [
        'wp-1',
        'wp-2',
        'wp-3',
      ]);
    });

    it('should return 400 if work_package_ids is missing', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/sprints/sprint-1/work-packages')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('work_package_ids array is required');
    });

    it('should return 400 if work_package_ids is not an array', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/sprints/sprint-1/work-packages')
        .send({
          work_package_ids: 'not-an-array',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('work_package_ids array is required');
    });

    it('should return 400 if work_package_ids is empty', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/sprints/sprint-1/work-packages')
        .send({
          work_package_ids: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('work_package_ids cannot be empty');
    });

    it('should return 404 if sprint does not exist', async () => {
      mockSprintService.addWorkPackagesToSprint.mockRejectedValue(
        new Error('Sprint not found')
      );

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .post('/api/v1/sprints/non-existent-id/work-packages')
        .send({
          work_package_ids: ['wp-1'],
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Sprint not found');
    });
  });

  describe('DELETE /api/v1/sprints/work-packages', () => {
    it('should remove work packages from their sprint', async () => {
      mockSprintService.removeWorkPackagesFromSprint.mockResolvedValue(undefined);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .delete('/api/v1/sprints/work-packages')
        .send({
          work_package_ids: ['wp-1', 'wp-2'],
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Work packages removed from sprint');
      expect(mockSprintService.removeWorkPackagesFromSprint).toHaveBeenCalledWith([
        'wp-1',
        'wp-2',
      ]);
    });

    it('should return 400 if work_package_ids is missing', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app).delete('/api/v1/sprints/work-packages').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('work_package_ids array is required');
    });

    it('should return 400 if work_package_ids is empty', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', sprintRoutes);

      const response = await request(app)
        .delete('/api/v1/sprints/work-packages')
        .send({
          work_package_ids: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('work_package_ids cannot be empty');
    });
  });
});
