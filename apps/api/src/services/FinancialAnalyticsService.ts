import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Project } from '../entities/Project';
import { Budget } from '../entities/Budget';
import { BudgetLine } from '../entities/BudgetLine';
import { CostEntry } from '../entities/CostEntry';
import { TimeEntry } from '../entities/TimeEntry';

export interface ProjectFinancialSummary {
  projectId: string;
  projectName: string;
  
  // Budget
  totalBudget: number;
  contingencyAmount: number;
  allocatedBudget: number;
  
  // Costs
  actualCost: number;
  committedCost: number;
  forecastCost: number;
  
  // Variance
  budgetVariance: number;
  budgetVariancePercentage: number;
  
  // Status
  budgetHealth: 'good' | 'warning' | 'critical';
  isOverBudget: boolean;
  
  // Time
  totalHoursLogged: number;
  laborCost: number;
  
  // Breakdown by cost code
  costCodeBreakdown: Array<{
    costCodeId: string;
    costCode: string;
    costCodeName: string;
    budgeted: number;
    actual: number;
    committed: number;
    variance: number;
    variancePercentage: number;
  }>;
}

export interface CostSummary {
  totalCost: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  otherCost: number;
  
  // By status
  pendingCost: number;
  approvedCost: number;
  paidCost: number;
}

export class FinancialAnalyticsService {
  private projectRepository: Repository<Project>;
  private budgetRepository: Repository<Budget>;
  private costEntryRepository: Repository<CostEntry>;
  private timeEntryRepository: Repository<TimeEntry>;

  constructor() {
    this.projectRepository = AppDataSource.getRepository(Project);
    this.budgetRepository = AppDataSource.getRepository(Budget);
    this.costEntryRepository = AppDataSource.getRepository(CostEntry);
    this.timeEntryRepository = AppDataSource.getRepository(TimeEntry);
  }

  /**
   * Get comprehensive financial summary for a project
   * This is the SINGLE SOURCE OF TRUTH for all financial metrics
   */
  async getProjectFinancialSummary(projectId: string): Promise<ProjectFinancialSummary> {
    // Get project
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get active budget with lines
    const budget = await this.budgetRepository.findOne({
      where: { projectId, isActive: true },
      relations: ['budgetLines', 'budgetLines.costCode'],
    });

    // Get all cost entries for project
    const costEntries = await this.costEntryRepository.find({
      where: { projectId },
      relations: ['costCode'],
    });

    // Get all time entries for project
    const timeEntries = await this.timeEntryRepository.find({
      where: { workPackage: { projectId } },
      relations: ['workPackage'],
    });

    // Calculate totals
    const totalBudget = budget?.totalBudget || 0;
    const contingencyAmount = budget?.contingencyAmount || 0;
    const allocatedBudget = budget?.budgetLines?.reduce((sum, line) => sum + line.budgetedAmount, 0) || 0;

    // Calculate actual costs (paid entries only)
    const actualCost = costEntries
      .filter(entry => entry.paymentStatus === 'PAID')
      .reduce((sum, entry) => sum + entry.totalCost, 0);

    // Calculate committed costs (unpaid + partial)
    const committedCost = costEntries
      .filter(entry => entry.paymentStatus === 'UNPAID' || entry.paymentStatus === 'PARTIAL')
      .reduce((sum, entry) => sum + entry.totalCost, 0);

    // Calculate labor cost from time entries
    const laborCost = timeEntries.reduce((sum, entry) => sum + (entry.laborCost || 0), 0);

    // Forecast = actual + committed
    const forecastCost = actualCost + committedCost;

    // Calculate variance
    const budgetVariance = totalBudget - actualCost;
    const budgetVariancePercentage = totalBudget > 0 ? (budgetVariance / totalBudget) * 100 : 0;

    // Determine budget health
    let budgetHealth: 'good' | 'warning' | 'critical' = 'good';
    if (budgetVariancePercentage < -10) {
      budgetHealth = 'critical';
    } else if (budgetVariancePercentage < 0) {
      budgetHealth = 'warning';
    }

    // Calculate total hours logged
    const totalHoursLogged = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

    // Build cost code breakdown
    const costCodeBreakdown = budget?.budgetLines?.map(line => {
      const costCodeEntries = costEntries.filter(entry => entry.costCodeId === line.costCodeId);
      const actual = costCodeEntries
        .filter(entry => entry.paymentStatus === 'PAID')
        .reduce((sum, entry) => sum + entry.totalCost, 0);
      const committed = costCodeEntries
        .filter(entry => entry.paymentStatus === 'UNPAID' || entry.paymentStatus === 'PARTIAL')
        .reduce((sum, entry) => sum + entry.totalCost, 0);
      const variance = line.budgetedAmount - actual;
      const variancePercentage = line.budgetedAmount > 0 ? (variance / line.budgetedAmount) * 100 : 0;

      return {
        costCodeId: line.costCodeId,
        costCode: line.costCode?.code || '',
        costCodeName: line.costCode?.name || '',
        budgeted: line.budgetedAmount,
        actual,
        committed,
        variance,
        variancePercentage,
      };
    }) || [];

    return {
      projectId,
      projectName: project.name,
      totalBudget,
      contingencyAmount,
      allocatedBudget,
      actualCost,
      committedCost,
      forecastCost,
      budgetVariance,
      budgetVariancePercentage,
      budgetHealth,
      isOverBudget: budgetVariance < 0,
      totalHoursLogged,
      laborCost,
      costCodeBreakdown,
    };
  }

