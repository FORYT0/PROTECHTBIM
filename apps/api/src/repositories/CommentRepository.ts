import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Comment } from '../entities/Comment';

export interface CommentFilters {
    entityType?: string;
    entityId?: string;
    userId?: string;
    parentId?: string | null;
}

export class CommentRepository {
    private repository: Repository<Comment>;

    constructor() {
        this.repository = AppDataSource.getRepository(Comment);
    }

    async create(commentData: Partial<Comment>): Promise<Comment> {
        const comment = this.repository.create(commentData);
        return await this.repository.save(comment);
    }

    async findById(id: string): Promise<Comment | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['user', 'replies', 'replies.user'],
        });
    }

    async findByEntity(entityType: string, entityId: string): Promise<Comment[]> {
        // Fetch top-level comments (parentId is null)
        return await this.repository.find({
            where: { entityType, entityId, parentId: IsNull() },
            relations: ['user', 'replies', 'replies.user', 'replies.replies'],
            order: { createdAt: 'DESC' },
        });
    }

    async update(id: string, content: string): Promise<Comment | null> {
        await this.repository.update(id, {
            content,
            editedAt: new Date(),
        });
        return await this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }

    async addReaction(id: string, emoji: string): Promise<Comment | null> {
        const comment = await this.findById(id);
        if (!comment) return null;

        const reactions = { ...(comment.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;

        await this.repository.update(id, { reactions });
        return this.findById(id);
    }

    async removeReaction(id: string, emoji: string): Promise<Comment | null> {
        const comment = await this.findById(id);
        if (!comment) return null;

        const reactions = { ...(comment.reactions || {}) };
        if (reactions[emoji] && reactions[emoji] > 0) {
            reactions[emoji] -= 1;
            if (reactions[emoji] === 0) {
                delete reactions[emoji];
            }
        }

        await this.repository.update(id, { reactions });
        return this.findById(id);
    }

    async updateMentions(id: string, mentions: { id: string; name: string }[]): Promise<void> {
        await this.repository.update(id, { mentions });
    }
}

export const createCommentRepository = (): CommentRepository => {
    return new CommentRepository();
};
