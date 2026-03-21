import { Router, Request, Response } from 'express';
import { ChangeOrderService } from '../services/ChangeOrderService';
import { authenticateToken } from '../middleware/auth.middleware';
import { ChangeOrderReason, ChangeOrderPriority } from '../entities/ChangeOrder';

const router = Router();
const changeOrderService = new ChangeOrderService();

// Get all change orders
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📝 Fetching all change orders');
    const changeOrders = await changeOrderService.getAllChangeOrders();
    console.log('✅ Found change orders:', changeOrders.length);
    res.json({ changeOrders });
  } catch (error: any) {
    console.error('❌ Error fetching change orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create change order (no auth required for testing)
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || 'a0077b22-fc68-408c-b1ce-aab3d36855de';

    console.log('📝 Creating change order:', req.body);

    const changeOrder = await changeOrderService.createChangeOrder(
      {
        projectId: req.body.projectId,
        contractId: req.body.contractId,
        title: req.body.title,
        description: req.body.description,
        reason: req.body.reason as ChangeOrderReason,
        costImpact: parseFloat(req.body.costImpact),
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

    console.log('✅ Change order created:', changeOrder.id);
    res.status(201).json({ changeOrder });
  } catch (error: any) {
    console.error('❌ Error creating change order:', error);
    res.status(400).json({ error: error.message });
  }
});

// All other routes require authentication
router.use(authenticateToken);

// Get change order by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const changeOrder = await changeOrderService.getChangeOrderById(req.params.id);

    if (!changeOrder) {
      return res.status(404).json({ error: 'Change order not found' });
    }

    return res.json({ changeOrder });
  } catch (error: any) {
    console.error('Error fetching change order:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get change orders by project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const changeOrders = await changeOrderService.getChangeOrdersByProject(req.params.projectId);
    res.json({ changeOrders });
  } catch (error: any) {
    console.error('Error fetching change orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get change orders by contract
router.get('/contract/:contractId', async (req: Request, res: Response) => {
  try {
    const changeOrders = await changeOrderService.getChangeOrdersByContract(req.params.contractId);
    res.json({ changeOrders });
  } catch (error: any) {
    console.error('Error fetching change orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cost lines for change order
router.get('/:id/cost-lines', async (req: Request, res: Response) => {
  try {
    const costLines = await changeOrderService.getCostLines(req.params.id);
    res.json({ costLines });
  } catch (error: any) {
    console.error('Error fetching cost lines:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit change order
router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const changeOrder = await changeOrderService.submitChangeOrder(req.params.id, userId);
    res.json({ changeOrder });
  } catch (error: any) {
    console.error('Error submitting change order:', error);
    res.status(400).json({ error: error.message });
  }
});

// Approve change order (CRITICAL - triggers budget impact)
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const changeOrder = await changeOrderService.approveChangeOrder(req.params.id, userId);
    res.json({
      changeOrder,
      message: 'Change order approved and budget updated successfully'
    });
  } catch (error: any) {
    console.error('Error approving change order:', error);
    res.status(400).json({ error: error.message });
  }
});

// Reject change order
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const reason = req.body.reason;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const changeOrder = await changeOrderService.rejectChangeOrder(req.params.id, userId, reason);
    return res.json({ changeOrder });
  } catch (error: any) {
    console.error('Error rejecting change order:', error);
    return res.status(400).json({ error: error.message });
  }
});

// Get change order metrics for project
router.get('/project/:projectId/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await changeOrderService.getChangeOrderMetrics(req.params.projectId);
    res.json({ metrics });
  } catch (error: any) {
    console.error('Error fetching change order metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
