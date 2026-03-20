import { Router, Request, Response } from 'express';
import { CommentRepository } from '../repositories/CommentRepository';
import { WorkPackageRepository } from '../repositories/WorkPackageRepository';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';
import { ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
import { socketManager } from '../websocket/socket-manager';
import { AppDataSource } from '../config/data-source';

export const createCommentRouter = (): Router => {
    const router = Router();
    const repository = new CommentRepository();
    const workPackageRepository = new WorkPackageRepository();
    const activityLogRepository = new ActivityLogRepository();
    const authService = createAuthService();
    const authenticate = authenticateToken(authService);

    // POST /api/v1/comments - Create comment
    router.post('/', authenticate, async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.userId;
            const { entityType, entityId, content, parentId } = req.body;

            if (!content) {
                return res.status(400).json({ error: 'Content is required' });
            }

            const comment = await repository.create({
                entityType,
                entityId,
                userId,
                content,
                parentId: parentId || null,
            });

            // Fetch the full comment with user data for the response/broadcast
            const fullComment = await repository.findById(comment.id);

            // Mention detection and population
            const mentionRegex = /@\[([0-9a-fA-F-]{36})\]/g;
            let match;
            const mentionedUserIds: string[] = [];
            const mentionedUsers: { id: string; name: string }[] = [];
            const userRepository = AppDataSource.getRepository('User');

            while ((match = mentionRegex.exec(content)) !== null) {
                const mentionedUserId = match[1];
                mentionedUserIds.push(mentionedUserId);
                const user = await userRepository.findOne({ where: { id: mentionedUserId } });
                if (user) {
                    mentionedUsers.push({ id: user.id, name: (user as any).name });
                }
            }

            // Update comment with persistent mentions data
            if (mentionedUsers.length > 0) {
                await repository.updateMentions(comment.id, mentionedUsers);
            }

            // Log activity and notify
            if (entityType === 'WorkPackage') {
                const wp = await workPackageRepository.findById(entityId);
                if (wp) {
                    await activityLogRepository.create({
                        projectId: wp.projectId,
                        workPackageId: wp.id,
                        userId,
                        actionType: ActivityActionType.COMMENTED,
                        entityType: ActivityEntityType.WORK_PACKAGE,
                        entityId: wp.id,
                        description: `commented on work package: ${wp.subject}`,
                        metadata: {
                            commentId: comment.id,
                            content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                        },
                    });

                    // Broadcast comment addition to project room
                    socketManager.notifyProject(wp.projectId, 'comment:added', {
                        ...fullComment,
                        entityType,
                        entityId
                    });

                    // Send individual notifications to mentioned users
                    for (const mentionedId of mentionedUserIds) {
                        if (mentionedId === userId) continue; // Don't notify self

                        socketManager.notifyUser(mentionedId, 'comment:mentioned', {
                            commentId: comment.id,
                            authorName: fullComment?.user?.name,
                            entityType,
                            entityId,
                            entitySubject: wp.subject,
                            excerpt: content.substring(0, 50),
                        });
                    }
                }
            } else if (entityType === 'Project') {
                await activityLogRepository.create({
                    projectId: entityId,
                    userId,
                    actionType: ActivityActionType.COMMENTED,
                    entityType: ActivityEntityType.PROJECT,
                    entityId: entityId,
                    description: `commented on project`,
                    metadata: {
                        commentId: comment.id,
                        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    },
                });

                // Broadcast comment addition to project room
                socketManager.notifyProject(entityId, 'comment:added', {
                    ...fullComment,
                    entityType,
                    entityId
                });

                // Send individual notifications to mentioned users
                for (const mentionedId of mentionedUserIds) {
                    if (mentionedId === userId) continue; // Don't notify self

                    socketManager.notifyUser(mentionedId, 'comment:mentioned', {
                        commentId: comment.id,
                        authorName: fullComment?.user?.name,
                        entityType,
                        entityId,
                        entitySubject: 'Project',
                        excerpt: content.substring(0, 50),
                    });
                }
            }

            return res.status(201).json(fullComment);
        } catch (error: any) {
            console.error('Error creating comment:', error);
            return res.status(400).json({ error: error.message });
        }
    });

    // GET /api/v1/comments/:entityType/:entityId - List comments
    router.get('/:entityType/:entityId', authenticate, async (req: Request, res: Response) => {
        try {
            const { entityType, entityId } = req.params;
            const comments = await repository.findByEntity(entityType, entityId);
            return res.status(200).json(comments);
        } catch (error: any) {
            console.error('Error listing comments:', error);
            return res.status(400).json({ error: error.message });
        }
    });

    // PATCH /api/v1/comments/:id - Update comment
    router.patch('/:id', authenticate, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const userId = (req as any).user?.userId;

            const comment = await repository.findById(id);
            if (!comment) {
                return res.status(404).json({ error: 'Comment not found' });
            }

            if (comment.userId !== userId) {
                return res.status(403).json({ error: 'Forbidden: You can only edit your own comments' });
            }

            const updated = await repository.update(id, content);
            return res.status(200).json(updated);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    });

    // DELETE /api/v1/comments/:id - Delete comment
    router.delete('/:id', authenticate, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.userId;

            const comment = await repository.findById(id);
            if (!comment) {
                return res.status(404).json({ error: 'Comment not found' });
            }

            if (comment.userId !== userId) {
                return res.status(403).json({ error: 'Forbidden: You can only delete your own comments' });
            }

            await repository.delete(id);
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    });

    // POST /api/v1/comments/:id/reactions - Add/Remove reaction
    router.post('/:id/reactions', authenticate, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { emoji, action } = req.body; // action: 'add' or 'remove'

            const updated = action === 'remove'
                ? await repository.removeReaction(id, emoji)
                : await repository.addReaction(id, emoji);

            return res.status(200).json(updated);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    });

    return router;
};
