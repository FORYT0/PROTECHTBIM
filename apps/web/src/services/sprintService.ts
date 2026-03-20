import api from '../utils/api';
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
 */

export const sprintService = {
  /**
   * Create a new sprint
   */
  async createSprint(
    projectId: string,
    data: CreateSprintRequest
  ): Promise<Sprint> {
    const response = await api.post<CreateSprintResponse>(
      `/projects/${projectId}/sprints`,
      data
    );
    return response.data.sprint;
  },

  /**
   * List sprints for a project
   */
  async listSprints(
    projectId: string,
    params?: ListSprintsRequest
  ): Promise<ListSprintsResponse> {
    const response = await api.get<ListSprintsResponse>(
      `/projects/${projectId}/sprints`,
      { params }
    );
    return response.data;
  },

  /**
   * Get a sprint with work packages and stats
   */
  async getSprint(sprintId: string): Promise<GetSprintResponse> {
    const response = await api.get<GetSprintResponse>(`/sprints/${sprintId}`);
    return response.data;
  },

  /**
   * Update a sprint
   */
  async updateSprint(
    sprintId: string,
    data: UpdateSprintRequest
  ): Promise<Sprint> {
    const response = await api.patch<UpdateSprintResponse>(
      `/sprints/${sprintId}`,
      data
    );
    return response.data.sprint;
  },

  /**
   * Delete a sprint
   */
  async deleteSprint(sprintId: string): Promise<void> {
    await api.delete(`/sprints/${sprintId}`);
  },

  /**
   * Add work packages to a sprint
   */
  async addWorkPackagesToSprint(
    sprintId: string,
    workPackageIds: string[]
  ): Promise<void> {
    await api.post(`/sprints/${sprintId}/work-packages`, {
      work_package_ids: workPackageIds,
    });
  },

  /**
   * Remove work packages from sprint
   */
  async removeWorkPackagesFromSprint(workPackageIds: string[]): Promise<void> {
    await api.delete('/sprints/work-packages', {
      data: { work_package_ids: workPackageIds },
    });
  },
};
