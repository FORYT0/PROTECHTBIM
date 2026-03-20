import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { WikiPage } from '../entities/WikiPage';

export class WikiRepository {
    private repository: Repository<WikiPage>;

    constructor() {
        this.repository = AppDataSource.getRepository(WikiPage);
    }

    async findByProjectId(projectId: string): Promise<WikiPage[]> {
        return await this.repository.find({
            where: { projectId },
            order: { orderIndex: 'ASC', createdAt: 'ASC' },
            relations: ['createdBy', 'lastEditedBy'],
        });
    }

    async findBySlug(projectId: string, slug: string): Promise<WikiPage | null> {
        return await this.repository.findOne({
            where: { projectId, slug },
            relations: ['createdBy', 'lastEditedBy', 'parent'],
        });
    }

    async findById(id: string): Promise<WikiPage | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['createdBy', 'lastEditedBy', 'parent'],
        });
    }

    async save(page: WikiPage): Promise<WikiPage> {
        return await this.repository.save(page);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async getTree(projectId: string): Promise<WikiPage[]> {
        const allPages = await this.findByProjectId(projectId);

        // Build hierarchy
        const pageMap = new Map<string, WikiPage>();
        const roots: WikiPage[] = [];

        // Initialize children arrays and map
        allPages.forEach(page => {
            page.children = [];
            pageMap.set(page.id, page);
        });

        // Populate children
        allPages.forEach(page => {
            if (page.parentId && pageMap.has(page.parentId)) {
                pageMap.get(page.parentId)!.children!.push(page);
            } else {
                roots.push(page);
            }
        });

        return roots;
    }
}
