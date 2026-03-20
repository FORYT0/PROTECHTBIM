import request from 'supertest';
import express, { Express } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { WorkPackage, WorkPackageType } from '../../entities/WorkPackage';
import { WorkPackageWatcher } from '../../entities/WorkPackageWatcher';
import { createWorkPackageRouter } from '../../routes/work-packages.routes';
import { createAuthService } from '../../middleware/auth.middleware';
import { hashPassword } from '@protecht-bim/shared-utils';

describe('Work Package Watchers Integration Tests', () => {
  let app: Express;
  let authToken: string;
  let testUser: User;
  let testUser2: User;
  let testProject: Project;
  let testWorkPackage: WorkPackage;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Set up Express app
    app = express();
    app.use(express.json());
    app.use('/api/v1/work_packages', createWorkPackageRouter());
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Create test users
    const userRepository = AppDataSource.getRepository(User);
    const authService = createAuthService();

    testUser = await userRepository.save({
      email: `test-watcher-${Date.now()}@example.com`,
      name: 'Test Watcher User',
      passwordHash: await hashPassword('password123'),
      status: 'active',
      currency: 'USD',
    });

    testUser2 = await userRepository.save({
      email: `test-watcher-2-${Date.now()}@example.com`,
      name: 'Test Watcher User 2',
      passwordHash: await hashPassword('password123'),
      status: 'active',
      currency: 'USD',
    });

    // Generate auth token
    const tokens = authService.generateTokens(testUser);
    authToken = tokens.accessToken;

    // Create test project
    const projectRepository = AppDataSource.getRepository(Project);
    testProject = await projectRepository.save(
      projectRepository.create({
        name: 'Test Watcher Project',
        ownerId: testUser.id,
        status: ProjectStatus.ACTIVE,
        lifecyclePhase: LifecyclePhase.PLANNING,
      })
    );

    // Create test work package
    const workPackageRepository = AppDataSource.getRepository(WorkPackage);
    testWorkPackage = await workPackageRepository.save(
      workPackageRepository.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Test Work Package for Watchers',
        status: 'new',
      })
    );
  });

  afterEach(async () => {
    // Clean up test data - be defensive about undefined values
    if (testWorkPackage?.id) {
      const watcherRepository = AppDataSource.getRepository(WorkPackageWatcher);
      await watcherRepository.delete({ workPackageId: testWorkPackage.id });

      const workPackageRepository = AppDataSource.getRepository(WorkPackage);
      await workPackageRepository.delete({ id: testWorkPackage.id });
    }

    if (testProject?.id) {
      const projectRepository = AppDataSource.getRepository(Project);
      await projectRepository.delete({ id: testProject.id });
    }

    if (testUser?.id) {
      const userRepository = AppDataSource.getRepository(User);
      await userRepository.delete({ id: testUser.id });
    }

    if (testUser2?.id) {
      const userRepository = AppDataSource.getRepository(User);
      await userRepository.delete({ id: testUser2.id });
    }
  });

  describe('POST /api/v1/work_packages/:id/watchers', () => {
    it('should add a watcher to a work package', async () => {
      const response = await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: testUser2.id })
        .expect(201);

      expect(response.body.watcher).toBeDefined();
      expect(response.body.watcher.work_package_id).toBe(testWorkPackage.id);
      expect(response.body.watcher.user_id).toBe(testUser2.id);
      expect(response.body.watcher.user).toBeDefined();
      expect(response.body.watcher.user.email).toBe(testUser2.email);
      expect(response.body.watcher.created_at).toBeDefined();
    });

    it('should return 400 when user_id is missing', async () => {
      const response = await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('user_id is required');
    });

    it('should return 404 when work package does not exist', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .post(`/api/v1/work_packages/${nonExistentId}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: testUser2.id })
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Work package not found');
    });

    it('should return 404 when user does not exist', async () => {
      const nonExistentUserId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: nonExistentUserId })
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('User not found');
    });

    it('should return 409 when user is already watching', async () => {
      // Add watcher first time
      await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: testUser2.id })
        .expect(201);

      // Try to add same watcher again
      const response = await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: testUser2.id })
        .expect(409);

      expect(response.body.error).toBe('Conflict');
      expect(response.body.message).toBe('User is already watching this work package');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .send({ user_id: testUser2.id })
        .expect(401);
    });
  });

  describe('GET /api/v1/work_packages/:id/watchers', () => {
    it('should list all watchers for a work package', async () => {
      // Add watchers
      await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: testUser.id })
        .expect(201);

      await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: testUser2.id })
        .expect(201);

      // List watchers
      const response = await request(app)
        .get(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.watchers).toBeDefined();
      expect(response.body.watchers).toHaveLength(2);
      expect(response.body.watchers[0].work_package_id).toBe(testWorkPackage.id);
      expect(response.body.watchers[0].user).toBeDefined();
    });

    it('should return empty array when no watchers exist', async () => {
      const response = await request(app)
        .get(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.watchers).toEqual([]);
    });

    it('should return 404 when work package does not exist', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .get(`/api/v1/work_packages/${nonExistentId}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Work package not found');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .expect(401);
    });
  });

  describe('DELETE /api/v1/work_packages/:id/watchers/:user_id', () => {
    it('should remove a watcher from a work package', async () => {
      // Add watcher first
      await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: testUser2.id })
        .expect(201);

      // Remove watcher
      await request(app)
        .delete(`/api/v1/work_packages/${testWorkPackage.id}/watchers/${testUser2.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify watcher was removed
      const response = await request(app)
        .get(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.watchers).toHaveLength(0);
    });

    it('should return 404 when work package does not exist', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .delete(`/api/v1/work_packages/${nonExistentId}/watchers/${testUser2.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Work package not found');
    });

    it('should return 404 when user is not watching', async () => {
      const response = await request(app)
        .delete(`/api/v1/work_packages/${testWorkPackage.id}/watchers/${testUser2.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('User is not watching this work package');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .delete(`/api/v1/work_packages/${testWorkPackage.id}/watchers/${testUser2.id}`)
        .expect(401);
    });
  });

  describe('Work Package GET endpoints should include watchers', () => {
    it('should include watchers in work package details', async () => {
      // Add watcher
      await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: testUser2.id })
        .expect(201);

      // Get work package details
      const response = await request(app)
        .get(`/api/v1/work_packages/${testWorkPackage.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.work_package.watchers).toBeDefined();
      expect(response.body.work_package.watchers).toHaveLength(1);
      expect(response.body.work_package.watchers[0].user_id).toBe(testUser2.id);
    });

    it('should include watchers in work package list', async () => {
      // Add watcher
      await request(app)
        .post(`/api/v1/work_packages/${testWorkPackage.id}/watchers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: testUser2.id })
        .expect(201);

      // List work packages
      const response = await request(app)
        .get(`/api/v1/work_packages?project_id=${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.work_packages).toHaveLength(1);
      expect(response.body.work_packages[0].watchers).toBeDefined();
      expect(response.body.work_packages[0].watchers).toHaveLength(1);
      expect(response.body.work_packages[0].watchers[0].user_id).toBe(testUser2.id);
    });
  });
});
