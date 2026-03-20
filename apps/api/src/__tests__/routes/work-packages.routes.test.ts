import request from 'supertest';
import express, { Express } from 'express';
import { createWorkPackageRouter } from '../../routes/work-packages.routes';
import { WorkPackageService } from '../../services/WorkPackageService';
import { WorkPackage, WorkPackageType, Priority, SchedulingMode } from '../../entities/WorkPackage';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { User } from '../../entities/User';

// Mock the auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateToken: () => (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-123' };
    next();
  },
  createAuthService: jest.fn(),
}));

describe('Work Package Routes', () => {
  let app: Express;
  let mockWorkPackageService: jest.Mocked<WorkPackageService>;

  const mockUser: User = {
    id: 'user-123',
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
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
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

    // Create mock service
    mockWorkPackageService = {
      createWorkPackage: jest.fn(),
      getWorkPackageById: jest.fn(),
      listWorkPackages: jest.fn(),
      updateWorkPackage: jest.fn(),
      deleteWorkPackage: jest.fn(),
      addWatcher: jest.fn(),
      removeWatcher: jest.fn(),
      getWatchers: jest.fn(),
    } as any;

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/work_packages', createWorkPackageRouter(mockWorkPackageService));
  });

  describe('POST /api/v1/work_packages', () => {
    it('should create work package', async () => {
      mockWorkPackageService.createWorkPackage.mockResolvedValue(mockWorkPackage);

      const response = await request(app)
        .post('/api/v1/work_packages')
        .send({
          project_id: mockProject.id,
          type: WorkPackageType.TASK,
          subject: 'Test Task',
          description: 'Test Description',
        });

      expect(response.status).toBe(201);
      expect(response.body.work_package).toBeDefined();
      expect(response.body.work_package.id).toBe('wp-123');
      expect(response.body.work_package.subject).toBe('Test Task');
      expect(mockWorkPackageService.createWorkPackage).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: mockProject.id,
          type: WorkPackageType.TASK,
          subject: 'Test Task',
        })
      );
    });

    it('should return 400 when creation fails', async () => {
      mockWorkPackageService.createWorkPackage.mockRejectedValue(
        new Error('Project not found')
      );

      const response = await request(app)
        .post('/api/v1/work_packages')
        .send({
          project_id: 'non-existent',
          type: WorkPackageType.TASK,
          subject: 'Test Task',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Project not found');
    });
  });

  describe('GET /api/v1/work_packages', () => {
    it('should list work packages', async () => {
      mockWorkPackageService.listWorkPackages.mockResolvedValue({
        workPackages: [mockWorkPackage],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/work_packages')
        .query({ project_id: mockProject.id });

      expect(response.status).toBe(200);
      expect(response.body.work_packages).toHaveLength(1);
      expect(response.body.work_packages[0].id).toBe('wp-123');
      expect(response.body.total).toBe(1);
      expect(response.body.page).toBe(1);
      expect(response.body.per_page).toBe(20);
    });

    it('should filter by type', async () => {
      mockWorkPackageService.listWorkPackages.mockResolvedValue({
        workPackages: [mockWorkPackage],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/work_packages')
        .query({ type: 'task,bug' });

      expect(response.status).toBe(200);
      expect(mockWorkPackageService.listWorkPackages).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ['task', 'bug'],
        })
      );
    });

    it('should return 400 on error', async () => {
      mockWorkPackageService.listWorkPackages.mockRejectedValue(
        new Error('Invalid page')
      );

      const response = await request(app).get('/api/v1/work_packages');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('GET /api/v1/work_packages/:id', () => {
    it('should get work package by ID', async () => {
      mockWorkPackageService.getWorkPackageById.mockResolvedValue(mockWorkPackage);

      const response = await request(app).get('/api/v1/work_packages/wp-123');

      expect(response.status).toBe(200);
      expect(response.body.work_package).toBeDefined();
      expect(response.body.work_package.id).toBe('wp-123');
      expect(response.body.work_package.subject).toBe('Test Task');
    });

    it('should return 404 when work package not found', async () => {
      mockWorkPackageService.getWorkPackageById.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/work_packages/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Work package not found');
    });

    it('should return 400 on error', async () => {
      mockWorkPackageService.getWorkPackageById.mockRejectedValue(
        new Error('Invalid ID')
      );

      const response = await request(app).get('/api/v1/work_packages/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('PATCH /api/v1/work_packages/:id', () => {
    it('should update work package', async () => {
      const updatedWorkPackage = {
        ...mockWorkPackage,
        subject: 'Updated Task',
      };

      mockWorkPackageService.updateWorkPackage.mockResolvedValue(updatedWorkPackage);

      const response = await request(app)
        .patch('/api/v1/work_packages/wp-123')
        .send({
          subject: 'Updated Task',
        });

      expect(response.status).toBe(200);
      expect(response.body.work_package).toBeDefined();
      expect(response.body.work_package.subject).toBe('Updated Task');
      expect(mockWorkPackageService.updateWorkPackage).toHaveBeenCalledWith(
        'wp-123',
        expect.objectContaining({
          subject: 'Updated Task',
        })
      );
    });

    it('should return 404 when work package not found', async () => {
      mockWorkPackageService.updateWorkPackage.mockRejectedValue(
        new Error('Work package not found')
      );

      const response = await request(app)
        .patch('/api/v1/work_packages/non-existent')
        .send({
          subject: 'Updated Task',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 400 on validation error', async () => {
      mockWorkPackageService.updateWorkPackage.mockRejectedValue(
        new Error('Subject cannot be empty')
      );

      const response = await request(app)
        .patch('/api/v1/work_packages/wp-123')
        .send({
          subject: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('DELETE /api/v1/work_packages/:id', () => {
    it('should delete work package', async () => {
      mockWorkPackageService.deleteWorkPackage.mockResolvedValue(true);

      const response = await request(app).delete('/api/v1/work_packages/wp-123');

      expect(response.status).toBe(204);
      expect(mockWorkPackageService.deleteWorkPackage).toHaveBeenCalledWith('wp-123');
    });

    it('should return 404 when work package not found', async () => {
      mockWorkPackageService.deleteWorkPackage.mockRejectedValue(
        new Error('Work package not found')
      );

      const response = await request(app).delete('/api/v1/work_packages/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 400 on error', async () => {
      mockWorkPackageService.deleteWorkPackage.mockRejectedValue(
        new Error('Invalid ID')
      );

      const response = await request(app).delete('/api/v1/work_packages/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('POST /api/v1/work_packages/:id/watchers', () => {
    const mockWatcher = {
      workPackageId: 'wp-123',
      userId: 'user-456',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      user: {
        id: 'user-456',
        email: 'watcher@example.com',
        name: 'Watcher User',
      },
    };

    it('should add a watcher to work package', async () => {
      mockWorkPackageService.addWatcher.mockResolvedValue(mockWatcher as any);

      const response = await request(app)
        .post('/api/v1/work_packages/wp-123/watchers')
        .send({
          user_id: 'user-456',
        });

      expect(response.status).toBe(201);
      expect(response.body.watcher).toBeDefined();
      expect(response.body.watcher.work_package_id).toBe('wp-123');
      expect(response.body.watcher.user_id).toBe('user-456');
      expect(response.body.watcher.user.email).toBe('watcher@example.com');
      expect(mockWorkPackageService.addWatcher).toHaveBeenCalledWith('wp-123', 'user-456');
    });

    it('should return 400 when user_id is missing', async () => {
      const response = await request(app)
        .post('/api/v1/work_packages/wp-123/watchers')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('user_id is required');
    });

    it('should return 404 when work package not found', async () => {
      mockWorkPackageService.addWatcher.mockRejectedValue(
        new Error('Work package not found')
      );

      const response = await request(app)
        .post('/api/v1/work_packages/non-existent/watchers')
        .send({
          user_id: 'user-456',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Work package not found');
    });

    it('should return 404 when user not found', async () => {
      mockWorkPackageService.addWatcher.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .post('/api/v1/work_packages/wp-123/watchers')
        .send({
          user_id: 'non-existent',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('User not found');
    });

    it('should return 409 when user is already watching', async () => {
      mockWorkPackageService.addWatcher.mockRejectedValue(
        new Error('User is already watching this work package')
      );

      const response = await request(app)
        .post('/api/v1/work_packages/wp-123/watchers')
        .send({
          user_id: 'user-456',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Conflict');
      expect(response.body.message).toBe('User is already watching this work package');
    });
  });

  describe('DELETE /api/v1/work_packages/:id/watchers/:user_id', () => {
    it('should remove a watcher from work package', async () => {
      mockWorkPackageService.removeWatcher.mockResolvedValue(true);

      const response = await request(app).delete(
        '/api/v1/work_packages/wp-123/watchers/user-456'
      );

      expect(response.status).toBe(204);
      expect(mockWorkPackageService.removeWatcher).toHaveBeenCalledWith('wp-123', 'user-456');
    });

    it('should return 404 when work package not found', async () => {
      mockWorkPackageService.removeWatcher.mockRejectedValue(
        new Error('Work package not found')
      );

      const response = await request(app).delete(
        '/api/v1/work_packages/non-existent/watchers/user-456'
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Work package not found');
    });

    it('should return 404 when user is not watching', async () => {
      mockWorkPackageService.removeWatcher.mockRejectedValue(
        new Error('User is not watching this work package')
      );

      const response = await request(app).delete(
        '/api/v1/work_packages/wp-123/watchers/user-456'
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('User is not watching this work package');
    });
  });

  describe('GET /api/v1/work_packages/:id/watchers', () => {
    const mockWatchers = [
      {
        workPackageId: 'wp-123',
        userId: 'user-456',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        user: {
          id: 'user-456',
          email: 'watcher1@example.com',
          name: 'Watcher 1',
        },
      },
      {
        workPackageId: 'wp-123',
        userId: 'user-789',
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        user: {
          id: 'user-789',
          email: 'watcher2@example.com',
          name: 'Watcher 2',
        },
      },
    ];

    it('should list all watchers for a work package', async () => {
      mockWorkPackageService.getWatchers.mockResolvedValue(mockWatchers as any);

      const response = await request(app).get('/api/v1/work_packages/wp-123/watchers');

      expect(response.status).toBe(200);
      expect(response.body.watchers).toBeDefined();
      expect(response.body.watchers).toHaveLength(2);
      expect(response.body.watchers[0].user_id).toBe('user-456');
      expect(response.body.watchers[0].user.email).toBe('watcher1@example.com');
      expect(response.body.watchers[1].user_id).toBe('user-789');
      expect(mockWorkPackageService.getWatchers).toHaveBeenCalledWith('wp-123');
    });

    it('should return empty array when no watchers exist', async () => {
      mockWorkPackageService.getWatchers.mockResolvedValue([]);

      const response = await request(app).get('/api/v1/work_packages/wp-123/watchers');

      expect(response.status).toBe(200);
      expect(response.body.watchers).toBeDefined();
      expect(response.body.watchers).toHaveLength(0);
    });

    it('should return 404 when work package not found', async () => {
      mockWorkPackageService.getWatchers.mockRejectedValue(
        new Error('Work package not found')
      );

      const response = await request(app).get('/api/v1/work_packages/non-existent/watchers');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Work package not found');
    });
  });

  describe('GET /api/v1/work_packages - Enhanced Filtering', () => {
    it('should filter by priority', async () => {
      mockWorkPackageService.listWorkPackages.mockResolvedValue({
        workPackages: [mockWorkPackage],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/work_packages')
        .query({ priority: 'high,urgent' });

      expect(response.status).toBe(200);
      expect(mockWorkPackageService.listWorkPackages).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: ['high', 'urgent'],
        })
      );
    });

    it('should filter by start date range', async () => {
      mockWorkPackageService.listWorkPackages.mockResolvedValue({
        workPackages: [mockWorkPackage],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/work_packages')
        .query({
          start_date_from: '2024-01-01',
          start_date_to: '2024-01-31',
        });

      expect(response.status).toBe(200);
      expect(mockWorkPackageService.listWorkPackages).toHaveBeenCalledWith(
        expect.objectContaining({
          startDateFrom: expect.any(Date),
          startDateTo: expect.any(Date),
        })
      );
    });

    it('should filter by due date range', async () => {
      mockWorkPackageService.listWorkPackages.mockResolvedValue({
        workPackages: [mockWorkPackage],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/work_packages')
        .query({
          due_date_from: '2024-01-01',
          due_date_to: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(mockWorkPackageService.listWorkPackages).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDateFrom: expect.any(Date),
          dueDateTo: expect.any(Date),
        })
      );
    });

    it('should filter by custom fields', async () => {
      mockWorkPackageService.listWorkPackages.mockResolvedValue({
        workPackages: [mockWorkPackage],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/work_packages')
        .query({
          custom_field_department: 'Engineering',
          custom_field_location: 'Building A',
        });

      expect(response.status).toBe(200);
      expect(mockWorkPackageService.listWorkPackages).toHaveBeenCalledWith(
        expect.objectContaining({
          customFields: {
            department: 'Engineering',
            location: 'Building A',
          },
        })
      );
    });

    it('should filter by custom fields with array values', async () => {
      mockWorkPackageService.listWorkPackages.mockResolvedValue({
        workPackages: [mockWorkPackage],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/work_packages')
        .query({
          custom_field_tags: 'urgent,critical',
        });

      expect(response.status).toBe(200);
      expect(mockWorkPackageService.listWorkPackages).toHaveBeenCalledWith(
        expect.objectContaining({
          customFields: {
            tags: ['urgent', 'critical'],
          },
        })
      );
    });

    it('should support full-text search on subject and description', async () => {
      mockWorkPackageService.listWorkPackages.mockResolvedValue({
        workPackages: [mockWorkPackage],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/work_packages')
        .query({ search: 'foundation' });

      expect(response.status).toBe(200);
      expect(mockWorkPackageService.listWorkPackages).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'foundation',
        })
      );
    });

    it('should combine multiple filters', async () => {
      mockWorkPackageService.listWorkPackages.mockResolvedValue({
        workPackages: [mockWorkPackage],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/work_packages')
        .query({
          project_id: 'project-123',
          type: 'task,bug',
          status: 'in_progress',
          priority: 'high',
          assignee_id: 'user-123',
          start_date_from: '2024-01-01',
          due_date_to: '2024-12-31',
          custom_field_department: 'Engineering',
          search: 'foundation',
          page: 1,
          per_page: 10,
          sort_by: 'dueDate',
          sort_order: 'asc',
        });

      expect(response.status).toBe(200);
      expect(mockWorkPackageService.listWorkPackages).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-123',
          type: ['task', 'bug'],
          status: ['in_progress'],
          priority: ['high'],
          assigneeId: 'user-123',
          startDateFrom: expect.any(Date),
          dueDateTo: expect.any(Date),
          customFields: {
            department: 'Engineering',
          },
          search: 'foundation',
          page: 1,
          perPage: 10,
          sortBy: 'dueDate',
          sortOrder: 'ASC',
        })
      );
    });
  });
});
