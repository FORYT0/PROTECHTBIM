import apiRequest from '../utils/api';

export interface Snag {
  id: string; projectId: string; workPackageId?: string; location: string;
  description: string; severity: string; category: string; assignedTo?: string;
  dueDate?: string; status: string; costImpact: number; rectificationCost: number;
  photoUrls?: string[]; createdBy: string; resolvedBy?: string; resolvedAt?: string;
  verifiedBy?: string; verifiedAt?: string; createdAt: string; updatedAt: string;
}

export const snagService = {
  async getAllSnags(): Promise<Snag[]> {
    const r = await apiRequest('/snags');
    if (!r.ok) throw new Error('Failed to fetch snags');
    return (await r.json()).snags || [];
  },

  async getSnagsByProject(projectId: string): Promise<Snag[]> {
    const r = await apiRequest(`/snags/project/${projectId}`);
    if (!r.ok) throw new Error('Failed to fetch snags');
    return (await r.json()).snags || [];
  },

  async getSnagMetrics(projectId: string): Promise<any> {
    const r = await apiRequest(`/snags/project/${projectId}/metrics`);
    if (!r.ok) throw new Error('Failed to fetch snag metrics');
    return (await r.json()).metrics;
  },

  async createSnag(data: any): Promise<Snag> {
    const r = await apiRequest('/snags', { method: 'POST', body: JSON.stringify(data) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create snag');
    }
    return (await r.json()).snag;
  },

  async updateSnag(id: string, data: any): Promise<Snag> {
    const r = await apiRequest(`/snags/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update snag');
    }
    return (await r.json()).snag;
  },

  async resolveSnag(id: string, rectificationCost?: number): Promise<Snag> {
    const r = await apiRequest(`/snags/${id}/resolve`, {
      method: 'POST', body: JSON.stringify({ rectificationCost }),
    });
    if (!r.ok) throw new Error('Failed to resolve snag');
    return (await r.json()).snag;
  },

  async verifySnag(id: string): Promise<Snag> {
    const r = await apiRequest(`/snags/${id}/verify`, { method: 'POST', body: '{}' });
    if (!r.ok) throw new Error('Failed to verify snag');
    return (await r.json()).snag;
  },

  async assignSnag(id: string, assignedTo: string): Promise<Snag> {
    const r = await apiRequest(`/snags/${id}/assign`, {
      method: 'POST', body: JSON.stringify({ assignedTo }),
    });
    if (!r.ok) throw new Error('Failed to assign snag');
    return (await r.json()).snag;
  },

  async closeSnag(id: string): Promise<Snag> {
    const r = await apiRequest(`/snags/${id}/close`, { method: 'POST', body: '{}' });
    if (!r.ok) throw new Error('Failed to close snag');
    return (await r.json()).snag;
  },

  async deleteSnag(id: string): Promise<void> {
    const r = await apiRequest(`/snags/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error('Failed to delete snag');
  },
};
