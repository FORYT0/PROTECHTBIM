import { Repository, DataSource } from 'typeorm';
import { Board, BoardType } from '../entities/Board';
import { BoardColumn } from '../entities/BoardColumn';
import { AppDataSource } from '../config/data-source';

export interface CreateBoardData {
  projectId: string;
  name: string;
  description?: string;
  boardType: BoardType;
  configuration?: Record<string, any>;
}

export interface UpdateBoardData {
  name?: string;
  description?: string;
  boardType?: BoardType;
  configuration?: Record<string, any>;
}

export interface CreateBoardColumnData {
  boardId: string;
  name: string;
  position: number;
  statusMapping?: string;
  wipLimit?: number;
}

export interface BoardWithColumns extends Board {
  columns: BoardColumn[];
}

export class BoardRepository {
  private repository: Repository<Board>;
  private columnRepository: Repository<BoardColumn>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Board);
    this.columnRepository = dataSource.getRepository(BoardColumn);
  }

  /**
   * Create a new board
   */
  async create(data: CreateBoardData): Promise<Board> {
    const board = this.repository.create({
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      boardType: data.boardType,
      configuration: data.configuration,
    });

    return await this.repository.save(board);
  }

  /**
   * Find board by ID
   */
  async findById(id: string): Promise<Board | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['project'],
    });
  }

  /**
   * Find board by ID with columns
   */
  async findByIdWithColumns(id: string): Promise<BoardWithColumns | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['project', 'columns'],
      order: {
        columns: {
          position: 'ASC',
        },
      },
    });
  }

  /**
   * Find all boards for a project
   */
  async findByProjectId(projectId: string): Promise<Board[]> {
    return await this.repository.find({
      where: { projectId },
      relations: ['columns'],
      order: {
        createdAt: 'DESC',
        columns: {
          position: 'ASC',
        },
      },
    });
  }

  /**
   * Update a board
   */
  async update(id: string, data: UpdateBoardData): Promise<Board | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  /**
   * Delete a board
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Check if board exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Create a board column
   */
  async createColumn(data: CreateBoardColumnData): Promise<BoardColumn> {
    const column = this.columnRepository.create(data);
    return await this.columnRepository.save(column);
  }

  /**
   * Get columns for a board
   */
  async getColumns(boardId: string): Promise<BoardColumn[]> {
    return await this.columnRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });
  }

  /**
   * Update a board column
   */
  async updateColumn(
    id: string,
    data: Partial<CreateBoardColumnData>
  ): Promise<BoardColumn | null> {
    await this.columnRepository.update(id, data);
    return await this.columnRepository.findOne({ where: { id } });
  }

  /**
   * Delete a board column
   */
  async deleteColumn(id: string): Promise<boolean> {
    const result = await this.columnRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

export const createBoardRepository = (
  dataSource: DataSource = AppDataSource
): BoardRepository => {
  return new BoardRepository(dataSource);
};
