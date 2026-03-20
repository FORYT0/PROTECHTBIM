import { Router, Request, Response } from 'express';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';
import { TimeEntryRepository } from '../repositories/TimeEntryRepository';
import { CostEntryRepository } from '../repositories/CostEntryRepository';
import { WorkPackageRepository } from '../repositories/WorkPackageRepository';
import { CostType } from '../entities/CostEntry';

export const createProjectAnalyticsRouter = (): Router => {
  const router = Router();
  const timeEntryRepository = new TimeEntryRepository();
  const costEntryRepository = new CostEntryRepository();
  const workPackageRepository = new WorkPackageRepository();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // GET /api/v1/projects/:projectId/analytics/time - Get time analytics for project
  router.get('/:projectId/analytics/time', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { date_from, date_to, group_by } = req.query;

      let dateFrom: Date | undefined;
      let dateTo: Date | undefined;

      if (date_from) {
        dateFrom = new Date(date_from as string);
      }
      if (date_to) {
        dateTo = new Date(date_to as string);
      }

      // Get all work packages for the project
      const workPackages = await workPackageRepository.findByProject(projectId);
      const workPackageIds = workPackages.map(wp => wp.id);

      if (workPackageIds.length === 0) {
        return res.status(200).json({
          project_id: projectId,
          total_hours: 0,
          billable_hours: 0,
          non_billable_hours: 0,
          by_work_package: [],
          by_user: [],
          by_date: [],
        });
      }

      // Get time entries for all work packages
      const timeEntries = await timeEntryRepository.findAll({
        workPackageId: workPackageIds.join(','),
        dateFrom,
        dateTo,
        perPage: 10000,
      });

      // Calculate totals
      const totalHours = timeEntries.timeEntries.reduce((sum, te) => sum + parseFloat(te.hours.toString()), 0);
      const billableHours = timeEntries.timeEntries
        .filter(te => te.billable)
        .reduce((sum, te) => sum + parseFloat(te.hours.toString()), 0);
      const nonBillableHours = totalHours - billableHours;

      // Group by work package
      const byWorkPackage = workPackages.map(wp => {
        const wpEntries = timeEntries.timeEntries.filter(te => te.workPackageId === wp.id);
        const hours = wpEntries.reduce((sum, te) => sum + parseFloat(te.hours.toString()), 0);
        return {
          work_package_id: wp.id,
          work_package_subject: wp.subject,
          hours,
          entry_count: wpEntries.length,
        };
      }).filter(item => item.hours > 0);

      // Group by user
      const userMap = new Map<string, { userId: string; userName: string; hours: number; entryCount: number }>();
      timeEntries.timeEntries.forEach(te => {
        const existing = userMap.get(te.userId) || {
          userId: te.userId,
          userName: te.user?.name || te.user?.email || 'Unknown',
          hours: 0,
          entryCount: 0,
        };
        existing.hours += parseFloat(te.hours.toString());
        existing.entryCount += 1;
        userMap.set(te.userId, existing);
      });
      const byUser = Array.from(userMap.values());

      // Group by date (if requested)
      let byDate: any[] = [];
      if (group_by === 'date') {
        const dateMap = new Map<string, number>();
        timeEntries.timeEntries.forEach(te => {
          const dateKey = new Date(te.date).toISOString().split('T')[0];
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + parseFloat(te.hours.toString()));
        });
        byDate = Array.from(dateMap.entries())
          .map(([date, hours]) => ({ date, hours }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }

      return res.status(200).json({
        project_id: projectId,
        total_hours: totalHours,
        billable_hours: billableHours,
        non_billable_hours: nonBillableHours,
        by_work_package: byWorkPackage,
        by_user: byUser,
        by_date: byDate,
        date_from: dateFrom,
        date_to: dateTo,
      });
    } catch (error: any) {
      console.error('Error getting project time analytics:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get time analytics',
      });
    }
  });

  // GET /api/v1/projects/:projectId/analytics/cost - Get cost analytics for project
  router.get('/:projectId/analytics/cost', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { date_from, date_to, group_by } = req.query;

      let dateFrom: Date | undefined;
      let dateTo: Date | undefined;

      if (date_from) {
        dateFrom = new Date(date_from as string);
      }
      if (date_to) {
        dateTo = new Date(date_to as string);
      }

      // Get all work packages for the project
      const workPackages = await workPackageRepository.findByProject(projectId);
      const workPackageIds = workPackages.map(wp => wp.id);

      if (workPackageIds.length === 0) {
        return res.status(200).json({
          project_id: projectId,
          total_cost: 0,
          billable_cost: 0,
          non_billable_cost: 0,
          by_type: [],
          by_work_package: [],
          by_date: [],
        });
      }

      // Get cost entries for all work packages
      const costEntries = await costEntryRepository.findAll({
        workPackageId: workPackageIds.join(','),
        dateFrom,
        dateTo,
        perPage: 10000,
      });

      // Calculate totals
      const totalCost = costEntries.costEntries.reduce((sum, ce) => sum + parseFloat(ce.amount.toString()), 0);
      const billableCost = costEntries.costEntries
        .filter(ce => ce.billable)
        .reduce((sum, ce) => sum + parseFloat(ce.amount.toString()), 0);
      const nonBillableCost = totalCost - billableCost;

      // Group by type
      const typeMap = new Map<CostType, number>();
      costEntries.costEntries.forEach(ce => {
        typeMap.set(ce.type, (typeMap.get(ce.type) || 0) + parseFloat(ce.amount.toString()));
      });
      const byType = Array.from(typeMap.entries()).map(([type, amount]) => ({ type, amount }));

      // Group by work package
      const byWorkPackage = workPackages.map(wp => {
        const wpEntries = costEntries.costEntries.filter(ce => ce.workPackageId === wp.id);
        const amount = wpEntries.reduce((sum, ce) => sum + parseFloat(ce.amount.toString()), 0);
        return {
          work_package_id: wp.id,
          work_package_subject: wp.subject,
          amount,
          entry_count: wpEntries.length,
        };
      }).filter(item => item.amount > 0);

      // Group by date (if requested)
      let byDate: any[] = [];
      if (group_by === 'date') {
        const dateMap = new Map<string, number>();
        costEntries.costEntries.forEach(ce => {
          const dateKey = new Date(ce.date).toISOString().split('T')[0];
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + parseFloat(ce.amount.toString()));
        });
        byDate = Array.from(dateMap.entries())
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }

      return res.status(200).json({
        project_id: projectId,
        total_cost: totalCost,
        billable_cost: billableCost,
        non_billable_cost: nonBillableCost,
        by_type: byType,
        by_work_package: byWorkPackage,
        by_date: byDate,
        date_from: dateFrom,
        date_to: dateTo,
      });
    } catch (error: any) {
      console.error('Error getting project cost analytics:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get cost analytics',
      });
    }
  });

  // GET /api/v1/projects/:projectId/analytics/summary - Get combined summary
  router.get('/:projectId/analytics/summary', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      // Get all work packages for the project
      const workPackages = await workPackageRepository.findByProject(projectId);
      const workPackageIds = workPackages.map(wp => wp.id);

      if (workPackageIds.length === 0) {
        return res.status(200).json({
          project_id: projectId,
          work_package_count: 0,
          total_hours: 0,
          total_cost: 0,
          avg_hours_per_work_package: 0,
          avg_cost_per_work_package: 0,
        });
      }

      // Get time entries
      const timeEntries = await timeEntryRepository.findAll({
        workPackageId: workPackageIds.join(','),
        perPage: 10000,
      });

      // Get cost entries
      const costEntries = await costEntryRepository.findAll({
        workPackageId: workPackageIds.join(','),
        perPage: 10000,
      });

      const totalHours = timeEntries.timeEntries.reduce((sum, te) => sum + parseFloat(te.hours.toString()), 0);
      const totalCost = costEntries.costEntries.reduce((sum, ce) => sum + parseFloat(ce.amount.toString()), 0);

      return res.status(200).json({
        project_id: projectId,
        work_package_count: workPackages.length,
        total_hours: totalHours,
        total_cost: totalCost,
        avg_hours_per_work_package: workPackages.length > 0 ? totalHours / workPackages.length : 0,
        avg_cost_per_work_package: workPackages.length > 0 ? totalCost / workPackages.length : 0,
        time_entry_count: timeEntries.total,
        cost_entry_count: costEntries.total,
      });
    } catch (error: any) {
      console.error('Error getting project summary:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get project summary',
      });
    }
  });

  return router;
};
