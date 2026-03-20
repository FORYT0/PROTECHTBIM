import { Router } from 'express';
import { WikiService } from '../services/WikiService';
import { authenticateToken } from '../middleware/auth.middleware';
import { createAuthService } from '../middleware/auth.middleware';

const router = Router();
const wikiService = new WikiService();
const authService = createAuthService();
const authenticate = authenticateToken(authService);

// Get wiki tree for a project
router.get('/projects/:projectId/wiki', authenticate, async (req, res) => {
    try {
        const tree = await wikiService.getProjectWikiTree(req.params.projectId);
        return res.json({ tree });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
});

// Get wiki page by slug
router.get('/projects/:projectId/wiki/:slug', authenticate, async (req, res) => {
    try {
        const page = await wikiService.getPageBySlug(req.params.projectId, req.params.slug);
        if (!page) {
            return res.status(404).json({ message: 'Wiki page not found' });
        }
        return res.json({ page });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
});

// Create new wiki page
router.post('/projects/:projectId/wiki', authenticate, async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        console.log('Creating wiki page:', { projectId: req.params.projectId, userId, body: req.body });
        const page = await wikiService.createPage(req.params.projectId, userId, req.body);
        console.log('Wiki page created successfully:', page.id);
        return res.status(201).json({ page });
    } catch (error: any) {
        console.error('Error creating wiki page:', error);
        return res.status(500).json({ message: error.message });
    }
});

// Update wiki page
router.patch('/wiki/:id', authenticate, async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const page = await wikiService.updatePage(req.params.id, userId, req.body);
        return res.json({ page });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
});

// Delete wiki page
router.delete('/wiki/:id', authenticate, async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        await wikiService.deletePage(req.params.id, userId);
        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
});

export default router;
