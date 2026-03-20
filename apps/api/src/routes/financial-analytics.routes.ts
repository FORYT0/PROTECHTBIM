import { Router, Request, Response } from 'express';
import { FinancialAnalyticsService, createFinancialAnalyticsService } from '../services/FinancialAnalyticsService';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createFinancialAnalyticsRouter = (
  financialAnalyticsService?: FinancialAnalyticsService
): Router => {
  const router = Router();
  const service = financialAnalyticsService || createFinancialAnalyticsService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // GET /api/v1/projects/:projectId/financial-summary
  router.get('/:projectId/financial-summary', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const summary = await service.getProjectFinancialSummary(projectId);

      return res.status(200).json({
        financial_summary: {
          project_id: summary.projectId,
          project_name: summary.projectName,
          total_budget: summary.totalBudget,
          contingency_amount: summary.contingencyAmount,
          allocated_budget: summary.allocatedBudget,
          actual_cost: summary.actualCost,
          committed_cost: summary.committedCost,
          forecast_cost: summary.forecastCost,
          budget_variance: summary.budgetVariance,
          budget_variance_percentage: summary.budgetVariancePercentage,
          budget_health: summary.budgetHealth,
          is_over_budget: summary.isOverBudget,
          total_hours_logged: summary.totalHoursLogged,
          labor_cost: summary.laborCost,
          cost_code_breakdown: summary.costCodeBreakdown.map(item => ({
            cost_code_id: item.costCodeId,
            cost_code: item.costCode,
            cost_code_name: item.costCodeName,
            budgeted: item.budgeted,
            actual: item.actual,
            committed: item.committed,
            variance: item.variance,
            variance_percentage: item.variancePercentage,
          })),
        },
      });
    } catch (error: any) {
      console.error('Error getting financial summary:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get financial summary',
      });
    }
  });

  // GET /api/v1/projects/:projectId/cost-summary
  router.get('/:projectId/cost-summary', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const summary = await service.getCostSummary(projectId);

      return res.status(200).json({
        cost_summary: {
          total_cost: summary.totalCost,
          labor_cost: summary.laborCost,
          material_cost: summary.materialCost,
          equipment_cost: summary.equipmentCost,
          subcontractor_cost: summary.subcontractorCost,
          other_cost: summary.otherCost,
          pending_cost: summary.pendingCost,
          approved_cost: summary.approvedCost,
          paid_cost: summary.paidCost,
        },
      });
    } catch (error: any) {
      console.error('Error getting cost summary:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get cost summary',
      });
    }
  });

  // GET /api/v1/projects/:projectId/budget-utilization
  router.get('/:projectId/budget-utilization', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const utilization = await service.getBudgetUtilization(projectId);

      return res.status(200).json({
        budget_utilization: {
          project_id: projectId,
          utilization_percentage: utilization,
        },
      });
    } catch (error: any) {
      console.error('Error getting budget utilization:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get budget utilization',
      });
    }
  });

  // GET /api/v1/projects/:projectId/forecast
  router.get('/:projectId/forecast', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const forecast = await service.getForecastToCompletion(projectId);

      return res.status(200).json({
        forecast: {
          project_id: projectId,
          forecast_to_completion: forecast,
        },
      });
    } catch (error: any) {
      console.error('Error getting forecast:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get forecast',
      });
    }
  });

  return router;
};
