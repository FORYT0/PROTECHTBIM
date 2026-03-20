/**
 * Sprint API request and response types
 */

import { Sprint, SprintStatus } from '../models/sprint';

export interface CreateSprintRequest {
  name: string;
  description?: string;
  start_date: Date | string;
  end_date: Date | string;
  capacity?: number;
}

export interface CreateSprintResponse {
  sprint: Sprint;
}

export interface ListSprintsRequest {
  status?: SprintStatus;
  page?: number;
  per_page?: number;
}

export interface ListSprintsResponse {
  sprints: Sprint[];
  total: number;
  page: number;
  per_page: number;
}

export interface GetSprintResponse {
  sprint: Sprint;
  work_packages?: any[];
  total_story_points?: number;
}

export interface UpdateSprintRequest {
  name?: string;
  description?: string;
  status?: SprintStatus;
  start_date?: Date | string;
  end_date?: Date | string;
  capacity?: number;
}

export interface UpdateSprintResponse {
  sprint: Sprint;
}
