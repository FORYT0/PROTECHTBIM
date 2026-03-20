import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VendorType {
  SUPPLIER = 'SUPPLIER',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  CONSULTANT = 'CONSULTANT',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  OTHER = 'OTHER',
}

@Entity('vendors')
@Index(['vendorCode'], { unique: true })
@Index(['vendorName'])
@Index(['isActive'])
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'vendor_code' })
  vendorCode!: string; // auto: VEN-001

  @Column({ type: 'varchar', length: 255, name: 'vendor_name' })
  vendorName!: string;

  @Column({
    type: 'enum',
    enum: VendorType,
    default: VendorType.SUPPLIER,
    name: 'vendor_type',
  })
  vendorType!: VendorType;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'contact_person' })
  contactPerson!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'payment_terms' })
  paymentTerms!: string | null; // e.g., "Net 30"

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'tax_id' })
  taxId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'bank_account' })
  bankAccount!: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'int', nullable: true, default: null })
  rating!: number | null; // 1-5

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
