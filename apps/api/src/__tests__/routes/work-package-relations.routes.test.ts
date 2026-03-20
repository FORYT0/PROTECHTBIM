import request from 'supertest';
import express, { Express } from 'express';
import {
  createWorkPackageRelationRouter,
  createRelationRouter,
} from '../../routes/work-package-relations.routes';
import { WorkPackageRelationService } from '../../services/WorkPackageRelationService';
import { WorkPackageRelation, RelationType } from '../../entities/WorkPackageRelation';
import { WorkPackage, WorkPackageType, Priority, SchedulingMode } from '../../entities/WorkPackage';

// Mock the auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateToken: () => (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-123' };
    next();
  },
  createAuthService: jest.fn(),
}));

describe('Work Package Relation Routes', () => {
  let app: Express;
  let mockRelationService: jest.Mocked<WorkPackageRelationService>;

  const mockWorkPackage1: Partial<WorkPackage> = {
    id: 'wp-1',
    projectId: 'project-123',
    type: WorkPackageType.TASK,
    subject: 'Task 1',
    status: 'new',
    priority: Priority.NORMAL,
    spentHours: 0,
    progressPercent: 0,
    schedulingMode: SchedulingMode.MANUAL,
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWorkPackage2: Partial<WorkPackage> = {
    id: 'wp-2',
    projectId: 'project-123',
    type: WorkPackageType.TASK,
    subject: 'Task 2',
    status: 'new',
    priority: Priority.NORMAL,
    spentHours: 0,
    progressPercent: 0,
    schedulingMode: SchedulingMode.MANUAL,
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRelation: WorkPackageRelation = {
    id: 'rel-123',
    fromId: 'wp-1',
    toId: 'wp-2',
    relationType: RelationType.SUCCESSOR,
    lagDays: 0,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    from: mockWorkPackage1 as WorkPackage,
    to: mockWorkPackage2 as WorkPackage,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock service
    mockRelationService = {
      createRelation: jest.fn(),
      getRelationById: jest.fn(),
      getRelationsByWorkPackageId: jest.fn(),
      deleteRelation: jest.fn(),
      detectCircularDependencies: jest.fn(),
    } as any;

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/work_packages', createWorkPackageRelationRouter(mockRelationService));
    app.use('/api/v1/work_package_relations', createRelationRouter(mockRelationService));
  });

  describe('POST /api/v1/work_packages/:id/relations', () => {
    it('should create a new relation', async () => {
      mockRelationService.createRelation.mockResolvedValue(mockRelation);

      const response = await request(app)
        .post('/api/v1/work_packages/wp-1/relations')
        .send({
          to_id: 'wp-2',
          relation_type: RelationType.SUCCESSOR,
          lag_days: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('relation');
      expect(response.body.relation).toMatchObject({
        id: 'rel-123',
        from_id: 'wp-1',
        to_id: 'wp-2',
        relation_type: RelationType.SUCCESSOR,
        lag_days: 0,
      });

      expect(mockRelationService.createRelation).toHaveBeenCalledWith({
        fromId: 'wp-1',
        toId: 'wp-2',
        relationType: RelationType.SUCCESSOR,
        lagDays: 0,
      });
    });

    it('should create a relation with lag days', async () => {
      const relationWithLag = {
        ...mockRelation,
        lagDays: 5,
      };
      mockRelationService.createRelation.mockResolvedValue(relationWithLag);

      const response = await request(app)
        .post('/api/v1/work_packages/wp-1/relations')
        .send({
          to_id: 'wp-2',
          relation_type: RelationType.PREDECESSOR,
          lag_days: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body.relation.lag_days).toBe(5);
    });

    it('should return 400 if to_id is missing', async () => {
      const response = await request(app)
        .post('/api/v1/work_packages/wp-1/relations')
        .send({
          relation_type: RelationType.SUCCESSOR,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('to_id is required');
    });

    it('should return 400 if relation_type is missing', async () => {
      const response = await request(app)
        .post('/api/v1/work_packages/wp-1/relations')
        .send({
          to_id: 'wp-2',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('relation_type is required');
    });

    it('should return 400 if relation_type is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/work_packages/wp-1/relations')
        .send({
          to_id: 'wp-2',
          relation_type: 'invalid_type',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid relation_type');
    });

    it('should return 404 if work package not found', async () => {
      mockRelationService.createRelation.mockRejectedValue(
        new Error('From work package not found')
      );

      const response = await request(app)
        .post('/api/v1/work_packages/wp-999/relations')
        .send({
          to_id: 'wp-2',
          relation_type: RelationType.SUCCESSOR,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('From work package not found');
    });

    it('should return 409 if circular dependency detected', async () => {
      mockRelationService.createRelation.mockRejectedValue(
        new Error('Creating this relation would create a circular dependency')
      );

      const response = await request(app)
        .post('/api/v1/work_packages/wp-1/relations')
        .send({
          to_id: 'wp-2',
          relation_type: RelationType.SUCCESSOR,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'Creating this relation would create a circular dependency'
      );
    });

    it('should return 400 if relation already exists', async () => {
      mockRelationService.createRelation.mockRejectedValue(
        new Error('Relation already exists between these work packages')
      );

      const response = await request(app)
        .post('/api/v1/work_packages/wp-1/relations')
        .send({
          to_id: 'wp-2',
          relation_type: RelationType.SUCCESSOR,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Relation already exists between these work packages');
    });
  });

  describe('GET /api/v1/work_packages/:id/relations', () => {
    it('should list all relations for a work package', async () => {
      const relations = [mockRelation];
      mockRelationService.getRelationsByWorkPackageId.mockResolvedValue(relations);

      const response = await request(app).get('/api/v1/work_packages/wp-1/relations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('relations');
      expect(response.body.relations).toHaveLength(1);
      expect(response.body.relations[0]).toMatchObject({
        id: 'rel-123',
        from_id: 'wp-1',
        to_id: 'wp-2',
        relation_type: RelationType.SUCCESSOR,
        lag_days: 0,
      });

      expect(mockRelationService.getRelationsByWorkPackageId).toHaveBeenCalledWith('wp-1');
    });

    it('should include work package details in relations', async () => {
      const relations = [mockRelation];
      mockRelationService.getRelationsByWorkPackageId.mockResolvedValue(relations);

      const response = await request(app).get('/api/v1/work_packages/wp-1/relations');

      expect(response.status).toBe(200);
      expect(response.body.relations[0]).toHaveProperty('from');
      expect(response.body.relations[0].from).toMatchObject({
        id: 'wp-1',
        subject: 'Task 1',
        type: WorkPackageType.TASK,
        status: 'new',
      });
      expect(response.body.relations[0]).toHaveProperty('to');
      expect(response.body.relations[0].to).toMatchObject({
        id: 'wp-2',
        subject: 'Task 2',
        type: WorkPackageType.TASK,
        status: 'new',
      });
    });

    it('should return empty array if no relations exist', async () => {
      mockRelationService.getRelationsByWorkPackageId.mockResolvedValue([]);

      const response = await request(app).get('/api/v1/work_packages/wp-1/relations');

      expect(response.status).toBe(200);
      expect(response.body.relations).toHaveLength(0);
    });

    it('should return 404 if work package not found', async () => {
      mockRelationService.getRelationsByWorkPackageId.mockRejectedValue(
        new Error('Work package not found')
      );

      const response = await request(app).get('/api/v1/work_packages/wp-999/relations');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Work package not found');
    });
  });

  describe('DELETE /api/v1/work_package_relations/:id', () => {
    it('should delete a relation', async () => {
      mockRelationService.deleteRelation.mockResolvedValue(true);

      const response = await request(app).delete('/api/v1/work_package_relations/rel-123');

      expect(response.status).toBe(204);
      expect(mockRelationService.deleteRelation).toHaveBeenCalledWith('rel-123');
    });

    it('should return 404 if relation not found', async () => {
      mockRelationService.deleteRelation.mockRejectedValue(new Error('Relation not found'));

      const response = await request(app).delete('/api/v1/work_package_relations/rel-999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Relation not found');
    });
  });

  describe('Relation Types', () => {
    it('should support all relation types', async () => {
      const relationTypes = [
        RelationType.SUCCESSOR,
        RelationType.PREDECESSOR,
        RelationType.BLOCKS,
        RelationType.BLOCKED_BY,
        RelationType.RELATES_TO,
        RelationType.DUPLICATES,
      ];

      for (const relationType of relationTypes) {
        const relation = { ...mockRelation, relationType };
        mockRelationService.createRelation.mockResolvedValue(relation);

        const response = await request(app)
          .post('/api/v1/work_packages/wp-1/relations')
          .send({
            to_id: 'wp-2',
            relation_type: relationType,
          });

        expect(response.status).toBe(201);
        expect(response.body.relation.relation_type).toBe(relationType);
      }
    });
  });
});
