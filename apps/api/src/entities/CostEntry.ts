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
import { WorkPackage } from './WorkPackage';
import { User } from './User';
import { Project } from './Project';
import { CostCode } from './CostCode';
import { Vendor } from './Vendor';

export enum CostCategory {
  LABOR = 'LABOR',
  MATERIAL = 'MATERIAL',
  EQUIPMENT = 'EQUIPMENT',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  OVERHEAD = 'OVERHEAD',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum EntrySource {
  MANUAL = 'MANUAL',
  TIME_ENTRY = 'TIME_ENTRY',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  IMPORT = 'IMPORT',
  API = 'API',
}

@Entity('cost_entries')
@Index(['projectId', 'entryDate'])
@Index(['workPackageId', 'entryDate'])
@Index(['costCodeId'])
@Index(['costCategory'])
@Index(['vendorId'])
@Index(['entryNumber'], { unique: true })
export class CostEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'entry_number' })
  entryNumber!: string; // auto: CE-2026-0001

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ type: 'uuid', nullable: true, name: 'work_package_id' })
  workPackageId!: string | null;

  @ManyToOne(() => WorkPackage, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'work_package_id' })
  workPackage!: WorkPackage | null;

  @Column({ type: 'uuid', name: 'cost_code_id' })
  costCodeId!: string;

  @ManyToOne(() => CostCode, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cost_code_id' })
  costCode!: CostCode;

  @Column({
    type: 'enum',
    enum: CostCategory,
    name: 'cost_category',
  })
  costCategory!: CostCategory;

  @Column({ type: 'uuid', nullable: true, name: 'vendor_id' })
  vendorId!: string | null;

  @ManyToOne(() => Vendor, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor!: Vendor | null;

  // Financial Details
  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity!: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit!: string | null; // e.g., "m3", "ton", "hours"

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'unit_cost' })
  unitCost!: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_cost' })
  totalCost!: number; // auto-calculated or direct entry

  // Invoice Details
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'invoice_number' })
  invoiceNumber!: string | null;

  @Column({ type: 'date', nullable: true, name: 'invoice_date' })
  invoiceDate!: Date | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
    name: 'payment_status',
  })
  paymentStatus!: PaymentStatus;

  // Classification
  @Column({ type: 'boolean', default: true, name: 'is_billable' })
  isBillable!: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_committed' })
  isCommitted!: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'commitment_id' })
  commitmentId!: string | null; // FK to PO (future)

  // Metadata
  @Column({ type: 'date', name: 'entry_date' })
  entryDate!: Date;

  @Column({
    type: 'enum',
    enum: EntrySource,
    default: EntrySource.MANUAL,
    name: 'entry_source',
  })
  entrySource!: EntrySource;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @Column({ type: 'uuid', nullable: true, name: 'approved_by' })
  approvedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver!: User | null;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt!: Date | null;

  // Attachments (stored as JSON array of attachment IDs)
  @Column({ type: 'simple-json', nullable: true, name: 'attachment_ids' })
  attachmentIds!: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
