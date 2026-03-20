import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Project } from './Project';
import { User } from './User';

@Entity('wiki_pages')
@Index(['projectId', 'slug'], { unique: true })
@Index(['projectId', 'parentId'])
export class WikiPage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('varchar', { length: 255 })
    title!: string;

    @Column('varchar', { length: 255 })
    slug!: string;

    @Column('text')
    content!: string;

    @Column('uuid', { name: 'project_id' })
    projectId!: string;

    @ManyToOne(() => Project, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project!: Project;

    @Column('uuid', { nullable: true, name: 'parent_id' })
    parentId!: string | null;

    @ManyToOne(() => WikiPage, (page) => page.children, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'parent_id' })
    parent!: WikiPage | null;

    @Column('int', { default: 0, name: 'order_index' })
    orderIndex!: number;

    @Column('uuid', { name: 'created_by_id' })
    createdById!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_id' })
    createdBy!: User;

    @Column('uuid', { nullable: true, name: 'last_edited_by_id' })
    lastEditedById!: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'last_edited_by_id' })
    lastEditedBy!: User | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Virtual property for children (not a real column)
    children?: WikiPage[];
}
