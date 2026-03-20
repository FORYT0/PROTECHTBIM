/**
 * User and authentication models
 */

export enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  TEAM_MEMBER = 'team_member',
  VIEWER = 'viewer',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  weekly_capacity_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}
