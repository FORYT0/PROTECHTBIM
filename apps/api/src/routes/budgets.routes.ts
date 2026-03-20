import { Router, Request, Response } from 'express';
import { BudgetService, createBudgetService } from '../services/BudgetService';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createBudgetRouter = (budgetService?: BudgetService): Router => {
  const router = Router();
  const service = budgetService || createBudgetService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // POST /api/v1/projects/:projectId/budget - Create or update project budget
  router.post('/projects/:projectId/budget', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const {
        name,
        total_budget,
        contingency_percentage,
        contingency_amount,
        currency,
        start_date,
        end_date,
        description,
        budget_lines,
      } = req.body;

      if (!total_budget || total_budget <= 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'total_budget is required and must be greater than 0',
        });
      }

      if (!budget_lines || !Array.isArray(budget_lines) || budget_lines.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'budget_lines is required and must contain at least one line',
        });
      }

      const budget = await service.createBudget(
        {
          projectId,
          name,
          totalBudget: total_budget,
          contingencyPercentage: contingency_percentage,
          contingencyAmount: contingency_amount,
          currency,
          startDate: start_date ? new Date(start_date) : undefined,
          endDate: end_date ? new Date(end_date) : undefined,
          description,
          budgetLines: budget_lines.map((line: any) => ({
            costCodeId: line.cost_code_id,
            budgetedAmount: line.budgeted_amount,
            notes: line.notes,
          })),
        },
        userId
      );

      return res.status(201).json({
        budget: {
          id: budget.id,
          project_id: budget.projectId,
          name: budget.name,
          total_budget: budget.totalBudget,
          contingency_percentage: budget.contingencyPercentage,
          contingency_amount: budget.contingencyAmount,
          currency: budget.currency,
          start_date: budget.startDate,
          end_date: budget.endDate,
          description: budget.description,
          is_active: budget.isActive,
          budget_lines: budget.budgetLines?.map((line) => ({
            id: line.id,
            cost_code_id: line.costCodeId,
            cost_code: line.costCode
              ? {
                  id: line.costCode.id,
                  code: line.costCode.code,
                  name: line.costCode.name,
                }
              : undefined,
            budgeted_amount: line.budgetedAmount,
            actual_cost: line.actualCost,
            committed_cost: line.committedCost,
            notes: line.notes,
          })),
          created_at: budget.createdAt,
          updated_at: budget.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating budget:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create budget',
      });
    }
  });

  // GET /api/v1/projects/:projectId/budget - Get project budget
  router.get('/projects/:projectId/budget', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const budget = await service.getBudgetByProjectId(projectId);

      if (!budget) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Budget not found for this project',
        });
      }

      return res.status(200).json({
        budget: {
          id: budget.id,
          project_id: budget.projectId,
          name: budget.name,
          total_budget: budget.totalBudget,
          contingency_percentage: budget.contingencyPercentage,
          contingency_amount: budget.contingencyAmount,
          currency: budget.currency,
          start_date: budget.startDate,
          end_date: budget.endDate,
          description: budget.description,
          is_active: budget.isActive,
          budget_lines: budget.budgetLines?.map((line) => ({
            id: line.id,
            cost_code_id: line.costCodeId,
            cost_code: line.costCode
              ? {
                  id: line.costCode.id,
                  code: line.costCode.code,
                  name: line.costCode.name,
                }
              : undefined,
            budgeted_amount: line.budgetedAmount,
            actual_cost: line.actualCost,
            committed_cost: line.committedCost,
            notes: line.notes,
          })),
          created_at: budget.createdAt,
          updated_at: budget.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error getting budget:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get budget',
      });
    }
  });

  // GET /api/v1/budgets/:id - Get budget by ID
  router.get('/budgets/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const budget = await service.getBudgetById(id);

      if (!budget) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Budget not found',
        });
      }

      return res.status(200).json({
        budget: {
          id: budget.id,
          project_id: budget.projectId,
          name: budget.name,
          total_budget: budget.totalBudget,
          contingency_percentage: budget.contingencyPercentage,
          contingency_amount: budget.contingencyAmount,
          currency: budget.currency,
          start_date: budget.startDate,
          end_date: budget.endDate,
          description: budget.description,
          is_active: budget.isActive,
          budget_lines: budget.budgetLines?.map((line) => ({
            id: line.id,
            cost_code_id: line.costCodeId,
            cost_code: line.costCode
              ? {
                  id: line.costCode.id,
                  code: line.costCode.code,
                  name: line.costCode.name,
                }
              : undefined,
            budgeted_amount: line.budgetedAmount,
            actual_cost: line.actualCost,
            committed_cost: line.committedCost,
            notes: line.notes,
          })),
          created_at: budget.createdAt,
          updated_at: budget.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error getting budget:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get budget',
      });
    }
  });

  // PATCH /api/v1/budgets/:id - Update budget
  router.patch('/budgets/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const {
        name,
        total_budget,
        contingency_percentage,
        contingency_amount,
        start_date,
        end_date,
        description,
        is_active,
      } = req.body;

      const budget = await service.updateBudget(
        id,
        {
          name,
          totalBudget: total_budget,
          contingencyPercentage: contingency_percentage,
          contingencyAmount: contingency_amount,
          startDate: start_date ? new Date(start_date) : undefined,
          endDate: end_date ? new Date(end_date) : undefined,
          description,
          isActive: is_active,
        },
        userId
      );

      return res.status(200).json({
        budget: {
          id: budget.id,
          project_id: budget.projectId,
          name: budget.name,
          total_budget: budget.totalBudget,
          contingency_percentage: budget.contingencyPercentage,
          contingency_amount: budget.contingencyAmount,
          currency: budget.currency,
          start_date: budget.startDate,
          end_date: budget.endDate,
          description: budget.description,
          is_active: budget.isActive,
          created_at: budget.createdAt,
          updated_at: budget.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error updating budget:', error);

      if (error.message === 'Budget not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update budget',
      });
    }
  });

  // DELETE /api/v1/budgets/:id - Delete budget
  router.delete('/budgets/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const deleted = await service.deleteBudget(id, userId);

      if (!deleted) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Budget not found',
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting budget:', error);

      if (error.message === 'Budget not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to delete budget',
      });
    }
  });

  return router;
};
