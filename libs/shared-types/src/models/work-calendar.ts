export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export interface WorkingHours {
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
}

export interface Holiday {
  date: string; // ISO date string (YYYY-MM-DD)
  name: string;
}

export interface WorkCalendar {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  isDefault: boolean;
  workingDays: DayOfWeek[];
  workingHours: WorkingHours;
  hoursPerDay: number;
  holidays: Holiday[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkCalendarRequest {
  name: string;
  description?: string;
  workingDays?: DayOfWeek[];
  workingHours?: WorkingHours;
  hoursPerDay?: number;
  holidays?: Holiday[];
}

export interface UpdateWorkCalendarRequest {
  name?: string;
  description?: string;
  workingDays?: DayOfWeek[];
  workingHours?: WorkingHours;
  hoursPerDay?: number;
  holidays?: Holiday[];
}
