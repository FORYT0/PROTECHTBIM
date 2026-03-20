import { Router, Request, Response } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { AppDataSource } from '../config/data-source';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createUserRouter = (): Router => {
    const router = Router();
    const repository = new UserRepository(AppDataSource);
    const authService = createAuthService();
    const authenticate = authenticateToken(authService);

    // GET /api/v1/users/search - Search users
    router.get('/search', authenticate, async (req: Request, res: Response) => {
        try {
            const query = req.query.q as string;
            if (!query || query.length < 2) {
                return res.status(200).json([]);
            }

            const users = await repository.search(query);
            return res.status(200).json(users);
        } catch (error: any) {
            console.error('Error searching users:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /api/v1/users/me - Get current user profile
    router.get('/me', authenticate, async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.userId;
            const user = await repository.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json(user);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    });

    return router;
};
