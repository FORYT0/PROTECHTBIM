import { AppDataSource } from '../config/data-source';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { ActivityLog, ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
import { User } from '../entities/User';
import { Project } from '../entities/Project';
import { WorkPackage } from '../entities/WorkPackage';

describe('ActivityLogRepository API Tests', () => {
  let repository: ActivityLogRepository;
  let testUser: User;
  let testProject: Project;
  let testWorkPackage: WorkPackage;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    repository = new ActivityLogRepository();
  });

  beforeEach(async () => {
    // Create test user
    const userRepository = AppDataSource.getRepository(User);
    testUser = await userRepository.save({
      email: `activity-test-user-${Date.now()}@test.com`,
      name: 'Activity Test User',
      password: 'hashedpassword',
    });

    // Create test project
    const projectRepository = AppDataSource.getRepository(Project);
    testProject = await projectRepository.save({
      name: 'Activity Test Project',
      description: 'For testing activity logging',
      status: 'active',
      lifecyclePhase: 'planning',
    });

    // Create test work package
    const wpRepository = AppDataSource.getRepository(WorkPackage);
    testWorkPackage = await wpRepository.save({
      projectId: testProject.id,
      subject: 'Activity Test WP',
      description: 'Test work package',
      type: 'task',
      status: 'new',
      priority: 'normal',
      schedulingMode: 'manual',
    });
  });

  afterEach(async () => {
    // Clean up
    const activityRepository = AppDataSource.getRepository(ActivityLog);
    const wpRepository = AppDataSource.getRepository(WorkPackage);
    const projectRepository = AppDataSource.getRepository(Project);
    const userRepository = AppDataSource.getRepository(User);

    if (testWorkPackage?.id) {
      await wpRepository.delete(testWorkPackage.id);
    }
    if (testProject?.id) {
      await projectRepository.delete(testProject.id);
    }
    if (testUser?.id) {
      await userRepository.delete(testUser.id);
    }
    await activityRepository.delete({ projectId: testProject?.id });
  });

  describe('Activity Creation', () => {
    it('should create an activity log entry', async () => {
      const activity = await repository.create({
        projectId: testProject.id,
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        actionType: ActivityActionType.CREATED,
        entityType: ActivityEntityType.WORK_PACKAGE,
        entityId: testWorkPackage.id,
        description: 'Created work package',
        metadata: { subject: 'Activity Test WP' },
      });

      expect(activity).toBeDefined();
      expect(activity.id).toBeDefined();
      expect(activity.projectId).toBe(testProject.id);
      expect(activity.actionType).toBe(ActivityActionType.CREATED);
    });

    it('should create multiple activity entries', async () => {
      const activities = [];

      for (let i = 0; i < 3; i++) {
        const activity = await repository.create({
          projectId: testProject.id,
          workPackageId: testWorkPackage.id,
          userId: testUser.id,
          actionType: ActivityActionType.UPDATED,
          entityType: ActivityEntityType.WORK_PACKAGE,
          entityId: testWorkPackage.id,
          description: `Updated ${i}`,
        });
        activities.push(activity);
      }

      expect(activities).toHaveLength(3);
      expect(activities.every((a) => a.projectId === testProject.id)).toBe(true);
    });
  });

  describe('Activity Retrieval', () => {
    beforeEach(async () => {
      // Create sample activities
      await repository.create({
        projectId: testProject.id,
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        actionType: ActivityActionType.CREATED,
        entityType: ActivityEntityType.WORK_PACKAGE,
        entityId: testWorkPackage.id,
        description: 'Created work package',
      });

      await repository.create({
        projectId: testProject.id,
        userId: testUser.id,
        actionType: ActivityActionType.UPDATED,
        entityType: ActivityEntityType.PROJECT,
        entityId: testProject.id,
        description: 'Updated project',
      });
    });

    it('should retrieve activities by project', async () => {
      const result = await repository.findProjectActivities(testProject.id);

      expect(result.activities).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(20);
    });

    it('should retrieve activities by user', async () => {
      const result = await repository.findUserActivities(testUser.id);

      expect(result.activities.length).toBeGreaterThanOrEqual(2);
      expect(result.activities.every((a) => a.userId === testUser.id)).toBe(true);
    });

    it('should filter activities by action type', async () => {
      const result = await repository.findProjectActivities(testProject.id, {
        actionType: ActivityActionType.CREATED,
      });

      expect(result.activities.every((a) => a.actionType === ActivityActionType.CREATED)).toBe(true);
    });

    it('should filter activities by entity type', async () => {
      const result = await repository.findProjectActivities(testProject.id, {
        entityType: ActivityEntityType.WORK_PACKAGE,
      });

      expect(result.activities.every((a) => a.entityType === ActivityEntityType.WORK_PACKAGE)).toBe(true);
    });

    it('should support pagination', async () => {
      // Create 25 activities for pagination testing
      for (let i = 0; i < 25; i++) {
        await repository.create({
          projectId: testProject.id,
          userId: testUser.id,
          actionType: ActivityActionType.UPDATED,
          entityType: ActivityEntityType.PROJECT,
          entityId: testProject.id,
          description: `Activity ${i}`,
        });
      }

      const page1 = await repository.findProjectActivities(testProject.id, {
        page: 1,
        perPage: 10,
      });

      const page2 = await repository.findProjectActivities(testProject.id, {
        page: 2,
        perPage: 10,
      });

      expect(page1.activities).toHaveLength(10);
      expect(page2.activities).toHaveLength(10);
      expect(page1.total).toBeGreaterThanOrEqual(27);
      expect(page1.activities[0].id).not.toBe(page2.activities[0].id);
    });

    it('should sort activities by timestamp', async () => {
      const resultAsc = await repository.findProjectActivities(testProject.id, {
        sortOrder: 'ASC',
      });

      const resultDesc = await repository.findProjectActivities(testProject.id, {
        sortOrder: 'DESC',
      });

      if (resultAsc.activities.length > 1 && resultDesc.activities.length > 1) {
        expect(resultAsc.activities[0].createdAt).toEqual(resultDesc.activities[resultDesc.activities.length - 1].createdAt);
      }
    });
  });

  describe('Activity Queries', () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create({
          projectId: testProject.id,
          workPackageId: testWorkPackage.id,
          userId: testUser.id,
          actionType: ActivityActionType.CREATED,
          entityType: ActivityEntityType.WORK_PACKAGE,
          entityId: testWorkPackage.id,
          description: `Activity ${i}`,
        });
      }
    });

    it('should get recent activities', async () => {
      const recent = await repository.findRecentActivities(testProject.id, 3);

      expect(recent).toHaveLength(3);
      expect(recent[0].projectId).toBe(testProject.id);
    });

    it('should count activities in project', async () => {
      const count = await repository.getActivityCount(testProject.id);

      expect(count).toBeGreaterThanOrEqual(5);
    });

    it('should count activities by type', async () => {
      const count = await repository.getActivityCountByType(testProject.id, ActivityActionType.CREATED);

      expect(count).toBeGreaterThanOrEqual(5);
    });

    it('should generate activity summary', async () => {
      const summary = await repository.getActivitySummary(testProject.id, 7);

      expect(summary.total).toBeGreaterThanOrEqual(5);
      expect(summary.byType[ActivityActionType.CREATED]).toBeGreaterThanOrEqual(5);
      expect(summary.byEntity[ActivityEntityType.WORK_PACKAGE]).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Activity Deletion', () => {
    it('should delete an activity', async () => {
      const activity = await repository.create({
        projectId: testProject.id,
        userId: testUser.id,
        actionType: ActivityActionType.CREATED,
        entityType: ActivityEntityType.PROJECT,
        entityId: testProject.id,
        description: 'Test delete',
      });

      const deleted = await repository.delete(activity.id);
      expect(deleted).toBe(true);

      const found = await repository.findById(activity.id);
      expect(found).toBeNull();
    });

    it('should clean up old activities', async () => {
      const activity = await repository.create({
        projectId: testProject.id,
        userId: testUser.id,
        actionType: ActivityActionType.CREATED,
        entityType: ActivityEntityType.PROJECT,
        entityId: testProject.id,
        description: 'Old activity',
      });

      // This won't actually delete since the activity is fresh
      const deleted = await repository.deleteOldActivities(1);
      expect(typeof deleted).toBe('number');
    });
  });

  describe('Activity Filters', () => {
    beforeEach(async () => {
      const actionTypes = [ActivityActionType.CREATED, ActivityActionType.UPDATED, ActivityActionType.DELETED];
      const entityTypes = [ActivityEntityType.WORK_PACKAGE, ActivityEntityType.PROJECT, ActivityEntityType.TIME_ENTRY];

      for (let i = 0; i < 9; i++) {
        await repository.create({
          projectId: testProject.id,
          userId: testUser.id,
          actionType: actionTypes[i % 3],
          entityType: entityTypes[i % 3],
          entityId: testProject.id,
          description: `Filter test ${i}`,
        });
      }
    });

    it('should filter by multiple criteria', async () => {
      const result = await repository.findAll({
        projectId: testProject.id,
        actionType: ActivityActionType.CREATED,
        entityType: ActivityEntityType.WORK_PACKAGE,
      });

      expect(result.activities.every((a) => a.projectId === testProject.id)).toBe(true);
      expect(result.activities.every((a) => a.actionType === ActivityActionType.CREATED)).toBe(true);
      expect(result.activities.every((a) => a.entityType === ActivityEntityType.WORK_PACKAGE)).toBe(true);
    });

    it('should handle date filtering', async () => {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 1);

      const dateTo = new Date();

      const result = await repository.findAll({
        projectId: testProject.id,
        dateFrom,
        dateTo,
      });

      expect(result.activities.length).toBeGreaterThanOrEqual(0);
      expect(result.activities.every((a) => a.createdAt >= dateFrom && a.createdAt <= dateTo)).toBe(true);
    });
  });

  describe('Activity Relations', () => {
    it('should load related entities', async () => {
      const activity = await repository.create({
        projectId: testProject.id,
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        actionType: ActivityActionType.CREATED,
        entityType: ActivityEntityType.WORK_PACKAGE,
        entityId: testWorkPackage.id,
        description: 'Test relations',
      });

      const retrieved = await repository.findById(activity.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.user).toBeDefined();
      expect(retrieved?.user?.id).toBe(testUser.id);
      expect(retrieved?.project).toBeDefined();
      expect(retrieved?.project?.id).toBe(testProject.id);
    });
  });
});
