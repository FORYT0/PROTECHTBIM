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
import { Contract } from './Contract';
import { User } from './User';

export enum PaymentStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  CERTIFIED = 'Certified',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
}

@Entity('payment_certificates')
@Index(['contractId'])
@Index(['certificateNumber'], { unique: true })
@Index(['paymentStatus'])
export class PaymentCertificate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  contractId!: string;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract!: Contract;

  @Column({ type: 'varchar', length: 50, unique: true })
  certificateNumber!: string;

  @Column({ type: 'date' })
  periodStart!: Date;

  @Column({ type: 'date' })
  periodEnd!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  workCompletedValue!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  materialsOnSite!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  previousCertified!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  currentCertified!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  cumulativeCertified!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  retentionPercentage!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  retentionWithheld!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  advanceRecovery!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  netPayable!: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.DRAFT,
  })
  paymentStatus!: PaymentStatus;

  @Column({ type: 'date', nullable: true })
  submittedDate!: Date | null;

  @Column({ type: 'date', nullable: true })
  certifiedDate!: Date | null;

  @Column({ type: 'date', nullable: true })
  paymentDueDate!: Date | null;

  @Column({ type: 'date', nullable: true })
  paymentReceivedDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column('uuid')
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @Column('uuid', { nullable: true })
  approvedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver!: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
