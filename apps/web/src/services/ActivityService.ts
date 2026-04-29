import axios, { AxiosInstance } from 'axios';
import { getAuthToken } from '../utils/api';

export enum ActivityActionType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  COMMENTED = 'COMMENTED',
  ATTACHED = 'ATTACHED',
  MENTIONED = 'MENTIONED',
  TRANSITIONED = 'TRANSITIONED',
  ASSIGNED = 'ASSIGNED',
  SHARED = 'SHARED',
}

export enum ActivityEntityType {
  PROJECT = 'Project',
  WORK_PACKAGE = 'WorkPackage',
  TIME_ENTRY = 'TimeEntry',
  COST_ENTRY = 'CostEntry',
  COMMENT = 'Comment',
  ATTACHMENT = 'Attachment',
  WIKI_PAGE = 'WikiPage',
  SPRINT = 'Sprint',
  BOARD = 'Board',
  BASELINE = 'Baseline',
}

export interface Activity {
  id: string;
  project_id: string;
  work_package_id?: string | null;
  user_id: string;
  user_name?: string;
  user_email?: string;
  action_type: ActivityActionType;
  entity_type: ActivityEntityType;
  entity_id: string;
  description: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface ActivityFilters {
  action_type?: ActivityActionType;
  entity_type?: ActivityEntityType;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface ActivityListResult {
  activities: Activity[];
  total: number;
  page: number;
  per_page: number;
}

export interface ActivitySummary {
  project_id: string;
  days: number;
  total_activities: number;
  by_action_type: Record<string, number>;
  by_entity_type: Record<string, number>;
}

export interface AvailableFilters {
  action_types: ActivityActionType[];
  entity_types: ActivityEntityType[];
  description: string;
}

class ActivityService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 
    (import.meta.env.PROD ? '/api/v1' : '${API_BASE}')) {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get activities for a specific project
   */
  async getProjectActivities(
    projectId: string,
    filters?: ActivityFilters
  ): Promise<ActivityListResult> {
    const response = await this.api.get<ActivityListResult>(
      `/projects/${projectId}/activity`,
      {
        params: {
          action_type: filters?.action_type,
          entity_type: filters?.entity_type,
          user_id: filters?.user_id,
          date_from: filters?.date_from,
          date_to: filters?.date_to,
          page: filters?.page ?? 1,
          per_page: filters?.per_page ?? 20,
          sort_by: filters?.sort_by ?? 'createdAt',
          sort_order: filters?.sort_order ?? 'DESC',
        },
      }
    );
    return response.data;
  }

  /**
   * Get activities for a specific work package
   */
  async getWorkPackageActivities(
    workPackageId: string,
    filters?: ActivityFilters
  ): Promise<ActivityListResult> {
    const response = await this.api.get<ActivityListResult>(
      `/work_packages/${workPackageId}/activity`,
      {
        params: {
          action_type: filters?.action_type,
          entity_type: filters?.entity_type,
          user_id: filters?.user_id,
          date_from: filters?.date_from,
          date_to: filters?.date_to,
          page: filters?.page ?? 1,
          per_page: filters?.per_page ?? 20,
          sort_by: filters?.sort_by ?? 'createdAt',
          sort_order: filters?.sort_order ?? 'DESC',
        },
      }
    );
    return response.data;
  }

  /**
   * Get current user's activity feed
   */
  async getUserActivityFeed(filters?: ActivityFilters): Promise<ActivityListResult> {
    const response = await this.api.get<ActivityListResult>('/activity/feed', {
      params: {
        action_type: filters?.action_type,
        entity_type: filters?.entity_type,
        date_from: filters?.date_from,
        date_to: filters?.date_to,
        page: filters?.page ?? 1,
        per_page: filters?.per_page ?? 20,
        sort_by: filters?.sort_by ?? 'createdAt',
        sort_order: filters?.sort_order ?? 'DESC',
      },
    });
    return response.data;
  }

  /**
   * Get available activity filters
   */
  async getAvailableFilters(): Promise<AvailableFilters> {
    const response = await this.api.get<AvailableFilters>('/activity/filters');
    return response.data;
  }

  /**
   * Get activity summary for a project
   */
  async getActivitySummary(
    projectId: string,
    days: number = 7
  ): Promise<ActivitySummary> {
    const response = await this.api.get<ActivitySummary>(
      `/activity/summary/${projectId}`,
      {
        params: { days },
      }
    );
    return response.data;
  }

  /**
   * Get recent activities for a project
   */
  async getRecentActivities(
    projectId: string,
    limit: number = 10
  ): Promise<Activity[]> {
    const response = await this.api.get<{ activities: Activity[]; count: number }>(
      `/activity/recent/${projectId}`,
      {
        params: { limit },
      }
    );
    return response.data.activities;
  }
}

export default ActivityService;
