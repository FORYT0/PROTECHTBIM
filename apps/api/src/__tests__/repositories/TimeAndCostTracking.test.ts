import { TimeEntryRepository } from '../../repositories/TimeEntryRepository';
import { AppDataSource } from '../../config/data-source';
import { TimeEntry } from '../../entities/TimeEntry';
import { User } from '../../entities/User';
import { WorkPackage, WorkPackageType } from '../../entities/WorkPackage';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';

describe('Time and Cost Tracking - TimeEntry Service', () => {
  let repository: TimeEntryRepository;
  let testUser: User;
  let testProject: Project;
  let testWorkPackage: WorkPackage;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    // Keep connection alive for other tests
  });

  beforeEach(async () => {
    repository = new TimeEntryRepository();

    // Create test user
    const userRepo = AppDataSource.getRepository(User);
    const uniqueEmail = `timetrack-${Date.now()}@test.com`;
    testUser = await userRepo.save({
      email: uniqueEmail,
      passwordHash: 'hash',
      name: 'Time Tracking Test User',
    });

    // Create test project
    const projectRepo = AppDataSource.getRepository(Project);
    testProject = await projectRepo.save({
      name: 'Time Tracking Test Project',
      ownerId: testUser.id,
      status: ProjectStatus.ACTIVE,
      lifecyclePhase: LifecyclePhase.EXECUTION,
    });

    // Create test work package
    const wpRepo = AppDataSource.getRepository(WorkPackage);
    testWorkPackage = await wpRepo.save({
      projectId: testProject.id,
      type: WorkPackageType.TASK,
      subject: 'Test Task',
      status: 'open',
    });
  });

  afterEach(async () => {
    // Clean up test data
    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
    const wpRepo = AppDataSource.getRepository(WorkPackage);
    const projectRepo = AppDataSource.getRepository(Project);
    const userRepo = AppDataSource.getRepository(User);

    if (testWorkPackage?.id) {
      await timeEntryRepo.delete({ workPackageId: testWorkPackage.id });
      await wpRepo.delete({ id: testWorkPackage.id });
    }
    if (testProject?.id) {
      await projectRepo.delete({ id: testProject.id });
    }
    if (testUser?.id) {
      await userRepo.delete({ id: testUser.id });
    }
  });

  describe('TimeEntry Creation', () => {
    it('should create a time entry with valid data', async () => {
      const timeEntry = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 5.5,
        date: new Date('2024-01-15'),
        comment: 'Test work',
        billable: true,
      });

      expect(timeEntry.id).toBeDefined();
      expect(timeEntry.hours).toBe(5.5);
      expect(timeEntry.billable).toBe(true);
      expect(timeEntry.comment).toBe('Test work');
    });

    it('should create a time entry without comment', async () => {
      const timeEntry = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
      });

      expect(timeEntry.id).toBeDefined();
      expect(timeEntry.hours).toBe(3.0);
      expect(timeEntry.comment ?? null).toBeNull();
    });

    it('should throw error for zero hours', async () => {
      await expect(
        repository.create({
          workPackageId: testWorkPackage.id,
          userId: testUser.id,
          hours: 0,
          date: new Date('2024-01-15'),
        })
      ).rejects.toThrow('Hours must be a positive number');
    });

    it('should throw error for negative hours', async () => {
      await expect(
        repository.create({
          workPackageId: testWorkPackage.id,
          userId: testUser.id,
          hours: -2.5,
          date: new Date('2024-01-15'),
        })
      ).rejects.toThrow('Hours must be a positive number');
    });
  });

  describe('TimeEntry Aggregations', () => {
    it('should get total hours by work package', async () => {
      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 2.5,
        date: new Date('2024-01-10'),
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.5,
        date: new Date('2024-01-15'),
      });

      const total = await repository.getTotalHoursByWorkPackage(
        testWorkPackage.id
      );
      expect(total).toBe(6.0);
    });

    it('should return 0 for work package with no time entries', async () => {
      const total = await repository.getTotalHoursByWorkPackage(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(total).toBe(0);
    });

    it('should get total hours by user', async () => {
      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 2.5,
        date: new Date('2024-01-10'),
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 4.0,
        date: new Date('2024-01-15'),
      });

      const total = await repository.getTotalHoursByUser(testUser.id);
      expect(total).toBe(6.5);
    });

    it('should get total hours by user within date range', async () => {
      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 2.0,
        date: new Date('2024-01-10'),
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 4.0,
        date: new Date('2024-01-20'),
      });

      const total = await repository.getTotalHoursByUser(
        testUser.id,
        new Date('2024-01-12'),
        new Date('2024-01-18')
      );
      expect(total).toBe(3.0);
    });
  });

  describe('TimeEntry Filtering', () => {
    it('should filter by billable status', async () => {
      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 2.0,
        date: new Date('2024-01-10'),
        billable: true,
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
        billable: false,
      });

      const result = await repository.findAll({
        workPackageId: testWorkPackage.id,
        billable: true,
      });

      expect(result.timeEntries).toHaveLength(1);
      expect(result.timeEntries[0].billable).toBe(true);
    });

    it('should filter by date range', async () => {
      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 2.0,
        date: new Date('2024-01-10'),
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.5,
        date: new Date('2024-01-15'),
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 4.0,
        date: new Date('2024-01-20'),
      });

      const result = await repository.findAll({
        workPackageId: testWorkPackage.id,
        dateFrom: new Date('2024-01-12'),
        dateTo: new Date('2024-01-18'),
      });

      expect(result.timeEntries).toHaveLength(1);
      expect(parseFloat(result.timeEntries[0].hours.toString())).toBe(3.5);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 25; i++) {
        await repository.create({
          workPackageId: testWorkPackage.id,
          userId: testUser.id,
          hours: 1.0,
          date: new Date('2024-01-15'),
        });
      }

      const page1 = await repository.findAll({
        workPackageId: testWorkPackage.id,
        page: 1,
        perPage: 10,
      });

      expect(page1.timeEntries).toHaveLength(10);
      expect(page1.total).toBe(25);
      expect(page1.page).toBe(1);

      const page2 = await repository.findAll({
        workPackageId: testWorkPackage.id,
        page: 2,
        perPage: 10,
      });

      expect(page2.timeEntries).toHaveLength(10);
    });

    it('should sort entries by date descending', async () => {
      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 1.0,
        date: new Date('2024-01-10'),
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 2.0,
        date: new Date('2024-01-20'),
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
      });

      const result = await repository.findAll({
        workPackageId: testWorkPackage.id,
        sortBy: 'date',
        sortOrder: 'DESC',
      });

      expect(result.timeEntries).toHaveLength(3);
      expect(parseFloat(result.timeEntries[0].hours.toString())).toBe(2.0);
      expect(parseFloat(result.timeEntries[2].hours.toString())).toBe(1.0);
    });
  });

  describe('TimeEntry Updates and Deletes', () => {
    it('should update a time entry', async () => {
      const created = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
        comment: 'Initial comment',
      });

      const updated = await repository.update(created.id, {
        hours: 5.0,
        comment: 'Updated comment',
      });

      expect(updated).toBeDefined();
      expect(parseFloat(updated!.hours.toString())).toBe(5.0);
      expect(updated!.comment).toBe('Updated comment');
    });

    it('should delete a time entry', async () => {
      const created = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
      });

      const deleted = await repository.delete(created.id);
      expect(deleted).toBe(true);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should check if entry exists', async () => {
      const created = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
      });

      const exists = await repository.exists(created.id);
      expect(exists).toBe(true);

      const notExists = await repository.exists(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(notExists).toBe(false);
    });
  });
});
