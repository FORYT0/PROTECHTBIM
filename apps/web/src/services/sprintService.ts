import { apiRequest } from '../utils/api';
import {
  Sprint,
  CreateSprintRequest,
  CreateSprintResponse,
  ListSprintsRequest,
  ListSprintsResponse,
  GetSprintResponse,
  UpdateSprintRequest,
  UpdateSprintResponse,
} from '@protecht-bim/shared-types';

/**
 * Sprint service for managing sprints and sprint planning
 * Uses the project's native fetch-based apiRequest utility.
 */

export const sprintService = {
  /**
   * Create a new sprint
   */
  async createSprint(
    projectId: string,
    data: CreateSprintRequest
  ): Promise<Sprint> {
    const response = await apiRequest(`/projects/${projectId}/sprints`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json: CreateSprintResponse = await response.json();
    return json.sprint;
  },

  /**
   * List sprints for a project
   */
  async listSprints(
    projectId: string,
    params?: ListSprintsRequest
  ): Promise<ListSprintsResponse> {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    const response = await apiRequest(`/projects/${projectId}/sprints${query}`);
    return response.json() as Promise<ListSprintsResponse>;
  },

  /**
   * Get a sprint with work packages and stats
   */
  async getSprint(sprintId: string): Promise<GetSprintResponse> {
    const response = await apiRequest(`/sprints/${sprintId}`);
    return response.json() as Promise<GetSprintResponse>;
  },

  /**
   * Update a sprint
   */
  async updateSprint(
    sprintId: string,
    data: UpdateSprintRequest
  ): Promise<Sprint> {
    const response = await apiRequest(`/sprints/${sprintId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const json: UpdateSprintResponse = await response.json();
    return json.sprint;
  },

  /**
   * Delete a sprint
   */
  async deleteSprint(sprintId: string): Promise<void> {
    await apiRequest(`/sprints/${sprintId}`, { method: 'DELETE' });
  },

  /**
   * Add work packages to a sprint
   */
  async addWorkPackagesToSprint(
    sprintId: string,
    workPackageIds: string[]
  ): Promise<void> {
    await apiRequest(`/sprints/${sprintId}/work-packages`, {
      method: 'POST',
      body: JSON.stringify({ work_package_ids: workPackageIds }),
    });
  },

  /**
   * Remove work packages from sprint
   */
  async removeWorkPackagesFromSprint(workPackageIds: string[]): Promise<void> {
    await apiRequest('/sprints/work-packages', {
      method: 'DELETE',
      body: JSON.stringify({ work_package_ids: workPackageIds }),
    });
  },
};
