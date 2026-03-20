import { WorkCalendar, DayOfWeek } from '../entities/WorkCalendar';
import {
  WorkCalendarRepository,
  createWorkCalendarRepository,
} from '../repositories/WorkCalendarRepository';

export class WorkCalendarService {
  private repository: WorkCalendarRepository;

  constructor(repository?: WorkCalendarRepository) {
    this.repository = repository || createWorkCalendarRepository();
  }

  /**
   * Get calendar for a project, or default calendar if project doesn't have one
   */
  async getCalendarForProject(projectId: string): Promise<WorkCalendar> {
    // Try to get project-specific calendar
    const projectCalendar = await this.repository.findByProjectId(projectId);
    if (projectCalendar) {
      return projectCalendar;
    }

    // Fall back to default calendar
    const defaultCalendar = await this.repository.findDefault();
    if (defaultCalendar) {
      return defaultCalendar;
    }

    // If no default exists, create one
    return await this.createDefaultCalendar();
  }

  /**
   * Create a default work calendar (Monday-Friday, 8:00-17:00, 8 hours/day)
   */
  async createDefaultCalendar(): Promise<WorkCalendar> {
    return await this.repository.create({
      name: 'Default Work Calendar',
      description: 'Standard Monday-Friday work week, 8:00 AM - 5:00 PM',
      isDefault: true,
      workingDays: [
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
      ],
      workingHours: {
        startHour: 8,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
      },
      hoursPerDay: 8.0,
      holidays: [],
    });
  }

  /**
   * Create or update a project-specific calendar
   */
  async setProjectCalendar(
    projectId: string,
    calendarData: Partial<WorkCalendar>
  ): Promise<WorkCalendar> {
    // Check if project already has a calendar
    const existing = await this.repository.findByProjectId(projectId);

    if (existing) {
      // Update existing calendar
      const updated = await this.repository.update(existing.id, {
        ...calendarData,
        projectId, // Ensure projectId doesn't change
        isDefault: false, // Project calendars are never default
      });
      if (!updated) {
        throw new Error('Failed to update calendar');
      }
      return updated;
    } else {
      // Create new calendar
      return await this.repository.create({
        ...calendarData,
        projectId,
        isDefault: false,
      });
    }
  }

  /**
   * Check if a date is a working day
   */
  isWorkingDay(date: Date, calendar: WorkCalendar): boolean {
    const dayOfWeek = date.getDay() as DayOfWeek;

    // Check if day of week is a working day
    if (!calendar.workingDays.includes(dayOfWeek)) {
      return false;
    }

    // Check if date is a holiday
    const dateStr = this.formatDate(date);
    const isHoliday = calendar.holidays.some((holiday) => holiday.date === dateStr);

    return !isHoliday;
  }

  /**
   * Add working days to a date (skips non-working days)
   */
  addWorkingDays(startDate: Date, days: number, calendar: WorkCalendar): Date {
    if (days === 0) {
      return new Date(startDate);
    }

    const result = new Date(startDate);
    let remainingDays = Math.abs(days);
    const direction = days > 0 ? 1 : -1;

    while (remainingDays > 0) {
      result.setDate(result.getDate() + direction);

      if (this.isWorkingDay(result, calendar)) {
        remainingDays--;
      }
    }

    return result;
  }

  /**
   * Calculate the number of working days between two dates
   */
  calculateWorkingDays(startDate: Date, endDate: Date, calendar: WorkCalendar): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Reset time to midnight for accurate day calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start.getTime() > end.getTime()) {
      return 0;
    }

    let workingDays = 0;
    const current = new Date(start);

    while (current <= end) {
      if (this.isWorkingDay(current, calendar)) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Get the next working day from a given date
   */
  getNextWorkingDay(date: Date, calendar: WorkCalendar): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);

    while (!this.isWorkingDay(result, calendar)) {
      result.setDate(result.getDate() + 1);
    }

    return result;
  }

  /**
   * Get the previous working day from a given date
   */
  getPreviousWorkingDay(date: Date, calendar: WorkCalendar): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - 1);

    while (!this.isWorkingDay(result, calendar)) {
      result.setDate(result.getDate() - 1);
    }

    return result;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get all calendars
   */
  async getAllCalendars(): Promise<WorkCalendar[]> {
    return await this.repository.findAll();
  }

  /**
   * Get calendar by ID
   */
  async getCalendarById(id: string): Promise<WorkCalendar | null> {
    return await this.repository.findById(id);
  }

  /**
   * Delete a calendar
   */
  async deleteCalendar(id: string): Promise<boolean> {
    const calendar = await this.repository.findById(id);
    if (!calendar) {
      return false;
    }

    // Don't allow deleting the default calendar if it's the only one
    if (calendar.isDefault) {
      const allCalendars = await this.repository.findAll();
      if (allCalendars.length === 1) {
        throw new Error('Cannot delete the only default calendar');
      }
    }

    return await this.repository.delete(id);
  }
}

export const createWorkCalendarService = (): WorkCalendarService => {
  return new WorkCalendarService();
};
