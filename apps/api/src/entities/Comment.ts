import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { User } from './User';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'entity_type', type: 'varchar' })
    entityType!: string;

    @Column({ name: 'entity_id', type: 'uuid' })
    entityId!: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ name: 'parent_id', type: 'uuid', nullable: true })
    parentId!: string | null;

    @ManyToOne('Comment', 'replies', { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_id' })
    parent!: any;

    @OneToMany('Comment', 'parent')
    replies!: any[];

    @Column({ type: 'text' })
    content!: string;

    @Column('jsonb', { nullable: true, default: [] })
    mentions!: { id: string; name: string }[] | null;

    @Column({ type: 'jsonb', nullable: true })
    reactions!: Record<string, number> | null;

    @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
    editedAt!: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
