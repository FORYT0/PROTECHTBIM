import { AppDataSource } from '../../config/data-source';
import { SprintService } from '../../services/SprintService';
import { BoardService } from '../../services/BoardService';
import { BurndownService } from '../../services/BurndownService';
import { Sprint, SprintStatus } from '../../entities/Sprint';
import { Board, BoardType } from '../../entities/Board';
import { Project, ProjectStatus } from '../../entities/Project';
import { User } from '../../entities/User';
import { WorkPackage, WorkPackageType } from '../../entities/WorkPackage';
import { BoardRepository } from '../../repositories/BoardRepository';
import { ProjectRepository } from '../../repositories/ProjectRepository';
import { WorkPackageRepository } from '../../repositories/WorkPackageRepository';

/**
 * Integration test for complete agile workflow
 * Tests Requirements 4.1, 4.4, 4.9
 * 
 * This test validates the complete agile workflow:
 * 1. Create a board for sprint planning
 * 2. Create a sprint with capacity
 * 3. Add work packages with story points to sprint
 * 4. Track burndown progress
 * 5. Verify story point calculations
 */
describe('Agile Workflow Integration', () => {
  let sprintService: SprintService;
  let boardService: BoardService;
  let burndownService: BurndownService;
  let testUser: User;
  let testProject: Project;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Initialize services
    const boardRepository = new BoardRepository(AppDataSource);
    const projectRepository = new ProjectRepository();
    const workPackageRepository = new WorkPackageRepository();

    sprintService = new SprintService();
    boardService = new BoardService(
      boardRepository,
      projectRepository,
      workPackageRepository
    );
    burndownService = new BurndownService();

    // Create test user
    const userRepo = AppDataSource.getRepository(User);
    testUser = userRepo.create({
      email: 'agile@test.com',
      passwordHash: 'hash',
      name: 'Agile Test User',
    });
    await userRepo.save(testUser);

    // Create test project
    const projectRepo = AppDataSource.getRepository(Project);
    testProject = projectRepo.create({
      name: 'Agile Test Project',
      ownerId: testUser.id,
      status: ProjectStatus.ACTIVE,
    });
    await projectRepo.save(testProject);
  });

  afterEach(async () => {
    // Clean up test data
    const sprintRepo = AppDataSource.getRepository(Sprint);
    await sprintRepo.delete({ projectId: testProject.id });

    const boardRepo = AppDataSource.getRepository(Board);
    await boardRepo.delete({ projectId: testProject.id });

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

  describe('Complete Sprint Planning and Execution Workflow', () => {
    it('should support complete agile workflow from board creation to burndown tracking', async () => {
      // Step 1: Create a sprint board with columns
      // Requirement 4.1: Board creation and configuration
      const board = await boardService.createBoard({
        projectId: testProject.id,
        name: 'Sprint Board',
        description: 'Board for sprint planning',
        boardType: BoardType.STATUS,
        columns: [
          { name: 'Backlog', position: 0, statusMapping: 'new' },
          { name: 'To Do', position: 1, statusMapping: 'open' },
          { name: 'In Progress', position: 2, statusMapping: 'in_progress' },
          { name: 'Done', position: 3, statusMapping: 'closed' },
        ],
      });

      expect(board).toBeDefined();
      expect(board.id).toBeDefined();
      expect(board.columns).toHaveLength(4);
      expect(board.boardType).toBe(BoardType.STATUS);

      // Step 2: Create a sprint with capacity
      // Requirement 4.4: Sprint management with capacity planning
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        description: 'First sprint',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
        capacity: 40, // 40 hours capacity
      });

      expect(sprint).toBeDefined();
      expect(sprint.id).toBeDefined();
      expect(sprint.status).toBe(SprintStatus.PLANNED);
      expect(sprint.capacity).toBe(40);

      // Step 3: Create work packages with story points
      // Requirement 4.4: Story points for effort estimation
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const workPackages = [
        wpRepo.create({
          projectId: testProject.id,
          type: WorkPackageType.FEATURE,
          subject: 'User Authentication',
          description: 'Implement user login and registration',
          status: 'new',
          storyPoints: 8,
        }),
        wpRepo.create({
          projectId: testProject.id,
          type: WorkPackageType.FEATURE,
          subject: 'Dashboard UI',
          description: 'Create main dashboard interface',
          status: 'new',
          storyPoints: 5,
        }),
        wpRepo.create({
          projectId: testProject.id,
          type: WorkPackageType.FEATURE,
          subject: 'API Integration',
          description: 'Integrate with external API',
          status: 'new',
          storyPoints: 13,
        }),
        wpRepo.create({
          projectId: testProject.id,
          type: WorkPackageType.BUG,
          subject: 'Fix login bug',
          description: 'Fix issue with login redirect',
          status: 'new',
          storyPoints: 3,
        }),
      ];
      await wpRepo.save(workPackages);

      // Step 4: Add work packages to sprint
      const workPackageIds = workPackages.map((wp) => wp.id);
      await sprintService.addWorkPackagesToSprint(sprint.id, workPackageIds);

      // Verify work packages are in sprint
      let sprintWithStats = await sprintService.getSprintWithStats(sprint.id);
      expect(sprintWithStats).toBeDefined();
      expect(sprintWithStats?.workPackages).toHaveLength(4);
      
      // Requirement 4.4: Calculate total story points
      expect(sprintWithStats?.totalStoryPoints).toBe(29); // 8 + 5 + 13 + 3
      expect(sprintWithStats?.sprint.storyPoints).toBe(29);

      // Step 5: Start the sprint
      await sprintService.updateSprint(sprint.id, {
        status: SprintStatus.ACTIVE,
      });

      // Step 6: Simulate work progress - complete some work packages
      // Refetch work packages to ensure we have the latest data
      const wp1 = await wpRepo.findOne({ where: { id: workPackages[0].id } });
      const wp2 = await wpRepo.findOne({ where: { id: workPackages[1].id } });
      
      if (wp1) {
        wp1.status = 'closed';
        wp1.progressPercent = 100;
        await wpRepo.save(wp1);
      }
      
      if (wp2) {
        wp2.status = 'in_progress';
        wp2.progressPercent = 50;
        await wpRepo.save(wp2);
      }

      // Verify work packages are still in sprint before recording snapshot
      const wpInSprint = await wpRepo.find({ where: { sprintId: sprint.id } });
      expect(wpInSprint).toHaveLength(4);
      const totalPoints = wpInSprint.reduce((sum, wp) => sum + (wp.storyPoints || 0), 0);
      expect(totalPoints).toBe(29);

      // Step 7: Record burndown snapshot
      // Requirement 4.9: Burndown chart data tracking
      const snapshot = await burndownService.recordBurndownSnapshot(sprint.id);
      expect(snapshot).toBeDefined();
      expect(snapshot.totalStoryPoints).toBe(29);
      expect(snapshot.completedStoryPoints).toBe(8); // Only fully completed work packages (Feature 1)
      expect(snapshot.remainingStoryPoints).toBe(21); // 29 - 8

      // Step 8: Get burndown chart data
      const burndown = await burndownService.getSprintBurndown(sprint.id);
      expect(burndown).toBeDefined();
      expect(burndown.sprintId).toBe(sprint.id);
      expect(burndown.sprintName).toBe('Sprint 1');
      expect(burndown.totalStoryPoints).toBe(29);
      expect(burndown.dataPoints.length).toBeGreaterThan(0);

      // Verify ideal line is calculated
      const firstPoint = burndown.dataPoints[0];
      expect(firstPoint.ideal).toBe(29);
      const lastPoint = burndown.dataPoints[burndown.dataPoints.length - 1];
      expect(lastPoint.ideal).toBe(0);

      // Step 9: Get board with work packages
      const boardWithWorkPackages = await boardService.getBoardWithWorkPackages(board.id);
      expect(boardWithWorkPackages).toBeDefined();
      expect(boardWithWorkPackages?.workPackages).toHaveLength(4);

      // Step 10: Complete more work and record another snapshot
      // Refetch work packages to ensure we have the latest data
      const wp2Updated = await wpRepo.findOne({ where: { id: workPackages[1].id } });
      const wp4Updated = await wpRepo.findOne({ where: { id: workPackages[3].id } });
      
      if (wp2Updated) {
        wp2Updated.status = 'closed';
        wp2Updated.progressPercent = 100;
        await wpRepo.save(wp2Updated);
      }
      
      if (wp4Updated) {
        wp4Updated.status = 'closed';
        wp4Updated.progressPercent = 100;
        await wpRepo.save(wp4Updated);
      }

      const snapshot2 = await burndownService.recordBurndownSnapshot(sprint.id);
      expect(snapshot2.completedStoryPoints).toBe(16); // 8 + 5 + 3
      expect(snapshot2.remainingStoryPoints).toBe(13); // 29 - 16

      // Step 11: Complete sprint
      await sprintService.updateSprint(sprint.id, {
        status: SprintStatus.COMPLETED,
      });

      const completedSprint = await sprintService.getSprintById(sprint.id);
      expect(completedSprint?.status).toBe(SprintStatus.COMPLETED);
    });

    it('should support multiple boards per project', async () => {
      // Requirement 4.10: Multiple boards per project with different configurations
      const sprintBoard = await boardService.createBoard({
        projectId: testProject.id,
        name: 'Sprint Board',
        boardType: BoardType.STATUS,
        columns: [
          { name: 'To Do', position: 0 },
          { name: 'Done', position: 1 },
        ],
      });

      const teamBoard = await boardService.createBoard({
        projectId: testProject.id,
        name: 'Team Board',
        boardType: BoardType.TEAM,
        configuration: { groupBy: 'assignee' },
        columns: [
          { name: 'Unassigned', position: 0 },
          { name: 'Assigned', position: 1 },
        ],
      });

      const boards = await boardService.listBoards(testProject.id);
      expect(boards).toHaveLength(2);
      expect(boards.find((b) => b.id === sprintBoard.id)).toBeDefined();
      expect(boards.find((b) => b.id === teamBoard.id)).toBeDefined();
    });

    it('should handle sprint capacity planning', async () => {
      // Requirement 4.4: Sprint capacity planning
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 2',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-28'),
        capacity: 80, // 80 hours capacity for 2-week sprint
      });

      // Create work packages with story points
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const workPackages = [];
      for (let i = 1; i <= 10; i++) {
        workPackages.push(
          wpRepo.create({
            projectId: testProject.id,
            type: WorkPackageType.TASK,
            subject: `Task ${i}`,
            status: 'new',
            storyPoints: 5,
          })
        );
      }
      await wpRepo.save(workPackages);

      // Add work packages to sprint
      const workPackageIds = workPackages.map((wp) => wp.id);
      await sprintService.addWorkPackagesToSprint(sprint.id, workPackageIds);

      // Verify total story points
      const sprintWithStats = await sprintService.getSprintWithStats(sprint.id);
      expect(sprintWithStats?.totalStoryPoints).toBe(50); // 10 tasks * 5 points

      // Verify capacity is tracked
      expect(sprintWithStats?.sprint.capacity).toBe(80);
      
      // In a real scenario, you would compare story points to capacity
      // to determine if sprint is over-committed
      const isOverCommitted = sprintWithStats!.totalStoryPoints > sprintWithStats!.sprint.capacity!;
      expect(isOverCommitted).toBe(false); // 50 points < 80 hours capacity
    });

    it('should track burndown across multiple sprints', async () => {
      // Create two sprints
      const sprint1 = await sprintService.createSprint({
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

      // Create work packages for each sprint
      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp1 = wpRepo.create({
        projectId: testProject.id,
        sprintId: sprint1.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 1',
        status: 'closed',
        storyPoints: 8,
        progressPercent: 100,
      });
      const wp2 = wpRepo.create({
        projectId: testProject.id,
        sprintId: sprint2.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 2',
        status: 'in_progress',
        storyPoints: 13,
        progressPercent: 50,
      });
      await wpRepo.save([wp1, wp2]);

      // Record snapshots for both sprints
      const snapshot1 = await burndownService.recordBurndownSnapshot(sprint1.id);
      const snapshot2 = await burndownService.recordBurndownSnapshot(sprint2.id);

      expect(snapshot1.completedStoryPoints).toBe(8);
      expect(snapshot2.completedStoryPoints).toBe(0); // Not fully completed

      // Get burndown data for both sprints
      const burndown1 = await burndownService.getSprintBurndown(sprint1.id);
      const burndown2 = await burndownService.getSprintBurndown(sprint2.id);

      expect(burndown1.sprintId).toBe(sprint1.id);
      expect(burndown2.sprintId).toBe(sprint2.id);
    });

    it('should support removing work packages from sprint', async () => {
      // Create sprint
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
        sprintId: sprint.id,
        type: WorkPackageType.TASK,
        subject: 'Task 1',
        status: 'new',
        storyPoints: 5,
      });
      const wp2 = wpRepo.create({
        projectId: testProject.id,
        sprintId: sprint.id,
        type: WorkPackageType.TASK,
        subject: 'Task 2',
        status: 'new',
        storyPoints: 8,
      });
      await wpRepo.save([wp1, wp2]);

      // Verify initial state
      let sprintWithStats = await sprintService.getSprintWithStats(sprint.id);
      expect(sprintWithStats?.workPackages).toHaveLength(2);
      expect(sprintWithStats?.totalStoryPoints).toBe(13);

      // Remove one work package from sprint
      await sprintService.removeWorkPackagesFromSprint([wp1.id]);

      // Verify work package was removed
      sprintWithStats = await sprintService.getSprintWithStats(sprint.id);
      expect(sprintWithStats?.workPackages).toHaveLength(1);
      expect(sprintWithStats?.totalStoryPoints).toBe(8);

      // Verify work package still exists but not in sprint
      const foundWp = await wpRepo.findOne({ where: { id: wp1.id } });
      expect(foundWp).toBeDefined();
      expect(foundWp?.sprintId).toBeNull();
    });
  });

  describe('Board Configuration Tests', () => {
    it('should create board with different types', async () => {
      // Requirement 4.1: Support different board types
      const basicBoard = await boardService.createBoard({
        projectId: testProject.id,
        name: 'Basic Board',
        boardType: BoardType.BASIC,
      });

      const statusBoard = await boardService.createBoard({
        projectId: testProject.id,
        name: 'Status Board',
        boardType: BoardType.STATUS,
      });

      const teamBoard = await boardService.createBoard({
        projectId: testProject.id,
        name: 'Team Board',
        boardType: BoardType.TEAM,
      });

      const versionBoard = await boardService.createBoard({
        projectId: testProject.id,
        name: 'Version Board',
        boardType: BoardType.VERSION,
      });

      expect(basicBoard.boardType).toBe(BoardType.BASIC);
      expect(statusBoard.boardType).toBe(BoardType.STATUS);
      expect(teamBoard.boardType).toBe(BoardType.TEAM);
      expect(versionBoard.boardType).toBe(BoardType.VERSION);
    });

    it('should support board column configuration with WIP limits', async () => {
      const board = await boardService.createBoard({
        projectId: testProject.id,
        name: 'Kanban Board',
        boardType: BoardType.STATUS,
        columns: [
          { name: 'Backlog', position: 0 },
          { name: 'In Progress', position: 1, wipLimit: 3 },
          { name: 'Review', position: 2, wipLimit: 2 },
          { name: 'Done', position: 3 },
        ],
      });

      expect(board.columns).toHaveLength(4);
      expect(board.columns[1].wipLimit).toBe(3);
      expect(board.columns[2].wipLimit).toBe(2);
    });
  });

  describe('Story Points Calculation Tests', () => {
    it('should calculate story points correctly with mixed work package types', async () => {
      // Requirement 4.4: Story points calculation
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const workPackages = [
        wpRepo.create({
          projectId: testProject.id,
          sprintId: sprint.id,
          type: WorkPackageType.FEATURE,
          subject: 'Feature',
          status: 'new',
          storyPoints: 13,
        }),
        wpRepo.create({
          projectId: testProject.id,
          sprintId: sprint.id,
          type: WorkPackageType.BUG,
          subject: 'Bug',
          status: 'new',
          storyPoints: 2,
        }),
        wpRepo.create({
          projectId: testProject.id,
          sprintId: sprint.id,
          type: WorkPackageType.TASK,
          subject: 'Task',
          status: 'new',
          storyPoints: 5,
        }),
        wpRepo.create({
          projectId: testProject.id,
          sprintId: sprint.id,
          type: WorkPackageType.TASK,
          subject: 'Task without points',
          status: 'new',
          // No story points
        }),
      ];
      await wpRepo.save(workPackages);

      const sprintWithStats = await sprintService.getSprintWithStats(sprint.id);
      expect(sprintWithStats?.totalStoryPoints).toBe(20); // 13 + 2 + 5 + 0
    });

    it('should update story points when work packages are added or removed', async () => {
      const sprint = await sprintService.createSprint({
        projectId: testProject.id,
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      });

      const wpRepo = AppDataSource.getRepository(WorkPackage);
      const wp1 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 1',
        status: 'new',
        storyPoints: 8,
      });
      await wpRepo.save(wp1);

      // Add work package to sprint
      await sprintService.addWorkPackagesToSprint(sprint.id, [wp1.id]);

      let sprintWithStats = await sprintService.getSprintWithStats(sprint.id);
      expect(sprintWithStats?.totalStoryPoints).toBe(8);

      // Add another work package
      const wp2 = wpRepo.create({
        projectId: testProject.id,
        type: WorkPackageType.FEATURE,
        subject: 'Feature 2',
        status: 'new',
        storyPoints: 13,
      });
      await wpRepo.save(wp2);
      await sprintService.addWorkPackagesToSprint(sprint.id, [wp2.id]);

      sprintWithStats = await sprintService.getSprintWithStats(sprint.id);
      expect(sprintWithStats?.totalStoryPoints).toBe(21); // 8 + 13

      // Remove first work package
      await sprintService.removeWorkPackagesFromSprint([wp1.id]);

      sprintWithStats = await sprintService.getSprintWithStats(sprint.id);
      expect(sprintWithStats?.totalStoryPoints).toBe(13); // Only wp2
    });
  });
});
