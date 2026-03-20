import apiRequest from '../utils/api';

export interface DailyReport {
  id: string;
  projectId: string;
  reportDate: string;
  weather?: string;
  temperature?: number;
  manpowerCount: number;
  equipmentCount: number;
  workCompleted?: string;
  workPlannedTomorrow?: string;
  delays?: string;
  safetyIncidents?: string;
  siteNotes?: string;
  visitorsOnSite?: string;
  materialsDelivered?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DelayEvent {
  id: string;
  dailyReportId?: string;
  projectId: string;
  delayType: string;
  description: string;
  estimatedImpactDays: number;
  costImpact: number;
  responsibleParty: string;
  status: string;
  mitigationAction?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const dailyReportService = {
  async getAllDailyReports(): Promise<DailyReport[]> {
    try {
      console.log('dailyReportService.getAllDailyReports called');
      const response = await apiRequest('/daily-reports');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch daily reports');
      }
      
      const data = await response.json();
      console.log('getAllDailyReports response:', data);
      return data.reports || [];
    } catch (error) {
      console.error('Error fetching daily reports:', error);
      throw error;
    }
  },

  async getDailyReportsByProject(projectId: string): Promise<DailyReport[]> {
    const response = await apiRequest(`/daily-reports/project/${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch daily reports');
    const data = await response.json();
    return data.dailyReports;
  },

  async createDailyReport(reportData: any): Promise<DailyReport> {
    const response = await apiRequest('/daily-reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
    if (!response.ok) throw new Error('Failed to create daily report');
    const data = await response.json();
    return data.dailyReport;
  },

  async getDelayEventsByProject(projectId: string): Promise<DelayEvent[]> {
    const response = await apiRequest(`/daily-reports/delay-events/project/${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch delay events');
    const data = await response.json();
    return data.delayEvents;
  },
};
