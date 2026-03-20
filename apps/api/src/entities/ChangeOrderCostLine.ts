import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ChangeOrder } from './ChangeOrder';
import { CostCode } from './CostCode';

@Entity('change_order_cost_lines')
@Index(['changeOrderId'])
@Index(['costCodeId'])
export class ChangeOrderCostLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  changeOrderId!: string;

  @ManyToOne(() => ChangeOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'changeOrderId' })
  changeOrder!: ChangeOrder;

  @Column('uuid')
  costCodeId!: string;

  @ManyToOne(() => CostCode, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'costCodeId' })
  costCode!: CostCode;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Column({ type: 'varchar', length: 50 })
  unit!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rate!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
