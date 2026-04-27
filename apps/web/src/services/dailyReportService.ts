import apiRequest from '../utils/api';

export interface DailyReport {
  id: string; projectId: string; reportDate: string; weather?: string;
  temperature?: number; manpowerCount: number; equipmentCount: number;
  workCompleted?: string; workPlannedTomorrow?: string; delays?: string;
  safetyIncidents?: string; siteNotes?: string; visitorsOnSite?: string;
  materialsDelivered?: string; createdBy: string; createdAt: string; updatedAt: string;
}

export const dailyReportService = {
  async getAllDailyReports(): Promise<DailyReport[]> {
    const r = await apiRequest('/daily-reports');
    if (!r.ok) throw new Error('Failed to fetch daily reports');
    return (await r.json()).reports || [];
  },

  async getDailyReportsByProject(projectId: string): Promise<DailyReport[]> {
    const r = await apiRequest(`/daily-reports/project/${projectId}`);
    if (!r.ok) throw new Error('Failed to fetch daily reports');
    return (await r.json()).dailyReports || [];
  },

  async createDailyReport(data: any): Promise<DailyReport> {
    const r = await apiRequest('/daily-reports', { method: 'POST', body: JSON.stringify(data) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create daily report');
    }
    return (await r.json()).dailyReport;
  },

  async updateDailyReport(id: string, data: any): Promise<DailyReport> {
    const r = await apiRequest(`/daily-reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update daily report');
    }
    return (await r.json()).dailyReport;
  },

  async getDelayEventsByProject(projectId: string): Promise<any[]> {
    const r = await apiRequest(`/daily-reports/delay-events/project/${projectId}`);
    if (!r.ok) throw new Error('Failed to fetch delay events');
    return (await r.json()).delayEvents || [];
  },
};
