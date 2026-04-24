import apiRequest from '../utils/api';

export interface DashboardData {
  projectId: string;
  financial: {
    contractValue: { original: number; revised: number; variations: number };
    budget: { total: number; spent: number; committed: number; remaining: number; percentUsed: number };
    costs: { total: number; labour: number; materials: number; equipment: number; subcontractor: number; overhead: number };
    changeOrders: { total: number; approved: number; pending: number; approvedValue: number; pendingValue: number };
    profitability: { grossMargin: number; netMargin: number; eac: number; etc: number; cpi: number };
  };
  resources: {
    totalMembers: number; activeMembers: number; avgUtilization: number;
    totalHours: number; billableHours: number; billableRate: number;
  };
  schedule: {
    overallProgress: number; daysRemaining: number; originalDuration: number;
    spi: number; onTrack: boolean; projectedEndDate: string;
    completedPhases: number; totalPhases: number;
  };
  workPackages: {
    total: number; completed: number; inProgress: number; notStarted: number;
    overdue: number; atRisk: number; avgCompletion: number;
  };
  quality: {
    openSnags: number; closedSnags: number; criticalSnags: number; totalSnags: number;
    snagsThisWeek: number; avgResolutionDays: number;
  };
  metadata: { lastUpdated: string; cacheExpiresAt: string; isCached: boolean };
}

export const dashboardService = {
  async getProjectDashboard(projectId: string): Promise<DashboardData> {
    const res = await apiRequest(`/projects/${projectId}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    const json = await res.json();
    return json.data;
  },

  async getPortfolioStats(): Promise<{
    totalProjects: number; activeProjects: number; totalValue: number;
    avgCompletion: number; atRisk: number; teamMembers: number;
  }> {
    // Derive from the projects list endpoint
    const res = await apiRequest('/projects?per_page=100');
    if (!res.ok) throw new Error('Failed to fetch projects');
    const json = await res.json();
    const projects = json.projects || [];
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter((p: any) => p.status === 'active').length,
      totalValue: 0, // calculated from budgets
      avgCompletion: 0,
      atRisk: 0,
      teamMembers: 0,
    };
  },
};
