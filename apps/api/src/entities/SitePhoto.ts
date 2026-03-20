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
import { DailyReport } from './DailyReport';
import { User } from './User';

@Entity('site_photos')
@Index(['projectId', 'createdAt'])
@Index(['workPackageId'])
@Index(['dailyReportId'])
export class SitePhoto {
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

  @Column('uuid', { nullable: true })
  dailyReportId!: string | null;

  @ManyToOne(() => DailyReport, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'dailyReportId' })
  dailyReport!: DailyReport | null;

  @Column({ type: 'varchar', length: 500 })
  fileUrl!: string;

  @Column({ type: 'integer', nullable: true })
  fileSize!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude!: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude!: number | null;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'simple-array', nullable: true })
  tags!: string[] | null;

  @Column('uuid')
  uploadedBy!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedBy' })
  uploader!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
