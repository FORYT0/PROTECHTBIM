/**
 * PROTECHT BIM - Comprehensive Demo Seed Script
 * Creates a full "Nairobi Heights Mixed-Use Tower" demo project
 *
 * Run with:  npx ts-node -r tsconfig-paths/register scripts/seed-demo.ts
 * OR:        node -e "require('./scripts/seed-demo')"  (after build)
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../src/config/data-source';
import { User } from '../src/entities/User';
import { Project, ProjectStatus, LifecyclePhase } from '../src/entities/Project';
import { WorkPackage, WorkPackageType, Priority } from '../src/entities/WorkPackage';
import { Contract, ContractType, ContractStatus } from '../src/entities/Contract';
import { ChangeOrder, ChangeOrderReason, ChangeOrderStatus, ChangeOrderPriority } from '../src/entities/ChangeOrder';
import { Budget } from '../src/entities/Budget';
import { BudgetLine } from '../src/entities/BudgetLine';
import { CostEntry, CostType } from '../src/entities/CostEntry';
import { TimeEntry } from '../src/entities/TimeEntry';
import { DailyReport } from '../src/entities/DailyReport';
import { Snag, SnagSeverity, SnagCategory, SnagStatus } from '../src/entities/Snag';
import { Sprint, SprintStatus } from '../src/entities/Sprint';
import { Board } from '../src/entities/Board';
import { BoardColumn } from '../src/entities/BoardColumn';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('🔌 Connecting to database…');
  await AppDataSource.initialize();
  console.log('✅ Connected!\n');

  const userRepo    = AppDataSource.getRepository(User);
  const projectRepo = AppDataSource.getRepository(Project);
  const wpRepo      = AppDataSource.getRepository(WorkPackage);
  const contractRepo= AppDataSource.getRepository(Contract);
  const coRepo      = AppDataSource.getRepository(ChangeOrder);
  const budgetRepo  = AppDataSource.getRepository(Budget);
  const blRepo      = AppDataSource.getRepository(BudgetLine);
  const ceRepo      = AppDataSource.getRepository(CostEntry);
  const teRepo      = AppDataSource.getRepository(TimeEntry);
  const drRepo      = AppDataSource.getRepository(DailyReport);
  const snagRepo    = AppDataSource.getRepository(Snag);
  const sprintRepo  = AppDataSource.getRepository(Sprint);
  const boardRepo   = AppDataSource.getRepository(Board);
  const colRepo     = AppDataSource.getRepository(BoardColumn);

  // ─────────────────────────────────────────────────────────
  // 1. USERS
  // ─────────────────────────────────────────────────────────
  console.log('👤 Creating users…');
  const passwordHash = await bcrypt.hash('Demo1234!', 10);

  const upsertUser = async (email: string, name: string) => {
    let u = await userRepo.findOne({ where: { email } });
    if (!u) {
      u = userRepo.create({ email, name, passwordHash, status: 'active' });
      await userRepo.save(u);
      console.log(`   Created: ${name} <${email}>`);
    } else {
      console.log(`   Exists:  ${name} <${email}>`);
    }
    return u;
  };

  const admin = await upsertUser('admin@protecht.demo', 'Sarah Kamau (Admin)');
  const pm    = await upsertUser('pm@protecht.demo',    'James Mwangi (PM)');
  const eng   = await upsertUser('eng@protecht.demo',   'Aisha Otieno (Engineer)');

  console.log('   ✅ Login: admin@protecht.demo / Demo1234!\n');

  // ─────────────────────────────────────────────────────────
  // 2. PROJECT
  // ─────────────────────────────────────────────────────────
  console.log('🏗️  Creating project…');
  let project = await projectRepo.findOne({ where: { name: 'Nairobi Heights Mixed-Use Tower' } });
  if (!project) {
    project = projectRepo.create({
      name: 'Nairobi Heights Mixed-Use Tower',
      description: 'A 22-floor mixed-use development in Westlands, Nairobi comprising retail (floors 1-3), Grade-A offices (floors 4-18) and luxury residential apartments (floors 19-22). Contract value KES 4.2B.',
      ownerId: pm.id,
      status: ProjectStatus.ACTIVE,
      lifecyclePhase: LifecyclePhase.EXECUTION,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2026-06-30'),
    });
    await projectRepo.save(project);
  }
  const pid = project.id;
  console.log(`   ✅ Project: ${project.name} (${pid})\n`);

  // ─────────────────────────────────────────────────────────
  // 3. WORK PACKAGES  (phases → tasks)
  // ─────────────────────────────────────────────────────────
  console.log('📦 Creating work packages…');
  const phases = [
    { subject: 'Site Preparation & Earthworks', dur: 30,  est: 240, act: 240, pct: 100, status: 'Closed'      as any, startOff: 0  },
    { subject: 'Piling & Foundation Works',      dur: 45,  est: 480, act: 460, pct: 100, status: 'Closed'      as any, startOff: 30 },
    { subject: 'Basement & Podium Structure',    dur: 60,  est: 720, act: 680, pct: 100, status: 'Closed'      as any, startOff: 75 },
    { subject: 'Tower Core & Slab Construction', dur: 120, est: 1440,act: 980, pct: 68,  status: 'In Progress' as any, startOff: 135},
    { subject: 'MEP Rough-In Works',             dur: 90,  est: 960, act: 320, pct: 33,  status: 'In Progress' as any, startOff: 195},
    { subject: 'Façade & Curtain Wall',          dur: 75,  est: 600, act: 0,   pct: 0,   status: 'New'         as any, startOff: 270},
    { subject: 'Interior Fit-Out (Commercial)',  dur: 60,  est: 800, act: 0,   pct: 0,   status: 'New'         as any, startOff: 330},
    { subject: 'Interior Fit-Out (Residential)', dur: 45,  est: 600, act: 0,   pct: 0,   status: 'New'         as any, startOff: 345},
    { subject: 'Commissioning & Testing',        dur: 30,  est: 240, act: 0,   pct: 0,   status: 'New'         as any, startOff: 390},
    { subject: 'Handover & Snagging',            dur: 21,  est: 160, act: 0,   pct: 0,   status: 'New'         as any, startOff: 415},
  ];

  const baseDate = new Date('2024-01-15');
  const addDays  = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate()+n); return r; };

  const wps: WorkPackage[] = [];
  for (const p of phases) {
    const sd = addDays(baseDate, p.startOff);
    const ed = addDays(sd, p.dur);
    let wp = await wpRepo.findOne({ where: { subject: p.subject, projectId: pid } });
    if (!wp) {
      wp = wpRepo.create({
        subject: p.subject, projectId: pid,
        type: WorkPackageType.PHASE, priority: Priority.HIGH,
        status: p.status, percentageDone: p.pct,
        assigneeId: eng.id,
        startDate: sd, dueDate: ed,
        estimatedHours: p.est, spentHours: p.act,
      });
      await wpRepo.save(wp);
    }
    wps.push(wp);
  }
  console.log(`   ✅ Created ${wps.length} work packages\n`);

  // ─────────────────────────────────────────────────────────
  // 4. CONTRACT
  // ─────────────────────────────────────────────────────────
  console.log('📄 Creating contract…');
  let contract = await contractRepo.findOne({ where: { contractNumber: 'NHT-2024-001' } });
  if (!contract) {
    contract = contractRepo.create({
      projectId: pid,
      contractNumber: 'NHT-2024-001',
      contractType: ContractType.LUMP_SUM,
      clientName: 'Westlands Real Estate Holdings Ltd',
      originalContractValue: 4200000000,
      revisedContractValue: 4350000000,
      totalApprovedVariations: 150000000,
      totalPendingVariations: 85000000,
      originalDurationDays: 540,
      startDate: new Date('2024-01-15'),
      completionDate: new Date('2025-07-08'),
      retentionPercentage: 5,
      advancePaymentAmount: 420000000,
      performanceBondValue: 210000000,
      currency: 'KES',
      status: ContractStatus.ACTIVE,
      description: 'Main construction contract for Nairobi Heights Mixed-Use Tower including civil, structural, mechanical, electrical and plumbing works.',
      createdBy: admin.id,
    });
    await contractRepo.save(contract);
  }
  console.log(`   ✅ Contract ${contract.contractNumber}\n`);

  // ─────────────────────────────────────────────────────────
  // 5. CHANGE ORDERS
  // ─────────────────────────────────────────────────────────
  console.log('🔄 Creating change orders…');
  const cos = [
    {
      changeNumber: 'CO-001', title: 'Tower Core Redesign – Extra Shear Walls',
      description: 'Structural engineer issued RFI-042 requiring 4 additional shear walls in the tower core due to updated wind load calculations per revised KBC 2023. This adds 280 m³ of concrete and 45 tonnes of rebar.',
      reason: ChangeOrderReason.DESIGN_ERROR, costImpact: 85000000, scheduleImpactDays: 14,
      status: ChangeOrderStatus.APPROVED, priority: ChangeOrderPriority.HIGH,
      submittedAt: new Date('2024-06-10'), approvedAt: new Date('2024-06-25'),
    },
    {
      changeNumber: 'CO-002', title: 'Client-Requested Upgrade: Façade Glazing Spec',
      description: 'Client requesting upgrade from standard double-glazed units to triple-glazed with solar control coating (SGG COOL-LITE SKN 176). Affects all 1,840 façade panels. Improves LEED score from Silver to Gold.',
      reason: ChangeOrderReason.CLIENT_CHANGE, costImpact: 65000000, scheduleImpactDays: 7,
      status: ChangeOrderStatus.APPROVED, priority: ChangeOrderPriority.MEDIUM,
      submittedAt: new Date('2024-09-01'), approvedAt: new Date('2024-09-20'),
    },
    {
      changeNumber: 'CO-003', title: 'Underground Services Rerouting',
      description: 'Discovery of an uncharted 600mm NCWSC water main during basement excavation requires rerouting of the electrical HV cable entry route. Coordination with Kenya Power ongoing.',
      reason: ChangeOrderReason.UNFORESEEN, costImpact: 28000000, scheduleImpactDays: 21,
      status: ChangeOrderStatus.UNDER_REVIEW, priority: ChangeOrderPriority.CRITICAL,
      submittedAt: new Date('2025-01-08'), approvedAt: null,
    },
  ];

  for (const c of cos) {
    const exists = await coRepo.findOne({ where: { changeNumber: c.changeNumber } });
    if (!exists) {
      const co = coRepo.create({
        projectId: pid, contractId: contract.id,
        changeNumber: c.changeNumber, title: c.title,
        description: c.description, reason: c.reason,
        costImpact: c.costImpact, scheduleImpactDays: c.scheduleImpactDays,
        status: c.status, priority: c.priority,
        submittedBy: pm.id, submittedAt: c.submittedAt,
        approvedBy: c.approvedAt ? admin.id : null,
        approvedAt: c.approvedAt,
        notes: null, rejectionReason: null,
        reviewedBy: null, reviewedAt: null,
      });
      await coRepo.save(co);
    }
  }
  console.log(`   ✅ 3 change orders\n`);

  // ─────────────────────────────────────────────────────────
  // 6. BUDGET
  // ─────────────────────────────────────────────────────────
  console.log('💰 Creating budget…');
  let budget = await budgetRepo.findOne({ where: { projectId: pid } });
  if (!budget) {
    // Pull a cost code to attach (use raw query for simplicity)
    const costCodes = await AppDataSource.query(`SELECT id, code FROM cost_codes LIMIT 6`);
    budget = budgetRepo.create({
      projectId: pid, name: 'NHT Main Contract Budget',
      totalBudget: 4200000000, contingencyPercentage: 5,
      contingencyAmount: 210000000, currency: 'KES',
      startDate: new Date('2024-01-15'), endDate: new Date('2026-06-30'),
      description: 'Approved project budget per BOQ revision 3', isActive: true,
    });
    await budgetRepo.save(budget);

    const budgetLines = [
      { desc: 'Civil & Structural Works',    amount: 1680000000 },
      { desc: 'MEP Works',                   amount: 840000000  },
      { desc: 'Façade & Curtain Wall',        amount: 630000000  },
      { desc: 'Interior Finishes',           amount: 756000000  },
      { desc: 'External Works & Landscaping',amount: 294000000  },
    ];

    for (let i = 0; i < budgetLines.length; i++) {
      const cc = costCodes[i] || costCodes[0];
      if (!cc) continue;
      const bl = blRepo.create({
        budgetId: budget.id, costCodeId: cc.id,
        budgetedAmount: budgetLines[i].amount,
        actualCost: budgetLines[i].amount * 0.42,
        committedCost: budgetLines[i].amount * 0.68,
        notes: budgetLines[i].desc,
      });
      await blRepo.save(bl);
    }
    console.log(`   ✅ Budget + 5 lines\n`);
  } else {
    console.log(`   Already exists, skipping\n`);
  }

  // ─────────────────────────────────────────────────────────
  // 7. TIME ENTRIES (last 30 days)
  // ─────────────────────────────────────────────────────────
  console.log('⏱️  Creating time entries…');
  const existingTE = await teRepo.count({ where: { workPackageId: wps[3].id } });
  if (existingTE === 0) {
    const workers = [admin, pm, eng];
    for (let d = 29; d >= 0; d--) {
      const date = addDays(new Date(), -d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      for (const worker of workers) {
        const wpIdx = d > 20 ? 2 : 3;
        await teRepo.save(teRepo.create({
          workPackageId: wps[wpIdx].id, userId: worker.id,
          hours: 8 + Math.floor(Math.random() * 3),
          comment: `Daily site work - ${wps[wpIdx].subject}`,
          date, billable: true,
        }));
      }
    }
    console.log(`   ✅ ~90 time entries\n`);
  } else {
    console.log(`   Already seeded, skipping\n`);
  }

  // ─────────────────────────────────────────────────────────
  // 8. COST ENTRIES
  // ─────────────────────────────────────────────────────────
  console.log('💸 Creating cost entries…');
  const existingCE = await ceRepo.count({ where: { workPackageId: wps[3].id } });
  if (existingCE === 0) {
    const costData = [
      { wp: 0, type: CostType.LABOUR,       amt: 12000000,  desc: 'Earthworks labour – Phase 1' },
      { wp: 0, type: CostType.EQUIPMENT,    amt: 8500000,   desc: 'Excavator & tipper hire' },
      { wp: 1, type: CostType.SUBCONTRACTOR,amt: 95000000,  desc: 'Piling subcontractor – Keller Kenya' },
      { wp: 1, type: CostType.MATERIAL,     amt: 22000000,  desc: 'Steel casing & grout' },
      { wp: 2, type: CostType.SUBCONTRACTOR,amt: 180000000, desc: 'Basement concrete works' },
      { wp: 2, type: CostType.MATERIAL,     amt: 55000000,  desc: 'Rebar & formwork' },
      { wp: 3, type: CostType.SUBCONTRACTOR,amt: 210000000, desc: 'Tower core concrete – ongoing' },
      { wp: 3, type: CostType.MATERIAL,     amt: 88000000,  desc: 'High-strength concrete C50' },
      { wp: 3, type: CostType.LABOUR,       amt: 34000000,  desc: 'Skilled concreters' },
      { wp: 4, type: CostType.MATERIAL,     amt: 45000000,  desc: 'MEP materials advance order' },
    ];
    for (const c of costData) {
      await ceRepo.save(ceRepo.create({
        workPackageId: wps[c.wp].id, userId: pm.id,
        type: c.type, amount: c.amt,
        description: c.desc, currency: 'KES',
        date: addDays(new Date(), -Math.floor(Math.random() * 60)),
      }));
    }
    console.log(`   ✅ 10 cost entries\n`);
  } else {
    console.log(`   Already seeded, skipping\n`);
  }

  // ─────────────────────────────────────────────────────────
  // 9. DAILY REPORTS (last 7 working days)
  // ─────────────────────────────────────────────────────────
  console.log('📋 Creating daily reports…');
  const weather = ['Sunny 28°C', 'Partly cloudy 26°C', 'Overcast 24°C', 'Light rain 22°C', 'Sunny 30°C'];
  const completed = [
    'Poured tower core level 11 slab – 180 m³ C50 concrete. Installed rebar for level 12 columns.',
    'Completed shear wall shuttering levels 11-12. MEP conduit first-fix on level 8.',
    'Poured level 12 slab. Scaffolding advanced to level 13. Safety toolbox talk conducted.',
    'Delayed by morning rain – resumed at 10:00. Completed column starter bars level 13.',
    'Full day pour – level 13 slab 165 m³. 48 workers on site. No incidents.',
    'Formwork strike level 11. Installed cast-in items for MEP penetrations level 10.',
    'Tower crane PM maintenance 06:00-09:00. Rebar fixing level 14 columns afternoon.',
  ];

  const drCount = await drRepo.count({ where: { projectId: pid } });
  if (drCount === 0) {
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), -(i + 1));
      if (date.getDay() === 0) continue;
      await drRepo.save(drRepo.create({
        projectId: pid, reportDate: date,
        weather: weather[i % weather.length],
        temperature: 24 + (i % 6),
        manpowerCount: 40 + (i * 3),
        equipmentCount: 12 + i,
        workCompleted: completed[i],
        workPlannedTomorrow: completed[(i + 1) % completed.length],
        delays: i === 3 ? 'Morning rain – 2 hour delay to concrete pour' : null,
        safetyIncidents: null,
        siteNotes: 'Tower crane operational. Concrete pump on standby.',
        materialsDelivered: i % 2 === 0 ? 'Ready-mix concrete 180 m³, Rebar 12T' : null,
        createdBy: pm.id,
      }));
    }
    console.log(`   ✅ 7 daily reports\n`);
  } else {
    console.log(`   Already seeded, skipping\n`);
  }

  // ─────────────────────────────────────────────────────────
  // 10. SNAGS
  // ─────────────────────────────────────────────────────────
  console.log('🔍 Creating snags…');
  const snagCount = await snagRepo.count({ where: { projectId: pid } });
  if (snagCount === 0) {
    const snags = [
      { loc: 'Level 8 – Column C4',  desc: 'Concrete honeycombing on east face of column C4. Depth approx. 30mm, area 0.15m². Requires polymer repair mortar.',   sev: SnagSeverity.MAJOR,    cat: SnagCategory.DEFECT,         st: SnagStatus.IN_PROGRESS },
      { loc: 'Level 10 – Staircore', desc: 'Construction joint at slab/wall interface not properly cleaned prior to pour. Cold joint visible.',                      sev: SnagSeverity.CRITICAL,  cat: SnagCategory.NON_COMPLIANCE, st: SnagStatus.OPEN        },
      { loc: 'Basement B2 – Ramp',   desc: 'Waterproofing membrane not lapped at corner junction. Risk of water ingress during rain season.',                      sev: SnagSeverity.MAJOR,    cat: SnagCategory.INCOMPLETE,     st: SnagStatus.RESOLVED    },
      { loc: 'Level 6 – East Slab',  desc: 'Surface crack 0.3mm width along construction joint – monitor only.',                                                   sev: SnagSeverity.MINOR,    cat: SnagCategory.DEFECT,         st: SnagStatus.VERIFIED    },
      { loc: 'Podium – Column B2',   desc: 'Formwork tie bolt not removed and covered. 3 instances on column B2.',                                                  sev: SnagSeverity.MINOR,    cat: SnagCategory.INCOMPLETE,     st: SnagStatus.OPEN        },
      { loc: 'Level 12 – Stairwell', desc: 'Temporary edge protection not installed at stair void. Safety critical – immediate action required.',                    sev: SnagSeverity.CRITICAL,  cat: SnagCategory.NON_COMPLIANCE, st: SnagStatus.IN_PROGRESS },
    ];
    for (const s of snags) {
      await snagRepo.save(snagRepo.create({
        projectId: pid,
        workPackageId: wps[s.st === SnagStatus.RESOLVED || s.st === SnagStatus.VERIFIED ? 2 : 3].id,
        location: s.loc, description: s.desc,
        severity: s.sev, category: s.cat, status: s.st,
        dueDate: addDays(new Date(), 7),
        assignedTo: eng.id, createdBy: pm.id,
        costImpact: s.sev === SnagSeverity.CRITICAL ? 2000000 : s.sev === SnagSeverity.MAJOR ? 800000 : 100000,
        rectificationCost: 0, photoUrls: null,
        resolvedBy: s.st === SnagStatus.RESOLVED || s.st === SnagStatus.VERIFIED ? eng.id : null,
        resolvedAt: s.st === SnagStatus.RESOLVED || s.st === SnagStatus.VERIFIED ? new Date() : null,
        verifiedBy: s.st === SnagStatus.VERIFIED ? admin.id : null,
        verifiedAt: s.st === SnagStatus.VERIFIED ? new Date() : null,
      }));
    }
    console.log(`   ✅ 6 snags\n`);
  } else {
    console.log(`   Already seeded, skipping\n`);
  }

  // ─────────────────────────────────────────────────────────
  // 11. SPRINT + BOARD
  // ─────────────────────────────────────────────────────────
  console.log('🏃 Creating sprint & board…');
  const sprintCount = await sprintRepo.count({ where: { projectId: pid } });
  if (sprintCount === 0) {
    const sprint = await sprintRepo.save(sprintRepo.create({
      projectId: pid, name: 'Sprint 4 – Tower Core Levels 11-14',
      description: 'Focus on tower core concrete works for levels 11 through 14, MEP first-fix floor 8.',
      status: SprintStatus.ACTIVE,
      startDate: new Date('2025-01-06'), endDate: new Date('2025-01-31'),
      capacity: 480, storyPoints: 55,
    }));

    const board = await boardRepo.save(boardRepo.create({
      name: 'Tower Core Progress Board', projectId: pid,
    } as any));

    const cols = ['Backlog', 'In Progress', 'Under Review', 'Done'];
    for (let i = 0; i < cols.length; i++) {
      await colRepo.save(colRepo.create({
        name: cols[i], boardId: board.id, position: i,
      } as any));
    }
    console.log(`   ✅ Sprint + 4-column board\n`);
  } else {
    console.log(`   Already seeded, skipping\n`);
  }

  // ─────────────────────────────────────────────────────────
  // 12. DONE
  // ─────────────────────────────────────────────────────────
  console.log('─'.repeat(55));
  console.log('✨  SEED COMPLETE!');
  console.log('─'.repeat(55));
  console.log('   Project:   Nairobi Heights Mixed-Use Tower');
  console.log('   Login 1:   admin@protecht.demo  / Demo1234!');
  console.log('   Login 2:   pm@protecht.demo     / Demo1234!');
  console.log('   Login 3:   eng@protecht.demo    / Demo1234!');
  console.log('─'.repeat(55));

  await AppDataSource.destroy();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
