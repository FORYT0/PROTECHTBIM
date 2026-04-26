import apiRequest from '../utils/api';

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
  user?: { id: string; email: string; name: string; };
  work_package?: { id: string; subject: string; project_id: string; };
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

// Format date consistently as YYYY-MM-DD
const toDateStr = (d: Date | string): string => {
  if (typeof d === 'string') {
    // Already a date string — ensure it's just YYYY-MM-DD
    return d.split('T')[0];
  }
  return d.toISOString().split('T')[0];
};

class TimeEntryService {
  async createTimeEntry(data: CreateTimeEntryPayload): Promise<TimeEntry> {
    const response = await apiRequest('/time_entries', {
      method: 'POST',
      body: JSON.stringify({
        work_package_id: data.work_package_id,
        hours: data.hours,
        date: toDateStr(data.date),
        comment: data.comment,
        billable: data.billable ?? false,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create time entry');
    }
    const json = await response.json();
    return json.time_entry;
  }

  async listTimeEntries(filters?: TimeEntryFilters): Promise<TimeEntryListResult> {
    const params = new URLSearchParams();
    if (filters?.work_package_id) params.set('work_package_id', filters.work_package_id);
    if (filters?.user_id) params.set('user_id', filters.user_id);
    if (filters?.date_from) params.set('date_from', toDateStr(filters.date_from));
    if (filters?.date_to) params.set('date_to', toDateStr(filters.date_to));
    if (filters?.billable !== undefined) params.set('billable', String(filters.billable));
    params.set('page', String(filters?.page ?? 1));
    params.set('per_page', String(filters?.per_page ?? 50));
    params.set('sort_by', filters?.sort_by ?? 'date');
    params.set('sort_order', filters?.sort_order ?? 'DESC');

    const response = await apiRequest(`/time_entries?${params}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to list time entries');
    }
    return response.json();
  }

  async getTimeEntry(id: string): Promise<TimeEntry> {
    const response = await apiRequest(`/time_entries/${id}`);
    if (!response.ok) throw new Error('Failed to get time entry');
    const json = await response.json();
    return json.time_entry;
  }

  async updateTimeEntry(id: string, data: UpdateTimeEntryPayload): Promise<TimeEntry> {
    const body: any = {};
    if (data.hours !== undefined) body.hours = data.hours;
    if (data.date !== undefined) body.date = toDateStr(data.date);
    if (data.comment !== undefined) body.comment = data.comment;
    if (data.billable !== undefined) body.billable = data.billable;

    const response = await apiRequest(`/time_entries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update time entry');
    }
    const json = await response.json();
    return json.time_entry;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    const response = await apiRequest(`/time_entries/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete time entry');
  }

  async getTotalHoursByWorkPackage(workPackageId: string): Promise<number> {
    const response = await apiRequest(`/time_entries/work_package/${workPackageId}/total`);
    if (!response.ok) return 0;
    const json = await response.json();
    return json.total_hours ?? 0;
  }

  async getTotalHoursByUser(userId: string, dateFrom?: string, dateTo?: string): Promise<number> {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', toDateStr(dateFrom));
    if (dateTo) params.set('date_to', toDateStr(dateTo));
    const response = await apiRequest(`/time_entries/user/${userId}/total?${params}`);
    if (!response.ok) return 0;
    const json = await response.json();
    return json.total_hours ?? 0;
  }

  async bulkCreateTimeEntries(payload: BulkTimeEntryPayload): Promise<any> {
    const response = await apiRequest('/time_entries/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to bulk create time entries');
    }
    return response.json();
  }

  async getDailyTimeEntries(date: Date, userId?: string): Promise<TimeEntry[]> {
    const dateStr = toDateStr(date);
    const result = await this.listTimeEntries({
      user_id: userId, date_from: dateStr, date_to: dateStr, per_page: 100,
    });
    return result.time_entries;
  }

  async getWeeklyTimeEntries(startDate: Date, userId?: string): Promise<TimeEntry[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const result = await this.listTimeEntries({
      user_id: userId,
      date_from: toDateStr(startDate),
      date_to: toDateStr(endDate),
      per_page: 200,
    });
    return result.time_entries;
  }
}

export default TimeEntryService;
