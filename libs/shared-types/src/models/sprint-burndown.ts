/**
 * Sprint burndown models for tracking remaining work over time
 */

export interface SprintBurndown {
  id: string;
  sprint_id: string;
  date: Date;
  remaining_story_points: number;
  completed_story_points: number;
  total_story_points: number;
  created_at: Date;
}

export interface BurndownDataPoint {
  date: string;
  remaining: number;
  completed: number;
  ideal: number;
}

export interface BurndownChartData {
  sprint_id: string;
  sprint_name: string;
  start_date: string;
  end_date: string;
  total_story_points: number;
  data_points: BurndownDataPoint[];
}
