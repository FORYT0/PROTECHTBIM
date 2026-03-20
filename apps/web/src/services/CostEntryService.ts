import axios, { AxiosInstance } from 'axios';

export interface CostEntry {
  id: string;
  entry_number: string;
  project_id: string;
  work_package_id?: string;
  cost_code_id?: string;
  cost_category: string;
  vendor_id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  invoice_number?: string;
  invoice_date?: string | Date;
  payment_status: string;
  is_billable: boolean;
  is_committed: boolean;
  commitment_id?: string;
  entry_date: string | Date;
  entry_source: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string | Date;
  attachment_ids?: string[];
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  };
  work_package?: {
    id: string;
    subject: string;
  };
  cost_code?: {
    id: string;
    code: string;
    name: string;
  };
  vendor?: {
    id: string;
    vendor_code: string;
    vendor_name: string;
  };
  creator?: {
    id: string;
    email: string;
    name: string;
  };
  approver?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface CostEntryFilters {
  project_id?: string;
  work_package_id?: string;
  cost_code_id?: string;
  cost_category?: string;
  vendor_id?: string;
  payment_status?: string;
  entry_source?: string;
  is_billable?: boolean;
  is_committed?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
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

export interface CostSummary {
  total_cost: number;
  billable_cost: number;
  non_billable_cost: number;
  committed_cost: number;
  by_cost_category: Array<{
    cost_category: string;
    total_cost: number;
  }>;
  by_payment_status: Array<{
    payment_status: string;
    total_cost: number;
  }>;
}

class CostEntryService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const authTokens = localStorage.getItem('auth_tokens');
      if (authTokens) {
        try {
          const tokens = JSON.parse(authTokens);
          if (tokens.accessToken) {
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }
        } catch (e) {
          console.error('Error parsing auth tokens:', e);
        }
      }
      return config;
    });
  }

  /**
   * List cost entries with optional filtering
   */
  async listCostEntries(filters?: CostEntryFilters): Promise<CostEntryListResult> {
    const response = await this.api.get<CostEntryListResult>('/cost-entries', {
      params: {
        project_id: filters?.project_id,
        work_package_id: filters?.work_package_id,
        cost_code_id: filters?.cost_code_id,
        cost_category: filters?.cost_category,
        vendor_id: filters?.vendor_id,
        payment_status: filters?.payment_status,
        entry_source: filters?.entry_source,
        is_billable: filters?.is_billable,
        is_committed: filters?.is_committed,
        date_from: filters?.date_from,
        date_to: filters?.date_to,
        search: filters?.search,
        page: filters?.page ?? 1,
        per_page: filters?.per_page ?? 100,
        sort_by: filters?.sort_by ?? 'entry_date',
        sort_order: filters?.sort_order ?? 'DESC',
      },
    });
    return response.data;
  }

  /**
   * Get cost summary for a project
   */
  async getCostSummary(projectId: string, dateFrom?: string, dateTo?: string): Promise<CostSummary> {
    const response = await this.api.get<{ summary: CostSummary }>(
      `/cost-entries/projects/${projectId}/summary`,
      {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
        },
      }
    );
    return response.data.summary;
  }

  /**
   * Get cost by cost code for a project
   */
  async getCostByCostCode(projectId: string): Promise<Array<{
    cost_code_id: string;
    cost_code: string;
    total_cost: number;
  }>> {
    const response = await this.api.get<{
      cost_by_cost_code: Array<{
        cost_code_id: string;
        cost_code: string;
        total_cost: number;
      }>;
    }>(`/cost-entries/projects/${projectId}/by-cost-code`);
    return response.data.cost_by_cost_code;
  }

  /**
   * Get a single cost entry by ID
   */
  async getCostEntry(id: string): Promise<CostEntry> {
    const response = await this.api.get<{ cost_entry: CostEntry }>(
      `/cost-entries/${id}`
    );
    return response.data.cost_entry;
  }
}

export default CostEntryService;
