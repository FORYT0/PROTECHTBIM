import request from 'supertest';
import express from 'express';
import { createBurndownService } from '../../services/BurndownService';
import burndownRoutes from '../../routes/burndown.routes';

// Mock the auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateToken: jest.fn((req, _res, next) => {
    req.user = { userId: 'test-user-id' };
    next();
  }),
}));

// Mock the BurndownService
jest.mock('../../services/BurndownService');

describe('Burndown Routes', () => {
  let mockBurndownService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock service
    mockBurndownService = {
      getSprintBurndown: jest.fn(),
      recordBurndownSnapshot: jest.fn(),
      getReleaseBurndown: jest.fn(),
      recordDailySnapshots: jest.fn(),
    };

    (createBurndownService as jest.Mock).mockReturnValue(mockBurndownService);
  });

  describe('GET /api/v1/sprints/:id/burndown', () => {
    it('should get burndown chart data for a sprint', async () => {
      const mockBurndown = {
        sprintId: 'sprint-1',
        sprintName: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
        totalStoryPoints: 20,
        dataPoints: [
          {
            date: new Date('2024-01-01'),
            remaining: 20,
            completed: 0,
            ideal: 20,
          },
          {
            date: new Date('2024-01-02'),
            remaining: 18,
            completed: 2,
            ideal: 18.5,
          },
          {
            date: new Date('2024-01-14'),
            remaining: 0,
            completed: 20,
            ideal: 0,
          },
        ],
      };

      mockBurndownService.getSprintBurndown.mockResolvedValue(mockBurndown);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app).get('/api/v1/sprints/sprint-1/burndown');

      expect(response.status).toBe(200);
      expect(response.body.burndown).toBeDefined();
      expect(response.body.burndown.sprintId).toBe('sprint-1');
      expect(response.body.burndown.totalStoryPoints).toBe(20);
      expect(response.body.burndown.dataPoints).toHaveLength(3);
      expect(mockBurndownService.getSprintBurndown).toHaveBeenCalledWith('sprint-1');
    });

    it('should return 404 if sprint does not exist', async () => {
      mockBurndownService.getSprintBurndown.mockRejectedValue(
        new Error('Sprint not found')
      );

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app).get('/api/v1/sprints/non-existent-id/burndown');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Sprint not found');
    });

    it('should return 500 on service error', async () => {
      mockBurndownService.getSprintBurndown.mockRejectedValue(
        new Error('Database connection failed')
      );

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app).get('/api/v1/sprints/sprint-1/burndown');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database connection failed');
    });
  });

  describe('POST /api/v1/sprints/:id/burndown/snapshot', () => {
    it('should record a burndown snapshot for current date', async () => {
      const mockSnapshot = {
        id: 'snapshot-1',
        sprintId: 'sprint-1',
        date: new Date('2024-01-05'),
        remainingStoryPoints: 15,
        completedStoryPoints: 5,
        totalStoryPoints: 20,
      };

      mockBurndownService.recordBurndownSnapshot.mockResolvedValue(mockSnapshot);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app)
        .post('/api/v1/sprints/sprint-1/burndown/snapshot')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.snapshot).toBeDefined();
      expect(response.body.snapshot.remaining_story_points).toBe(15);
      expect(response.body.snapshot.completed_story_points).toBe(5);
      expect(response.body.snapshot.total_story_points).toBe(20);
      expect(mockBurndownService.recordBurndownSnapshot).toHaveBeenCalledWith(
        'sprint-1',
        undefined
      );
    });

    it('should record a burndown snapshot for specific date', async () => {
      const mockSnapshot = {
        id: 'snapshot-1',
        sprintId: 'sprint-1',
        date: new Date('2024-01-03'),
        remainingStoryPoints: 18,
        completedStoryPoints: 2,
        totalStoryPoints: 20,
      };

      mockBurndownService.recordBurndownSnapshot.mockResolvedValue(mockSnapshot);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app)
        .post('/api/v1/sprints/sprint-1/burndown/snapshot')
        .send({
          date: '2024-01-03',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockBurndownService.recordBurndownSnapshot).toHaveBeenCalledWith(
        'sprint-1',
        new Date('2024-01-03')
      );
    });

    it('should return 404 if sprint does not exist', async () => {
      mockBurndownService.recordBurndownSnapshot.mockRejectedValue(
        new Error('Sprint not found')
      );

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app)
        .post('/api/v1/sprints/non-existent-id/burndown/snapshot')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Sprint not found');
    });

    it('should return 500 on service error', async () => {
      mockBurndownService.recordBurndownSnapshot.mockRejectedValue(
        new Error('Failed to save snapshot')
      );

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app)
        .post('/api/v1/sprints/sprint-1/burndown/snapshot')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to save snapshot');
    });
  });

  describe('GET /api/v1/projects/:id/burndown', () => {
    it('should get release burndown chart data for a project', async () => {
      const mockBurndown = {
        projectId: 'project-1',
        totalStoryPoints: 50,
        dataPoints: [
          {
            date: new Date('2024-01-01'),
            remaining: 50,
            completed: 0,
            ideal: 50,
          },
          {
            date: new Date('2024-01-15'),
            remaining: 25,
            completed: 25,
            ideal: 25,
          },
          {
            date: new Date('2024-01-31'),
            remaining: 0,
            completed: 50,
            ideal: 0,
          },
        ],
      };

      mockBurndownService.getReleaseBurndown.mockResolvedValue(mockBurndown);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app).get('/api/v1/projects/project-1/burndown');

      expect(response.status).toBe(200);
      expect(response.body.burndown).toBeDefined();
      expect(response.body.burndown.projectId).toBe('project-1');
      expect(response.body.burndown.totalStoryPoints).toBe(50);
      expect(response.body.burndown.dataPoints).toHaveLength(3);
      expect(mockBurndownService.getReleaseBurndown).toHaveBeenCalledWith('project-1', {
        versionId: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should filter by version ID', async () => {
      const mockBurndown = {
        projectId: 'project-1',
        versionId: 'version-1',
        totalStoryPoints: 30,
        dataPoints: [],
      };

      mockBurndownService.getReleaseBurndown.mockResolvedValue(mockBurndown);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app).get(
        '/api/v1/projects/project-1/burndown?version_id=version-1'
      );

      expect(response.status).toBe(200);
      expect(response.body.burndown.versionId).toBe('version-1');
      expect(mockBurndownService.getReleaseBurndown).toHaveBeenCalledWith('project-1', {
        versionId: 'version-1',
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should filter by date range', async () => {
      const mockBurndown = {
        projectId: 'project-1',
        totalStoryPoints: 40,
        dataPoints: [],
      };

      mockBurndownService.getReleaseBurndown.mockResolvedValue(mockBurndown);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app).get(
        '/api/v1/projects/project-1/burndown?start_date=2024-01-01&end_date=2024-01-31'
      );

      expect(response.status).toBe(200);
      expect(mockBurndownService.getReleaseBurndown).toHaveBeenCalledWith('project-1', {
        versionId: undefined,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });
    });

    it('should return 500 on service error', async () => {
      mockBurndownService.getReleaseBurndown.mockRejectedValue(
        new Error('Failed to calculate burndown')
      );

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app).get('/api/v1/projects/project-1/burndown');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to calculate burndown');
    });
  });

  describe('POST /api/v1/burndown/daily-snapshots', () => {
    it('should record daily snapshots for all active sprints', async () => {
      mockBurndownService.recordDailySnapshots.mockResolvedValue(undefined);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app).post('/api/v1/burndown/daily-snapshots').send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Daily snapshots recorded');
      expect(mockBurndownService.recordDailySnapshots).toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      mockBurndownService.recordDailySnapshots.mockRejectedValue(
        new Error('Failed to record snapshots')
      );

      const app = express();
      app.use(express.json());
      app.use('/api/v1', burndownRoutes);

      const response = await request(app).post('/api/v1/burndown/daily-snapshots').send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to record snapshots');
    });
  });
});
