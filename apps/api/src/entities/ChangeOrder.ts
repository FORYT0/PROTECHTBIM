import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Project } from './Project';
import { Contract } from './Contract';
import { User } from './User';

export enum ChangeOrderReason {
  CLIENT_CHANGE = 'Client Change',
  SITE_CONDITION = 'Site Condition',
  DESIGN_ERROR = 'Design Error',
  REGULATORY = 'Regulatory',
  SCOPE_ADDITION = 'Scope Addition',
  UNFORESEEN = 'Unforeseen',
}

export enum ChangeOrderStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  UNDER_REVIEW = 'Under Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  VOIDED = 'Voided',
}

export enum ChangeOrderPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

@Entity('change_orders')
@Index(['projectId', 'status'])
@Index(['changeNumber'], { unique: true })
export class ChangeOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  // contractId is nullable — change orders can exist without a linked contract
  @Column({ type: 'uuid', nullable: true })
  contractId!: string | null;

  @ManyToOne(() => Contract, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'contractId' })
  contract!: Contract | null;

  @Column({ type: 'varchar', length: 50, unique: true })
  changeNumber!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: ChangeOrderReason,
  })
  reason!: ChangeOrderReason;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  costImpact!: number;

  @Column({ type: 'integer', default: 0 })
  scheduleImpactDays!: number;

  @Column({
    type: 'enum',
    enum: ChangeOrderStatus,
    default: ChangeOrderStatus.DRAFT,
  })
  status!: ChangeOrderStatus;

  @Column({
    type: 'enum',
    enum: ChangeOrderPriority,
    default: ChangeOrderPriority.MEDIUM,
  })
  priority!: ChangeOrderPriority;

  @Column('uuid')
  submittedBy!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'submittedBy' })
  submitter!: User;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt!: Date | null;

  @Column('uuid', { nullable: true })
  reviewedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer!: User | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt!: Date | null;

  @Column('uuid', { nullable: true })
  approvedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver!: User | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
