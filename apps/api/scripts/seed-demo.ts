/**
 * PROTECHT BIM - Demo Seed Script
 * Nairobi Heights Mixed-Use Tower demo project
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../src/config/data-source';
import { User } from '../src/entities/User';
import { Project } from '../src/entities/Project';
import { WorkPackage } from '../src/entities/WorkPackage';
import { Contract } from '../src/entities/Contract';
import { ChangeOrder } from '../src/entities/ChangeOrder';
import { DailyReport } from '../src/entities/DailyReport';
import { Snag } from '../src/entities/Snag';
import { Sprint } from '../src/entities/Sprint';
import { CostEntry } from '../src/entities/CostEntry';
import { TimeEntry } from '../src/entities/TimeEntry';
import * as bcrypt from 'bcrypt';

const addDays = (d: Date, n: number) => {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
};

async function seed() {
  console.log('🔌 Connecting to database…');
  await AppDataSource.initialize();
  console.log('✅ Connected!\n');

  const em = AppDataSource.manager;

  // ── 1. USERS ────────────────────────────────────────────────────
  console.log('👤 Creating users…');
  const hash = await bcrypt.hash('Demo1234!', 10);

  const upsert = async (email: string, name: string) => {
    let u = await em.findOne(User, { where: { email } });
    if (!u) {
      u = em.create(User, { email, name, passwordHash: hash, status: 'active' } as any);
      await em.save(u);
      console.log(`   ✅ Created ${name}`);
    } else {
      console.log(`   ⏭  Exists  ${name}`);
    }
    return u;
  };

  const admin = await upsert('admin@protecht.demo', 'Sarah Kamau');
  const pm    = await upsert('pm@protecht.demo',    'James Mwangi');
  const eng   = await upsert('eng@protecht.demo',   'Aisha Otieno');

  // ── 2. PROJECT ──────────────────────────────────────────────────
  console.log('\n🏗️  Creating project…');
  let project = await em.findOne(Project, { where: { name: 'Nairobi Heights Mixed-Use Tower' } });
  if (!project) {
    project = em.create(Project, {
      name: 'Nairobi Heights Mixed-Use Tower',
      description: '22-floor mixed-use development in Westlands, Nairobi. Retail floors 1-3, Grade-A offices 4-18, luxury residential 19-22. Contract value KES 4.2B.',
      ownerId: pm.id,
      status: 'active',
      startDate: new Date('2024-01-15'),
      endDate:   new Date('2026-06-30'),
    } as any);
    await em.save(project);
    console.log(`   ✅ ${project.name}`);
  } else {
    console.log(`   ⏭  Exists`);
  }
  const pid = project.id;

  // ── 3. WORK PACKAGES ────────────────────────────────────────────
  console.log('\n📦 Creating work packages…');
  const phases = [
    { subject: 'Site Preparation & Earthworks',  pct: 100, status: 'closed',       off: 0,   dur: 30  },
    { subject: 'Piling & Foundation Works',       pct: 100, status: 'closed',       off: 30,  dur: 45  },
    { subject: 'Basement & Podium Structure',     pct: 100, status: 'closed',       off: 75,  dur: 60  },
    { subject: 'Tower Core & Slab Construction',  pct: 68,  status: 'in_progress',  off: 135, dur: 120 },
    { subject: 'MEP Rough-In Works',              pct: 33,  status: 'in_progress',  off: 195, dur: 90  },
    { subject: 'Façade & Curtain Wall',           pct: 0,   status: 'new',          off: 270, dur: 75  },
    { subject: 'Interior Fit-Out (Commercial)',   pct: 0,   status: 'new',          off: 330, dur: 60  },
    { subject: 'Interior Fit-Out (Residential)',  pct: 0,   status: 'new',          off: 345, dur: 45  },
    { subject: 'Commissioning & Testing',         pct: 0,   status: 'new',          off: 390, dur: 30  },
    { subject: 'Handover & Snagging',             pct: 0,   status: 'new',          off: 415, dur: 21  },
  ];
  const base = new Date('2024-01-15');
  const wps: WorkPackage[] = [];
  for (const p of phases) {
    let wp = await em.findOne(WorkPackage, { where: { subject: p.subject, projectId: pid } });
    if (!wp) {
      wp = em.create(WorkPackage, {
        subject: p.subject, projectId: pid,
        status: p.status, percentageDone: p.pct,
        assigneeId: eng.id,
        startDate: addDays(base, p.off),
        dueDate:   addDays(base, p.off + p.dur),
        estimatedHours: p.dur * 8, spentHours: Math.floor(p.pct / 100 * p.dur * 8),
        priority: 'high', type: 'phase',
      } as any);
      await em.save(wp);
    }
    wps.push(wp);
  }
  console.log(`   ✅ ${wps.length} work packages`);

  // ── 4. CONTRACT ─────────────────────────────────────────────────
  console.log('\n📄 Creating contract…');
  let contract = await em.findOne(Contract, { where: { projectId: pid } });
  if (!contract) {
    contract = em.create(Contract, {
      projectId: pid,
      contractNumber: 'NHT-2024-001',
      clientName: 'Westlands Real Estate Holdings Ltd',
      contractType: 'lump_sum',
      status: 'active',
      originalContractValue: 4200000000,
      revisedContractValue:  4350000000,
      currency: 'KES',
      startDate:        new Date('2024-01-15'),
      completionDate:   new Date('2025-07-08'),
      retentionPercentage: 5,
      description: 'Main construction contract — civil, structural, MEP works.',
      createdBy: admin.id,
    } as any);
    await em.save(contract);
    console.log(`   ✅ ${contract.contractNumber}`);
  } else {
    console.log(`   ⏭  Exists`);
  }

  // ── 5. CHANGE ORDERS ────────────────────────────────────────────
  console.log('\n🔄 Creating change orders…');
  const coData = [
    { num: 'CO-001', title: 'Tower Core Redesign – Extra Shear Walls',
      desc: 'Additional shear walls required per updated wind load calculations (KBC 2023). 280 m³ concrete, 45T rebar.',
      reason: 'design_error', cost: 85000000, days: 14, status: 'approved' },
    { num: 'CO-002', title: 'Client-Requested Upgrade: Façade Glazing',
      desc: 'Upgrade from double- to triple-glazed SGG COOL-LITE SKN 176 across 1,840 panels. LEED Silver → Gold.',
      reason: 'client_change', cost: 65000000, days: 7,  status: 'approved' },
    { num: 'CO-003', title: 'Underground Services Rerouting',
      desc: 'Uncharted 600mm NCWSC water main discovered during basement excavation. Kenya Power coordination required.',
      reason: 'unforeseen', cost: 28000000, days: 21, status: 'under_review' },
  ];
  for (const c of coData) {
    const exists = await em.findOne(ChangeOrder, { where: { changeNumber: c.num } });
    if (!exists) {
      await em.save(em.create(ChangeOrder, {
        projectId: pid, contractId: contract.id,
        changeNumber: c.num, title: c.title, description: c.desc,
        reason: c.reason, costImpact: c.cost,
        scheduleImpactDays: c.days, status: c.status,
        submittedBy: pm.id, submittedAt: new Date(),
        approvedBy: c.status === 'approved' ? admin.id : null,
        approvedAt: c.status === 'approved' ? new Date() : null,
      } as any));
    }
  }
  console.log(`   ✅ 3 change orders`);

  // ── 6. DAILY REPORTS ────────────────────────────────────────────
  console.log('\n📋 Creating daily reports…');
  const drCount = await em.count(DailyReport, { where: { projectId: pid } });
  if (drCount === 0) {
    const reports = [
      { work: 'Poured tower core L11 slab – 180m³ C50. Rebar fixed L12 columns.', weather: 'Sunny 28°C', men: 48 },
      { work: 'Shear wall shuttering L11-12 complete. MEP conduit first-fix L8.', weather: 'Cloudy 26°C', men: 45 },
      { work: 'Poured L12 slab 165m³. Scaffolding advanced to L13.', weather: 'Sunny 29°C', men: 50 },
      { work: 'Rain delay 2hr. Resumed 10:00. Column starter bars L13 complete.', weather: 'Rain 22°C', men: 38 },
      { work: 'Full day pour L13 – 165m³. Tower crane fully operational.', weather: 'Sunny 30°C', men: 52 },
      { work: 'Formwork strike L11. Cast-in items for MEP penetrations L10.', weather: 'Cloudy 25°C', men: 44 },
      { work: 'Crane PM 06:00-09:00. Rebar fixing L14 columns afternoon shift.', weather: 'Sunny 27°C', men: 46 },
    ];
    for (let i = 0; i < reports.length; i++) {
      const r = reports[i];
      await em.save(em.create(DailyReport, {
        projectId: pid, createdBy: pm.id,
        reportDate: addDays(new Date(), -(i + 1)),
        weather: r.weather, manpowerCount: r.men,
        workCompleted: r.work,
        workPlannedTomorrow: reports[(i + 1) % reports.length].work,
        delays: i === 3 ? 'Rain – 2 hour delay' : null,
        safetyIncidents: null, siteNotes: 'Tower crane operational.',
      } as any));
    }
    console.log(`   ✅ 7 daily reports`);
  } else {
    console.log(`   ⏭  Already seeded`);
  }

  // ── 7. SNAGS ────────────────────────────────────────────────────
  console.log('\n🔍 Creating snags…');
  const snagCount = await em.count(Snag, { where: { projectId: pid } });
  if (snagCount === 0) {
    const snags = [
      { loc: 'L8 – Column C4',   desc: 'Honeycombing on east face ~30mm depth 0.15m².', severity: 'major',    category: 'defect',          status: 'in_progress' },
      { loc: 'L10 – Stair Core', desc: 'Cold joint at slab/wall interface not cleaned.', severity: 'critical', category: 'non_compliance',  status: 'open'        },
      { loc: 'B2 – Ramp',        desc: 'Waterproofing membrane not lapped at corner.',   severity: 'major',    category: 'incomplete',      status: 'resolved'    },
      { loc: 'L6 – East Slab',   desc: 'Surface crack 0.3mm at construction joint.',     severity: 'minor',    category: 'defect',          status: 'verified'    },
      { loc: 'Podium – Col B2',  desc: 'Formwork tie bolts not removed. 3 instances.',   severity: 'minor',    category: 'incomplete',      status: 'open'        },
      { loc: 'L12 – Stairwell',  desc: 'Edge protection missing at stair void. URGENT.', severity: 'critical', category: 'non_compliance',  status: 'in_progress' },
    ];
    for (const s of snags) {
      await em.save(em.create(Snag, {
        projectId: pid, workPackageId: wps[3].id,
        location: s.loc, description: s.desc,
        severity: s.severity, category: s.category, status: s.status,
        assignedTo: eng.id, createdBy: pm.id,
        dueDate: addDays(new Date(), 7),
      } as any));
    }
    console.log(`   ✅ 6 snags`);
  } else {
    console.log(`   ⏭  Already seeded`);
  }

  // ── 8. SPRINT ───────────────────────────────────────────────────
  console.log('\n🏃 Creating sprint…');
  const sprintCount = await em.count(Sprint, { where: { projectId: pid } });
  if (sprintCount === 0) {
    await em.save(em.create(Sprint, {
      projectId: pid, name: 'Sprint 4 – Tower Core Levels 11-14',
      description: 'Concrete works L11-14, MEP first-fix L8.',
      status: 'active',
      startDate: new Date('2025-01-06'),
      endDate:   new Date('2025-01-31'),
    } as any));
    console.log(`   ✅ Sprint created`);
  } else {
    console.log(`   ⏭  Already seeded`);
  }

  // ── 9. COST ENTRIES ─────────────────────────────────────────────
  console.log('\n💸 Creating cost entries…');
  const ceCount = await em.count(CostEntry, { where: { workPackageId: wps[3].id } });
  if (ceCount === 0) {
    const costs = [
      { wp: 0, cat: 'labour',       amt: 12000000, desc: 'Earthworks labour' },
      { wp: 0, cat: 'equipment',    amt: 8500000,  desc: 'Excavator & tipper hire' },
      { wp: 1, cat: 'subcontractor',amt: 95000000, desc: 'Piling – Keller Kenya' },
      { wp: 2, cat: 'subcontractor',amt: 180000000,desc: 'Basement concrete works' },
      { wp: 2, cat: 'material',     amt: 55000000, desc: 'Rebar & formwork' },
      { wp: 3, cat: 'subcontractor',amt: 210000000,desc: 'Tower core concrete' },
      { wp: 3, cat: 'material',     amt: 88000000, desc: 'High-strength concrete C50' },
      { wp: 3, cat: 'labour',       amt: 34000000, desc: 'Skilled concreters' },
      { wp: 4, cat: 'material',     amt: 45000000, desc: 'MEP materials advance' },
    ];
    for (const c of costs) {
      await em.save(em.create(CostEntry, {
        workPackageId: wps[c.wp].id, userId: pm.id,
        category: c.cat, amount: c.amt, currency: 'KES',
        description: c.desc, date: addDays(new Date(), -Math.floor(Math.random() * 60)),
      } as any));
    }
    console.log(`   ✅ 9 cost entries`);
  } else {
    console.log(`   ⏭  Already seeded`);
  }

  // ── 10. TIME ENTRIES ────────────────────────────────────────────
  console.log('\n⏱️  Creating time entries…');
  const teCount = await em.count(TimeEntry, { where: { workPackageId: wps[3].id } });
  if (teCount === 0) {
    const users = [admin, pm, eng];
    let saved = 0;
    for (let d = 29; d >= 0; d--) {
      const date = addDays(new Date(), -d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      for (const u of users) {
        await em.save(em.create(TimeEntry, {
          workPackageId: wps[d > 20 ? 2 : 3].id,
          userId: u.id, hours: 8, billable: true,
          comment: 'Daily site work',
          date,
        } as any));
        saved++;
      }
    }
    console.log(`   ✅ ${saved} time entries`);
  } else {
    console.log(`   ⏭  Already seeded`);
  }

  console.log('\n' + '─'.repeat(55));
  console.log('✨  SEED COMPLETE!');
  console.log('─'.repeat(55));
  console.log('   Project:  Nairobi Heights Mixed-Use Tower');
  console.log('   Login 1:  admin@protecht.demo  / Demo1234!');
  console.log('   Login 2:  pm@protecht.demo     / Demo1234!');
  console.log('   Login 3:  eng@protecht.demo    / Demo1234!');
  console.log('─'.repeat(55) + '\n');

  await AppDataSource.destroy();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message || err);
  process.exit(1);
});
