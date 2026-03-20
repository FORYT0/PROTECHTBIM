/**
 * Board models for Agile and Kanban views
 */

export enum BoardType {
  BASIC = 'basic',
  STATUS = 'status',
  TEAM = 'team',
  VERSION = 'version',
}

export interface Board {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  board_type: BoardType;
  configuration?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  position: number;
  status_mapping?: string;
  wip_limit?: number;
  created_at: Date;
  updated_at: Date;
}
