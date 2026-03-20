import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Project } from './Project';
import { WorkPackageRelation } from './WorkPackageRelation';
import { WorkPackageWatcher } from './WorkPackageWatcher';
import { Sprint } from './Sprint';

export enum WorkPackageType {
  TASK = 'task',
  MILESTONE = 'milestone',
  PHASE = 'phase',
  FEATURE = 'feature',
  BUG = 'bug',
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum SchedulingMode {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

@Entity('work_packages')
export class WorkPackage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  @Index()
  projectId!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: WorkPackageType;

  @Column({ type: 'varchar', length: 500 })
  subject!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  status!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: Priority.NORMAL,
  })
  priority!: Priority;

  @Column({ type: 'uuid', name: 'assignee_id', nullable: true })
  @Index()
  assigneeId?: string;

  @Column({ type: 'uuid', name: 'accountable_id', nullable: true })
  accountableId?: string;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  @Index()
  parentId?: string;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'estimated_hours' })
  estimatedHours?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'spent_hours' })
  spentHours!: number;

  @Column({ type: 'integer', default: 0, name: 'progress_percent' })
  progressPercent!: number;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'scheduling_mode',
    default: SchedulingMode.AUTOMATIC,
  })
  schedulingMode!: SchedulingMode;

  @Column({ type: 'uuid', nullable: true, name: 'version_id' })
  versionId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'sprint_id' })
  sprintId?: string;

  @Column({ type: 'integer', nullable: true, name: 'story_points' })
  storyPoints?: number;

  @Column({ type: 'jsonb', nullable: true, name: 'custom_fields' })
  customFields?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'accountable_id' })
  accountable?: User;

  @ManyToOne(() => WorkPackage, (wp) => wp.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: WorkPackage;

  @OneToMany(() => WorkPackage, (wp) => wp.parent)
  children!: WorkPackage[];

  @OneToMany(() => WorkPackageRelation, (relation) => relation.from)
  relationsFrom!: WorkPackageRelation[];

  @OneToMany(() => WorkPackageRelation, (relation) => relation.to)
  relationsTo!: WorkPackageRelation[];

  @OneToMany(() => WorkPackageWatcher, (watcher) => watcher.workPackage)
  watchers!: WorkPackageWatcher[];

  @ManyToOne(() => Sprint, (sprint) => sprint.workPackages, { nullable: true })
  @JoinColumn({ name: 'sprint_id' })
  sprint?: Sprint;
}
