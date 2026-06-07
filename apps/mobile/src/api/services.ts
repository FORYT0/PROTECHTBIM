/**
 * Mobile API services — mirrors apps/web/src/services/*
 * All calls go to the shared Railway backend.
 */
import {apiRequest} from './client';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    apiRequest<{user: any; tokens: {accessToken: string; refreshToken: string}}>(
      '/auth/login', {method: 'POST', data: {email, password}},
    ),
  register: (name: string, email: string, password: string) =>
    apiRequest<{user: any; tokens: {accessToken: string; refreshToken: string}}>(
      '/auth/register', {method: 'POST', data: {name, email, password}},
    ),
  me: () => apiRequest<{user: any}>('/auth/me'),
};

// ─── Projects ────────────────────────────────────────────────────────────────
export const projectService = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<{projects: any[]}>('/projects', {params}),
  get: (id: string) => apiRequest<any>(`/projects/${id}`),
  create: (data: unknown) =>
    apiRequest<any>('/projects', {method: 'POST', data}),
  update: (id: string, data: unknown) =>
    apiRequest<any>(`/projects/${id}`, {method: 'PUT', data}),
  toggleFavorite: (id: string) =>
    apiRequest<any>(`/projects/${id}/favorite`, {method: 'POST'}),
  getStats: (id: string) => apiRequest<any>(`/projects/${id}/stats`),
};

// ─── Cost Tracking ───────────────────────────────────────────────────────────
export const costService = {
  list: (projectId?: string) =>
    apiRequest<{costs: any[]}>('/cost-entries', {params: {project_id: projectId}}),
  create: (data: unknown) =>
    apiRequest<any>('/cost-entries', {method: 'POST', data}),
  update: (id: string, data: unknown) =>
    apiRequest<any>(`/cost-entries/${id}`, {method: 'PUT', data}),
  delete: (id: string) =>
    apiRequest<any>(`/cost-entries/${id}`, {method: 'DELETE'}),
  getSummary: (projectId?: string) =>
    apiRequest<any>('/cost-entries/summary', {params: {project_id: projectId}}),
};

// ─── Contracts ───────────────────────────────────────────────────────────────
export const contractService = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<{contracts: any[]}>('/contracts', {params}),
  get: (id: string) => apiRequest<any>(`/contracts/${id}`),
  create: (data: unknown) =>
    apiRequest<any>('/contracts', {method: 'POST', data}),
  update: (id: string, data: unknown) =>
    apiRequest<any>(`/contracts/${id}`, {method: 'PUT', data}),
};

// ─── Change Orders ───────────────────────────────────────────────────────────
export const changeOrderService = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<{change_orders: any[]}>('/change-orders', {params}),
  get: (id: string) => apiRequest<any>(`/change-orders/${id}`),
  create: (data: unknown) =>
    apiRequest<any>('/change-orders', {method: 'POST', data}),
  update: (id: string, data: unknown) =>
    apiRequest<any>(`/change-orders/${id}`, {method: 'PUT', data}),
  approve: (id: string) =>
    apiRequest<any>(`/change-orders/${id}/approve`, {method: 'POST'}),
  reject: (id: string) =>
    apiRequest<any>(`/change-orders/${id}/reject`, {method: 'POST'}),
};

// ─── Daily Reports ───────────────────────────────────────────────────────────
export const dailyReportService = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<{reports: any[]}>('/daily-reports', {params}),
  get: (id: string) => apiRequest<any>(`/daily-reports/${id}`),
  create: (data: unknown) =>
    apiRequest<any>('/daily-reports', {method: 'POST', data}),
};

// ─── Snags ───────────────────────────────────────────────────────────────────
export const snagService = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<{snags: any[]}>('/snags', {params}),
  get: (id: string) => apiRequest<any>(`/snags/${id}`),
  create: (data: unknown) =>
    apiRequest<any>('/snags', {method: 'POST', data}),
  update: (id: string, data: unknown) =>
    apiRequest<any>(`/snags/${id}`, {method: 'PUT', data}),
  resolve: (id: string) =>
    apiRequest<any>(`/snags/${id}/resolve`, {method: 'POST'}),
};

// ─── Time Tracking ───────────────────────────────────────────────────────────
export const timeService = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<{time_entries: any[]}>('/time-entries', {params}),
  create: (data: unknown) =>
    apiRequest<any>('/time-entries', {method: 'POST', data}),
  update: (id: string, data: unknown) =>
    apiRequest<any>(`/time-entries/${id}`, {method: 'PUT', data}),
  delete: (id: string) =>
    apiRequest<any>(`/time-entries/${id}`, {method: 'DELETE'}),
};

// ─── Work Packages ───────────────────────────────────────────────────────────
export const workPackageService = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<{work_packages: any[]}>('/work-packages', {params}),
  get: (id: string) => apiRequest<any>(`/work-packages/${id}`),
  create: (data: unknown) =>
    apiRequest<any>('/work-packages', {method: 'POST', data}),
  update: (id: string, data: unknown) =>
    apiRequest<any>(`/work-packages/${id}`, {method: 'PUT', data}),
};

// ─── Resources ───────────────────────────────────────────────────────────────
export const resourceService = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<{resources: any[]}>('/resources', {params}),
  create: (data: unknown) =>
    apiRequest<any>('/resources', {method: 'POST', data}),
  update: (id: string, data: unknown) =>
    apiRequest<any>(`/resources/${id}`, {method: 'PUT', data}),
};

// ─── Activity ────────────────────────────────────────────────────────────────
export const activityService = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<{activities: any[]}>('/activities', {params}),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardService = {
  getStats: () => apiRequest<any>('/dashboard/stats'),
  getActivity: () => apiRequest<any>('/dashboard/activity'),
};

// ─── Wiki ────────────────────────────────────────────────────────────────────
export const wikiService = {
  list: (projectId?: string) =>
    apiRequest<{pages: any[]}>('/wiki', {params: {project_id: projectId}}),
  get: (id: string) => apiRequest<any>(`/wiki/${id}`),
  create: (data: unknown) => apiRequest<any>('/wiki', {method: 'POST', data}),
  update: (id: string, data: unknown) =>
    apiRequest<any>(`/wiki/${id}`, {method: 'PUT', data}),
};
