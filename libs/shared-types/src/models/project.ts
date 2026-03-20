/**
 * Project hierarchy models
 */

export enum ProjectStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum LifecyclePhase {
  INITIATION = 'initiation',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  MONITORING = 'monitoring',
  CLOSURE = 'closure',
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
  custom_fields: Record<string, unknown>;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  portfolio_id: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
  custom_fields: Record<string, unknown>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  program_id: string | null;
  portfolio_id: string | null;
  owner_id: string;
  status: ProjectStatus;
  lifecycle_phase: LifecyclePhase;
  start_date: Date | null;
  end_date: Date | null;
  is_favorite: boolean;
  template_id: string | null;
  created_at: Date;
  updated_at: Date;
  custom_fields: Record<string, unknown>;
}
