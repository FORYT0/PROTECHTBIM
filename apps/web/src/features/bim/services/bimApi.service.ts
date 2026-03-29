import axios, { AxiosInstance } from 'axios';
import type { IFCModel, ClashResult, BCFIssue } from '../types/bim.types';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function makeApi(): AxiosInstance {
  const api = axios.create({ baseURL: BASE });
  api.interceptors.request.use((cfg) => {
    try {
      const raw = localStorage.getItem('auth_tokens');
      if (raw) {
        const { accessToken } = JSON.parse(raw);
        if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch {}
    return cfg;
  });
  return api;
}

const api = makeApi();

// ── Models ──────────────────────────────────────────────────
export async function fetchModels(projectId: string): Promise<IFCModel[]> {
  const { data } = await api.get(`/projects/${projectId}/bim/models`);
  return data.models ?? [];
}

export async function uploadModel(projectId: string, file: File): Promise<IFCModel> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(`/projects/${projectId}/bim/models`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.model;
}

export async function deleteModel(modelId: string): Promise<void> {
  await api.delete(`/bim/models/${modelId}`);
}

export async function getModelDownloadUrl(modelId: string): Promise<string> {
  const { data } = await api.get(`/bim/models/${modelId}/download`);
  return data.url;
}

// ── Clashes ─────────────────────────────────────────────────
export async function fetchClashes(projectId: string): Promise<ClashResult[]> {
  const { data } = await api.get(`/projects/${projectId}/bim/clashes`);
  return data.clashes ?? [];
}

export async function runClashDetection(modelIds: string[], tolerance = 0.01): Promise<string> {
  const { data } = await api.post('/bim/clash-detection', { modelIds, tolerance });
  return data.jobId;
}

export async function updateClash(clashId: string, updates: Partial<ClashResult>): Promise<ClashResult> {
  const { data } = await api.patch(`/bim/clashes/${clashId}`, updates);
  return data.clash;
}

// ── BCF ─────────────────────────────────────────────────────
export async function fetchBCFIssues(projectId: string): Promise<BCFIssue[]> {
  const { data } = await api.get(`/projects/${projectId}/bim/bcf`);
  return data.issues ?? [];
}

export async function createBCFIssue(projectId: string, issue: Partial<BCFIssue>): Promise<BCFIssue> {
  const { data } = await api.post(`/projects/${projectId}/bim/bcf`, issue);
  return data.issue;
}

export async function updateBCFIssue(issueId: string, updates: Partial<BCFIssue>): Promise<BCFIssue> {
  const { data } = await api.patch(`/bim/bcf/${issueId}`, updates);
  return data.issue;
}

export async function addBCFComment(issueId: string, comment: string): Promise<BCFIssue> {
  const { data } = await api.post(`/bim/bcf/${issueId}/comments`, { comment });
  return data.issue;
}
