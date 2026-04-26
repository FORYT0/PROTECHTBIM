import { Router, Request, Response } from 'express';
import { ChangeOrderService } from '../services/ChangeOrderService';
import { authenticateToken } from '../middleware/auth.middleware';
import { ChangeOrderReason, ChangeOrderPriority } from '../entities/ChangeOrder';

const router = Router();
const changeOrderService = new ChangeOrderService();

// ─── PUBLIC ROUTES ────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const changeOrders = await changeOrderService.getAllChangeOrders();
    res.json({ changeOrders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || req.body.submittedBy;
    const changeOrder = await changeOrderService.createChangeOrder(
      {
        projectId: req.body.projectId,
        contractId: req.body.contractId,
        title: req.body.title,
        description: req.body.description,
        reason: req.body.reason as ChangeOrderReason,
        costImpact: parseFloat(req.body.costImpact) || 0,
        scheduleImpactDays: req.body.scheduleImpactDays ? parseInt(req.body.scheduleImpactDays) : undefined,
        priority: req.body.priority as ChangeOrderPriority,
        notes: req.body.notes,
        costLines: (req.body.costLines || []).map((line: any) => ({
          costCodeId: line.costCodeId,
          description: line.description,
          quantity: parseFloat(line.quantity) || 0,
          unit: line.unit,
          rate: parseFloat(line.rate) || 0,
          amount: parseFloat(line.amount) || 0,
          notes: line.notes,
        })),
      },
      userId
    );
    res.status(201).json({ changeOrder });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── SPECIFIC COLLECTION ROUTES (BEFORE /:id) ────────────────────

router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const changeOrders = await changeOrderService.getChangeOrdersByProject(req.params.projectId);
    res.json({ changeOrders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/project/:projectId/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await changeOrderService.getChangeOrderMetrics(req.params.projectId);
    res.json({ metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/contract/:contractId', async (req: Request, res: Response) => {
  try {
    const changeOrders = await changeOrderService.getChangeOrdersByContract(req.params.contractId);
    res.json({ changeOrders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────
router.use(authenticateToken);

// ─── INDIVIDUAL RESOURCE ROUTES ──────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const changeOrder = await changeOrderService.getChangeOrderById(req.params.id);
    if (!changeOrder) return res.status(404).json({ error: 'Change order not found' });
    return res.json({ changeOrder });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id/cost-lines', async (req: Request, res: Response) => {
  try {
    const costLines = await changeOrderService.getCostLines(req.params.id);
    res.json({ costLines });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const changeOrder = await changeOrderService.submitChangeOrder(req.params.id, userId);
    res.json({ changeOrder });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const changeOrder = await changeOrderService.approveChangeOrder(req.params.id, userId);
    res.json({ changeOrder, message: 'Change order approved and budget updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const reason = req.body.reason;
    if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });
    const changeOrder = await changeOrderService.rejectChangeOrder(req.params.id, userId, reason);
    return res.json({ changeOrder });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
