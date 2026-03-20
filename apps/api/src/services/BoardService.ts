import { Board, BoardType } from '../entities/Board';
import { BoardColumn } from '../entities/BoardColumn';
import { WorkPackage } from '../entities/WorkPackage';
import {
  BoardRepository,
  createBoardRepository,
  BoardWithColumns,
} from '../repositories/BoardRepository';
import {
  ProjectRepository,
  createProjectRepository,
} from '../repositories/ProjectRepository';
import {
  WorkPackageRepository,
  createWorkPackageRepository,
} from '../repositories/WorkPackageRepository';

export interface CreateBoardDTO {
  projectId: string;
  name: string;
  description?: string;
  boardType: BoardType;
  configuration?: Record<string, any>;
  columns?: CreateBoardColumnDTO[];
}

export interface CreateBoardColumnDTO {
  name: string;
  position: number;
  statusMapping?: string;
  wipLimit?: number;
}

export interface UpdateBoardDTO {
  name?: string;
  description?: string;
  boardType?: BoardType;
  configuration?: Record<string, any>;
}

export interface BoardWithWorkPackages extends BoardWithColumns {
  workPackages: WorkPackage[];
}

export class BoardService {
  private boardRepository: BoardRepository;
  private projectRepository: ProjectRepository;
  private workPackageRepository: WorkPackageRepository;

  constructor(
    boardRepository?: BoardRepository,
    projectRepository?: ProjectRepository,
    workPackageRepository?: WorkPackageRepository
  ) {
    this.boardRepository = boardRepository || createBoardRepository();
    this.projectRepository = projectRepository || createProjectRepository();
    this.workPackageRepository = workPackageRepository || createWorkPackageRepository();
  }

  /**
   * Create a new board with optional columns
   */
  async createBoard(data: CreateBoardDTO): Promise<BoardWithColumns> {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Board name is required');
    }

    if (!data.projectId) {
      throw new Error('Project ID is required');
    }

    if (!data.boardType) {
      throw new Error('Board type is required');
    }

    // Verify project exists
    const project = await this.projectRepository.findById(data.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Create the board
    const board = await this.boardRepository.create({
      projectId: data.projectId,
      name: data.name.trim(),
      description: data.description?.trim(),
      boardType: data.boardType,
      configuration: data.configuration,
    });

    // Create columns if provided
    const columns: BoardColumn[] = [];
    if (data.columns && data.columns.length > 0) {
      for (const columnData of data.columns) {
        const column = await this.boardRepository.createColumn({
          boardId: board.id,
          name: columnData.name,
          position: columnData.position,
          statusMapping: columnData.statusMapping,
          wipLimit: columnData.wipLimit,
        });
        columns.push(column);
      }
    }

    return {
      ...board,
      columns,
    };
  }

  /**
   * Get board by ID
   */
  async getBoardById(id: string): Promise<Board | null> {
    if (!id) {
      throw new Error('Board ID is required');
    }

    return await this.boardRepository.findById(id);
  }

  /**
   * Get board by ID with columns
   */
  async getBoardWithColumns(id: string): Promise<BoardWithColumns | null> {
    if (!id) {
      throw new Error('Board ID is required');
    }

    return await this.boardRepository.findByIdWithColumns(id);
  }

  /**
   * Get board by ID with columns and work packages
   */
  async getBoardWithWorkPackages(id: string): Promise<BoardWithWorkPackages | null> {
    if (!id) {
      throw new Error('Board ID is required');
    }

    const board = await this.boardRepository.findByIdWithColumns(id);
    if (!board) {
      return null;
    }

    // Get all work packages for the project
    const { workPackages } = await this.workPackageRepository.findAll({
      projectId: board.projectId,
      perPage: 10000, // Get all work packages
    });

    return {
      ...board,
      workPackages,
    };
  }

  /**
   * List all boards for a project
   */
  async listBoards(projectId: string): Promise<Board[]> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Verify project exists
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    return await this.boardRepository.findByProjectId(projectId);
  }

  /**
   * Update a board
   */
  async updateBoard(id: string, data: UpdateBoardDTO): Promise<Board | null> {
    if (!id) {
      throw new Error('Board ID is required');
    }

    // Check if board exists
    const exists = await this.boardRepository.exists(id);
    if (!exists) {
      throw new Error('Board not found');
    }

    // Trim string fields
    const updateData: UpdateBoardDTO = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
      if (updateData.name.length === 0) {
        throw new Error('Board name cannot be empty');
      }
    }
    if (data.description !== undefined) {
      updateData.description = data.description?.trim();
    }
    if (data.boardType !== undefined) {
      updateData.boardType = data.boardType;
    }
    if (data.configuration !== undefined) {
      updateData.configuration = data.configuration;
    }

    return await this.boardRepository.update(id, updateData);
  }

  /**
   * Delete a board
   */
  async deleteBoard(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Board ID is required');
    }

    // Check if board exists
    const exists = await this.boardRepository.exists(id);
    if (!exists) {
      throw new Error('Board not found');
    }

    return await this.boardRepository.delete(id);
  }

  /**
   * Create a board column
   */
  async createColumn(
    boardId: string,
    data: CreateBoardColumnDTO
  ): Promise<BoardColumn> {
    if (!boardId) {
      throw new Error('Board ID is required');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Column name is required');
    }

    // Verify board exists
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    return await this.boardRepository.createColumn({
      boardId,
      name: data.name.trim(),
      position: data.position,
      statusMapping: data.statusMapping,
      wipLimit: data.wipLimit,
    });
  }

  /**
   * Update a board column
   */
  async updateColumn(
    id: string,
    data: Partial<CreateBoardColumnDTO>
  ): Promise<BoardColumn | null> {
    if (!id) {
      throw new Error('Column ID is required');
    }

    // Trim name if provided
    if (data.name !== undefined) {
      data.name = data.name.trim();
      if (data.name.length === 0) {
        throw new Error('Column name cannot be empty');
      }
    }

    return await this.boardRepository.updateColumn(id, data);
  }

  /**
   * Delete a board column
   */
  async deleteColumn(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Column ID is required');
    }

    return await this.boardRepository.deleteColumn(id);
  }
}

export const createBoardService = (): BoardService => {
  return new BoardService();
};
