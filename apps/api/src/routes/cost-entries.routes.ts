import { Router, Request, Response } from 'express';
import { CostEntryService, createCostEntryService } from '../services/CostEntryService';
import { CostCategory, PaymentStatus, EntrySource } from '../entities/CostEntry';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createCostEntryRouter = (costEntryService?: CostEntryService): Router => {
  const router = Router();
  const service = costEntryService || createCostEntryService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // POST /api/v1/cost-entries - Create cost entry
  router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const {
        project_id,
        work_package_id,
        cost_code_id,
        cost_category,
        vendor_id,
        description,
        quantity,
        unit,
        unit_cost,
        total_cost,
        invoice_number,
        invoice_date,
        payment_status,
        is_billable,
        is_committed,
        commitment_id,
        entry_date,
        entry_source,
        attachment_ids,
      } = req.body;

      const costEntry = await service.createCostEntry(
        {
          projectId: project_id,
          workPackageId: work_package_id,
          costCodeId: cost_code_id,
          costCategory: cost_category,
          vendorId: vendor_id,
          description,
          quantity,
          unit,
          unitCost: unit_cost,
          totalCost: total_cost,
          invoiceNumber: invoice_number,
          invoiceDate: invoice_date ? new Date(invoice_date) : undefined,
          paymentStatus: payment_status,
          isBillable: is_billable,
          isCommitted: is_committed,
          commitmentId: commitment_id,
          entryDate: new Date(entry_date),
          entrySource: entry_source,
          createdBy: userId,
          attachmentIds: attachment_ids,
        },
        userId
      );

      return res.status(201).json({
        cost_entry: {
          id: costEntry.id,
          entry_number: costEntry.entryNumber,
          project_id: costEntry.projectId,
          work_package_id: costEntry.workPackageId,
          cost_code_id: costEntry.costCodeId,
          cost_category: costEntry.costCategory,
          vendor_id: costEntry.vendorId,
          description: costEntry.description,
          quantity: costEntry.quantity,
          unit: costEntry.unit,
          unit_cost: costEntry.unitCost,
          total_cost: costEntry.totalCost,
          invoice_number: costEntry.invoiceNumber,
          invoice_date: costEntry.invoiceDate,
          payment_status: costEntry.paymentStatus,
          is_billable: costEntry.isBillable,
          is_committed: costEntry.isCommitted,
          commitment_id: costEntry.commitmentId,
          entry_date: costEntry.entryDate,
          entry_source: costEntry.entrySource,
          created_by: costEntry.createdBy,
          approved_by: costEntry.approvedBy,
          approved_at: costEntry.approvedAt,
          attachment_ids: costEntry.attachmentIds,
          created_at: costEntry.createdAt,
          updated_at: costEntry.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error creating cost entry:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create cost entry',
      });
    }
  });

  // GET /api/v1/cost-entries - List cost entries
  router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        project_id,
        work_package_id,
        cost_code_id,
        cost_category,
        vendor_id,
        payment_status,
        entry_source,
        is_billable,
        is_committed,
        date_from,
        date_to,
        search,
        page,
        per_page,
        sort_by,
        sort_order,
      } = req.query;

      const result = await service.listCostEntries({
        projectId: project_id as string,
        workPackageId: work_package_id as string,
        costCodeId: cost_code_id as string,
        costCategory: cost_category as CostCategory,
        vendorId: vendor_id as string,
        paymentStatus: payment_status as PaymentStatus,
        entrySource: entry_source as EntrySource,
        isBillable: is_billable === 'true' ? true : is_billable === 'false' ? false : undefined,
        isCommitted: is_committed === 'true' ? true : is_committed === 'false' ? false : undefined,
        dateFrom: date_from ? new Date(date_from as string) : undefined,
        dateTo: date_to ? new Date(date_to as string) : undefined,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        perPage: per_page ? parseInt(per_page as string, 10) : undefined,
        sortBy: sort_by as string,
        sortOrder: (sort_order as string)?.toUpperCase() as 'ASC' | 'DESC',
      });

      return res.status(200).json({
        cost_entries: result.costEntries.map((ce) => ({
          id: ce.id,
          entry_number: ce.entryNumber,
          project_id: ce.projectId,
          work_package_id: ce.workPackageId,
          cost_code_id: ce.costCodeId,
          cost_category: ce.costCategory,
          vendor_id: ce.vendorId,
          description: ce.description,
          quantity: ce.quantity,
          unit: ce.unit,
          unit_cost: ce.unitCost,
          total_cost: ce.totalCost,
          invoice_number: ce.invoiceNumber,
          invoice_date: ce.invoiceDate,
          payment_status: ce.paymentStatus,
          is_billable: ce.isBillable,
          is_committed: ce.isCommitted,
          commitment_id: ce.commitmentId,
          entry_date: ce.entryDate,
          entry_source: ce.entrySource,
          created_by: ce.createdBy,
          approved_by: ce.approvedBy,
          approved_at: ce.approvedAt,
          attachment_ids: ce.attachmentIds,
          created_at: ce.createdAt,
          updated_at: ce.updatedAt,
          project: ce.project
            ? {
                id: ce.project.id,
                name: ce.project.name,
              }
            : undefined,
          work_package: ce.workPackage
            ? {
                id: ce.workPackage.id,
                subject: ce.workPackage.subject,
              }
            : undefined,
          cost_code: ce.costCode
            ? {
                id: ce.costCode.id,
                code: ce.costCode.code,
                name: ce.costCode.name,
              }
            : undefined,
          vendor: ce.vendor
            ? {
                id: ce.vendor.id,
                vendor_code: ce.vendor.vendorCode,
                vendor_name: ce.vendor.vendorName,
              }
            : undefined,
          creator: ce.creator
            ? {
                id: ce.creator.id,
                email: ce.creator.email,
                name: ce.creator.name,
              }
            : undefined,
          approver: ce.approver
            ? {
                id: ce.approver.id,
                email: ce.approver.email,
                name: ce.approver.name,
              }
            : undefined,
        })),
        total: result.total,
        page: result.page,
        per_page: result.perPage,
      });
    } catch (error: any) {
      console.error('Error listing cost entries:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to list cost entries',
      });
    }
  });

  // GET /api/v1/cost-entries/projects/:projectId/summary - Get cost summary for project
  router.get('/projects/:projectId/summary', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { date_from, date_to } = req.query;

      const summary = await service.getCostSummary(projectId, {
        dateFrom: date_from ? new Date(date_from as string) : undefined,
        dateTo: date_to ? new Date(date_to as string) : undefined,
      });

      return res.status(200).json({
        summary: {
          total_cost: summary.totalCost,
          billable_cost: summary.billableCost,
          non_billable_cost: summary.nonBillableCost,
          committed_cost: summary.committedCost,
          by_cost_category: summary.byCostCategory,
          by_payment_status: summary.byPaymentStatus,
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

  // GET /api/v1/cost-entries/projects/:projectId/by-cost-code - Get cost by cost code
  router.get('/projects/:projectId/by-cost-code', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const costByCostCode = await service.getCostByCostCode(projectId);

      return res.status(200).json({
        cost_by_cost_code: costByCostCode.map((item) => ({
          cost_code_id: item.costCodeId,
          cost_code: item.costCode,
          total_cost: item.totalCost,
        })),
      });
    } catch (error: any) {
      console.error('Error getting cost by cost code:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get cost by cost code',
      });
    }
  });

  // GET /api/v1/cost-entries/:id - Get cost entry by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const costEntry = await service.getCostEntryById(id);

      if (!costEntry) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Cost entry not found',
        });
      }

      return res.status(200).json({
        cost_entry: {
          id: costEntry.id,
          entry_number: costEntry.entryNumber,
          project_id: costEntry.projectId,
          work_package_id: costEntry.workPackageId,
          cost_code_id: costEntry.costCodeId,
          cost_category: costEntry.costCategory,
          vendor_id: costEntry.vendorId,
          description: costEntry.description,
          quantity: costEntry.quantity,
          unit: costEntry.unit,
          unit_cost: costEntry.unitCost,
          total_cost: costEntry.totalCost,
          invoice_number: costEntry.invoiceNumber,
          invoice_date: costEntry.invoiceDate,
          payment_status: costEntry.paymentStatus,
          is_billable: costEntry.isBillable,
          is_committed: costEntry.isCommitted,
          commitment_id: costEntry.commitmentId,
          entry_date: costEntry.entryDate,
          entry_source: costEntry.entrySource,
          created_by: costEntry.createdBy,
          approved_by: costEntry.approvedBy,
          approved_at: costEntry.approvedAt,
          attachment_ids: costEntry.attachmentIds,
          created_at: costEntry.createdAt,
          updated_at: costEntry.updatedAt,
          project: costEntry.project
            ? {
                id: costEntry.project.id,
                name: costEntry.project.name,
              }
            : undefined,
          work_package: costEntry.workPackage
            ? {
                id: costEntry.workPackage.id,
                subject: costEntry.workPackage.subject,
              }
            : undefined,
          cost_code: costEntry.costCode
            ? {
                id: costEntry.costCode.id,
                code: costEntry.costCode.code,
                name: costEntry.costCode.name,
              }
            : undefined,
          vendor: costEntry.vendor
            ? {
                id: costEntry.vendor.id,
                vendor_code: costEntry.vendor.vendorCode,
                vendor_name: costEntry.vendor.vendorName,
              }
            : undefined,
          creator: costEntry.creator
            ? {
                id: costEntry.creator.id,
                email: costEntry.creator.email,
                name: costEntry.creator.name,
              }
            : undefined,
          approver: costEntry.approver
            ? {
                id: costEntry.approver.id,
                email: costEntry.approver.email,
                name: costEntry.approver.name,
              }
            : undefined,
        },
      });
    } catch (error: any) {
      console.error('Error getting cost entry:', error);
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to get cost entry',
      });
    }
  });

  // PATCH /api/v1/cost-entries/:id - Update cost entry
  router.patch('/:id', authenticate, async (req: Request, res: Response) => {
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
        work_package_id,
        cost_code_id,
        cost_category,
        vendor_id,
        description,
        quantity,
        unit,
        unit_cost,
        total_cost,
        invoice_number,
        invoice_date,
        payment_status,
        is_billable,
        is_committed,
        commitment_id,
        entry_date,
        attachment_ids,
      } = req.body;

      const costEntry = await service.updateCostEntry(
        id,
        {
          workPackageId: work_package_id,
          costCodeId: cost_code_id,
          costCategory: cost_category,
          vendorId: vendor_id,
          description,
          quantity,
          unit,
          unitCost: unit_cost,
          totalCost: total_cost,
          invoiceNumber: invoice_number,
          invoiceDate: invoice_date ? new Date(invoice_date) : undefined,
          paymentStatus: payment_status,
          isBillable: is_billable,
          isCommitted: is_committed,
          commitmentId: commitment_id,
          entryDate: entry_date ? new Date(entry_date) : undefined,
          attachmentIds: attachment_ids,
        },
        userId
      );

      return res.status(200).json({
        cost_entry: {
          id: costEntry.id,
          entry_number: costEntry.entryNumber,
          project_id: costEntry.projectId,
          work_package_id: costEntry.workPackageId,
          cost_code_id: costEntry.costCodeId,
          cost_category: costEntry.costCategory,
          vendor_id: costEntry.vendorId,
          description: costEntry.description,
          quantity: costEntry.quantity,
          unit: costEntry.unit,
          unit_cost: costEntry.unitCost,
          total_cost: costEntry.totalCost,
          invoice_number: costEntry.invoiceNumber,
          invoice_date: costEntry.invoiceDate,
          payment_status: costEntry.paymentStatus,
          is_billable: costEntry.isBillable,
          is_committed: costEntry.isCommitted,
          commitment_id: costEntry.commitmentId,
          entry_date: costEntry.entryDate,
          entry_source: costEntry.entrySource,
          created_by: costEntry.createdBy,
          approved_by: costEntry.approvedBy,
          approved_at: costEntry.approvedAt,
          attachment_ids: costEntry.attachmentIds,
          created_at: costEntry.createdAt,
          updated_at: costEntry.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error updating cost entry:', error);

      if (error.message === 'Cost entry not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update cost entry',
      });
    }
  });

  // POST /api/v1/cost-entries/:id/approve - Approve cost entry
  router.post('/:id/approve', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const costEntry = await service.approveCostEntry(id, userId);

      return res.status(200).json({
        cost_entry: {
          id: costEntry.id,
          entry_number: costEntry.entryNumber,
          approved_by: costEntry.approvedBy,
          approved_at: costEntry.approvedAt,
        },
        message: 'Cost entry approved successfully',
      });
    } catch (error: any) {
      console.error('Error approving cost entry:', error);

      if (error.message === 'Cost entry not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to approve cost entry',
      });
    }
  });

  // PATCH /api/v1/cost-entries/:id/payment-status - Update payment status
  router.patch('/:id/payment-status', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { payment_status } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      if (!payment_status) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'payment_status is required',
        });
      }

      const costEntry = await service.updatePaymentStatus(id, payment_status, userId);

      return res.status(200).json({
        cost_entry: {
          id: costEntry.id,
          entry_number: costEntry.entryNumber,
          payment_status: costEntry.paymentStatus,
        },
        message: 'Payment status updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating payment status:', error);

      if (error.message === 'Cost entry not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update payment status',
      });
    }
  });

  // DELETE /api/v1/cost-entries/:id - Delete cost entry
  router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const deleted = await service.deleteCostEntry(id, userId);

      if (!deleted) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Cost entry not found',
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting cost entry:', error);

      if (error.message === 'Cost entry not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to delete cost entry',
      });
    }
  });

  return router;
};
