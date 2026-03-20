import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * 
 * This is the SINGLE SOURCE OF TRUTH for all server state management.
 * 
 * RULES:
 * 1. All API data fetching goes through React Query
 * 2. Never use useState for server data
 * 3. Use query keys consistently across the app
 * 4. Invalidate queries after mutations
 * 5. Let React Query handle caching, refetching, and background updates
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh
      staleTime: 30 * 1000, // 30 seconds

      // Cache time: How long unused data stays in cache
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

      // Retry failed requests
      retry: 1,

      // Refetch on window focus (good for real-time feel)
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations
      retry: 0,
    },
  },
});

/**
 * Query Keys
 * 
 * Centralized query keys for consistency and easy invalidation.
 * Use these keys throughout the app.
 */
export const queryKeys = {
  // Projects
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  projectFinancialSummary: (id: string) => ['projects', id, 'financial-summary'] as const,
  projectCostSummary: (id: string) => ['projects', id, 'cost-summary'] as const,
  projectBudgetUtilization: (id: string) => ['projects', id, 'budget-utilization'] as const,

  // ✅ UNIFIED DASHBOARD - Single source of truth for all project data
  projectDashboard: (id: string) => ['projects', id, 'dashboard'] as const,
  projectDashboardFinancial: (id: string) => ['projects', id, 'dashboard', 'financial'] as const,
  projectDashboardResources: (id: string) => ['projects', id, 'dashboard', 'resources'] as const,
  projectDashboardSchedule: (id: string) => ['projects', id, 'dashboard', 'schedule'] as const,
  projectDashboardAnalytics: (id: string) => ['projects', id, 'dashboard', 'analytics'] as const,

  // Budgets
  budgets: ['budgets'] as const,
  budget: (id: string) => ['budgets', id] as const,
  projectBudget: (projectId: string) => ['projects', projectId, 'budget'] as const,

  // Cost Entries
  costEntries: ['cost-entries'] as const,
  costEntry: (id: string) => ['cost-entries', id] as const,
  projectCostEntries: (projectId: string) => ['projects', projectId, 'cost-entries'] as const,

  // Time Entries
  timeEntries: ['time-entries'] as const,
  timeEntry: (id: string) => ['time-entries', id] as const,
  projectTimeEntries: (projectId: string) => ['projects', projectId, 'time-entries'] as const,

  // Work Packages
  workPackages: ['work-packages'] as const,
  workPackage: (id: string) => ['work-packages', id] as const,
  projectWorkPackages: (projectId: string) => ['projects', projectId, 'work-packages'] as const,

  // Cost Codes
  costCodes: ['cost-codes'] as const,
  costCode: (id: string) => ['cost-codes', id] as const,

  // Vendors
  vendors: ['vendors'] as const,
  vendor: (id: string) => ['vendors', id] as const,

  // Resource Rates
  resourceRates: ['resource-rates'] as const,
  resourceRate: (id: string) => ['resource-rates', id] as const,

  // Activities
  activities: ['activities'] as const,
  projectActivities: (projectId: string) => ['projects', projectId, 'activities'] as const,

  // Comments
  comments: ['comments'] as const,
  entityComments: (entityType: string, entityId: string) => ['comments', entityType, entityId] as const,

  // Change Orders
  changeOrders: ['change-orders'] as const,
  projectChangeOrders: (projectId: string) => ['projects', projectId, 'change-orders'] as const,

  // Daily Reports
  dailyReports: ['daily-reports'] as const,
  projectDailyReports: (projectId: string) => ['projects', projectId, 'daily-reports'] as const,

  // Snags
  snags: ['snags'] as const,
  projectSnags: (projectId: string) => ['projects', projectId, 'snags'] as const,

  // Contracts
  contracts: ['contracts'] as const,
  projectContracts: (projectId: string) => ['projects', projectId, 'contracts'] as const,

  // Resources
  resourceUtilization: (projectId: string, start?: string, end?: string) =>
    ['projects', projectId, 'resource-utilization', { start, end }] as const,

  // Backlog & Sprints
  projectBacklog: (projectId: string) => ['projects', projectId, 'backlog'] as const,
  projectSprints: (projectId: string, status?: string) => ['projects', projectId, 'sprints', { status }] as const,
};

/**
 * Invalidation Helpers
 * 
 * Use these to invalidate related queries after mutations.
 */

/**
 * Invalidate unified dashboard
 * Called when any financial data changes
 */
export const invalidateProjectDashboard = (projectId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.projectDashboard(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectDashboardFinancial(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectDashboardResources(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectDashboardSchedule(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectDashboardAnalytics(projectId) });
};

export const invalidateProjectFinancials = (projectId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.projectFinancialSummary(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectCostSummary(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectBudgetUtilization(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectBudget(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });

  // Also invalidate unified dashboard
  invalidateProjectDashboard(projectId);
};

export const invalidateProjectData = (projectId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectWorkPackages(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectActivities(projectId) });
  invalidateProjectFinancials(projectId);
};
