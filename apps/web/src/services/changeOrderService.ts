import apiRequest from '../utils/api';

export interface ChangeOrder {
  id: string;
  projectId: string;
  contractId: string;
  changeNumber: string;
  title: string;
  description: string;
  reason: string;
  costImpact: number;
  scheduleImpactDays: number;
  status: string;
  priority: string;
  submittedBy: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrderMetrics {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  voided: number;
  totalCostImpact: number;
  approvedCostImpact: number;
  pendingCostImpact: number;
  totalScheduleImpact: number;
  approvedScheduleImpact: number;
}

export const changeOrderService = {
  async getAllChangeOrders(): Promise<ChangeOrder[]> {
    try {
      console.log('changeOrderService.getAllChangeOrders called');
      const response = await apiRequest('/change-orders');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch change orders');
      }
      
      const data = await response.json();
      console.log('getAllChangeOrders response:', data);
      return data.changeOrders || [];
    } catch (error) {
      console.error('Error fetching change orders:', error);
      throw error;
    }
  },

  async getChangeOrdersByProject(projectId: string): Promise<ChangeOrder[]> {
    const response = await apiRequest(`/change-orders/project/${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch change orders');
    const data = await response.json();
    return data.changeOrders;
  },

  async getChangeOrderMetrics(projectId: string): Promise<ChangeOrderMetrics> {
    const response = await apiRequest(`/change-orders/project/${projectId}/metrics`);
    if (!response.ok) throw new Error('Failed to fetch change order metrics');
    const data = await response.json();
    return data.metrics;
  },

  async createChangeOrder(changeOrderData: any): Promise<ChangeOrder> {
    const response = await apiRequest('/change-orders', {
      method: 'POST',
      body: JSON.stringify(changeOrderData),
    });
    if (!response.ok) throw new Error('Failed to create change order');
    const data = await response.json();
    return data.changeOrder;
  },

  async approveChangeOrder(id: string): Promise<ChangeOrder> {
    const response = await apiRequest(`/change-orders/${id}/approve`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to approve change order');
    const data = await response.json();
    return data.changeOrder;
  },
};
