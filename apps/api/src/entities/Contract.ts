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
import { User } from './User';

export enum ContractType {
  LUMP_SUM = 'Lump Sum',
  BOQ = 'BOQ',
  DESIGN_BUILD = 'Design-Build',
  EPC = 'EPC',
  COST_PLUS = 'Cost Plus',
  UNIT_PRICE = 'Unit Price',
}

export enum ContractStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  TERMINATED = 'Terminated',
}

@Entity('contracts')
@Index(['projectId'])
@Index(['status'])
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Column({ type: 'varchar', length: 100, unique: true })
  contractNumber!: string;

  @Column({
    type: 'enum',
    enum: ContractType,
    default: ContractType.LUMP_SUM,
  })
  contractType!: ContractType;

  @Column({ type: 'varchar', length: 255 })
  clientName!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  originalContractValue!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  revisedContractValue!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalApprovedVariations!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalPendingVariations!: number;

  @Column({ type: 'integer' })
  originalDurationDays!: number;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  completionDate!: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  retentionPercentage!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  advancePaymentAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  performanceBondValue!: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
  })
  status!: ContractStatus;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  terms!: string | null;

  @Column('uuid', { nullable: true })
  createdBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator!: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
