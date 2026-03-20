/**
 * Sprint models for Agile project management
 */

export enum SprintStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: SprintStatus;
  start_date: Date;
  end_date: Date;
  capacity?: number;
  story_points?: number;
  created_at: Date;
  updated_at: Date;
}
