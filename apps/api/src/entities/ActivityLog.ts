import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Project } from './Project';
import { WorkPackage } from './WorkPackage';
import { User } from './User';

export enum ActivityActionType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  COMMENTED = 'COMMENTED',
  ATTACHED = 'ATTACHED',
  MENTIONED = 'MENTIONED',
  TRANSITIONED = 'TRANSITIONED',
  ASSIGNED = 'ASSIGNED',
  SHARED = 'SHARED',
  APPROVED = 'APPROVED',
}

export enum ActivityEntityType {
  PROJECT = 'Project',
  WORK_PACKAGE = 'WorkPackage',
  TIME_ENTRY = 'TimeEntry',
  COST_ENTRY = 'CostEntry',
  COMMENT = 'Comment',
  ATTACHMENT = 'Attachment',
  WIKI_PAGE = 'WikiPage',
  SPRINT = 'Sprint',
  BOARD = 'Board',
  BASELINE = 'Baseline',
  BUDGET = 'Budget',
}

@Entity('activity_logs')
@Index(['projectId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['actionType'])
@Index(['entityType'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Column('uuid', { nullable: true })
  workPackageId!: string | null;

  @ManyToOne(() => WorkPackage, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'workPackageId' })
  workPackage!: WorkPackage | null;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: ActivityActionType,
  })
  actionType!: ActivityActionType;

  @Column({
    type: 'enum',
    enum: ActivityEntityType,
  })
  entityType!: ActivityEntityType;

  @Column('uuid')
  entityId!: string;

  @Column('text')
  description!: string;

  @Column('json', { nullable: true })
  metadata!: {
    oldValue?: any;
    newValue?: any;
    [key: string]: any;
  } | null;

  @CreateDateColumn()
  createdAt!: Date;
}
