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

@Entity('cost_codes')
@Index(['code'], { unique: true })
@Index(['parentCodeId'])
@Index(['level'])
export class CostCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string; // e.g., "01", "01.01", "01.01.001"

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'parent_code_id' })
  parentCodeId!: string | null;

  @ManyToOne(() => CostCode, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_code_id' })
  parentCode!: CostCode | null;

  @Column({ type: 'int', default: 1 })
  level!: number; // 1, 2, 3 for hierarchy depth

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
