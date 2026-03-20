import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Attachment } from '../entities/Attachment';

export class AttachmentRepository {
    private repository: Repository<Attachment>;

    constructor() {
        this.repository = AppDataSource.getRepository(Attachment);
    }

    async create(data: Partial<Attachment>): Promise<Attachment> {
        const attachment = this.repository.create(data);
        return await this.repository.save(attachment);
    }

    async findById(id: string): Promise<Attachment | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['uploadedBy'],
        });
    }

    async findByEntity(entityType: string, entityId: string): Promise<Attachment[]> {
        return await this.repository.find({
            where: { entityType, entityId },
            relations: ['uploadedBy'],
            order: { createdAt: 'DESC' },
        });
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}

export const createAttachmentRepository = (): AttachmentRepository => {
    return new AttachmentRepository();
};
