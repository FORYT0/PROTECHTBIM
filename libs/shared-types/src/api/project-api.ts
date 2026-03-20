/**
 * Project API interfaces
 */

import { Project, ProjectStatus, LifecyclePhase } from '../models/project';

export interface ListProjectsRequest {
  portfolio_id?: string;
  program_id?: string;
  status?: ProjectStatus[];
  owner_id?: string;
  favorites_only?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ListProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  per_page: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  program_id?: string;
  portfolio_id?: string;
  template_id?: string;
  start_date?: Date;
  end_date?: Date;
  custom_fields?: Record<string, unknown>;
}

export interface CreateProjectResponse {
  project: Project;
}

export interface TransitionPhaseRequest {
  new_phase: LifecyclePhase;
}

export interface TransitionPhaseResponse {
  project: Project;
  message: string;
}
