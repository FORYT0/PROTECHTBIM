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
import { DailyReport } from './DailyReport';
import { User } from './User';

export enum DelayType {
  WEATHER = 'Weather',
  CLIENT = 'Client',
  DESIGN = 'Design',
  MATERIAL = 'Material',
  EQUIPMENT = 'Equipment',
  LABOR = 'Labor',
  AUTHORITY = 'Authority',
  THIRD_PARTY = 'Third Party',
}

export enum ResponsibleParty {
  CLIENT = 'Client',
  CONTRACTOR = 'Contractor',
  CONSULTANT = 'Consultant',
  THIRD_PARTY = 'Third Party',
}

export enum DelayStatus {
  LOGGED = 'Logged',
  UNDER_REVIEW = 'Under Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('delay_events')
@Index(['projectId', 'delayType'])
@Index(['dailyReportId'])
@Index(['status'])
export class DelayEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  dailyReportId!: string | null;

  @ManyToOne(() => DailyReport, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'dailyReportId' })
  dailyReport!: DailyReport | null;

  @Column('uuid')
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Column({
    type: 'enum',
    enum: DelayType,
  })
  delayType!: DelayType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'integer', default: 0 })
  estimatedImpactDays!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  costImpact!: number;

  @Column({
    type: 'enum',
    enum: ResponsibleParty,
  })
  responsibleParty!: ResponsibleParty;

  @Column({
    type: 'enum',
    enum: DelayStatus,
    default: DelayStatus.LOGGED,
  })
  status!: DelayStatus;

  @Column({ type: 'text', nullable: true })
  mitigationAction!: string | null;

  @Column('uuid')
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
