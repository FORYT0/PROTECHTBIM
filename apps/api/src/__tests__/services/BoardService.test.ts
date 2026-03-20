import { BoardService } from '../../services/BoardService';
import { BoardType } from '../../entities/Board';
import { BoardRepository } from '../../repositories/BoardRepository';
import { ProjectRepository } from '../../repositories/ProjectRepository';
import { WorkPackageRepository } from '../../repositories/WorkPackageRepository';

// Mock repositories
jest.mock('../../repositories/BoardRepository');
jest.mock('../../repositories/ProjectRepository');
jest.mock('../../repositories/WorkPackageRepository');

describe('BoardService', () => {
  let boardService: BoardService;
  let mockBoardRepository: jest.Mocked<BoardRepository>;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;
  let mockWorkPackageRepository: jest.Mocked<WorkPackageRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repositories
    mockBoardRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithColumns: jest.fn(),
      findByProjectId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      createColumn: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
    } as any;

    mockProjectRepository = {
      findById: jest.fn(),
    } as any;

    mockWorkPackageRepository = {
      findAll: jest.fn(),
    } as any;

    boardService = new BoardService(
      mockBoardRepository,
      mockProjectRepository,
      mockWorkPackageRepository
    );
  });

  describe('createBoard', () => {
    it('should create a board successfully', async () => {
      const mockProject = { id: 'project-1', name: 'Test Project' };
      const mockBoard = {
        id: 'board-1',
        projectId: 'project-1',
        name: 'Test Board',
        boardType: BoardType.BASIC,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectRepository.findById.mockResolvedValue(mockProject as any);
      mockBoardRepository.create.mockResolvedValue(mockBoard as any);

      const result = await boardService.createBoard({
        projectId: 'project-1',
        name: 'Test Board',
        boardType: BoardType.BASIC,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('board-1');
      expect(mockProjectRepository.findById).toHaveBeenCalledWith('project-1');
      expect(mockBoardRepository.create).toHaveBeenCalledWith({
        projectId: 'project-1',
        name: 'Test Board',
        description: undefined,
        boardType: BoardType.BASIC,
        configuration: undefined,
      });
    });

    it('should create a board with columns', async () => {
      const mockProject = { id: 'project-1', name: 'Test Project' };
      const mockBoard = {
        id: 'board-1',
        projectId: 'project-1',
        name: 'Test Board',
        boardType: BoardType.STATUS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockColumn1 = {
        id: 'col-1',
        boardId: 'board-1',
        name: 'To Do',
        position: 0,
      };
      const mockColumn2 = {
        id: 'col-2',
        boardId: 'board-1',
        name: 'Done',
        position: 1,
      };

      mockProjectRepository.findById.mockResolvedValue(mockProject as any);
      mockBoardRepository.create.mockResolvedValue(mockBoard as any);
      mockBoardRepository.createColumn
        .mockResolvedValueOnce(mockColumn1 as any)
        .mockResolvedValueOnce(mockColumn2 as any);

      const result = await boardService.createBoard({
        projectId: 'project-1',
        name: 'Test Board',
        boardType: BoardType.STATUS,
        columns: [
          { name: 'To Do', position: 0, statusMapping: 'new' },
          { name: 'Done', position: 1, statusMapping: 'closed' },
        ],
      });

      expect(result.columns).toHaveLength(2);
      expect(result.columns[0].name).toBe('To Do');
      expect(result.columns[1].name).toBe('Done');
      expect(mockBoardRepository.createColumn).toHaveBeenCalledTimes(2);
    });

    it('should throw error if name is missing', async () => {
      await expect(
        boardService.createBoard({
          projectId: 'project-1',
          name: '',
          boardType: BoardType.BASIC,
        })
      ).rejects.toThrow('Board name is required');
    });

    it('should throw error if project does not exist', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(
        boardService.createBoard({
          projectId: 'non-existent',
          name: 'Test Board',
          boardType: BoardType.BASIC,
        })
      ).rejects.toThrow('Project not found');
    });

    it('should throw error if boardType is missing', async () => {
      await expect(
        boardService.createBoard({
          projectId: 'project-1',
          name: 'Test Board',
          boardType: undefined as any,
        })
      ).rejects.toThrow('Board type is required');
    });
  });

  describe('getBoardById', () => {
    it('should get a board by ID', async () => {
      const mockBoard = {
        id: 'board-1',
        projectId: 'project-1',
        name: 'Test Board',
        boardType: BoardType.BASIC,
      };

      mockBoardRepository.findById.mockResolvedValue(mockBoard as any);

      const result = await boardService.getBoardById('board-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('board-1');
      expect(mockBoardRepository.findById).toHaveBeenCalledWith('board-1');
    });

    it('should return null if board does not exist', async () => {
      mockBoardRepository.findById.mockResolvedValue(null);

      const result = await boardService.getBoardById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error if ID is missing', async () => {
      await expect(boardService.getBoardById('')).rejects.toThrow('Board ID is required');
    });
  });

  describe('getBoardWithColumns', () => {
    it('should get a board with columns', async () => {
      const mockBoard = {
        id: 'board-1',
        projectId: 'project-1',
        name: 'Test Board',
        boardType: BoardType.STATUS,
        columns: [
          { id: 'col-1', name: 'To Do', position: 0 },
          { id: 'col-2', name: 'Done', position: 1 },
        ],
      };

      mockBoardRepository.findByIdWithColumns.mockResolvedValue(mockBoard as any);

      const result = await boardService.getBoardWithColumns('board-1');

      expect(result).toBeDefined();
      expect(result?.columns).toHaveLength(2);
      expect(mockBoardRepository.findByIdWithColumns).toHaveBeenCalledWith('board-1');
    });
  });

  describe('getBoardWithWorkPackages', () => {
    it('should get a board with columns and work packages', async () => {
      const mockBoard = {
        id: 'board-1',
        projectId: 'project-1',
        name: 'Test Board',
        boardType: BoardType.STATUS,
        columns: [
          { id: 'col-1', name: 'To Do', position: 0 },
          { id: 'col-2', name: 'Done', position: 1 },
        ],
      };
      const mockWorkPackages = [
        { id: 'wp-1', subject: 'Task 1', status: 'new' },
        { id: 'wp-2', subject: 'Task 2', status: 'closed' },
      ];

      mockBoardRepository.findByIdWithColumns.mockResolvedValue(mockBoard as any);
      mockWorkPackageRepository.findAll.mockResolvedValue({
        workPackages: mockWorkPackages as any,
        total: 2,
        page: 1,
        perPage: 10000,
      });

      const result = await boardService.getBoardWithWorkPackages('board-1');

      expect(result).toBeDefined();
      expect(result?.workPackages).toHaveLength(2);
      expect(mockWorkPackageRepository.findAll).toHaveBeenCalledWith({
        projectId: 'project-1',
        perPage: 10000,
      });
    });

    it('should return null if board does not exist', async () => {
      mockBoardRepository.findByIdWithColumns.mockResolvedValue(null);

      const result = await boardService.getBoardWithWorkPackages('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listBoards', () => {
    it('should list all boards for a project', async () => {
      const mockProject = { id: 'project-1', name: 'Test Project' };
      const mockBoards = [
        { id: 'board-1', name: 'Board 1', boardType: BoardType.BASIC },
        { id: 'board-2', name: 'Board 2', boardType: BoardType.STATUS },
      ];

      mockProjectRepository.findById.mockResolvedValue(mockProject as any);
      mockBoardRepository.findByProjectId.mockResolvedValue(mockBoards as any);

      const result = await boardService.listBoards('project-1');

      expect(result).toHaveLength(2);
      expect(mockBoardRepository.findByProjectId).toHaveBeenCalledWith('project-1');
    });

    it('should throw error if project does not exist', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(boardService.listBoards('non-existent')).rejects.toThrow(
        'Project not found'
      );
    });

    it('should throw error if projectId is missing', async () => {
      await expect(boardService.listBoards('')).rejects.toThrow('Project ID is required');
    });
  });

  describe('updateBoard', () => {
    it('should update a board', async () => {
      const mockBoard = {
        id: 'board-1',
        projectId: 'project-1',
        name: 'Updated Board',
        description: 'Updated description',
        boardType: BoardType.BASIC,
      };

      mockBoardRepository.exists.mockResolvedValue(true);
      mockBoardRepository.update.mockResolvedValue(mockBoard as any);

      const result = await boardService.updateBoard('board-1', {
        name: 'Updated Board',
        description: 'Updated description',
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Board');
      expect(mockBoardRepository.update).toHaveBeenCalledWith('board-1', {
        name: 'Updated Board',
        description: 'Updated description',
      });
    });

    it('should throw error if board does not exist', async () => {
      mockBoardRepository.exists.mockResolvedValue(false);

      await expect(
        boardService.updateBoard('non-existent', { name: 'Updated' })
      ).rejects.toThrow('Board not found');
    });

    it('should throw error if name is empty', async () => {
      mockBoardRepository.exists.mockResolvedValue(true);

      await expect(boardService.updateBoard('board-1', { name: '' })).rejects.toThrow(
        'Board name cannot be empty'
      );
    });
  });

  describe('deleteBoard', () => {
    it('should delete a board', async () => {
      mockBoardRepository.exists.mockResolvedValue(true);
      mockBoardRepository.delete.mockResolvedValue(true);

      const result = await boardService.deleteBoard('board-1');

      expect(result).toBe(true);
      expect(mockBoardRepository.delete).toHaveBeenCalledWith('board-1');
    });

    it('should throw error if board does not exist', async () => {
      mockBoardRepository.exists.mockResolvedValue(false);

      await expect(boardService.deleteBoard('non-existent')).rejects.toThrow(
        'Board not found'
      );
    });
  });

  describe('createColumn', () => {
    it('should create a board column', async () => {
      const mockBoard = { id: 'board-1', name: 'Test Board' };
      const mockColumn = {
        id: 'col-1',
        boardId: 'board-1',
        name: 'New Column',
        position: 0,
        wipLimit: 5,
      };

      mockBoardRepository.findById.mockResolvedValue(mockBoard as any);
      mockBoardRepository.createColumn.mockResolvedValue(mockColumn as any);

      const result = await boardService.createColumn('board-1', {
        name: 'New Column',
        position: 0,
        wipLimit: 5,
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('New Column');
      expect(mockBoardRepository.createColumn).toHaveBeenCalledWith({
        boardId: 'board-1',
        name: 'New Column',
        position: 0,
        statusMapping: undefined,
        wipLimit: 5,
      });
    });

    it('should throw error if board does not exist', async () => {
      mockBoardRepository.findById.mockResolvedValue(null);

      await expect(
        boardService.createColumn('non-existent', { name: 'Column', position: 0 })
      ).rejects.toThrow('Board not found');
    });

    it('should throw error if column name is missing', async () => {
      const mockBoard = { id: 'board-1', name: 'Test Board' };
      mockBoardRepository.findById.mockResolvedValue(mockBoard as any);

      await expect(
        boardService.createColumn('board-1', { name: '', position: 0 })
      ).rejects.toThrow('Column name is required');
    });
  });

  describe('updateColumn', () => {
    it('should update a board column', async () => {
      const mockColumn = {
        id: 'col-1',
        boardId: 'board-1',
        name: 'Updated Column',
        position: 0,
      };

      mockBoardRepository.updateColumn.mockResolvedValue(mockColumn as any);

      const result = await boardService.updateColumn('col-1', {
        name: 'Updated Column',
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Column');
      expect(mockBoardRepository.updateColumn).toHaveBeenCalledWith('col-1', {
        name: 'Updated Column',
      });
    });

    it('should throw error if column name is empty', async () => {
      await expect(boardService.updateColumn('col-1', { name: '' })).rejects.toThrow(
        'Column name cannot be empty'
      );
    });
  });

  describe('deleteColumn', () => {
    it('should delete a board column', async () => {
      mockBoardRepository.deleteColumn.mockResolvedValue(true);

      const result = await boardService.deleteColumn('col-1');

      expect(result).toBe(true);
      expect(mockBoardRepository.deleteColumn).toHaveBeenCalledWith('col-1');
    });
  });
});
