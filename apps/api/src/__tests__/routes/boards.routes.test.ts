import request from 'supertest';
import express from 'express';
import { BoardType } from '../../entities/Board';
import { createBoardService } from '../../services/BoardService';
import boardRoutes from '../../routes/boards.routes';

// Mock the auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateToken: jest.fn((req, _res, next) => {
    req.user = { userId: 'test-user-id' };
    next();
  }),
}));

// Mock the BoardService
jest.mock('../../services/BoardService');

describe('Board Routes', () => {
  let mockBoardService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock service
    mockBoardService = {
      createBoard: jest.fn(),
      listBoards: jest.fn(),
      getBoardWithWorkPackages: jest.fn(),
      updateBoard: jest.fn(),
      deleteBoard: jest.fn(),
      createColumn: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
    };

    (createBoardService as jest.Mock).mockReturnValue(mockBoardService);
  });

  describe('POST /api/v1/projects/:id/boards', () => {
    it('should create a new board', async () => {
      const mockBoard = {
        id: 'board-1',
        projectId: 'project-1',
        name: 'Sprint Board',
        boardType: BoardType.STATUS,
        columns: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBoardService.createBoard.mockResolvedValue(mockBoard);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app)
        .post('/api/v1/projects/project-1/boards')
        .send({
          name: 'Sprint Board',
          description: 'Board for sprint planning',
          board_type: BoardType.STATUS,
          configuration: { showCompleted: false },
        });

      expect(response.status).toBe(201);
      expect(response.body.board).toBeDefined();
      expect(mockBoardService.createBoard).toHaveBeenCalledWith({
        projectId: 'project-1',
        name: 'Sprint Board',
        description: 'Board for sprint planning',
        boardType: BoardType.STATUS,
        configuration: { showCompleted: false },
        columns: undefined,
      });
    });

    it('should return 400 if name is missing', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app)
        .post('/api/v1/projects/project-1/boards')
        .send({
          board_type: BoardType.BASIC,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Board name is required');
    });

    it('should return 400 if board_type is missing', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app)
        .post('/api/v1/projects/project-1/boards')
        .send({
          name: 'Test Board',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Board type is required');
    });

    it('should return 404 if project does not exist', async () => {
      mockBoardService.createBoard.mockRejectedValue(new Error('Project not found'));

      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app)
        .post('/api/v1/projects/non-existent-id/boards')
        .send({
          name: 'Test Board',
          board_type: BoardType.BASIC,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('GET /api/v1/projects/:id/boards', () => {
    it('should list all boards for a project', async () => {
      const mockBoards = [
        {
          id: 'board-1',
          projectId: 'project-1',
          name: 'Board 1',
          boardType: BoardType.BASIC,
          columns: [],
        },
        {
          id: 'board-2',
          projectId: 'project-1',
          name: 'Board 2',
          boardType: BoardType.STATUS,
          columns: [],
        },
      ];

      mockBoardService.listBoards.mockResolvedValue(mockBoards);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app).get('/api/v1/projects/project-1/boards');

      expect(response.status).toBe(200);
      expect(response.body.boards).toHaveLength(2);
      expect(mockBoardService.listBoards).toHaveBeenCalledWith('project-1');
    });
  });

  describe('GET /api/v1/boards/:id', () => {
    it('should get a board with columns and work packages', async () => {
      const mockBoard = {
        id: 'board-1',
        projectId: 'project-1',
        name: 'Test Board',
        boardType: BoardType.BASIC,
        columns: [
          { id: 'col-1', name: 'To Do', position: 0 },
          { id: 'col-2', name: 'Done', position: 1 },
        ],
        workPackages: [],
      };

      mockBoardService.getBoardWithWorkPackages.mockResolvedValue(mockBoard);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app).get('/api/v1/boards/board-1');

      expect(response.status).toBe(200);
      expect(response.body.board).toBeDefined();
      expect(response.body.board.columns).toHaveLength(2);
      expect(mockBoardService.getBoardWithWorkPackages).toHaveBeenCalledWith('board-1');
    });

    it('should return 404 if board does not exist', async () => {
      mockBoardService.getBoardWithWorkPackages.mockResolvedValue(null);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app).get('/api/v1/boards/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Board not found');
    });
  });

  describe('PATCH /api/v1/boards/:id', () => {
    it('should update a board', async () => {
      const mockBoard = {
        id: 'board-1',
        projectId: 'project-1',
        name: 'Updated Name',
        description: 'Updated description',
        boardType: BoardType.BASIC,
      };

      mockBoardService.updateBoard.mockResolvedValue(mockBoard);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app)
        .patch('/api/v1/boards/board-1')
        .send({
          name: 'Updated Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.board.name).toBe('Updated Name');
      expect(mockBoardService.updateBoard).toHaveBeenCalledWith('board-1', {
        name: 'Updated Name',
        description: 'Updated description',
        boardType: undefined,
        configuration: undefined,
      });
    });

    it('should return 404 if board does not exist', async () => {
      mockBoardService.updateBoard.mockRejectedValue(new Error('Board not found'));

      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app)
        .patch('/api/v1/boards/non-existent-id')
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Board not found');
    });
  });

  describe('DELETE /api/v1/boards/:id', () => {
    it('should delete a board', async () => {
      mockBoardService.deleteBoard.mockResolvedValue(true);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app).delete('/api/v1/boards/board-1');

      expect(response.status).toBe(204);
      expect(mockBoardService.deleteBoard).toHaveBeenCalledWith('board-1');
    });

    it('should return 404 if board does not exist', async () => {
      mockBoardService.deleteBoard.mockRejectedValue(new Error('Board not found'));

      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app).delete('/api/v1/boards/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Board not found');
    });
  });

  describe('POST /api/v1/boards/:id/columns', () => {
    it('should create a new column', async () => {
      const mockColumn = {
        id: 'col-1',
        boardId: 'board-1',
        name: 'New Column',
        position: 0,
        wipLimit: 5,
      };

      mockBoardService.createColumn.mockResolvedValue(mockColumn);

      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app)
        .post('/api/v1/boards/board-1/columns')
        .send({
          name: 'New Column',
          position: 0,
          status_mapping: 'new',
          wip_limit: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body.column).toBeDefined();
      expect(mockBoardService.createColumn).toHaveBeenCalledWith('board-1', {
        name: 'New Column',
        position: 0,
        statusMapping: 'new',
        wipLimit: 5,
      });
    });

    it('should return 400 if name is missing', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/v1', boardRoutes);

      const response = await request(app)
        .post('/api/v1/boards/board-1/columns')
        .send({
          position: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Column name is required');
    });
  });
});
