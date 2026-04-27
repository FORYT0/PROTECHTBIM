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
      console.log('   created: ' + name);
    } else { console.log('   exists:  ' + name); }
    return u;
  };
  const admin = await upsert('admin@protecht.demo', 'Sarah Kamau');
  const pm    = await upsert('pm@protecht.demo',    'James Mwangi');
  const eng   = await upsert('eng@protecht.demo',   'Aisha Otieno');

  // ── 2. PROJECT ──────────────────────────────────────────────────
  console.log('\nCreating project…');
  let project = await em.findOne(Project, { where: { name: 'Nairobi Heights Mixed-Use Tower' } });
  if (!project) {
    project = em.create(Project, {
      name: 'Nairobi Heights Mixed-Use Tower',
      description: '22-floor mixed-use tower in Westlands, Nairobi. KES 4.2B contract.',
      ownerId: pm.id, status: 'active',
      startDate: new Date('2024-01-15'), endDate: new Date('2026-06-30'),
    } as any);
    await em.save(project);
    console.log('   created: ' + project.name);
  } else { console.log('   exists'); }
  const pid = project.id;

  // ── 3. WORK PACKAGES ────────────────────────────────────────────
  console.log('\nCreating work packages…');
  const base = new Date('2024-01-15');
  const phases = [
    { subject: 'Site Preparation & Earthworks',  pct: 100, status: 'closed',       off: 0,   dur: 30  },
    { subject: 'Piling & Foundation Works',       pct: 100, status: 'closed',       off: 30,  dur: 45  },
    { subject: 'Basement & Podium Structure',     pct: 100, status: 'closed',       off: 75,  dur: 60  },
    { subject: 'Tower Core & Slab Construction',  pct: 68,  status: 'in_progress',  off: 135, dur: 120 },
    { subject: 'MEP Rough-In Works',              pct: 33,  status: 'in_progress',  off: 195, dur: 90  },
    { subject: 'Facade & Curtain Wall',           pct: 0,   status: 'new',          off: 270, dur: 75  },
    { subject: 'Interior Fit-Out Commercial',     pct: 0,   status: 'new',          off: 330, dur: 60  },
    { subject: 'Interior Fit-Out Residential',    pct: 0,   status: 'new',          off: 345, dur: 45  },
    { subject: 'Commissioning & Testing',         pct: 0,   status: 'new',          off: 390, dur: 30  },
    { subject: 'Handover & Snagging',             pct: 0,   status: 'new',          off: 415, dur: 21  },
  ];
  const wps: WorkPackage[] = [];
  for (const p of phases) {
    let wp = await em.findOne(WorkPackage, { where: { subject: p.subject, projectId: pid } });
    if (!wp) {
      wp = em.create(WorkPackage, {
        subject: p.subject, projectId: pid, status: p.status,
        percentageDone: p.pct, assigneeId: eng.id,
        startDate: addDays(base, p.off), dueDate: addDays(base, p.off + p.dur),
        estimatedHours: p.dur * 8, spentHours: Math.floor(p.pct / 100 * p.dur * 8),
        priority: 'high', type: 'phase',
      } as any);
      await em.save(wp);
    }
    wps.push(wp);
  }
  console.log('   ' + wps.length + ' work packages');

  // ── 4. CONTRACT ─────────────────────────────────────────────────
  console.log('\nCreating contract…');
  let contract = await em.findOne(Contract, { where: { projectId: pid } });
  if (!contract) {
    contract = em.create(Contract, {
      projectId: pid, contractNumber: 'NHT-2024-001',
      clientName: 'Westlands Real Estate Holdings Ltd',
      contractType: 'Lump Sum', status: 'Active',
      originalContractValue: 4200000000, revisedContractValue: 4350000000,
      totalApprovedVariations: 150000000, totalPendingVariations: 85000000,
      originalDurationDays: 540, currency: 'KES',
      startDate: new Date('2024-01-15'), completionDate: new Date('2025-07-08'),
      retentionPercentage: 5, advancePaymentAmount: 420000000,
      performanceBondValue: 210000000,
      description: 'Main construction contract - civil, structural, MEP.',
      createdBy: admin.id,
    } as any);
    await em.save(contract);
    console.log('   created: ' + contract.contractNumber);
  } else { console.log('   exists'); }

  // ── 5. CHANGE ORDERS ────────────────────────────────────────────
  console.log('\nCreating change orders…');
  const coData = [
    { num: 'CO-001', title: 'Tower Core Redesign - Extra Shear Walls',
      desc: 'Additional shear walls per updated wind load (KBC 2023). 280m3 concrete, 45T rebar.',
      reason: 'Design Error', cost: 85000000, days: 14, status: 'Approved' },
    { num: 'CO-002', title: 'Facade Glazing Upgrade',
      desc: 'Upgrade to triple-glazed SGG COOL-LITE SKN 176. 1840 panels. LEED Silver to Gold.',
      reason: 'Client Change', cost: 65000000, days: 7, status: 'Approved' },
    { num: 'CO-003', title: 'Underground Services Rerouting',
      desc: 'Uncharted 600mm water main found during excavation. Kenya Power coordination needed.',
      reason: 'Unforeseen', cost: 28000000, days: 21, status: 'Under Review' },
  ];
  for (const c of coData) {
    const ex = await em.findOne(ChangeOrder, { where: { changeNumber: c.num } });
    if (!ex) {
      await em.save(em.create(ChangeOrder, {
        projectId: pid, contractId: contract.id,
        changeNumber: c.num, title: c.title, description: c.desc,
        reason: c.reason, costImpact: c.cost, scheduleImpactDays: c.days,
        status: c.status, submittedBy: pm.id, submittedAt: new Date(),
      } as any));
    }
  }
  console.log('   3 change orders');

  // ── 6. DAILY REPORTS ────────────────────────────────────────────
  console.log('\nCreating daily reports…');
  const drCount = await em.count(DailyReport, { where: { projectId: pid } });
  if (drCount === 0) {
    const rpts = [
      { w: 'Poured tower core L11 slab 180m3 C50. Rebar fixed L12 columns.', weath: 'Sunny 28C', men: 48 },
      { w: 'Shear wall shuttering L11-12 complete. MEP conduit first-fix L8.', weath: 'Cloudy 26C', men: 45 },
      { w: 'Poured L12 slab 165m3. Scaffolding advanced to L13.', weath: 'Sunny 29C', men: 50 },
      { w: 'Rain delay 2hr. Column starter bars L13 complete.', weath: 'Rain 22C', men: 38 },
      { w: 'Full day pour L13 165m3. Tower crane operational.', weath: 'Sunny 30C', men: 52 },
      { w: 'Formwork strike L11. Cast-in items for MEP penetrations L10.', weath: 'Cloudy 25C', men: 44 },
      { w: 'Crane PM 06:00-09:00. Rebar fixing L14 columns afternoon.', weath: 'Sunny 27C', men: 46 },
    ];
    for (let i = 0; i < rpts.length; i++) {
      await em.save(em.create(DailyReport, {
        projectId: pid, createdBy: pm.id,
        reportDate: addDays(new Date(), -(i + 1)),
        weather: rpts[i].weath, manpowerCount: rpts[i].men,
        workCompleted: rpts[i].w,
        workPlannedTomorrow: rpts[(i + 1) % rpts.length].w,
        siteNotes: 'Tower crane operational.',
      } as any));
    }
    console.log('   7 daily reports');
  } else { console.log('   already seeded'); }

  // ── 7. SNAGS ────────────────────────────────────────────────────
  console.log('\nCreating snags…');
  const snagCount = await em.count(Snag, { where: { projectId: pid } });
  if (snagCount === 0) {
    const snags = [
      { loc: 'L8 Column C4',   desc: 'Honeycombing east face 30mm depth.', sev: 'Major',    cat: 'Defect',         st: 'In Progress' },
      { loc: 'L10 Stair Core', desc: 'Cold joint at slab/wall interface.',  sev: 'Critical', cat: 'Non-Compliance', st: 'Open'        },
      { loc: 'B2 Ramp',        desc: 'Waterproofing membrane not lapped.',   sev: 'Major',    cat: 'Incomplete',     st: 'Resolved'    },
      { loc: 'L6 East Slab',   desc: 'Surface crack 0.3mm at joint.',        sev: 'Minor',    cat: 'Defect',         st: 'Verified'    },
      { loc: 'Podium Col B2',  desc: 'Tie bolts not removed. 3 instances.',  sev: 'Minor',    cat: 'Incomplete',     st: 'Open'        },
      { loc: 'L12 Stairwell',  desc: 'Edge protection missing at void.',     sev: 'Critical', cat: 'Non-Compliance', st: 'In Progress' },
    ];
    for (const s of snags) {
      await em.save(em.create(Snag, {
        projectId: pid, workPackageId: wps[3].id,
        location: s.loc, description: s.desc,
        severity: s.sev, category: s.cat, status: s.st,
        assignedTo: eng.id, createdBy: pm.id,
        dueDate: addDays(new Date(), 7),
      } as any));
    }
    console.log('   6 snags');
  } else { console.log('   already seeded'); }

  // ── 8. SPRINT ───────────────────────────────────────────────────
  console.log('\nCreating sprint…');
  const sc = await em.count(Sprint, { where: { projectId: pid } });
  if (sc === 0) {
    await em.save(em.create(Sprint, {
      projectId: pid, name: 'Sprint 4 - Tower Core Levels 11-14',
      description: 'Concrete works L11-14, MEP first-fix L8.', status: 'active',
      startDate: new Date('2025-01-06'), endDate: new Date('2025-01-31'),
    } as any));
    console.log('   sprint created');
  } else { console.log('   already seeded'); }

  console.log('\n' + '='.repeat(50));
  console.log('SEED COMPLETE!');
  console.log('  Login: admin@protecht.demo / Demo1234!');
  console.log('  Login: pm@protecht.demo    / Demo1234!');
  console.log('  Login: eng@protecht.demo   / Demo1234!');
  console.log('='.repeat(50) + '\n');

  await AppDataSource.destroy();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});


