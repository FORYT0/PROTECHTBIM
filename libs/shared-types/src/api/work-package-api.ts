/**
 * Work Package API interfaces
 */

import { WorkPackage, WorkPackageType, Priority, RelationType, WorkPackageRelation } from '../models/work-package';

export interface CreateWorkPackageRequest {
  project_id: string;
  type: WorkPackageType;
  subject: string;
  description?: string;
  assignee_id?: string;
  parent_id?: string;
  start_date?: Date;
  due_date?: Date;
  estimated_hours?: number;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateWorkPackageRequest {
  subject?: string;
  description?: string;
  status?: string;
  priority?: Priority;
  assignee_id?: string;
  start_date?: Date;
  due_date?: Date;
  progress_percent?: number;
  custom_fields?: Record<string, unknown>;
}

export interface CreateRelationRequest {
  to_id: string;
  relation_type: RelationType;
  lag_days?: number;
}

export interface CreateRelationResponse {
  relation: WorkPackageRelation;
}

export interface ListRelationsResponse {
  relations: WorkPackageRelation[];
}

export interface ListWorkPackagesResponse {
  work_packages: WorkPackage[];
  total: number;
  page: number;
  per_page: number;
}

export interface CreateWorkPackageResponse {
  work_package: WorkPackage;
}

export interface GetWorkPackageResponse {
  work_package: WorkPackage;
}

export interface UpdateWorkPackageResponse {
  work_package: WorkPackage;
}

// Watcher API interfaces
export interface AddWatcherRequest {
  user_id: string;
}

export interface WatcherResponse {
  work_package_id: string;
  user_id: string;
  created_at: Date;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface AddWatcherResponse {
  watcher: WatcherResponse;
}

export interface ListWatchersResponse {
  watchers: WatcherResponse[];
}
