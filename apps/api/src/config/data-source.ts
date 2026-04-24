import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/User';
import { UserGroup } from '../entities/UserGroup';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';
import { Portfolio } from '../entities/Portfolio';
import { Program } from '../entities/Program';
import { Project } from '../entities/Project';
import { WorkPackage } from '../entities/WorkPackage';
import { WorkPackageRelation } from '../entities/WorkPackageRelation';
import { WorkPackageWatcher } from '../entities/WorkPackageWatcher';
import { WorkCalendar } from '../entities/WorkCalendar';
import { Baseline } from '../entities/Baseline';
import { BaselineWorkPackage } from '../entities/BaselineWorkPackage';
import { Board } from '../entities/Board';
import { BoardColumn } from '../entities/BoardColumn';
import { Sprint } from '../entities/Sprint';
import { SprintBurndown } from '../entities/SprintBurndown';
import { TimeEntry } from '../entities/TimeEntry';
import { CostEntry } from '../entities/CostEntry';
import { CostCode } from '../entities/CostCode';
import { Vendor } from '../entities/Vendor';
import { ResourceRate } from '../entities/ResourceRate';
import { Budget } from '../entities/Budget';
import { BudgetLine } from '../entities/BudgetLine';
import { ActivityLog } from '../entities/ActivityLog';
import { Comment } from '../entities/Comment';
import { Attachment } from '../entities/Attachment';
import { WikiPage } from '../entities/WikiPage';
import { Contract } from '../entities/Contract';
import { ChangeOrder } from '../entities/ChangeOrder';
import { ChangeOrderCostLine } from '../entities/ChangeOrderCostLine';
import { PaymentCertificate } from '../entities/PaymentCertificate';
import { DailyReport } from '../entities/DailyReport';
import { DelayEvent } from '../entities/DelayEvent';
import { SitePhoto } from '../entities/SitePhoto';
import { Snag } from '../entities/Snag';

dotenv.config();

const ALL_ENTITIES = [
  User, UserGroup, Role, Permission, Portfolio, Program, Project,
  WorkPackage, WorkPackageRelation, WorkPackageWatcher, WorkCalendar,
  Baseline, BaselineWorkPackage, Board, BoardColumn, Sprint, SprintBurndown,
  TimeEntry, CostEntry, CostCode, Vendor, ResourceRate, Budget, BudgetLine,
  ActivityLog, Comment, Attachment, WikiPage, Contract, ChangeOrder,
  ChangeOrderCostLine, PaymentCertificate, DailyReport, DelayEvent, SitePhoto, Snag,
];

// Railway provides DATABASE_URL (internal) or DATABASE_PUBLIC_URL (external proxy).
// When running inside Railway, the internal URL is preferred. Accept both.
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.DATABASE_PUBLIC_URL ||
  (process.env.PGHOST
    ? `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || process.env.POSTGRES_DB}`
    : null);

// Always synchronize schema — safe because we use tsx (no compiled migrations).
// Tables are created/updated automatically on every start.
const SYNC = true;

export const dataSourceOptions: DataSourceOptions = dbUrl
  ? {
      type: 'postgres',
      url: dbUrl,
      entities: ALL_ENTITIES,
      synchronize: SYNC,
      logging: false,
      ssl: { rejectUnauthorized: false },
      extra: {
        max: 10,
        min: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      },
    }
  : {
      type: 'postgres',
      host:     process.env.DATABASE_HOST || 'localhost',
      port:     parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'protecht_bim',
      entities: ALL_ENTITIES,
      synchronize: SYNC,
      logging: false,
      ssl: false,
      extra: {
        max: 10,
        min: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      },
    };

export const AppDataSource = new DataSource(dataSourceOptions);

export const initializeDatabase = async (): Promise<DataSource> => {
  if (!AppDataSource.isInitialized) {
    const urlUsed = (dataSourceOptions as any).url ||
      `${(dataSourceOptions as any).host}:${(dataSourceOptions as any).port}/${(dataSourceOptions as any).database}`;
    console.log(`🔌 Connecting to DB: ${urlUsed.replace(/:([^:@]+)@/, ':***@')}`);
    await AppDataSource.initialize();
    console.log('✅ Database connected — schema synchronised');
  }
  return AppDataSource;
};
