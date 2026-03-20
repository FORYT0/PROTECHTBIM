import axios, { AxiosInstance } from 'axios';

export interface TimeEntry {
  id: string;
  work_package_id: string;
  user_id: string;
  hours: number;
  date: string | Date;
  comment?: string | null;
  billable: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  work_package?: {
    id: string;
    subject: string;
    project_id: string;
  };
}

export interface TimeEntryFilters {
  work_package_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  billable?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface TimeEntryListResult {
  time_entries: TimeEntry[];
  total: number;
  page: number;
  per_page: number;
}

export interface CreateTimeEntryPayload {
  work_package_id: string;
  hours: number;
  date: Date | string;
  comment?: string;
  billable?: boolean;
}

export interface UpdateTimeEntryPayload {
  hours?: number;
  date?: Date | string;
  comment?: string;
  billable?: boolean;
}

export interface BulkTimeEntryPayload {
  entries: CreateTimeEntryPayload[];
}

class TimeEntryService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Create a new time entry
   */
  async createTimeEntry(data: CreateTimeEntryPayload): Promise<TimeEntry> {
    const response = await this.api.post<{ time_entry: TimeEntry }>(
      '/time_entries',
      {
        work_package_id: data.work_package_id,
        hours: data.hours,
        date: data.date,
        comment: data.comment,
        billable: data.billable ?? false,
      }
    );
    return response.data.time_entry;
  }

  /**
   * List time entries with optional filtering
   */
  async listTimeEntries(filters?: TimeEntryFilters): Promise<TimeEntryListResult> {
    const response = await this.api.get<TimeEntryListResult>('/time_entries', {
      params: {
        work_package_id: filters?.work_package_id,
        user_id: filters?.user_id,
        date_from: filters?.date_from,
        date_to: filters?.date_to,
        billable: filters?.billable,
        page: filters?.page ?? 1,
        per_page: filters?.per_page ?? 20,
        sort_by: filters?.sort_by ?? 'date',
        sort_order: filters?.sort_order ?? 'DESC',
      },
    });
    return response.data;
  }

  /**
   * Get a single time entry by ID
   */
  async getTimeEntry(id: string): Promise<TimeEntry> {
    const response = await this.api.get<{ time_entry: TimeEntry }>(
      `/time_entries/${id}`
    );
    return response.data.time_entry;
  }

  /**
   * Update a time entry
   */
  async updateTimeEntry(
    id: string,
    data: UpdateTimeEntryPayload
  ): Promise<TimeEntry> {
    const response = await this.api.patch<{ time_entry: TimeEntry }>(
      `/time_entries/${id}`,
      {
        hours: data.hours,
        date: data.date,
        comment: data.comment,
        billable: data.billable,
      }
    );
    return response.data.time_entry;
  }

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(id: string): Promise<void> {
    await this.api.delete(`/time_entries/${id}`);
  }

  /**
   * Get total hours for a work package
   */
  async getTotalHoursByWorkPackage(workPackageId: string): Promise<number> {
    const response = await this.api.get<{ total_hours: number }>(
      `/time_entries/work_package/${workPackageId}/total`
    );
    return response.data.total_hours;
  }

  /**
   * Get total hours for a user (optionally within date range)
   */
  async getTotalHoursByUser(
    userId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<number> {
    const response = await this.api.get<{ total_hours: number }>(
      `/time_entries/user/${userId}/total`,
      {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
        },
      }
    );
    return response.data.total_hours;
  }

  /**
   * Bulk create time entries
   */
  async bulkCreateTimeEntries(payload: BulkTimeEntryPayload): Promise<any> {
    const response = await this.api.post('/time_entries/bulk', payload);
    return response.data;
  }

  /**
   * Get daily time entries for a specific date
   */
  async getDailyTimeEntries(date: Date, userId?: string): Promise<TimeEntry[]> {
    const dateStr = date.toISOString().split('T')[0];
    const result = await this.listTimeEntries({
      user_id: userId,
      date_from: dateStr,
      date_to: dateStr,
      per_page: 100,
    });
    return result.time_entries;
  }

  /**
   * Get weekly time entries for a week
   */
  async getWeeklyTimeEntries(
    startDate: Date,
    userId?: string
  ): Promise<TimeEntry[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const result = await this.listTimeEntries({
      user_id: userId,
      date_from: startStr,
      date_to: endStr,
      per_page: 100,
    });
    return result.time_entries;
  }
}

export default TimeEntryService;
