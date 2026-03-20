import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { createBoardService } from '../services/BoardService';
import { BoardType } from '../entities/Board';

const router = Router();

/**
 * POST /api/v1/projects/:id/boards
 * Create a new board for a project
 */
router.post(
  '/projects/:id/boards',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const projectId = req.params.id;
      const { name, description, board_type, configuration, columns } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Board name is required' });
      }

      if (!board_type) {
        return res.status(400).json({ error: 'Board type is required' });
      }

      // Validate board type
      if (!Object.values(BoardType).includes(board_type)) {
        return res.status(400).json({
          error: `Invalid board type. Must be one of: ${Object.values(BoardType).join(', ')}`,
        });
      }

      const boardService = createBoardService();
      const board = await boardService.createBoard({
        projectId,
        name,
        description,
        boardType: board_type,
        configuration,
        columns,
      });

      return res.status(201).json({ board });
    } catch (error: any) {
      console.error('Error creating board:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message || 'Failed to create board' });
    }
  }
);

/**
 * GET /api/v1/projects/:id/boards
 * List all boards for a project
 */
router.get(
  '/projects/:id/boards',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const projectId = req.params.id;

      const boardService = createBoardService();
      const boards = await boardService.listBoards(projectId);

      return res.json({ boards });
    } catch (error: any) {
      console.error('Error listing boards:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message || 'Failed to list boards' });
    }
  }
);

/**
 * GET /api/v1/boards/:id
 * Get a specific board with columns and work packages
 */
router.get('/boards/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const boardId = req.params.id;

    const boardService = createBoardService();
    const board = await boardService.getBoardWithWorkPackages(boardId);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    return res.json({ board });
  } catch (error: any) {
    console.error('Error getting board:', error);
    return res.status(500).json({ error: error.message || 'Failed to get board' });
  }
});

/**
 * PATCH /api/v1/boards/:id
 * Update board configuration
 */
router.patch('/boards/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const boardId = req.params.id;
    const { name, description, board_type, configuration } = req.body;

    // Validate board type if provided
    if (board_type && !Object.values(BoardType).includes(board_type)) {
      return res.status(400).json({
        error: `Invalid board type. Must be one of: ${Object.values(BoardType).join(', ')}`,
      });
    }

    const boardService = createBoardService();
    const board = await boardService.updateBoard(boardId, {
      name,
      description,
      boardType: board_type,
      configuration,
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    return res.json({ board });
  } catch (error: any) {
    console.error('Error updating board:', error);

    if (error.message === 'Board not found') {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message || 'Failed to update board' });
  }
});

/**
 * DELETE /api/v1/boards/:id
 * Delete a board
 */
router.delete('/boards/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const boardId = req.params.id;

    const boardService = createBoardService();
    const deleted = await boardService.deleteBoard(boardId);

    if (!deleted) {
      return res.status(404).json({ error: 'Board not found' });
    }

    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting board:', error);

    if (error.message === 'Board not found') {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message || 'Failed to delete board' });
  }
});

/**
 * POST /api/v1/boards/:id/columns
 * Create a new column for a board
 */
router.post(
  '/boards/:id/columns',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const boardId = req.params.id;
      const { name, position, status_mapping, wip_limit } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Column name is required' });
      }

      if (position === undefined || position === null) {
        return res.status(400).json({ error: 'Column position is required' });
      }

      const boardService = createBoardService();
      const column = await boardService.createColumn(boardId, {
        name,
        position,
        statusMapping: status_mapping,
        wipLimit: wip_limit,
      });

      return res.status(201).json({ column });
    } catch (error: any) {
      console.error('Error creating column:', error);

      if (error.message === 'Board not found') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message || 'Failed to create column' });
    }
  }
);

/**
 * PATCH /api/v1/boards/columns/:id
 * Update a board column
 */
router.patch(
  '/boards/columns/:id',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const columnId = req.params.id;
      const { name, position, status_mapping, wip_limit } = req.body;

      const boardService = createBoardService();
      const column = await boardService.updateColumn(columnId, {
        name,
        position,
        statusMapping: status_mapping,
        wipLimit: wip_limit,
      });

      if (!column) {
        return res.status(404).json({ error: 'Column not found' });
      }

      return res.json({ column });
    } catch (error: any) {
      console.error('Error updating column:', error);
      return res.status(500).json({ error: error.message || 'Failed to update column' });
    }
  }
);

/**
 * DELETE /api/v1/boards/columns/:id
 * Delete a board column
 */
router.delete(
  '/boards/columns/:id',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const columnId = req.params.id;

      const boardService = createBoardService();
      const deleted = await boardService.deleteColumn(columnId);

      if (!deleted) {
        return res.status(404).json({ error: 'Column not found' });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting column:', error);
      return res.status(500).json({ error: error.message || 'Failed to delete column' });
    }
  }
);

export default router;
