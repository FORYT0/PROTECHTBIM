import { DataSource } from 'typeorm';
import { TestDataSource } from '../../config/test-data-source';
import {
  WorkPackage,
  WorkPackageType,
  Priority,
  SchedulingMode,
  WorkPackageRelation,
  RelationType,
  WorkPackageWatcher,
} from '../../entities';
import { User } from '../../entities/User';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';

describe('WorkPackage Entity', () => {
  let dataSource: DataSource;
  let testUser: User;
  let testProject: Project;

  beforeAll(async () => {
    dataSource = await TestDataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Create test user
    const userRepo = dataSource.getRepository(User);
    testUser = userRepo.create({
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      name: 'Test User',
    });
    await userRepo.save(testUser);

    // Create test project
    const projectRepo = dataSource.getRepository(Project);
    testProject = projectRepo.create({
      name: 'Test Project',
      ownerId: testUser.id,
      status: ProjectStatus.ACTIVE,
      lifecyclePhase: LifecyclePhase.PLANNING,
    });
    await projectRepo.save(testProject);
  });

  afterEach(async () => {
    // Clean up in reverse order of dependencies
    await dataSource.getRepository(WorkPackageWatcher).delete({});
    await dataSource.getRepository(WorkPackageRelation).delete({});
    await dataSource.getRepository(WorkPackage).delete({});
    await dataSource.getRepository(Project).delete({});
    await dataSource.getRepository(User).delete({});
  });

  describe('WorkPackage Creation', () => {
    it('should create a work package with required fields', async () => {
      const wpRepo = dataSource.getRepository(WorkPackage);

      const workPackage = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Test Task',
        status: 'open',
        priority: Priority.NORMAL,
        schedulingMode: SchedulingMode.AUTOMATIC,
      });

      const saved = await wpRepo.save(workPackage);

      expect(saved.id).toBeDefined();
      expect(saved.subject).toBe('Test Task');
      expect(saved.type).toBe(WorkPackageType.TASK);
      expect(saved.status).toBe('open');
      expect(saved.priority).toBe(Priority.NORMAL);
      expect(saved.spentHours).toBe(0);
      expect(saved.progressPercent).toBe(0);
      expect(saved.schedulingMode).toBe(SchedulingMode.AUTOMATIC);
    });

    it('should create a work package with all optional fields', async () => {
      const wpRepo = dataSource.getRepository(WorkPackage);

      const workPackage = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.FEATURE,
        subject: 'Test Feature',
        description: 'A detailed description',
        status: 'in_progress',
        priority: Priority.HIGH,
        assigneeId: testUser.id,
        accountableId: testUser.id,
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-31'),
        estimatedHours: 40,
        spentHours: 10,
        progressPercent: 25,
        schedulingMode: SchedulingMode.MANUAL,
        storyPoints: 8,
        customFields: { customField1: 'value1' },
      });

      const saved = await wpRepo.save(workPackage);

      expect(saved.description).toBe('A detailed description');
      expect(saved.assigneeId).toBe(testUser.id);
      expect(saved.estimatedHours).toBe(40);
      expect(saved.storyPoints).toBe(8);
      expect(saved.customFields).toEqual({ customField1: 'value1' });
    });

    it('should create a parent-child relationship', async () => {
      const wpRepo = dataSource.getRepository(WorkPackage);

      const parent = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.PHASE,
        subject: 'Parent Phase',
        status: 'open',
      });
      await wpRepo.save(parent);

      const child = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Child Task',
        status: 'open',
        parentId: parent.id,
      });
      await wpRepo.save(child);

      const loadedChild = await wpRepo.findOne({
        where: { id: child.id },
        relations: ['parent'],
      });

      expect(loadedChild?.parentId).toBe(parent.id);
      expect(loadedChild?.parent?.subject).toBe('Parent Phase');
    });
  });

  describe('WorkPackageRelation', () => {
    it('should create a relation between work packages', async () => {
      const wpRepo = dataSource.getRepository(WorkPackage);
      const relationRepo = dataSource.getRepository(WorkPackageRelation);

      const wp1 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'open',
      });
      await wpRepo.save(wp1);

      const wp2 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        status: 'open',
      });
      await wpRepo.save(wp2);

      const relation = relationRepo.create({
        fromId: wp1.id,
        toId: wp2.id,
        relationType: RelationType.SUCCESSOR,
        lagDays: 2,
      });
      await relationRepo.save(relation);

      const loadedRelation = await relationRepo.findOne({
        where: { id: relation.id },
        relations: ['from', 'to'],
      });

      expect(loadedRelation?.fromId).toBe(wp1.id);
      expect(loadedRelation?.toId).toBe(wp2.id);
      expect(loadedRelation?.relationType).toBe(RelationType.SUCCESSOR);
      expect(loadedRelation?.lagDays).toBe(2);
      expect(loadedRelation?.from.subject).toBe('Task 1');
      expect(loadedRelation?.to.subject).toBe('Task 2');
    });

    it('should support different relation types', async () => {
      const wpRepo = dataSource.getRepository(WorkPackage);
      const relationRepo = dataSource.getRepository(WorkPackageRelation);

      const wp1 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'open',
      });
      await wpRepo.save(wp1);

      const wp2 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        status: 'open',
      });
      await wpRepo.save(wp2);

      const relationTypes = [
        RelationType.SUCCESSOR,
        RelationType.PREDECESSOR,
        RelationType.BLOCKS,
        RelationType.BLOCKED_BY,
        RelationType.RELATES_TO,
        RelationType.DUPLICATES,
      ];

      for (const relationType of relationTypes) {
        const relation = relationRepo.create({
          fromId: wp1.id,
          toId: wp2.id,
          relationType,
        });
        const saved = await relationRepo.save(relation);
        expect(saved.relationType).toBe(relationType);
        await relationRepo.delete(saved.id);
      }
    });
  });

  describe('WorkPackageWatcher', () => {
    it('should add a watcher to a work package', async () => {
      const wpRepo = dataSource.getRepository(WorkPackage);
      const watcherRepo = dataSource.getRepository(WorkPackageWatcher);

      const workPackage = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Watched Task',
        status: 'open',
      });
      await wpRepo.save(workPackage);

      const watcher = watcherRepo.create({
        workPackageId: workPackage.id,
        userId: testUser.id,
      });
      await watcherRepo.save(watcher);

      const loadedWatcher = await watcherRepo.findOne({
        where: {
          workPackageId: workPackage.id,
          userId: testUser.id,
        },
        relations: ['workPackage', 'user'],
      });

      expect(loadedWatcher).toBeDefined();
      expect(loadedWatcher?.workPackageId).toBe(workPackage.id);
      expect(loadedWatcher?.userId).toBe(testUser.id);
      expect(loadedWatcher?.workPackage.subject).toBe('Watched Task');
      expect(loadedWatcher?.user.email).toBe('test@example.com');
    });

    it('should allow multiple watchers on a work package', async () => {
      const wpRepo = dataSource.getRepository(WorkPackage);
      const watcherRepo = dataSource.getRepository(WorkPackageWatcher);
      const userRepo = dataSource.getRepository(User);

      const workPackage = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Multi-Watched Task',
        status: 'open',
      });
      await wpRepo.save(workPackage);

      const user2 = userRepo.create({
        email: 'user2@example.com',
        passwordHash: 'hashedpassword',
        name: 'User 2',
      });
      await userRepo.save(user2);

      const watcher1 = watcherRepo.create({
        workPackageId: workPackage.id,
        userId: testUser.id,
      });
      await watcherRepo.save(watcher1);

      const watcher2 = watcherRepo.create({
        workPackageId: workPackage.id,
        userId: user2.id,
      });
      await watcherRepo.save(watcher2);

      const watchers = await watcherRepo.find({
        where: { workPackageId: workPackage.id },
      });

      expect(watchers).toHaveLength(2);
    });
  });

  describe('Cascade Deletes', () => {
    it('should cascade delete work packages when project is deleted', async () => {
      const wpRepo = dataSource.getRepository(WorkPackage);
      const projectRepo = dataSource.getRepository(Project);

      const workPackage = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task to be deleted',
        status: 'open',
      });
      await wpRepo.save(workPackage);

      await projectRepo.delete(testProject.id);

      const found = await wpRepo.findOne({ where: { id: workPackage.id } });
      expect(found).toBeNull();
    });

    it('should cascade delete relations when work package is deleted', async () => {
      const wpRepo = dataSource.getRepository(WorkPackage);
      const relationRepo = dataSource.getRepository(WorkPackageRelation);

      const wp1 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'open',
      });
      await wpRepo.save(wp1);

      const wp2 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        status: 'open',
      });
      await wpRepo.save(wp2);

      const relation = relationRepo.create({
        fromId: wp1.id,
        toId: wp2.id,
        relationType: RelationType.SUCCESSOR,
      });
      await relationRepo.save(relation);

      await wpRepo.delete(wp1.id);

      const foundRelation = await relationRepo.findOne({
        where: { id: relation.id },
      });
      expect(foundRelation).toBeNull();
    });

    it('should cascade delete watchers when work package is deleted', async () => {
      const wpRepo = dataSource.getRepository(WorkPackage);
      const watcherRepo = dataSource.getRepository(WorkPackageWatcher);

      const workPackage = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.TASK,
        subject: 'Task with watcher',
        status: 'open',
      });
      await wpRepo.save(workPackage);

      const watcher = watcherRepo.create({
        workPackageId: workPackage.id,
        userId: testUser.id,
      });
      await watcherRepo.save(watcher);

      await wpRepo.delete(workPackage.id);

      const foundWatcher = await watcherRepo.findOne({
        where: {
          workPackageId: workPackage.id,
          userId: testUser.id,
        },
      });
      expect(foundWatcher).toBeNull();
    });
  });
});
