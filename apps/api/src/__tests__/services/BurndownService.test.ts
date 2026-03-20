import { AppDataSource } from '../../config/data-source';
import { BurndownService } from '../../services/BurndownService';
import { Sprint, SprintStatus } from '../../entities/Sprint';
import { Project, ProjectStatus } from '../../entities/Project';
import { User } from '../../entities/User';
import { WorkPackage, WorkPackageType } from '../../entities/WorkPackage';
import { SprintBurndown } from '../../entities/SprintBurndown';

describe('BurndownService', () => {
  let burndownService: BurndownService;
  let testUser: User;
  let testProject: Project;
  let testSprint: Sprint;

  beforeEach(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    burndownService = new BurndownService();

    // Create test user
    const userRepo = AppDataSource.getRepository(User);
    testUser = userRepo.create({
      email: 'burndown@test.com',
      passwordHash: 'hash',
      name: 'Burndown Test User',
    });
    await userRepo.save(testUser);

    // Create test project
    const projectRepo = AppDataSource.getRepository(Project);
    testProject = projectRepo.create({
      name: 'Burndown Test Project',
      ownerId: testUser.id,
      status: ProjectStatus.ACTIVE,
    });
    await projectRepo.save(testProject);

    // Create test sprint
    const sprintRepo = AppDataSource.getRepository(Sprint);
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-14');
    testSprint = sprintRepo.create({
      projectId: testProject.id,
      name: 'Test Sprint',
      status: SprintStatus.ACTIVE,
      startDate,
      endDate,
    });
    await sprintRepo.save(testSprint);
  });

  afterEach(async () => {
    // Clean up test data
    const burndownRepo = AppDataSource.getRepository(SprintBurndown);
    await burndownRepo.delete({ sprintId: testSprint.id });

    const wpRepo = AppDataSource.getRepository(WorkPackage);
    await wpRepo.delete({ projectId: testProject.id });

    const sprintRepo = AppDataSource.getRepository(Sprint);
    await sprintRepo.delete({ id: testSprint.id });

    const projectRepo = AppDataSource.getRepository(Project);
    await projectRepo.delete({ id: testProject.id });

    const userRepo = AppDataSource.getRepository(User);
    await userRepo.delete({ id: testUser.id });
  });

  describe('recordBurndownSnapshot', () => {
    it('should record a burndown snapshot for a sprint', async () => {
      // Create work packages with story points
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp1 = wpRepo.create({
        projectId: testProject.id,
        sprintId: testSprint.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 1',
        status: 'in_progress',
        storyPoints: 5,
        progressPercent: 0,
      });
      const wp2 = wpRepo.create({
        projectId: testProject.id,
        sprintId: testSprint.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 2',
        status: 'done',
        storyPoints: 3,
        progressPercent: 100,
      });
      await wpRepo.save([wp1, wp2]);

      const snapshot = await burndownService.recordBurndownSnapshot(testSprint.id);

      expect(snapshot).toBeDefined();
      expect(snapshot.sprintId).toBe(testSprint.id);
      expect(snapshot.totalStoryPoints).toBe(8);
      expect(snapshot.completedStoryPoints).toBe(3);
      expect(snapshot.remainingStoryPoints).toBe(5);
    });

    it('should update existing snapshot for the same date', async () => {
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp = wpRepo.create({
        projectId: testProject.id,
        sprintId: testSprint.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature',
        status: 'in_progress',
        storyPoints: 5,
        progressPercent: 0,
      });
      await wpRepo.save(wp);

      // Record first snapshot
      const snapshot1 = await burndownService.recordBurndownSnapshot(testSprint.id);
      expect(snapshot1.remainingStoryPoints).toBe(5);

      // Complete the work package
      wp.progressPercent = 100;
      await wpRepo.save(wp);

      // Record second snapshot for same date
      const snapshot2 = await burndownService.recordBurndownSnapshot(testSprint.id);
      expect(snapshot2.id).toBe(snapshot1.id);
      expect(snapshot2.remainingStoryPoints).toBe(0);
      expect(snapshot2.completedStoryPoints).toBe(5);
    });

    it('should throw error for non-existent sprint', async () => {
      await expect(
        burndownService.recordBurndownSnapshot('non-existent-id')
      ).rejects.toThrow('Sprint not found');
    });
  });

  describe('getSprintBurndown', () => {
    it('should return burndown chart data with ideal line', async () => {
      // Create work packages
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp1 = wpRepo.create({
        projectId: testProject.id,
        sprintId: testSprint.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 1',
        status: 'in_progress',
        storyPoints: 10,
        progressPercent: 0,
      });
      await wpRepo.save(wp1);

      // Record snapshot
      await burndownService.recordBurndownSnapshot(testSprint.id);

      const burndown = await burndownService.getSprintBurndown(testSprint.id);

      expect(burndown).toBeDefined();
      expect(burndown.sprintId).toBe(testSprint.id);
      expect(burndown.sprintName).toBe('Test Sprint');
      expect(burndown.totalStoryPoints).toBe(10);
      expect(burndown.dataPoints.length).toBeGreaterThan(0);

      // Check first data point
      const firstPoint = burndown.dataPoints[0];
      expect(firstPoint.remaining).toBe(10);
      expect(firstPoint.completed).toBe(0);
      expect(firstPoint.ideal).toBe(10);

      // Check last data point has ideal = 0
      const lastPoint = burndown.dataPoints[burndown.dataPoints.length - 1];
      expect(lastPoint.ideal).toBe(0);
    });

    it('should create snapshot if none exists', async () => {
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp = wpRepo.create({
        projectId: testProject.id,
        sprintId: testSprint.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature',
        status: 'in_progress',
        storyPoints: 5,
        progressPercent: 0,
      });
      await wpRepo.save(wp);

      const burndown = await burndownService.getSprintBurndown(testSprint.id);

      expect(burndown).toBeDefined();
      expect(burndown.totalStoryPoints).toBe(5);

      // Verify snapshot was created
      const burndownRepo = AppDataSource.getRepository(SprintBurndown);
      const snapshots = await burndownRepo.find({ where: { sprintId: testSprint.id } });
      expect(snapshots.length).toBe(1);
    });

    it('should throw error for non-existent sprint', async () => {
      await expect(
        burndownService.getSprintBurndown('non-existent-id')
      ).rejects.toThrow('Sprint not found');
    });
  });

  describe('getReleaseBurndown', () => {
    it('should return release burndown data for a project', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');

      // Create work packages with due dates
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp1 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 1',
        status: 'done',
        storyPoints: 5,
        progressPercent: 100,
        dueDate: new Date('2024-01-05'),
      });
      const wp2 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 2',
        status: 'in_progress',
        storyPoints: 8,
        progressPercent: 50,
        dueDate: new Date('2024-01-08'),
      });
      await wpRepo.save([wp1, wp2]);

      const burndown = await burndownService.getReleaseBurndown(testProject.id, {
        startDate,
        endDate,
      });

      expect(burndown).toBeDefined();
      expect(burndown.totalStoryPoints).toBe(13);
      expect(burndown.dataPoints.length).toBeGreaterThan(0);
    });

    it('should filter by version ID', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      const versionId = 'version-1';

      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp = wpRepo.create({
        projectId: testProject.id,
        versionId,
        type: WorkPackageType.FEATURE,
        subject: 'Feature',
        status: 'in_progress',
        storyPoints: 5,
        progressPercent: 0,
        dueDate: new Date('2024-01-05'),
      });
      await wpRepo.save(wp);

      const burndown = await burndownService.getReleaseBurndown(testProject.id, {
        versionId,
        startDate,
        endDate,
      });

      expect(burndown).toBeDefined();
      expect(burndown.totalStoryPoints).toBe(5);
    });
  });

  describe('recordDailySnapshots', () => {
    it('should record snapshots for all active sprints', async () => {
      // Create another active sprint
      const sprintRepo = AppDataSource.getRepository(Sprint);
      const sprint2 = sprintRepo.create({
        projectId: testProject.id,
        name: 'Sprint 2',
        status: SprintStatus.ACTIVE,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });
      await sprintRepo.save(sprint2);

      // Create work packages for both sprints
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp1 = wpRepo.create({
        projectId: testProject.id,
        sprintId: testSprint.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 1',
        status: 'in_progress',
        storyPoints: 5,
        progressPercent: 0,
      });
      const wp2 = wpRepo.create({
        projectId: testProject.id,
        sprintId: sprint2.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 2',
        status: 'in_progress',
        storyPoints: 3,
        progressPercent: 0,
      });
      await wpRepo.save([wp1, wp2]);

      await burndownService.recordDailySnapshots();

      // Verify snapshots were created
      const burndownRepo = AppDataSource.getRepository(SprintBurndown);
      const snapshots1 = await burndownRepo.find({ where: { sprintId: testSprint.id } });
      const snapshots2 = await burndownRepo.find({ where: { sprintId: sprint2.id } });

      expect(snapshots1.length).toBe(1);
      expect(snapshots2.length).toBe(1);

      // Clean up
      await sprintRepo.delete({ id: sprint2.id });
    });
  });
});
