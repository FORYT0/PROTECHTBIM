import { WorkPackageWatcherRepository } from '../../repositories/WorkPackageWatcherRepository';
import { WorkPackageWatcher } from '../../entities/WorkPackageWatcher';
import { WorkPackage, WorkPackageType } from '../../entities/WorkPackage';
import { User } from '../../entities/User';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { AppDataSource } from '../../config/data-source';

describe('WorkPackageWatcherRepository', () => {
  let repository: WorkPackageWatcherRepository;
  let testUser: User;
  let testProject: Project;
  let testWorkPackage: WorkPackage;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    repository = new WorkPackageWatcherRepository();

    // Create test user
    const userRepository = AppDataSource.getRepository(User);
    testUser = await userRepository.save({
      email: `test-watcher-${Date.now()}@example.com`,
      name: 'Test Watcher User',
      passwordHash: 'hashedpassword',
    });

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
  });

  describe('addWatcher', () => {
    it('should add a watcher to a work package', async () => {
      const watcher = await repository.addWatcher(testWorkPackage.id, testUser.id);

      expect(watcher).toBeDefined();
      expect(watcher.workPackageId).toBe(testWorkPackage.id);
      expect(watcher.userId).toBe(testUser.id);
      expect(watcher.createdAt).toBeDefined();
    });

    it('should allow adding the same watcher twice (database constraint will prevent)', async () => {
      await repository.addWatcher(testWorkPackage.id, testUser.id);

      // This should throw a database constraint error
      await expect(
        repository.addWatcher(testWorkPackage.id, testUser.id)
      ).rejects.toThrow();
    });
  });

  describe('removeWatcher', () => {
    it('should remove a watcher from a work package', async () => {
      await repository.addWatcher(testWorkPackage.id, testUser.id);

      const removed = await repository.removeWatcher(testWorkPackage.id, testUser.id);

      expect(removed).toBe(true);

      const isWatching = await repository.isWatching(testWorkPackage.id, testUser.id);
      expect(isWatching).toBe(false);
    });

    it('should return false when removing non-existent watcher', async () => {
      const removed = await repository.removeWatcher(testWorkPackage.id, testUser.id);

      expect(removed).toBe(false);
    });
  });

  describe('getWatchers', () => {
    it('should return all watchers for a work package', async () => {
      await repository.addWatcher(testWorkPackage.id, testUser.id);

      const watchers = await repository.getWatchers(testWorkPackage.id);

      expect(watchers).toHaveLength(1);
      expect(watchers[0].workPackageId).toBe(testWorkPackage.id);
      expect(watchers[0].userId).toBe(testUser.id);
      expect(watchers[0].user).toBeDefined();
      expect(watchers[0].user.email).toBe(testUser.email);
    });

    it('should return empty array when no watchers exist', async () => {
      const watchers = await repository.getWatchers(testWorkPackage.id);

      expect(watchers).toHaveLength(0);
    });

    it('should return watchers ordered by creation date', async () => {
      // Create second user
      const userRepository = AppDataSource.getRepository(User);
      const testUser2 = await userRepository.save({
        email: `test-watcher-2-${Date.now()}@example.com`,
        name: 'Test Watcher User 2',
        passwordHash: 'hashedpassword',
      });

      await repository.addWatcher(testWorkPackage.id, testUser.id);
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      await repository.addWatcher(testWorkPackage.id, testUser2.id);

      const watchers = await repository.getWatchers(testWorkPackage.id);

      expect(watchers).toHaveLength(2);
      expect(watchers[0].userId).toBe(testUser.id);
      expect(watchers[1].userId).toBe(testUser2.id);

      // Clean up
      await userRepository.delete({ id: testUser2.id });
    });
  });

  describe('isWatching', () => {
    it('should return true when user is watching', async () => {
      await repository.addWatcher(testWorkPackage.id, testUser.id);

      const isWatching = await repository.isWatching(testWorkPackage.id, testUser.id);

      expect(isWatching).toBe(true);
    });

    it('should return false when user is not watching', async () => {
      const isWatching = await repository.isWatching(testWorkPackage.id, testUser.id);

      expect(isWatching).toBe(false);
    });
  });

  describe('getWatchedWorkPackages', () => {
    it('should return all work packages a user is watching', async () => {
      await repository.addWatcher(testWorkPackage.id, testUser.id);

      const watched = await repository.getWatchedWorkPackages(testUser.id);

      expect(watched).toHaveLength(1);
      expect(watched[0].workPackageId).toBe(testWorkPackage.id);
      expect(watched[0].workPackage).toBeDefined();
      expect(watched[0].workPackage.subject).toBe(testWorkPackage.subject);
    });

    it('should return empty array when user is not watching any work packages', async () => {
      const watched = await repository.getWatchedWorkPackages(testUser.id);

      expect(watched).toHaveLength(0);
    });
  });
});
