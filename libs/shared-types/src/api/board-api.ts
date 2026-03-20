import { Board, BoardColumn, BoardType } from '../models/board';
import { WorkPackage } from '../models/work-package';

/**
 * Board API request and response types
 */

// Create Board
export interface CreateBoardRequest {
  name: string;
  description?: string;
  board_type: BoardType;
  configuration?: Record<string, unknown>;
  columns?: CreateBoardColumnRequest[];
}

export interface CreateBoardColumnRequest {
  name: string;
  position: number;
  status_mapping?: string;
  wip_limit?: number;
}

export interface CreateBoardResponse {
  board: Board & {
    columns: BoardColumn[];
  };
}

// List Boards
export interface ListBoardsResponse {
  boards: Board[];
}

// Get Board
export interface GetBoardResponse {
  board: Board & {
    columns: BoardColumn[];
    workPackages: WorkPackage[];
  };
}

// Update Board
export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  board_type?: BoardType;
  configuration?: Record<string, unknown>;
}

export interface UpdateBoardResponse {
  board: Board;
}

// Create Column
export interface CreateColumnRequest {
  name: string;
  position: number;
  status_mapping?: string;
  wip_limit?: number;
}

export interface CreateColumnResponse {
  column: BoardColumn;
}

// Update Column
export interface UpdateColumnRequest {
  name?: string;
  position?: number;
  status_mapping?: string;
  wip_limit?: number;
}

export interface UpdateColumnResponse {
  column: BoardColumn;
}
