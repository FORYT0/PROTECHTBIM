import { Router, Request, Response, NextFunction } from 'express';
import { ContractService } from '../services/ContractService';
import { authenticateToken } from '../middleware/auth.middleware';
import { ContractType, ContractStatus } from '../entities/Contract';

const router = Router();

// Optional auth: extract user from JWT if present, don't block if missing
const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
      const decoded = jwt.verify(token, secret) as any;
      (req as any).user = decoded;
    } catch {}
  }
  next();
};

const contractService = new ContractService();

// Get all contracts (no auth required for testing)
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📝 Fetching all contracts');
    const contracts = await contractService.getAllContracts();
    console.log('✅ Found contracts:', contracts.length);
    res.json({ contracts });
  } catch (error: any) {
    console.error('❌ Error fetching contracts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create contract (no auth required for testing)
router.post('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Use a default user ID for testing if not authenticated
    const userId = (req as any).user?.userId || req.body.createdBy;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    console.log('📝 Creating contract:', req.body);

    const contract = await contractService.createContract(
      {
        projectId: req.body.projectId,
        contractNumber: req.body.contractNumber,
        contractType: req.body.contractType as ContractType,
        clientName: req.body.clientName,
        originalContractValue: parseFloat(req.body.originalContractValue),
        originalDurationDays: parseInt(req.body.originalDurationDays),
        startDate: new Date(req.body.startDate),
        completionDate: new Date(req.body.completionDate),
        retentionPercentage: req.body.retentionPercentage ? parseFloat(req.body.retentionPercentage) : undefined,
        advancePaymentAmount: req.body.advancePaymentAmount ? parseFloat(req.body.advancePaymentAmount) : undefined,
        performanceBondValue: req.body.performanceBondValue ? parseFloat(req.body.performanceBondValue) : undefined,
        currency: req.body.currency,
        description: req.body.description,
        terms: req.body.terms,
      },
      userId
    );

    console.log('✅ Contract created:', contract.id);
    res.status(201).json({ contract });
  } catch (error: any) {
    console.error('❌ Error creating contract:', error);
    res.status(400).json({ error: error.message });
  }
});

// ⚠️ CRITICAL: /project/:projectId/all MUST come BEFORE /:id route and BEFORE auth middleware
// Otherwise /project will match /:id parameter!
router.get('/project/:projectId/all', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    console.log(`📝 [CONTRACTS] Fetching ALL contracts for project: ${projectId}`);
    
    const contracts = await contractService.getContractsByProjectId(projectId);
    console.log(`✅ [CONTRACTS] Found ${contracts.length} contracts for project ${projectId}`);
    
    return res.json({ contracts });
  } catch (error: any) {
    console.error('❌ [CONTRACTS] Error fetching contracts:', error);
    return res.status(500).json({ error: error.message });
  }
});

// All other routes require authentication
router.use(authenticateToken);

// Get contract by project ID (single contract)
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    console.log(`📝 Fetching contract for project: ${req.params.projectId}`);
    const contract = await contractService.getContractByProjectId(req.params.projectId);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found for this project' });
    }

    return res.json({ contract });
  } catch (error: any) {
    console.error('Error fetching contract:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get contract by ID - MUST come AFTER /project routes to avoid shadowing
router.get('/:id', async (req: Request, res: Response) => {
  try {
    console.log(`📝 Fetching contract by ID: ${req.params.id}`);
    const contract = await contractService.getContractById(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    return res.json({ contract });
  } catch (error: any) {
    console.error('Error fetching contract:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update contract
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const contract = await contractService.updateContract(
      req.params.id,
      {
        contractType: req.body.contractType as ContractType,
        clientName: req.body.clientName,
        retentionPercentage: req.body.retentionPercentage ? parseFloat(req.body.retentionPercentage) : undefined,
        advancePaymentAmount: req.body.advancePaymentAmount ? parseFloat(req.body.advancePaymentAmount) : undefined,
        performanceBondValue: req.body.performanceBondValue ? parseFloat(req.body.performanceBondValue) : undefined,
        status: req.body.status as ContractStatus,
        description: req.body.description,
        terms: req.body.terms,
      },
      userId
    );

    res.json({ contract });
  } catch (error: any) {
    console.error('Error updating contract:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get contract metrics
router.get('/:id/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await contractService.getContractMetrics(req.params.id);
    res.json({ metrics });
  } catch (error: any) {
    console.error('Error fetching contract metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete contract
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await contractService.deleteContract(req.params.id, userId);
    res.json({ message: 'Contract deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting contract:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
