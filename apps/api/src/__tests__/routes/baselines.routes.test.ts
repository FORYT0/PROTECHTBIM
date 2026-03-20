import request from 'supertest';
import express, { Express } from 'express';
import baselinesRouter from '../../routes/baselines.routes';
import { BaselineService } from '../../services/BaselineService';
import { Baseline } from '../../entities/Baseline';
import { User } from '../../entities/User';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';

// Mock the authenticate middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1' };
    next();
  },
}));

// Mock the BaselineService
jest.mock('../../services/BaselineService');

describe('Baselines Routes', () => {
  let app: Express;
  let mockBaselineService: jest.Mocked<BaselineService>;

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

  beforeEach(() => {
    jest.clearAllMocks();

    mockBaselineService = {
      createBaseline: jest.fn(),
      listBaselines: jest.fn(),
      getBaselineWithWorkPackages: jest.fn(),
      deleteBaseline: jest.fn(),
      calculateVariance: jest.fn(),
    } as any;

    // Mock the createBaselineService function
    (BaselineService as any).mockImplementation(() => mockBaselineService);
    require('../../services/BaselineService').createBaselineService = jest.fn(
      () => mockBaselineService
    );

    app = express();
    app.use(express.json());
    app.use('/api/v1', baselinesRouter);
  });

  describe('POST /api/v1/projects/:id/baselines', () => {
    it('should create a new baseline', async () => {
      mockBaselineService.createBaseline.mockResolvedValue(mockBaseline);

      const response = await request(app)
        .post('/api/v1/projects/project-1/baselines')
        .send({
          name: 'Sprint 1 Baseline',
          description: 'Baseline for Sprint 1',
        })
        .expect(201);

      expect(response.body.baseline.id).toBe('baseline-1');
      expect(response.body.baseline.name).toBe('Sprint 1 Baseline');
      expect(response.body.baseline.projectId).toBe('project-1');
      expect(mockBaselineService.createBaseline).toHaveBeenCalledWith({
        projectId: 'project-1',
        name: 'Sprint 1 Baseline',
        description: 'Baseline for Sprint 1',
        createdBy: 'user-1',
      });
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/v1/projects/project-1/baselines')
        .send({
          description: 'Test description',
        })
        .expect(400);

      expect(response.body.error).toBe('Baseline name is required');
      expect(mockBaselineService.createBaseline).not.toHaveBeenCalled();
    });

    it('should return 404 when project not found', async () => {
      mockBaselineService.createBaseline.mockRejectedValue(new Error('Project not found'));

      const response = await request(app)
        .post('/api/v1/projects/nonexistent/baselines')
        .send({
          name: 'Test Baseline',
        })
        .expect(404);

      expect(response.body.error).toBe('Project not found');
    });

    it('should return 500 on service error', async () => {
      mockBaselineService.createBaseline.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/projects/project-1/baselines')
        .send({
          name: 'Test Baseline',
        })
        .expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/v1/projects/:id/baselines', () => {
    it('should list all baselines for a project', async () => {
      const baselines = [
        {
          id: 'baseline-1',
          projectId: 'project-1',
          name: 'Sprint 1 Baseline',
          description: 'Baseline for Sprint 1',
          createdBy: 'user-1',
          createdAt: new Date('2024-01-01'),
          workPackageCount: 5,
        },
        {
          id: 'baseline-2',
          projectId: 'project-1',
          name: 'Sprint 2 Baseline',
          description: 'Baseline for Sprint 2',
          createdBy: 'user-1',
          createdAt: new Date('2024-02-01'),
          workPackageCount: 8,
        },
      ];

      mockBaselineService.listBaselines.mockResolvedValue(baselines);

      const response = await request(app)
        .get('/api/v1/projects/project-1/baselines')
        .expect(200);

      expect(response.body.baselines).toHaveLength(2);
      expect(response.body.baselines[0].workPackageCount).toBe(5);
      expect(mockBaselineService.listBaselines).toHaveBeenCalledWith('project-1');
    });

    it('should return empty array when no baselines exist', async () => {
      mockBaselineService.listBaselines.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/projects/project-1/baselines')
        .expect(200);

      expect(response.body.baselines).toEqual([]);
    });

    it('should return 404 when project not found', async () => {
      mockBaselineService.listBaselines.mockRejectedValue(new Error('Project not found'));

      const response = await request(app)
        .get('/api/v1/projects/nonexistent/baselines')
        .expect(404);

      expect(response.body.error).toBe('Project not found');
    });

    it('should return 500 on service error', async () => {
      mockBaselineService.listBaselines.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/projects/project-1/baselines')
        .expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/v1/baselines/:id', () => {
    it('should return baseline with work package snapshots', async () => {
      const baselineWithWPs = {
        ...mockBaseline,
        workPackages: [
          {
            id: 'bwp-1',
            baselineId: 'baseline-1',
            workPackageId: 'wp-1',
            subject: 'Task 1',
            startDate: new Date('2024-01-01'),
            dueDate: new Date('2024-01-15'),
            baseline: mockBaseline,
          } as any,
          {
            id: 'bwp-2',
            baselineId: 'baseline-1',
            workPackageId: 'wp-2',
            subject: 'Task 2',
            startDate: new Date('2024-01-16'),
            dueDate: new Date('2024-01-31'),
            baseline: mockBaseline,
          } as any,
        ],
      };

      mockBaselineService.getBaselineWithWorkPackages.mockResolvedValue(baselineWithWPs);

      const response = await request(app).get('/api/v1/baselines/baseline-1').expect(200);

      expect(response.body.baseline.id).toBe('baseline-1');
      expect(response.body.baseline.workPackages).toHaveLength(2);
      expect(mockBaselineService.getBaselineWithWorkPackages).toHaveBeenCalledWith('baseline-1');
    });

    it('should return 404 when baseline not found', async () => {
      mockBaselineService.getBaselineWithWorkPackages.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/baselines/nonexistent').expect(404);

      expect(response.body.error).toBe('Baseline not found');
    });

    it('should return 500 on service error', async () => {
      mockBaselineService.getBaselineWithWorkPackages.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/v1/baselines/baseline-1').expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });

  describe('DELETE /api/v1/baselines/:id', () => {
    it('should delete a baseline', async () => {
      mockBaselineService.deleteBaseline.mockResolvedValue(true);

      await request(app).delete('/api/v1/baselines/baseline-1').expect(204);

      expect(mockBaselineService.deleteBaseline).toHaveBeenCalledWith('baseline-1');
    });

    it('should return 404 when baseline not found', async () => {
      mockBaselineService.deleteBaseline.mockRejectedValue(new Error('Baseline not found'));

      const response = await request(app).delete('/api/v1/baselines/nonexistent').expect(404);

      expect(response.body.error).toBe('Baseline not found');
    });

    it('should return 500 on service error', async () => {
      mockBaselineService.deleteBaseline.mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/api/v1/baselines/baseline-1').expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/v1/baselines/:id/variance', () => {
    it('should return variance report', async () => {
      const varianceReport = {
        baselineId: 'baseline-1',
        baselineName: 'Sprint 1 Baseline',
        projectId: 'project-1',
        generatedAt: new Date('2024-01-15'),
        totalWorkPackages: 3,
        aheadCount: 1,
        onTrackCount: 1,
        behindCount: 1,
        noBaselineCount: 0,
        averageStartVarianceDays: 0.5,
        averageDueVarianceDays: 1.2,
        variances: [
          {
            workPackageId: 'wp-1',
            subject: 'Task 1',
            baselineStartDate: new Date('2024-01-01'),
            baselineDueDate: new Date('2024-01-15'),
            currentStartDate: new Date('2024-01-03'),
            currentDueDate: new Date('2024-01-17'),
            startVarianceDays: 2,
            dueVarianceDays: 2,
            status: 'behind' as const,
          },
          {
            workPackageId: 'wp-2',
            subject: 'Task 2',
            baselineStartDate: new Date('2024-01-16'),
            baselineDueDate: new Date('2024-01-31'),
            currentStartDate: new Date('2024-01-16'),
            currentDueDate: new Date('2024-01-31'),
            startVarianceDays: 0,
            dueVarianceDays: 0,
            status: 'on_track' as const,
          },
          {
            workPackageId: 'wp-3',
            subject: 'Task 3',
            baselineStartDate: new Date('2024-02-01'),
            baselineDueDate: new Date('2024-02-15'),
            currentStartDate: new Date('2024-01-28'),
            currentDueDate: new Date('2024-02-12'),
            startVarianceDays: -4,
            dueVarianceDays: -3,
            status: 'ahead' as const,
          },
        ],
      };

      mockBaselineService.calculateVariance.mockResolvedValue(varianceReport);

      const response = await request(app)
        .get('/api/v1/baselines/baseline-1/variance')
        .expect(200);

      expect(response.body.report.baselineId).toBe('baseline-1');
      expect(response.body.report.totalWorkPackages).toBe(3);
      expect(response.body.report.aheadCount).toBe(1);
      expect(response.body.report.onTrackCount).toBe(1);
      expect(response.body.report.behindCount).toBe(1);
      expect(response.body.report.variances).toHaveLength(3);
      expect(mockBaselineService.calculateVariance).toHaveBeenCalledWith('baseline-1');
    });

    it('should return 404 when baseline not found', async () => {
      mockBaselineService.calculateVariance.mockRejectedValue(new Error('Baseline not found'));

      const response = await request(app)
        .get('/api/v1/baselines/nonexistent/variance')
        .expect(404);

      expect(response.body.error).toBe('Baseline not found');
    });

    it('should return 500 on service error', async () => {
      mockBaselineService.calculateVariance.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/baselines/baseline-1/variance')
        .expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });
});
