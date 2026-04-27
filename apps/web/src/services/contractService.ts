import apiRequest from '../utils/api';

export interface Contract {
  id: string;
  projectId: string;
  contractNumber: string;
  contractType: string;
  clientName: string;
  originalContractValue: number;
  revisedContractValue: number;
  totalApprovedVariations: number;
  totalPendingVariations: number;
  originalDurationDays: number;
  startDate: string;
  completionDate: string;
  retentionPercentage: number;
  advancePaymentAmount: number;
  performanceBondValue: number;
  currency: string;
  status: string;
  description?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export const contractService = {
  async getAllContracts(): Promise<Contract[]> {
    const r = await apiRequest('/contracts');
    if (!r.ok) throw new Error('Failed to fetch contracts');
    return (await r.json()).contracts || [];
  },

  async getContractsByProjectId(projectId: string): Promise<Contract[]> {
    const r = await apiRequest(`/contracts/project/${projectId}/all`);
    if (!r.ok) throw new Error('Failed to fetch project contracts');
    return (await r.json()).contracts || [];
  },

  async getContractByProject(projectId: string): Promise<Contract | null> {
    const r = await apiRequest(`/contracts/project/${projectId}`);
    if (!r.ok) return null;
    return (await r.json()).contract;
  },

  async createContract(data: any): Promise<Contract> {
    const r = await apiRequest('/contracts', { method: 'POST', body: JSON.stringify(data) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create contract (${r.status})`);
    }
    return (await r.json()).contract;
  },

  async updateContract(id: string, data: any): Promise<Contract> {
    const r = await apiRequest(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update contract (${r.status})`);
    }
    return (await r.json()).contract;
  },

  async getContractMetrics(contractId: string): Promise<any> {
    const r = await apiRequest(`/contracts/${contractId}/metrics`);
    if (!r.ok) throw new Error('Failed to fetch contract metrics');
    return (await r.json()).metrics;
  },
};
