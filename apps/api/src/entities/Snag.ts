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
import { WorkPackage } from './WorkPackage';
import { User } from './User';

export enum SnagSeverity {
  MINOR = 'Minor',
  MAJOR = 'Major',
  CRITICAL = 'Critical',
}

export enum SnagCategory {
  DEFECT = 'Defect',
  INCOMPLETE = 'Incomplete',
  DAMAGE = 'Damage',
  NON_COMPLIANCE = 'Non-Compliance',
}

export enum SnagStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  VERIFIED = 'Verified',
  CLOSED = 'Closed',
}

@Entity('snags')
@Index(['projectId', 'status'])
@Index(['workPackageId'])
@Index(['assignedTo'])
export class Snag {
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

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: SnagSeverity,
    default: SnagSeverity.MINOR,
  })
  severity!: SnagSeverity;

  @Column({
    type: 'enum',
    enum: SnagCategory,
  })
  category!: SnagCategory;

  @Column('uuid', { nullable: true })
  assignedTo!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedTo' })
  assignee!: User | null;

  @Column({ type: 'date', nullable: true })
  dueDate!: Date | null;

  @Column({
    type: 'enum',
    enum: SnagStatus,
    default: SnagStatus.OPEN,
  })
  status!: SnagStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  costImpact!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  rectificationCost!: number;

  @Column({ type: 'simple-array', nullable: true })
  photoUrls!: string[] | null;

  @Column('uuid')
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @Column('uuid', { nullable: true })
  resolvedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'resolvedBy' })
  resolver!: User | null;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt!: Date | null;

  @Column('uuid', { nullable: true })
  verifiedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifier!: User | null;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
