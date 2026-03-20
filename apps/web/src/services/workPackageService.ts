import apiRequest from '../utils/api';
import type {
  CreateWorkPackageRequest,
  CreateWorkPackageResponse,
  UpdateWorkPackageRequest,
  UpdateWorkPackageResponse,
  ListWorkPackagesResponse,
  WorkPackage,
  WorkPackageType,
  Priority,
} from '@protecht-bim/shared-types';

export interface ListWorkPackagesParams {
  project_id?: string;
  type?: WorkPackageType[];
  status?: string[];
  assignee_id?: string;
  priority?: Priority[];
  start_date_from?: Date;
  start_date_to?: Date;
  due_date_from?: Date;
  due_date_to?: Date;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const workPackageService = {
  async listWorkPackages(params: ListWorkPackagesParams = {}): Promise<ListWorkPackagesResponse> {
    const queryParams = new URLSearchParams();

    if (params.project_id) queryParams.append('project_id', params.project_id);
    if (params.type) params.type.forEach((t) => queryParams.append('type', t));
    if (params.status) params.status.forEach((s) => queryParams.append('status', s));
    if (params.assignee_id) queryParams.append('assignee_id', params.assignee_id);
    if (params.priority) params.priority.forEach((p) => queryParams.append('priority', p));
    if (params.start_date_from) queryParams.append('start_date_from', params.start_date_from.toISOString());
    if (params.start_date_to) queryParams.append('start_date_to', params.start_date_to.toISOString());
    if (params.due_date_from) queryParams.append('due_date_from', params.due_date_from.toISOString());
    if (params.due_date_to) queryParams.append('due_date_to', params.due_date_to.toISOString());
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const query = queryParams.toString();
    const endpoint = query ? `/work_packages?${query}` : '/work_packages';

    try {
      const response = await apiRequest(endpoint);

      if (!response.ok) {
        let errorMessage = 'Failed to fetch work packages';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (err) {
      console.error('WorkPackageService - listWorkPackages error:', err);
      throw err;
    }
  },

  async getWorkPackage(id: string): Promise<WorkPackage> {
    const response = await apiRequest(`/work_packages/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch work package');
    }

    const data = await response.json();
    return data.work_package;
  },

  async createWorkPackage(data: CreateWorkPackageRequest): Promise<CreateWorkPackageResponse> {
    console.log('WorkPackageService - Creating work package:', data);

    try {
      const response = await apiRequest('/work_packages', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      console.log('WorkPackageService - Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to create work package';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
          console.error('WorkPackageService - API error:', error);
        } catch (parseErr) {
          console.error('WorkPackageService - Failed to parse error response');
          errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('WorkPackageService - Work package created:', result);
      return result;
    } catch (err) {
      console.error('WorkPackageService - Exception:', err);
      throw err;
    }
  },

  async updateWorkPackage(id: string, data: UpdateWorkPackageRequest): Promise<UpdateWorkPackageResponse> {
    const response = await apiRequest(`/work_packages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update work package');
    }

    return response.json();
  },

  async deleteWorkPackage(id: string): Promise<void> {
    const response = await apiRequest(`/work_packages/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete work package');
    }
  },

  async getWorkPackages(params: ListWorkPackagesParams = {}): Promise<ListWorkPackagesResponse> {
    return this.listWorkPackages(params);
  },

  async getWorkPackageRelations(id: string): Promise<any[]> {
    const response = await apiRequest(`/work_packages/${id}/relations`);

    if (!response.ok) {
      throw new Error('Failed to fetch work package relations');
    }

    const data = await response.json();
    return data.relations || [];
  },

  async getBacklog(projectId: string): Promise<ListWorkPackagesResponse> {
    try {
      const response = await apiRequest(`/projects/${projectId}/backlog`);
      if (!response.ok) {
        throw new Error('Failed to fetch backlog');
      }
      return response.json();
    } catch (err) {
      console.error('WorkPackageService - getBacklog error:', err);
      throw err;
    }
  },
};
