/**
 * Burndown chart API request and response types
 */

import { BurndownChartData } from '../models/sprint-burndown';

export interface GetSprintBurndownRequest {
  sprint_id: string;
}

export interface GetSprintBurndownResponse {
  burndown: BurndownChartData;
}

export interface GetReleaseBurndownRequest {
  project_id: string;
  version_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface GetReleaseBurndownResponse {
  burndown: BurndownChartData;
}

export interface RecordBurndownSnapshotRequest {
  sprint_id: string;
  date?: string;
}

export interface RecordBurndownSnapshotResponse {
  success: boolean;
  snapshot: {
    date: string;
    remaining_story_points: number;
    completed_story_points: number;
    total_story_points: number;
  };
}
