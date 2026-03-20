import apiRequest from '../utils/api';

export interface Snag {
  id: string;
  projectId: string;
  workPackageId?: string;
  location: string;
  description: string;
  severity: string;
  category: string;
  assignedTo?: string;
  dueDate?: string;
  status: string;
  costImpact: number;
  rectificationCost: number;
  photoUrls?: string[];
  createdBy: string;
  resolvedBy?: string;
  resolvedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SnagMetrics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  verified: number;
  closed: number;
  bySeverity: {
    minor: number;
    major: number;
    critical: number;
  };
  byCategory: Record<string, number>;
  totalCostImpact: number;
  totalRectificationCost: number;
  averageResolutionTime: number;
}

export const snagService = {
  async getAllSnags(): Promise<Snag[]> {
    try {
      console.log('snagService.getAllSnags called');
      const response = await apiRequest('/snags');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch snags');
      }
      
      const data = await response.json();
      console.log('getAllSnags response:', data);
      return data.snags || [];
    } catch (error) {
      console.error('Error fetching snags:', error);
      throw error;
    }
  },

  async getSnagsByProject(projectId: string): Promise<Snag[]> {
    const response = await apiRequest(`/snags/project/${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch snags');
    const data = await response.json();
    return data.snags;
  },

  async getSnagMetrics(projectId: string): Promise<SnagMetrics> {
    const response = await apiRequest(`/snags/project/${projectId}/metrics`);
    if (!response.ok) throw new Error('Failed to fetch snag metrics');
    const data = await response.json();
    return data.metrics;
  },

  async createSnag(snagData: any): Promise<Snag> {
    const response = await apiRequest('/snags', {
      method: 'POST',
      body: JSON.stringify(snagData),
    });
    if (!response.ok) throw new Error('Failed to create snag');
    const data = await response.json();
    return data.snag;
  },

  async resolveSnag(id: string, rectificationCost?: number): Promise<Snag> {
    const response = await apiRequest(`/snags/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ rectificationCost }),
    });
    if (!response.ok) throw new Error('Failed to resolve snag');
    const data = await response.json();
    return data.snag;
  },
};
