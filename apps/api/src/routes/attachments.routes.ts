import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';
import { createAttachmentRepository } from '../repositories/AttachmentRepository';
import { storageService } from '../services/StorageService';
import { v4 as uuidv4 } from 'uuid';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { WorkPackageRepository } from '../repositories/WorkPackageRepository';
import { ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';

export const createAttachmentRouter = (): Router => {
    const router = Router();
    const repository = createAttachmentRepository();
    const workPackageRepository = new WorkPackageRepository();
    const activityLogRepository = new ActivityLogRepository();
    const authService = createAuthService();
    const authenticate = authenticateToken(authService);

    // Configure multer for memory storage
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 100 * 1024 * 1024, // 100MB
        },
    });

    // POST /api/v1/attachments/upload
    router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
        try {
            const { entityType, entityId } = req.body;
            const file = req.file;
            const user = req.user;

            if (!file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            if (!entityType || !entityId) {
                res.status(400).json({ error: 'entityType and entityId are required' });
                return;
            }

            if (!user) {
                res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
                return;
            }

            const fileExtension = file.originalname.split('.').pop();
            const storageKey = `attachments/${entityType}/${entityId}/${uuidv4()}.${fileExtension}`;

            // Upload to S3
            await storageService.uploadFile(storageKey, file.buffer, file.mimetype);

            // Save metadata to DB
            const attachment = await repository.create({
                entityType,
                entityId,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                storageKey,
                uploadedById: user.userId,
            });

            // Log activity
            if (entityType === 'WorkPackage') {
                const wp = await workPackageRepository.findById(entityId);
                if (wp) {
                    await activityLogRepository.create({
                        projectId: wp.projectId,
                        workPackageId: wp.id,
                        userId: user.userId,
                        actionType: ActivityActionType.ATTACHED,
                        entityType: ActivityEntityType.WORK_PACKAGE,
                        entityId: wp.id,
                        description: `attached file: ${file.originalname}`,
                        metadata: {
                            attachmentId: attachment.id,
                            fileName: file.originalname,
                        },
                    });
                }
            } else if (entityType === 'Project') {
                await activityLogRepository.create({
                    projectId: entityId,
                    userId: user.userId,
                    actionType: ActivityActionType.ATTACHED,
                    entityType: ActivityEntityType.PROJECT,
                    entityId: entityId,
                    description: `attached file: ${file.originalname}`,
                    metadata: {
                        attachmentId: attachment.id,
                        fileName: file.originalname,
                    },
                });
            }

            res.status(201).json({ attachment });
        } catch (error: any) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Failed to upload file', message: error.message });
        }
    });

    // GET /api/v1/attachments/:id/download
    // IMPORTANT: This must come BEFORE the generic /:entityType/:entityId route
    router.get('/:id/download', authenticate, async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const attachment = await repository.findById(id);

            if (!attachment) {
                res.status(404).json({ error: 'Attachment not found' });
                return;
            }

            const downloadUrl = await storageService.getDownloadUrl(attachment.storageKey);
            res.json({ downloadUrl });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to generate download URL', message: error.message });
        }
    });

    // GET /api/v1/attachments/:entityType/:entityId
    router.get('/:entityType/:entityId', authenticate, async (req: Request, res: Response): Promise<void> => {
        try {
            const { entityType, entityId } = req.params;
            const attachments = await repository.findByEntity(entityType, entityId);
            res.json({ attachments });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch attachments', message: error.message });
        }
    });

    // DELETE /api/v1/attachments/:id
    router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const attachment = await repository.findById(id);

            if (!attachment) {
                res.status(404).json({ error: 'Attachment not found' });
                return;
            }

            // Delete from S3
            await storageService.deleteFile(attachment.storageKey);

            // Delete from DB
            await repository.delete(id);

            // Log activity
            const user = req.user;
            if (user) {
                if (attachment.entityType === 'WorkPackage') {
                    const wp = await workPackageRepository.findById(attachment.entityId);
                    if (wp) {
                        await activityLogRepository.create({
                            projectId: wp.projectId,
                            workPackageId: wp.id,
                            userId: user.userId,
                            actionType: ActivityActionType.DELETED,
                            entityType: ActivityEntityType.ATTACHMENT,
                            entityId: attachment.id,
                            description: `deleted attachment: ${attachment.fileName}`,
                            metadata: {
                                fileName: attachment.fileName,
                            },
                        });
                    }
                } else if (attachment.entityType === 'Project') {
                    await activityLogRepository.create({
                        projectId: attachment.entityId,
                        userId: user.userId,
                        actionType: ActivityActionType.DELETED,
                        entityType: ActivityEntityType.ATTACHMENT,
                        entityId: attachment.id,
                        description: `deleted attachment: ${attachment.fileName}`,
                        metadata: {
                            fileName: attachment.fileName,
                        },
                    });
                }
            }

            res.json({ message: 'Attachment deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to delete attachment', message: error.message });
        }
    });

    return router;
};
