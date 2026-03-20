import apiRequest from '../utils/api';
import type {
  CreateBoardRequest,
  CreateBoardResponse,
  ListBoardsResponse,
  GetBoardResponse,
  UpdateBoardRequest,
  UpdateBoardResponse,
} from '@protecht-bim/shared-types';

export const boardService = {
  /**
   * Create a new board for a project
   */
  async createBoard(projectId: string, data: CreateBoardRequest): Promise<CreateBoardResponse> {
    const response = await apiRequest(`/projects/${projectId}/boards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create board');
    }

    return response.json();
  },

  /**
   * List all boards for a project
   */
  async listBoards(projectId: string): Promise<ListBoardsResponse> {
    const response = await apiRequest(`/projects/${projectId}/boards`);

    if (!response.ok) {
      throw new Error('Failed to fetch boards');
    }

    return response.json();
  },

  /**
   * Get a specific board with columns and work packages
   */
  async getBoard(boardId: string): Promise<GetBoardResponse> {
    const response = await apiRequest(`/boards/${boardId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch board');
    }

    return response.json();
  },

  /**
   * Update board configuration
   */
  async updateBoard(boardId: string, data: UpdateBoardRequest): Promise<UpdateBoardResponse> {
    const response = await apiRequest(`/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update board');
    }

    return response.json();
  },

  /**
   * Delete a board
   */
  async deleteBoard(boardId: string): Promise<void> {
    const response = await apiRequest(`/boards/${boardId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete board');
    }
  },
};
