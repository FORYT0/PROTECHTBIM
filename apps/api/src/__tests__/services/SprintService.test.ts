import { AppDataSource } from '../../config/data-source';
import { SprintService } from '../../services/SprintService';
import { Sprint, SprintStatus } from '../../entities/Sprint';
import { Project, ProjectStatus } from '../../entities/Project';
import { User } from '../../entities/User';
import { WorkPackage, WorkPackageType } from '../../entities/WorkPackage';

describe('SprintService', () => {
  let sprintService: SprintService;
  let testUser: User;
  let testProject: Project;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    sprintService = new SprintService();

    // Create test user
    const userRepo = AppDataSource.getRepository(User);
    testUser = userRepo.create({
      email: 'sprint@test.com',
      passwordHash: 'hash',
      name: 'Sprint Test User',
    });
    await userRepo.save(testUser);

    // Create test project
    const projectRepo = AppDataSource.getRepository(Project);
    testProject = projectRepo.create({
      name: 'Sprint Test Project',
      ownerId: testUser.id,
      status: ProjectStatus.ACTIVE,
    });
    await projectRepo.save(testProject);
  });

  afterEach(async () => {
    // Clean up sprints and work packages
    const sprintRepo = AppDataSource.getRepository(Sprint);
    await sprintRepo.delete({ projectId: testProject.id });

    const wpRepo = AppDataSource.getRepository(WorkPackage);
    await wpRepo.delete({ projectId: testProject.id });
  });

  afterAll(async () => {
    // Clean up test data
    const projectRepo = AppDataSource.getRepository(Project);
    await projectRepo.delete({ id: testProject.id });

    const userRepo = AppDataSource.getRepository(User);
    await userRepo.delete({ id: testUser.id });

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('createSprint', () => {
    it('should create a sprint successfully', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        description: 'First sprint',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
        capacity: 40,
      });

      expect(sprint).toBeDefined();
      expect(sprint.id).toBeDefined();
      expect(sprint.name).toBe('Sprint 1');
      expect(sprint.description).toBe('First sprint');
      expect(sprint.status).toBe(SprintStatus.PLANNED);
      expect(sprint.capacity).toBe(40);
      expect(sprint.projectId).toBe(testProject.id);
    });

    it('should throw error if project does not exist', async () => {
      await expect(
        sprintService.createSprint({
          projectId: '00000000-0000-0000-0000-000000000000',
          name: 'Sprint 1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-14'),
        })
      ).rejects.toThrow('Project not found');
    });

    it('should throw error if end date is before start date', async () => {
      await expect(
        sprintService.createSprint({
          projectId: testProject.id,
          name: 'Sprint 1',
          startDate: new Date('2024-01-14'),
          endDate: new Date('2024-01-01'),
        })
      ).rejects.toThrow('End date must be after start date');
    });
  });

  describe('listSprints', () => {
    beforeEach(async () => {
      // Create test sprints
      await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      const sprint2 = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 2',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-28'),
      });

      // Update sprint 2 to active
      await sprintService.updateSprint(sprint2.id, {
        status: SprintStatus.ACTIVE,
      });
    });

    it('should list all sprints for a project', async () => {
      const { sprints, total } = await sprintService.listSprints(testProject.id);

      expect(sprints).toHaveLength(2);
      expect(total).toBe(2);
      // Should be ordered by start_date DESC
      expect(sprints[0].name).toBe('Sprint 2');
      expect(sprints[1].name).toBe('Sprint 1');
    });

    it('should filter sprints by status', async () => {
      const { sprints, total } = await sprintService.listSprints(testProject.id, {
        status: SprintStatus.ACTIVE,
      });

      expect(sprints).toHaveLength(1);
      expect(total).toBe(1);
      expect(sprints[0].name).toBe('Sprint 2');
      expect(sprints[0].status).toBe(SprintStatus.ACTIVE);
    });

    it('should support pagination', async () => {
      const { sprints, total } = await sprintService.listSprints(testProject.id, {
        page: 1,
        perPage: 1,
      });

      expect(sprints).toHaveLength(1);
      expect(total).toBe(2);
      expect(sprints[0].name).toBe('Sprint 2');
    });

    it('should throw error if project does not exist', async () => {
      await expect(sprintService.listSprints('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('getSprintById', () => {
    it('should get a sprint by ID', async () => {
      const created = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      const sprint = await sprintService.getSprintById(created.id);

      expect(sprint).toBeDefined();
      expect(sprint?.id).toBe(created.id);
      expect(sprint?.name).toBe('Sprint 1');
    });

    it('should return null if sprint does not exist', async () => {
      const sprint = await sprintService.getSprintById('00000000-0000-0000-0000-000000000000');

      expect(sprint).toBeNull();
    });
  });

  describe('getSprintWithStats', () => {
    it('should get sprint with work packages and calculate story points', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      // Create work packages with story points
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp1 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'new',
        sprintId: sprint.id,
        storyPoints: 5,
      });
      const wp2 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        status: 'new',
        sprintId: sprint.id,
        storyPoints: 8,
      });
      await wpRepo.save([wp1, wp2]);

      const result = await sprintService.getSprintWithStats(sprint.id);

      expect(result).toBeDefined();
      expect(result?.sprint.id).toBe(sprint.id);
      expect(result?.workPackages).toHaveLength(2);
      expect(result?.totalStoryPoints).toBe(13);
      expect(result?.sprint.storyPoints).toBe(13);
    });

    it('should return null if sprint does not exist', async () => {
      const result = await sprintService.getSprintWithStats('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });

    it('should handle work packages without story points', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      // Create work package without story points
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'new',
        sprintId: sprint.id,
      });
      await wpRepo.save(wp);

      const result = await sprintService.getSprintWithStats(sprint.id);

      expect(result).toBeDefined();
      expect(result?.totalStoryPoints).toBe(0);
    });
  });

  describe('updateSprint', () => {
    it('should update a sprint', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
        capacity: 40,
      });

      const updated = await sprintService.updateSprint(sprint.id, {
        name: 'Updated Sprint',
        description: 'Updated description',
        status: SprintStatus.ACTIVE,
        capacity: 50,
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Sprint');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.status).toBe(SprintStatus.ACTIVE);
      expect(updated?.capacity).toBe(50);
    });

    it('should update sprint dates', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      const updated = await sprintService.updateSprint(sprint.id, {
        startDate: new Date('2024-01-02'),
        endDate: new Date('2024-01-16'),
      });

      expect(updated).toBeDefined();
      expect(updated?.startDate).toEqual(new Date('2024-01-02'));
      expect(updated?.endDate).toEqual(new Date('2024-01-16'));
    });

    it('should throw error if end date is before start date', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      await expect(
        sprintService.updateSprint(sprint.id, {
          startDate: new Date('2024-01-14'),
          endDate: new Date('2024-01-01'),
        })
      ).rejects.toThrow('End date must be after start date');
    });

    it('should return null if sprint does not exist', async () => {
      const updated = await sprintService.updateSprint('00000000-0000-0000-0000-000000000000', {
        name: 'Updated',
      });

      expect(updated).toBeNull();
    });
  });

  describe('deleteSprint', () => {
    it('should delete a sprint', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      const deleted = await sprintService.deleteSprint(sprint.id);

      expect(deleted).toBe(true);

      const found = await sprintService.getSprintById(sprint.id);
      expect(found).toBeNull();
    });

    it('should return false if sprint does not exist', async () => {
      const deleted = await sprintService.deleteSprint('00000000-0000-0000-0000-000000000000');

      expect(deleted).toBe(false);
    });

    it('should remove sprint reference from work packages', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      // Create work package in sprint
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'new',
        sprintId: sprint.id,
      });
      await wpRepo.save(wp);

      await sprintService.deleteSprint(sprint.id);

      // Work package should still exist but sprint reference should be null
      const foundWp = await wpRepo.findOne({ where: { id: wp.id } });
      expect(foundWp).toBeDefined();
      expect(foundWp?.sprintId).toBeNull();
    });
  });

  describe('addWorkPackagesToSprint', () => {
    it('should add work packages to a sprint', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      // Create work packages
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp1 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'new',
        storyPoints: 5,
      });
      const wp2 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        status: 'new',
        storyPoints: 8,
      });
      await wpRepo.save([wp1, wp2]);

      await sprintService.addWorkPackagesToSprint(sprint.id, [wp1.id, wp2.id]);

      // Verify work packages are in sprint
      const result = await sprintService.getSprintWithStats(sprint.id);
      expect(result?.workPackages).toHaveLength(2);
      expect(result?.totalStoryPoints).toBe(13);
    });

    it('should throw error if sprint does not exist', async () => {
      await expect(
        sprintService.addWorkPackagesToSprint('00000000-0000-0000-0000-000000000000', ['wp-1'])
      ).rejects.toThrow('Sprint not found');
    });

    it('should only add work packages from the same project', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      // Create work package in different project
      const projectRepo = AppDataSource.getRepository(Project);
      const otherProject = projectRepo.create({
        name: 'Other Project',
        ownerId: testUser.id,
        status: ProjectStatus.ACTIVE,
      });
      await projectRepo.save(otherProject);

      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp = wpRepo.create({
        projectId: otherProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'new',
      });
      await wpRepo.save(wp);

      await sprintService.addWorkPackagesToSprint(sprint.id, [wp.id]);

      // Work package should not be added
      const result = await sprintService.getSprintWithStats(sprint.id);
      expect(result?.workPackages).toHaveLength(0);

      // Clean up
      await projectRepo.delete({ id: otherProject.id });
    });
  });

  describe('removeWorkPackagesFromSprint', () => {
    it('should remove work packages from sprint', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      // Create work packages in sprint
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp1 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'new',
        sprintId: sprint.id,
      });
      const wp2 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        status: 'new',
        sprintId: sprint.id,
      });
      await wpRepo.save([wp1, wp2]);

      await sprintService.removeWorkPackagesFromSprint([wp1.id, wp2.id]);

      // Verify work packages are removed from sprint
      const result = await sprintService.getSprintWithStats(sprint.id);
      expect(result?.workPackages).toHaveLength(0);

      // Verify work packages still exist
      const foundWp1 = await wpRepo.findOne({ where: { id: wp1.id } });
      const foundWp2 = await wpRepo.findOne({ where: { id: wp2.id } });
      expect(foundWp1).toBeDefined();
      expect(foundWp2).toBeDefined();
      expect(foundWp1?.sprintId).toBeNull();
      expect(foundWp2?.sprintId).toBeNull();
    });
  });
});
