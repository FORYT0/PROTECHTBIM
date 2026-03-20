/**
 * Work package models
 */

export enum WorkPackageType {
  TASK = 'task',
  MILESTONE = 'milestone',
  PHASE = 'phase',
  FEATURE = 'feature',
  BUG = 'bug',
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum SchedulingMode {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export enum RelationType {
  SUCCESSOR = 'successor',
  PREDECESSOR = 'predecessor',
  BLOCKS = 'blocks',
  BLOCKED_BY = 'blocked_by',
  RELATES_TO = 'relates_to',
  DUPLICATES = 'duplicates',
  PARENT = 'parent',
  CHILD = 'child',
}

export interface WorkPackage {
  id: string;
  project_id: string;
  type: WorkPackageType;
  subject: string;
  description: string;
  status: string;
  priority: Priority;
  assignee_id: string | null;
  accountable_id: string | null;
  watcher_ids: string[];
  parent_id: string | null;
  start_date: Date | null;
  due_date: Date | null;
  estimated_hours: number | null;
  spent_hours: number;
  progress_percent: number;
  scheduling_mode: SchedulingMode;
  version_id: string | null;
  sprint_id: string | null;
  story_points: number | null;
  created_at: Date;
  updated_at: Date;
  custom_fields: Record<string, unknown>;
}

export interface WorkPackageRelation {
  id: string;
  from_id: string;
  to_id: string;
  relation_type: RelationType;
  lag_days: number;
  created_at: Date;
}
