import { TimeEntryRepository } from '../../repositories/TimeEntryRepository';
import { TimeEntry } from '../../entities/TimeEntry';
import { User } from '../../entities/User';
import { Project, ProjectStatus, LifecyclePhase } from '../../entities/Project';
import { WorkPackage, WorkPackageType } from '../../entities/WorkPackage';
import { AppDataSource } from '../../config/data-source';

describe('TimeEntryRepository', () => {
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
    // Don't destroy the data source in tests
  });

  beforeEach(async () => {
    repository = new TimeEntryRepository();

    // Create test user with unique email per test
    const userRepo = AppDataSource.getRepository(User);
    const uniqueEmail = `timeentry-${Date.now()}@test.com`;
    testUser = await userRepo.save({
      email: uniqueEmail,
      passwordHash: 'hash',
      name: 'Time Entry Test User',
    });

    // Create test project
    const projectRepo = AppDataSource.getRepository(Project);
    testProject = await projectRepo.save({
      name: 'Time Entry Test Project',
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
    // Clean up in reverse order of dependencies
    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
    const wpRepo = AppDataSource.getRepository(WorkPackage);
    const projectRepo = AppDataSource.getRepository(Project);
    const userRepo = AppDataSource.getRepository(User);

    // Delete by specific IDs to avoid empty criteria error
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

  describe('create', () => {
    it('should create a time entry with valid data', async () => {
      const timeEntry = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 5.5,
        date: new Date('2024-01-15'),
        comment: 'Worked on feature implementation',
        billable: true,
      });

      expect(timeEntry.id).toBeDefined();
      expect(timeEntry.workPackageId).toBe(testWorkPackage.id);
      expect(timeEntry.userId).toBe(testUser.id);
      expect(parseFloat(timeEntry.hours.toString())).toBe(5.5);
      expect(timeEntry.comment).toBe('Worked on feature implementation');
      expect(timeEntry.billable).toBe(true);
    });

    it('should create a time entry without comment', async () => {
      const timeEntry = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
      });

      expect(timeEntry.id).toBeDefined();
      // Comment should be null or undefined when not provided
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

  describe('findById', () => {
    it('should find a time entry by id with relations', async () => {
      const created = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 4.0,
        date: new Date('2024-01-15'),
      });

      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.workPackage).toBeDefined();
      expect(found!.workPackage.id).toBe(testWorkPackage.id);
      expect(found!.user).toBeDefined();
      expect(found!.user.id).toBe(testUser.id);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all time entries for a work package', async () => {
      // Create exactly 3 time entries for this test
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
        hours: 3.5,
        date: new Date('2024-01-15'),
        billable: false,
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 4.0,
        date: new Date('2024-01-20'),
        billable: true,
      });

      const result = await repository.findAll({ workPackageId: testWorkPackage.id });

      expect(result.timeEntries.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should filter by work package id', async () => {
      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 2.0,
        date: new Date('2024-01-10'),
      });

      const result = await repository.findAll({
        workPackageId: testWorkPackage.id,
      });

      expect(result.timeEntries.length).toBeGreaterThan(0);
      expect(result.timeEntries.every((te) => te.workPackageId === testWorkPackage.id)).toBe(true);
    });

    it('should filter by user id', async () => {
      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 2.0,
        date: new Date('2024-01-10'),
      });

      const result = await repository.findAll({
        userId: testUser.id,
      });

      expect(result.timeEntries.length).toBeGreaterThan(0);
      expect(result.timeEntries.every((te) => te.userId === testUser.id)).toBe(true);
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

      expect(result.timeEntries.length).toBe(1);
      expect(parseFloat(result.timeEntries[0].hours.toString())).toBe(3.5);
    });

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
        hours: 3.5,
        date: new Date('2024-01-15'),
        billable: false,
      });

      await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 4.0,
        date: new Date('2024-01-20'),
        billable: true,
      });

      const result = await repository.findAll({
        workPackageId: testWorkPackage.id,
        billable: true,
      });

      expect(result.timeEntries.length).toBe(2);
      expect(result.timeEntries.every((te) => te.billable === true)).toBe(true);
    });

    it('should support pagination', async () => {
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
        page: 1,
        perPage: 2,
      });

      expect(result.timeEntries.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(2);
    });

    it('should support sorting', async () => {
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
        sortBy: 'date',
        sortOrder: 'ASC',
      });

      expect(result.timeEntries.length).toBe(3);
      expect(parseFloat(result.timeEntries[0].hours.toString())).toBe(2.0);
      expect(parseFloat(result.timeEntries[2].hours.toString())).toBe(4.0);
    });
  });

  describe('update', () => {
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

    it('should throw error when updating to zero hours', async () => {
      const created = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
      });

      await expect(
        repository.update(created.id, { hours: 0 })
      ).rejects.toThrow('Hours must be a positive number');
    });

    it('should throw error when updating to negative hours', async () => {
      const created = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
      });

      await expect(
        repository.update(created.id, { hours: -1.5 })
      ).rejects.toThrow('Hours must be a positive number');
    });
  });

  describe('delete', () => {
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

    it('should return false for non-existent id', async () => {
      const deleted = await repository.delete('00000000-0000-0000-0000-000000000000');
      expect(deleted).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing time entry', async () => {
      const created = await repository.create({
        workPackageId: testWorkPackage.id,
        userId: testUser.id,
        hours: 3.0,
        date: new Date('2024-01-15'),
      });

      const exists = await repository.exists(created.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent time entry', async () => {
      const exists = await repository.exists('00000000-0000-0000-0000-000000000000');
      expect(exists).toBe(false);
    });
  });

  describe('getTotalHoursByWorkPackage', () => {
    it('should calculate total hours for a work package', async () => {
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

      const total = await repository.getTotalHoursByWorkPackage(testWorkPackage.id);
      expect(total).toBe(6.0);
    });

    it('should return 0 for work package with no time entries', async () => {
      const total = await repository.getTotalHoursByWorkPackage('00000000-0000-0000-0000-000000000000');
      expect(total).toBe(0);
    });
  });

  describe('getTotalHoursByUser', () => {
    it('should calculate total hours for a user', async () => {
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

    it('should calculate total hours for a user within date range', async () => {
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

    it('should return 0 for user with no time entries', async () => {
      const total = await repository.getTotalHoursByUser('00000000-0000-0000-0000-000000000000');
      expect(total).toBe(0);
    });
  });
});
