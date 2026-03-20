import apiRequest from '../utils/api';
import type {
  ListProjectsRequest,
  ListProjectsResponse,
  CreateProjectRequest,
  CreateProjectResponse,
} from '@protecht-bim/shared-types';
import type { Project } from '@protecht-bim/shared-types';

export const projectService = {
  async listProjects(params: ListProjectsRequest = {}): Promise<ListProjectsResponse> {
    const queryParams = new URLSearchParams();

    if (params.portfolio_id) queryParams.append('portfolio_id', params.portfolio_id);
    if (params.program_id) queryParams.append('program_id', params.program_id);
    if (params.status) params.status.forEach((s: string) => queryParams.append('status', s));
    if (params.owner_id) queryParams.append('owner_id', params.owner_id);
    if (params.favorites_only) queryParams.append('favorites_only', 'true');
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const query = queryParams.toString();
    const endpoint = query ? `/projects?${query}` : '/projects';

    const response = await apiRequest(endpoint);

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  },

  async getProject(id: string): Promise<Project> {
    const response = await apiRequest(`/projects/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    const data = await response.json();
    return data.project;
  },

  async createProject(data: CreateProjectRequest): Promise<CreateProjectResponse> {
    const response = await apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create project');
    }

    return response.json();
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await apiRequest(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update project');
    }

    return response.json();
  },

  async deleteProject(id: string): Promise<void> {
    const response = await apiRequest(`/projects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  },

  async toggleFavorite(id: string, isFavorite: boolean): Promise<Project> {
    return this.updateProject(id, { is_favorite: isFavorite });
  },

  async getGanttData(
    projectId: string,
    params: {
      start_date?: string;
      end_date?: string;
      include_relations?: boolean;
    } = {}
  ): Promise<{
    work_packages: any[];
    relations: any[];
  }> {
    const queryParams = new URLSearchParams();

    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.include_relations !== undefined) {
      queryParams.append('include_relations', params.include_relations.toString());
    }

    const query = queryParams.toString();
    const endpoint = query
      ? `/projects/${projectId}/gantt?${query}`
      : `/projects/${projectId}/gantt`;

    const response = await apiRequest(endpoint);

    if (!response.ok) {
      throw new Error('Failed to fetch Gantt data');
    }

    return response.json();
  },

  async getProjectSnapshot(projectId: string): Promise<any> {
    const response = await apiRequest(`/projects/${projectId}/snapshot`);

    if (!response.ok) {
      throw new Error('Failed to fetch project snapshot');
    }

    const data = await response.json();
    return data.snapshot;
  },
};
