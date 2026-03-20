import { WikiPage } from '../entities/WikiPage';
import { WikiRepository } from '../repositories/WikiRepository';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { ActivityActionType, ActivityEntityType } from '../entities/ActivityLog';
import slugify from 'slugify';

export class WikiService {
    private wikiRepository: WikiRepository;
    private activityLogRepository: ActivityLogRepository;

    constructor() {
        this.wikiRepository = new WikiRepository();
        this.activityLogRepository = new ActivityLogRepository();
    }

    async getProjectWikiTree(projectId: string): Promise<WikiPage[]> {
        return await this.wikiRepository.getTree(projectId);
    }

    async getPageBySlug(projectId: string, slug: string): Promise<WikiPage | null> {
        return await this.wikiRepository.findBySlug(projectId, slug);
    }

    async createPage(projectId: string, userId: string, data: Partial<WikiPage>): Promise<WikiPage> {
        const page = new WikiPage();
        page.title = data.title || 'Untitled Page';
        page.slug = data.slug || slugify(page.title, { lower: true, strict: true });
        page.content = data.content || '';
        page.projectId = projectId;
        page.parentId = data.parentId || null;
        page.orderIndex = data.orderIndex || 0;
        page.createdById = userId;

        const savedPage = await this.wikiRepository.save(page);

        // Log activity
        await this.activityLogRepository.create({
            projectId,
            userId,
            actionType: ActivityActionType.CREATED,
            entityType: ActivityEntityType.WIKI_PAGE,
            entityId: savedPage.id,
            description: `created wiki page: ${savedPage.title}`,
        });

        return savedPage;
    }

    async updatePage(id: string, userId: string, data: Partial<WikiPage>): Promise<WikiPage> {
        const page = await this.wikiRepository.findById(id);
        if (!page) {
            throw new Error('Wiki page not found');
        }

        if (data.title) {
            page.title = data.title;
            // Only update slug if not explicitly provided and title changed
            if (!data.slug) {
                page.slug = slugify(page.title, { lower: true, strict: true });
            }
        }

        if (data.slug) page.slug = data.slug;
        if (data.content !== undefined) page.content = data.content;
        if (data.parentId !== undefined) page.parentId = data.parentId;
        if (data.orderIndex !== undefined) page.orderIndex = data.orderIndex;

        page.lastEditedById = userId;

        const updatedPage = await this.wikiRepository.save(page);

        // Log activity
        await this.activityLogRepository.create({
            projectId: updatedPage.projectId,
            userId,
            actionType: ActivityActionType.UPDATED,
            entityType: ActivityEntityType.WIKI_PAGE,
            entityId: updatedPage.id,
            description: `updated wiki page: ${updatedPage.title}`,
        });

        return updatedPage;
    }

    async deletePage(id: string, userId: string): Promise<void> {
        const page = await this.wikiRepository.findById(id);
        if (!page) {
            throw new Error('Wiki page not found');
        }

        await this.wikiRepository.delete(id);

        // Log activity
        await this.activityLogRepository.create({
            projectId: page.projectId,
            userId,
            actionType: ActivityActionType.DELETED,
            entityType: ActivityEntityType.WIKI_PAGE,
            entityId: id,
            description: `deleted wiki page: ${page.title}`,
        });
    }
}
