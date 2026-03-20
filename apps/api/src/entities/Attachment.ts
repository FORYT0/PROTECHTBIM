import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './User';

@Entity('attachments')
export class Attachment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, name: 'entity_type' })
    @Index()
    entityType!: string;

    @Column({ type: 'uuid', name: 'entity_id' })
    @Index()
    entityId!: string;

    @Column({ type: 'varchar', length: 255, name: 'file_name' })
    fileName!: string;

    @Column({ type: 'bigint', name: 'file_size' })
    fileSize!: number;

    @Column({ type: 'varchar', length: 100, name: 'mime_type' })
    mimeType!: string;

    @Column({ type: 'varchar', length: 500, name: 'storage_key' })
    storageKey!: string;

    @Column({ type: 'uuid', name: 'uploaded_by' })
    uploadedById!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relationships
    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploaded_by' })
    uploadedBy!: User;
}
