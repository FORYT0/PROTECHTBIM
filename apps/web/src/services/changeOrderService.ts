import apiRequest from '../utils/api';

export interface ChangeOrder {
  id: string; projectId: string; contractId?: string | null; changeNumber: string;
  title: string; description: string; reason: string; costImpact: number;
  scheduleImpactDays: number; status: string; priority: string;
  submittedBy: string; submittedAt?: string; reviewedBy?: string; reviewedAt?: string;
  approvedBy?: string; approvedAt?: string; rejectionReason?: string; notes?: string;
  createdAt: string; updatedAt: string;
}

export const changeOrderService = {
  async getAllChangeOrders(): Promise<ChangeOrder[]> {
    const r = await apiRequest('/change-orders');
    if (!r.ok) throw new Error('Failed to fetch change orders');
    return (await r.json()).changeOrders || [];
  },

  async getChangeOrdersByProject(projectId: string): Promise<ChangeOrder[]> {
    const r = await apiRequest(`/change-orders/project/${projectId}`);
    if (!r.ok) throw new Error('Failed to fetch change orders');
    return (await r.json()).changeOrders || [];
  },

  async getChangeOrderMetrics(projectId: string): Promise<any> {
    const r = await apiRequest(`/change-orders/project/${projectId}/metrics`);
    if (!r.ok) throw new Error('Failed to fetch metrics');
    return (await r.json()).metrics;
  },

  async createChangeOrder(data: any): Promise<ChangeOrder> {
    const r = await apiRequest('/change-orders', { method: 'POST', body: JSON.stringify(data) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create change order');
    }
    return (await r.json()).changeOrder;
  },

  async submitChangeOrder(id: string): Promise<ChangeOrder> {
    const r = await apiRequest(`/change-orders/${id}/submit`, { method: 'POST', body: '{}' });
    if (!r.ok) throw new Error('Failed to submit change order');
    return (await r.json()).changeOrder;
  },

  async approveChangeOrder(id: string): Promise<ChangeOrder> {
    const r = await apiRequest(`/change-orders/${id}/approve`, { method: 'POST', body: '{}' });
    if (!r.ok) throw new Error('Failed to approve change order');
    return (await r.json()).changeOrder;
  },

  async rejectChangeOrder(id: string, reason: string): Promise<ChangeOrder> {
    const r = await apiRequest(`/change-orders/${id}/reject`, {
      method: 'POST', body: JSON.stringify({ reason }),
    });
    if (!r.ok) throw new Error('Failed to reject change order');
    return (await r.json()).changeOrder;
  },
};
