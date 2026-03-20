import request from 'supertest';
import express, { Express } from 'express';
import { createProjectRouter } from '../../routes/projects.routes';
import { ProjectService } from '../../services/ProjectService';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { User } from '../../entities/User';

// Mock the authenticate middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateToken: () => (req: any, _res: any, next: any) => {
    req.user = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      roles: ['user'],
    };
    next();
  },
  createAuthService: jest.fn(),
}));

describe('Project Routes', () => {
  let app: Express;
  let mockProjectService: jest.Mocked<ProjectService>;

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

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock service
    mockProjectService = {
      createProject: jest.fn(),
      getProjectById: jest.fn(),
      listProjects: jest.fn(),
      updateProject: jest.fn(),
      deleteProject: jest.fn(),
      transitionPhase: jest.fn(),
    } as any;

    // Create Express app with project routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/projects', createProjectRouter(mockProjectService));
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project successfully', async () => {
      mockProjectService.createProject.mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/v1/projects')
        .send({
          name: 'Test Project',
          description: 'Test Description',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        });

      expect(response.status).toBe(201);
      expect(response.body.project).toBeDefined();
      expect(response.body.project.name).toBe('Test Project');
      expect(response.body.project.id).toBe('project-123');
      expect(mockProjectService.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Project',
          description: 'Test Description',
          ownerId: mockUser.id,
        })
      );
    });

    it('should return 400 for missing name', async () => {
      mockProjectService.createProject.mockRejectedValue(
        new Error('Project name is required')
      );

      const response = await request(app)
        .post('/api/v1/projects')
        .send({
          description: 'Test Description',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid date range', async () => {
      mockProjectService.createProject.mockRejectedValue(
        new Error('Start date must be before end date')
      );

      const response = await request(app)
        .post('/api/v1/projects')
        .send({
          name: 'Test Project',
          start_date: '2024-12-31',
          end_date: '2024-01-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Start date must be before end date');
    });

    it('should create project with custom fields', async () => {
      const projectWithCustomFields = {
        ...mockProject,
        customFields: { budget: 100000, priority: 'high' },
      };
      mockProjectService.createProject.mockResolvedValue(projectWithCustomFields);

      const response = await request(app)
        .post('/api/v1/projects')
        .send({
          name: 'Test Project',
          custom_fields: { budget: 100000, priority: 'high' },
        });

      expect(response.status).toBe(201);
      expect(response.body.project.custom_fields).toEqual({
        budget: 100000,
        priority: 'high',
      });
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should list projects successfully', async () => {
      mockProjectService.listProjects.mockResolvedValue({
        projects: [mockProject],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app).get('/api/v1/projects');

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.total).toBe(1);
      expect(response.body.page).toBe(1);
      expect(response.body.per_page).toBe(20);
    });

    it('should filter projects by status', async () => {
      mockProjectService.listProjects.mockResolvedValue({
        projects: [mockProject],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/projects')
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ['active'],
        })
      );
    });

    it('should filter projects by multiple statuses', async () => {
      mockProjectService.listProjects.mockResolvedValue({
        projects: [mockProject],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/projects')
        .query({ status: 'active,on_hold' });

      expect(response.status).toBe(200);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ['active', 'on_hold'],
        })
      );
    });

    it('should filter projects by owner', async () => {
      mockProjectService.listProjects.mockResolvedValue({
        projects: [mockProject],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/projects')
        .query({ owner_id: mockUser.id });

      expect(response.status).toBe(200);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: mockUser.id,
        })
      );
    });

    it('should support pagination', async () => {
      mockProjectService.listProjects.mockResolvedValue({
        projects: [mockProject],
        total: 50,
        page: 2,
        perPage: 10,
      });

      const response = await request(app)
        .get('/api/v1/projects')
        .query({ page: 2, per_page: 10 });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.per_page).toBe(10);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          perPage: 10,
        })
      );
    });

    it('should support sorting', async () => {
      mockProjectService.listProjects.mockResolvedValue({
        projects: [mockProject],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/projects')
        .query({ sort_by: 'name', sort_order: 'asc' });

      expect(response.status).toBe(200);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'name',
          sortOrder: 'ASC',
        })
      );
    });

    it('should support search', async () => {
      mockProjectService.listProjects.mockResolvedValue({
        projects: [mockProject],
        total: 1,
        page: 1,
        perPage: 20,
      });

      const response = await request(app)
        .get('/api/v1/projects')
        .query({ search: 'test' });

      expect(response.status).toBe(200);
      expect(mockProjectService.listProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
        })
      );
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should get project by id successfully', async () => {
      mockProjectService.getProjectById.mockResolvedValue(mockProject);

      const response = await request(app).get('/api/v1/projects/project-123');

      expect(response.status).toBe(200);
      expect(response.body.project).toBeDefined();
      expect(response.body.project.id).toBe('project-123');
      expect(response.body.project.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      mockProjectService.getProjectById.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/projects/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Project not found');
    });

    it('should include related entities', async () => {
      const projectWithRelations = {
        ...mockProject,
        program: { id: 'program-1', name: 'Test Program' },
        portfolio: { id: 'portfolio-1', name: 'Test Portfolio' },
      };
      mockProjectService.getProjectById.mockResolvedValue(projectWithRelations as any);

      const response = await request(app).get('/api/v1/projects/project-123');

      expect(response.status).toBe(200);
      expect(response.body.project.owner).toBeDefined();
      expect(response.body.project.program).toBeDefined();
      expect(response.body.project.portfolio).toBeDefined();
    });
  });

  describe('PATCH /api/v1/projects/:id', () => {
    it('should update project successfully', async () => {
      const updatedProject = {
        ...mockProject,
        name: 'Updated Project',
        description: 'Updated Description',
      };
      mockProjectService.updateProject.mockResolvedValue(updatedProject);

      const response = await request(app)
        .patch('/api/v1/projects/project-123')
        .send({
          name: 'Updated Project',
          description: 'Updated Description',
        });

      expect(response.status).toBe(200);
      expect(response.body.project.name).toBe('Updated Project');
      expect(response.body.project.description).toBe('Updated Description');
      expect(mockProjectService.updateProject).toHaveBeenCalledWith(
        'project-123',
        expect.objectContaining({
          name: 'Updated Project',
          description: 'Updated Description',
        })
      );
    });

    it('should update project status', async () => {
      const updatedProject = {
        ...mockProject,
        status: ProjectStatus.ON_HOLD,
      };
      mockProjectService.updateProject.mockResolvedValue(updatedProject);

      const response = await request(app)
        .patch('/api/v1/projects/project-123')
        .send({
          status: 'on_hold',
        });

      expect(response.status).toBe(200);
      expect(response.body.project.status).toBe('on_hold');
    });

    it('should update lifecycle phase', async () => {
      const updatedProject = {
        ...mockProject,
        lifecyclePhase: LifecyclePhase.EXECUTION,
      };
      mockProjectService.updateProject.mockResolvedValue(updatedProject);

      const response = await request(app)
        .patch('/api/v1/projects/project-123')
        .send({
          lifecycle_phase: 'execution',
        });

      expect(response.status).toBe(200);
      expect(response.body.project.lifecycle_phase).toBe('execution');
    });

    it('should return 404 for non-existent project', async () => {
      mockProjectService.updateProject.mockRejectedValue(
        new Error('Project not found')
      );

      const response = await request(app)
        .patch('/api/v1/projects/non-existent')
        .send({
          name: 'Updated Project',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Project not found');
    });

    it('should return 400 for invalid date range', async () => {
      mockProjectService.updateProject.mockRejectedValue(
        new Error('Start date must be before end date')
      );

      const response = await request(app)
        .patch('/api/v1/projects/project-123')
        .send({
          start_date: '2024-12-31',
          end_date: '2024-01-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Start date must be before end date');
    });

    it('should update custom fields', async () => {
      const updatedProject = {
        ...mockProject,
        customFields: { budget: 200000, priority: 'critical' },
      };
      mockProjectService.updateProject.mockResolvedValue(updatedProject);

      const response = await request(app)
        .patch('/api/v1/projects/project-123')
        .send({
          custom_fields: { budget: 200000, priority: 'critical' },
        });

      expect(response.status).toBe(200);
      expect(response.body.project.custom_fields).toEqual({
        budget: 200000,
        priority: 'critical',
      });
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete project successfully', async () => {
      mockProjectService.deleteProject.mockResolvedValue(true);

      const response = await request(app).delete('/api/v1/projects/project-123');

      expect(response.status).toBe(204);
      expect(mockProjectService.deleteProject).toHaveBeenCalledWith('project-123');
    });

    it('should return 404 for non-existent project', async () => {
      mockProjectService.deleteProject.mockRejectedValue(
        new Error('Project not found')
      );

      const response = await request(app).delete('/api/v1/projects/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Project not found');
    });
  });

  describe('POST /api/v1/projects/:id/transition-phase', () => {
    it('should transition project phase successfully', async () => {
      const transitionedProject = {
        ...mockProject,
        lifecyclePhase: LifecyclePhase.PLANNING,
      };
      mockProjectService.transitionPhase.mockResolvedValue(transitionedProject);

      const response = await request(app)
        .post('/api/v1/projects/project-123/transition-phase')
        .send({
          new_phase: 'planning',
        });

      expect(response.status).toBe(200);
      expect(response.body.project.lifecycle_phase).toBe('planning');
      expect(response.body.message).toContain('planning');
      expect(mockProjectService.transitionPhase).toHaveBeenCalledWith(
        'project-123',
        'planning'
      );
    });

    it('should return 400 when new_phase is missing', async () => {
      const response = await request(app)
        .post('/api/v1/projects/project-123/transition-phase')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('new_phase is required');
    });

    it('should return 404 for non-existent project', async () => {
      mockProjectService.transitionPhase.mockRejectedValue(
        new Error('Project not found')
      );

      const response = await request(app)
        .post('/api/v1/projects/non-existent/transition-phase')
        .send({
          new_phase: 'planning',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Project not found');
    });

    it('should return 400 for invalid phase transition', async () => {
      mockProjectService.transitionPhase.mockRejectedValue(
        new Error(
          'Cannot skip from initiation to execution. Must transition through intermediate phases.'
        )
      );

      const response = await request(app)
        .post('/api/v1/projects/project-123/transition-phase')
        .send({
          new_phase: 'execution',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot skip');
    });

    it('should allow backward phase transition', async () => {
      const projectInExecution = {
        ...mockProject,
        lifecyclePhase: LifecyclePhase.EXECUTION,
      };
      const transitionedProject = {
        ...projectInExecution,
        lifecyclePhase: LifecyclePhase.PLANNING,
      };
      mockProjectService.transitionPhase.mockResolvedValue(transitionedProject);

      const response = await request(app)
        .post('/api/v1/projects/project-123/transition-phase')
        .send({
          new_phase: 'planning',
        });

      expect(response.status).toBe(200);
      expect(response.body.project.lifecycle_phase).toBe('planning');
    });

    it('should allow staying in the same phase', async () => {
      mockProjectService.transitionPhase.mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/v1/projects/project-123/transition-phase')
        .send({
          new_phase: 'initiation',
        });

      expect(response.status).toBe(200);
      expect(response.body.project.lifecycle_phase).toBe('initiation');
    });
  });
});
