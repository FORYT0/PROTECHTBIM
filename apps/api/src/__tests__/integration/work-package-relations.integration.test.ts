import request from 'supertest';
import express, { Express } from 'express';
import { AppDataSource, initializeDatabase } from '../../config/data-source';
import { createWorkPackageRouter } from '../../routes/work-packages.routes';
import {
  createWorkPackageRelationRouter,
  createRelationRouter,
} from '../../routes/work-package-relations.routes';
import { User } from '../../entities/User';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { WorkPackage, WorkPackageType, Priority } from '../../entities/WorkPackage';
import { RelationType } from '../../entities/WorkPackageRelation';

// Mock the auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateToken: () => (req: any, _res: any, next: any) => {
    req.user = { userId: 'test-user-id' };
    next();
  },
  createAuthService: jest.fn(),
}));

describe('Work Package Relations Integration Tests', () => {
  let app: Express;
  let testUser: User;
  let testProject: Project;
  let workPackage1: WorkPackage;
  let workPackage2: WorkPackage;
  let workPackage3: WorkPackage;

  beforeAll(async () => {
    // Initialize database
    await initializeDatabase();

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/v1/work_packages', createWorkPackageRouter());
    app.use('/api/v1/work_packages', createWorkPackageRelationRouter());
    app.use('/api/v1/work_package_relations', createRelationRouter());
  });

  beforeEach(async () => {
    // Clean up database
    await AppDataSource.getRepository('WorkPackageRelation').delete({});
    await AppDataSource.getRepository('WorkPackage').delete({});
    await AppDataSource.getRepository('Project').delete({});
    await AppDataSource.getRepository('User').delete({});

    // Create test user
    const userRepo = AppDataSource.getRepository(User);
    testUser = userRepo.create({
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hash',
      status: 'active',
    });
    await userRepo.save(testUser);

    // Create test project
    const projectRepo = AppDataSource.getRepository(Project);
    testProject = projectRepo.create({
      name: 'Test Project',
      description: 'Test Description',
      ownerId: testUser.id,
      status: ProjectStatus.ACTIVE,
      lifecyclePhase: LifecyclePhase.EXECUTION,
    });
    await projectRepo.save(testProject);

    // Create test work packages
    const wpRepo = AppDataSource.getRepository(WorkPackage);

    workPackage1 = wpRepo.create({
      projectId: testProject.id,
      type: WorkPackageType.TASK,
      subject: 'Task 1',
      status: 'new',
      priority: Priority.NORMAL,
    });
    await wpRepo.save(workPackage1);

    workPackage2 = wpRepo.create({
      projectId: testProject.id,
      type: WorkPackageType.TASK,
      subject: 'Task 2',
      status: 'new',
      priority: Priority.NORMAL,
    });
    await wpRepo.save(workPackage2);

    workPackage3 = wpRepo.create({
      projectId: testProject.id,
      type: WorkPackageType.TASK,
      subject: 'Task 3',
      status: 'new',
      priority: Priority.NORMAL,
    });
    await wpRepo.save(workPackage3);
  });

  afterAll(async () => {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('Complete Relation Workflow', () => {
    it('should create, list, and delete relations', async () => {
      // Create a relation
      const createResponse = await request(app)
        .post(`/api/v1/work_packages/${workPackage1.id}/relations`)
        .send({
          to_id: workPackage2.id,
          relation_type: RelationType.SUCCESSOR,
          lag_days: 2,
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.relation).toMatchObject({
        from_id: workPackage1.id,
        to_id: workPackage2.id,
        relation_type: RelationType.SUCCESSOR,
        lag_days: 2,
      });

      const relationId = createResponse.body.relation.id;

      // List relations for work package 1
      const listResponse1 = await request(app).get(
        `/api/v1/work_packages/${workPackage1.id}/relations`
      );

      expect(listResponse1.status).toBe(200);
      expect(listResponse1.body.relations).toHaveLength(1);
      expect(listResponse1.body.relations[0].from.subject).toBe('Task 1');
      expect(listResponse1.body.relations[0].to.subject).toBe('Task 2');

      // List relations for work package 2 (should also show the relation)
      const listResponse2 = await request(app).get(
        `/api/v1/work_packages/${workPackage2.id}/relations`
      );

      expect(listResponse2.status).toBe(200);
      expect(listResponse2.body.relations).toHaveLength(1);

      // Delete the relation
      const deleteResponse = await request(app).delete(
        `/api/v1/work_package_relations/${relationId}`
      );

      expect(deleteResponse.status).toBe(204);

      // Verify relation is deleted
      const listAfterDelete = await request(app).get(
        `/api/v1/work_packages/${workPackage1.id}/relations`
      );

      expect(listAfterDelete.status).toBe(200);
      expect(listAfterDelete.body.relations).toHaveLength(0);
    });

    it('should prevent circular dependencies', async () => {
      // Create relation: wp1 -> wp2
      await request(app)
        .post(`/api/v1/work_packages/${workPackage1.id}/relations`)
        .send({
          to_id: workPackage2.id,
          relation_type: RelationType.SUCCESSOR,
        });

      // Create relation: wp2 -> wp3
      await request(app)
        .post(`/api/v1/work_packages/${workPackage2.id}/relations`)
        .send({
          to_id: workPackage3.id,
          relation_type: RelationType.SUCCESSOR,
        });

      // Try to create relation: wp3 -> wp1 (would create cycle)
      const response = await request(app)
        .post(`/api/v1/work_packages/${workPackage3.id}/relations`)
        .send({
          to_id: workPackage1.id,
          relation_type: RelationType.SUCCESSOR,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'Creating this relation would create a circular dependency'
      );
    });

    it('should allow multiple relation types between work packages', async () => {
      // Create SUCCESSOR relation
      const response1 = await request(app)
        .post(`/api/v1/work_packages/${workPackage1.id}/relations`)
        .send({
          to_id: workPackage2.id,
          relation_type: RelationType.SUCCESSOR,
        });

      expect(response1.status).toBe(201);

      // Create RELATES_TO relation (different type, should be allowed)
      const response2 = await request(app)
        .post(`/api/v1/work_packages/${workPackage1.id}/relations`)
        .send({
          to_id: workPackage2.id,
          relation_type: RelationType.RELATES_TO,
        });

      expect(response2.status).toBe(201);

      // List relations
      const listResponse = await request(app).get(
        `/api/v1/work_packages/${workPackage1.id}/relations`
      );

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.relations).toHaveLength(2);
    });

    it('should prevent duplicate relations of the same type', async () => {
      // Create relation
      const response1 = await request(app)
        .post(`/api/v1/work_packages/${workPackage1.id}/relations`)
        .send({
          to_id: workPackage2.id,
          relation_type: RelationType.SUCCESSOR,
        });

      expect(response1.status).toBe(201);

      // Try to create the same relation again
      const response2 = await request(app)
        .post(`/api/v1/work_packages/${workPackage1.id}/relations`)
        .send({
          to_id: workPackage2.id,
          relation_type: RelationType.SUCCESSOR,
        });

      expect(response2.status).toBe(400);
      expect(response2.body.message).toBe('Relation already exists between these work packages');
    });

    it('should support all relation types', async () => {
      const relationTypes = [
        RelationType.SUCCESSOR,
        RelationType.PREDECESSOR,
        RelationType.BLOCKS,
        RelationType.BLOCKED_BY,
        RelationType.RELATES_TO,
        RelationType.DUPLICATES,
      ];

      for (let i = 0; i < relationTypes.length; i++) {
        const relationType = relationTypes[i];

        // Create a new work package for each relation to avoid conflicts
        const wpRepo = AppDataSource.getRepository(WorkPackage);
        const newWp = wpRepo.create({
          projectId: testProject.id,
          type: WorkPackageType.TASK,
          subject: `Task ${i + 10}`,
          status: 'new',
          priority: Priority.NORMAL,
        });
        await wpRepo.save(newWp);

        const response = await request(app)
          .post(`/api/v1/work_packages/${workPackage1.id}/relations`)
          .send({
            to_id: newWp.id,
            relation_type: relationType,
          });

        expect(response.status).toBe(201);
        expect(response.body.relation.relation_type).toBe(relationType);
      }
    });
  });
});
