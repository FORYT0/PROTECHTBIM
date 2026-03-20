import axios, { AxiosInstance } from 'axios';

export enum CostType {
  LABOR = 'labor',
  MATERIAL = 'material',
  EQUIPMENT = 'equipment',
  SUBCONTRACTOR = 'subcontractor',
  OTHER = 'other',
}

export interface CostEntry {
  id: string;
  work_package_id: string;
  user_id?: string | null;
  type: CostType;
  amount: number;
  description?: string | null;
  date: string | Date;
  reference?: string | null;
  billable: boolean;
  currency: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  work_package?: {
    id: string;
    subject: string;
    project_id: string;
  };
}

export interface Budget {
  id: string;
  project_id: string;
  name: string;
  total_budget: number;
  currency: string;
  start_date: string | Date;
  end_date: string | Date;
  description?: string | null;
  is_active: boolean;
  breakdown?: {
    labor?: number;
    material?: number;
    equipment?: number;
    subcontractor?: number;
    other?: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CostEntryFilters {
  work_package_id?: string;
  user_id?: string;
  type?: CostType;
  date_from?: string;
  date_to?: string;
  billable?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface CostEntryListResult {
  cost_entries: CostEntry[];
  total: number;
  page: number;
  per_page: number;
}

export interface CreateCostEntryPayload {
  work_package_id: string;
  user_id?: string | null;
  type: CostType;
  amount: number;
  description?: string;
  date: Date | string;
  reference?: string;
  billable?: boolean;
  currency?: string;
}

export interface CreateBudgetPayload {
  project_id: string;
  name: string;
  total_budget: number;
  currency?: string;
  start_date: Date | string;
  end_date: Date | string;
  description?: string;
  breakdown?: {
    labor?: number;
    material?: number;
    equipment?: number;
    subcontractor?: number;
    other?: number;
  };
}

export interface CostBreakdown {
  [key: string]: number;
}

class CostTrackingService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = '/api/v1') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Cost Entry Methods

  /**
   * Create a new cost entry
   */
  async createCostEntry(data: CreateCostEntryPayload): Promise<CostEntry> {
    const response = await this.api.post<{ cost_entry: CostEntry }>(
      '/cost_entries',
      {
        work_package_id: data.work_package_id,
        user_id: data.user_id,
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date,
        reference: data.reference,
        billable: data.billable ?? false,
        currency: data.currency ?? 'USD',
      }
    );
    return response.data.cost_entry;
  }

  /**
   * List cost entries with optional filtering
   */
  async listCostEntries(filters?: CostEntryFilters): Promise<CostEntryListResult> {
    const response = await this.api.get<CostEntryListResult>('/cost_entries', {
      params: {
        work_package_id: filters?.work_package_id,
        user_id: filters?.user_id,
        type: filters?.type,
        date_from: filters?.date_from,
        date_to: filters?.date_to,
        billable: filters?.billable,
        page: filters?.page ?? 1,
        per_page: filters?.per_page ?? 20,
        sort_by: filters?.sort_by ?? 'date',
        sort_order: filters?.sort_order ?? 'DESC',
      },
    });
    return response.data;
  }

  /**
   * Get a single cost entry
   */
  async getCostEntry(id: string): Promise<CostEntry> {
    const response = await this.api.get<{ cost_entry: CostEntry }>(
      `/cost_entries/${id}`
    );
    return response.data.cost_entry;
  }

  /**
   * Update a cost entry
   */
  async updateCostEntry(id: string, data: Partial<CreateCostEntryPayload>): Promise<CostEntry> {
    const response = await this.api.patch<{ cost_entry: CostEntry }>(
      `/cost_entries/${id}`,
      {
        amount: data.amount,
        type: data.type,
        description: data.description,
        date: data.date,
        reference: data.reference,
        billable: data.billable,
      }
    );
    return response.data.cost_entry;
  }

  /**
   * Delete a cost entry
   */
  async deleteCostEntry(id: string): Promise<void> {
    await this.api.delete(`/cost_entries/${id}`);
  }

  /**
   * Get total cost for a work package
   */
  async getTotalCostByWorkPackage(
    workPackageId: string,
    type?: CostType
  ): Promise<number> {
    const response = await this.api.get<{ total_cost: number }>(
      `/cost_entries/work_package/${workPackageId}/total`,
      {
        params: { type },
      }
    );
    return response.data.total_cost;
  }

  /**
   * Get cost breakdown by type for a work package
   */
  async getCostBreakdownByType(workPackageId: string): Promise<CostBreakdown> {
    const response = await this.api.get<{ breakdown: CostBreakdown }>(
      `/cost_entries/work_package/${workPackageId}/breakdown`
    );
    return response.data.breakdown;
  }

  /**
   * Get costs for a date range
   */
  async getCostsByDateRange(
    workPackageId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<CostEntryListResult> {
    return this.listCostEntries({
      work_package_id: workPackageId,
      date_from: dateFrom,
      date_to: dateTo,
      per_page: 100,
    });
  }

  /**
   * Get billable vs non-billable costs
   */
  async getBillableVsNonBillable(
    workPackageId: string
  ): Promise<{ billable: number; non_billable: number }> {
    const billableResult = await this.listCostEntries({
      work_package_id: workPackageId,
      billable: true,
      per_page: 1000,
    });

    const nonBillableResult = await this.listCostEntries({
      work_package_id: workPackageId,
      billable: false,
      per_page: 1000,
    });

    const billableTotal = billableResult.cost_entries.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const nonBillableTotal = nonBillableResult.cost_entries.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    return {
      billable: billableTotal,
      non_billable: nonBillableTotal,
    };
  }

  /**
   * Bulk create cost entries
   */
  async bulkCreateCostEntries(payload: { entries: CreateCostEntryPayload[] }): Promise<any> {
    const response = await this.api.post('/cost_entries/bulk', payload);
    return response.data;
  }

  // Budget Methods

  /**
   * Create a project budget
   */
  async createBudget(data: CreateBudgetPayload): Promise<Budget> {
    const response = await this.api.post<{ budget: Budget }>(
      `/projects/${data.project_id}/budget`,
      {
        name: data.name,
        total_budget: data.total_budget,
        currency: data.currency ?? 'USD',
        start_date: data.start_date,
        end_date: data.end_date,
        description: data.description,
        breakdown: data.breakdown,
      }
    );
    return response.data.budget;
  }

  /**
   * Get project budget
   */
  async getProjectBudget(projectId: string): Promise<Budget> {
    const response = await this.api.get<{ budget: Budget }>(
      `/projects/${projectId}/budget`
    );
    return response.data.budget;
  }

  /**
   * Update project budget
   */
  async updateBudget(projectId: string, data: Partial<CreateBudgetPayload>): Promise<Budget> {
    const response = await this.api.patch<{ budget: Budget }>(
      `/projects/${projectId}/budget`,
      data
    );
    return response.data.budget;
  }

  /**
   * Get budget vs actual for a project
   */
  async getBudgetVsActual(projectId: string): Promise<{
    budget: number;
    actual: number;
    variance: number;
    variance_percent: number;
    currency: string;
  }> {
    const response = await this.api.get<any>(
      `/projects/${projectId}/budget/vs-actual`
    );
    return response.data;
  }

  /**
   * Get cost forecast
   */
  async getCostForecast(projectId: string): Promise<{
    current_spend: number;
    projected_final: number;
    budget: number;
    remaining_budget: number;
  }> {
    const response = await this.api.get<any>(
      `/projects/${projectId}/cost-forecast`
    );
    return response.data;
  }

  /**
   * Generate cost report
   */
  async generateCostReport(
    projectId: string,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      groupBy?: 'type' | 'workPackage' | 'user';
    }
  ): Promise<any> {
    const response = await this.api.get<any>(
      `/projects/${projectId}/cost-report`,
      {
        params: filters,
      }
    );
    return response.data;
  }

  /**
   * Export cost report to CSV
   */
  async exportCostReportToCSV(
    projectId: string,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<Blob> {
    const response = await this.api.get(
      `/projects/${projectId}/cost-report/export/csv`,
      {
        params: filters,
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Export cost report to PDF
   */
  async exportCostReportToPDF(
    projectId: string,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<Blob> {
    const response = await this.api.get(
      `/projects/${projectId}/cost-report/export/pdf`,
      {
        params: filters,
        responseType: 'blob',
      }
    );
    return response.data;
  }
}

export default CostTrackingService;
