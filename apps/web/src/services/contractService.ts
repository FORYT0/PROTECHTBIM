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

export interface ContractMetrics {
  originalContractValue: number;
  revisedContractValue: number;
  totalApprovedVariations: number;
  totalPendingVariations: number;
  variationPercentage: number;
  potentialValue: number;
  retentionPercentage: number;
  advancePaymentAmount: number;
  performanceBondValue: number;
  currency: string;
}

export const contractService = {
  async getAllContracts(): Promise<Contract[]> {
    try {
      const response = await apiRequest('/contracts');
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      const data = await response.json();
      return data.contracts || [];
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  },

  async getContractByProject(projectId: string): Promise<Contract | null> {
    try {
      const response = await apiRequest(`/contracts/project/${projectId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch contract');
      }
      const data = await response.json();
      return data.contract;
    } catch (error) {
      console.error('Error fetching contract:', error);
      throw error;
    }
  },

  async getContractMetrics(contractId: string): Promise<ContractMetrics> {
    const response = await apiRequest(`/contracts/${contractId}/metrics`);
    if (!response.ok) throw new Error('Failed to fetch contract metrics');
    const data = await response.json();
    return data.metrics;
  },

  async createContract(contractData: any): Promise<Contract> {
    console.log('contractService.createContract called with:', contractData);
    try {
      const response = await apiRequest('/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Failed to create contract (${response.status})`);
      }

      const data = await response.json();
      console.log('Contract created successfully:', data);
      return data.contract;
    } catch (error) {
      console.error('Error in createContract:', error);
      throw error;
    }
  },

  async getContractsByProjectId(projectId: string): Promise<Contract[]> {
    try {
      const response = await apiRequest(`/contracts/project/${projectId}/all`);
      if (!response.ok) {
        throw new Error('Failed to fetch project contracts');
      }
      const data = await response.json();
      return data.contracts || [];
    } catch (error) {
      console.error('Error fetching project contracts:', error);
      throw error;
    }
  },
};
