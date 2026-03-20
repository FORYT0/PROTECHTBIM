import { Router, Request, Response } from 'express';
import { aiService } from '../services/AIService';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createAiRouter = (): Router => {
  const router = Router();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  router.post('/risk-score', authenticate, async (req: Request, res: Response) => {
    try {
      const { scenario } = req.body;
      if (!scenario) {
        res.status(400).json({ error: 'Scenario is required' });
        return;
      }
      const result = await aiService.evaluateRisk(scenario);
      res.json(result);
      return;
    } catch (error) {
      console.error('Error in /risk-score:', error);
      res.status(500).json({ error: 'Failed to process AI risk score' });
      return;
    }
  });

  router.post('/chat', authenticate, async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Messages array is required' });
        return;
      }
      const result = await aiService.chatAsProjectManager(messages);
      res.json({ response: result });
      return;
    } catch (error) {
      console.error('Error in /chat:', error);
      res.status(500).json({ error: 'Failed to process AI chat' });
      return;
    }
  });

  return router;
};

export default createAiRouter;