  /**
   * Get cost summary with breakdown by type and status
   */
  async getCostSummary(projectId: string): Promise<CostSummary> {
    const costEntries = await this.costEntryRepository.find({
      where: { projectId },
    });

    // Calculate by cost category
    const laborCost = costEntries
      .filter(entry => entry.costCategory === 'LABOR')
      .reduce((sum, entry) => sum + entry.totalCost, 0);

    const materialCost = costEntries
      .filter(entry => entry.costCategory === 'MATERIAL')
      .reduce((sum, entry) => sum + entry.totalCost, 0);

    const equipmentCost = costEntries
      .filter(entry => entry.costCategory === 'EQUIPMENT')
      .reduce((sum, entry) => sum + entry.totalCost, 0);

    const subcontractorCost = costEntries
      .filter(entry => entry.costCategory === 'SUBCONTRACTOR')
      .reduce((sum, entry) => sum + entry.totalCost, 0);

    const otherCost = costEntries
      .filter(entry => entry.costCategory === 'OTHER' || entry.costCategory === 'OVERHEAD')
      .reduce((sum, entry) => sum + entry.totalCost, 0);

    // Calculate by payment status
    const pendingCost = costEntries
      .filter(entry => entry.paymentStatus === 'UNPAID')
      .reduce((sum, entry) => sum + entry.totalCost, 0);

    const approvedCost = costEntries
      .filter(entry => entry.paymentStatus === 'PAID')
      .reduce((sum, entry) => sum + entry.totalCost, 0);

    // Calculate by payment status
    const paidCost = costEntries
      .filter(entry => entry.paymentStatus === 'PAID')
      .reduce((sum, entry) => sum + entry.totalCost, 0);

    const totalCost = costEntries.reduce((sum, entry) => sum + entry.totalCost, 0);

    return {
      totalCost,
      laborCost,
      materialCost,
      equipmentCost,
      subcontractorCost,
      otherCost,
      pendingCost,
      approvedCost,
      paidCost,
    };
  }

  /**
   * Calculate budget utilization percentage
   */
  async getBudgetUtilization(projectId: string): Promise<number> {
    const summary = await this.getProjectFinancialSummary(projectId);
    if (summary.totalBudget === 0) return 0;
    return (summary.actualCost / summary.totalBudget) * 100;
  }

  /**
   * Get forecast to completion (EAC - Estimate at Completion)
   */
  async getForecastToCompletion(projectId: string): Promise<number> {
    const summary = await this.getProjectFinancialSummary(projectId);
    // Simple EAC = Actual Cost + Remaining Work Estimate
    // For now, we use actual + committed as forecast
    return summary.forecastCost;
  }

  /**
   * Calculate cost performance index (CPI)
   * CPI = Earned Value / Actual Cost
   * CPI > 1 = Under budget, CPI < 1 = Over budget
   */
  async getCostPerformanceIndex(projectId: string, earnedValue: number): Promise<number> {
    const summary = await this.getProjectFinancialSummary(projectId);
    if (summary.actualCost === 0) return 1;
    return earnedValue / summary.actualCost;
  }
}

export const createFinancialAnalyticsService = (): FinancialAnalyticsService => {
  return new FinancialAnalyticsService();
};
