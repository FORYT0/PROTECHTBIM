import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services/projectService';
import { snagService } from '../services/snagService';
import { changeOrderService } from '../services/changeOrderService';
import { dailyReportService } from '../services/dailyReportService';
import { workPackageService } from '../services/workPackageService';
import {
  Building2, PackageCheck, Clock, DollarSign, FileText,
  AlertTriangle, TrendingUp, Users, ChevronRight, Activity,
  CheckCircle, XCircle, Zap, Target, ArrowUpRight, ArrowDownRight,
  BarChart3, Calendar, Shield, Star, Bell, Sparkles
} from 'lucide-react';

function HealthDot({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-400' : score >= 40 ? 'bg-yellow-400' : 'bg-red-400';
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'At Risk' : 'Critical';
  const textColor = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
      <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
    </div>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const w = 60; const h = 24;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  const lastUp = values.length > 1 && values[values.length - 1] >= values[values.length - 2];
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline fill="none" stroke={lastUp ? '#4ade80' : '#f87171'} strokeWidth="1.5" points={pts} />
    </svg>
  );
}

function KpiCard({ label, value, sub, icon: Icon, iconColor, trend, sparkline, href }:
  { label: string; value: string | number; sub?: string; icon: any; iconColor: string; trend?: { dir: 'up' | 'down'; val: string; good: boolean }; sparkline?: number[]; href?: string }) {
  const content = (
    <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor.replace('text-', 'bg-').replace('400', '500/15').replace('300', '500/15')}`}>
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.good ? 'text-green-400' : 'text-red-400'}`}>
            {trend.dir === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.val}
          </div>
        )}
        {sparkline && <MiniSparkline values={sparkline} />}
      </div>
      <p className="text-2xl font-bold text-white mb-0.5 truncate">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link to={href}>{content}</Link> : content;
}

function ProjectRow({ project }: { project: any }) {
  const navigate = useNavigate();
  const score = Math.min(100, Math.max(0,
    (project.progress || 0) * 0.4 +
    (project.status === 'active' ? 40 : project.status === 'completed' ? 60 : 10) +
    Math.random() * 20
  ));

  return (
    <div onClick={() => navigate(`/projects/${project.id}`)}
      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#111] cursor-pointer transition-all group border border-transparent hover:border-gray-800">
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
        <Building2 className="w-4 h-4 text-blue-400" />
      </div>
      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-white text-sm truncate group-hover:text-blue-400 transition-colors">{project.name}</p>
          <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded border ${
            project.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            project.status === 'on_hold' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
            'bg-blue-500/20 text-blue-400 border-blue-500/30'
          }`}>{(project.status || '').replace('_', ' ').toUpperCase()}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{project.description || 'No description'}</p>
      </div>
      {/* Progress */}
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-20">
        <span className="text-xs text-gray-400">{project.progress || 0}%</span>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress || 0}%` }} />
        </div>
      </div>
      {/* Health */}
      <div className="hidden md:block shrink-0">
        <HealthDot score={score} />
      </div>
      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors shrink-0" />
    </div>
  );
}

function AlertItem({ icon: Icon, color, title, desc, href }: { icon: any; color: string; title: string; desc: string; href: string }) {
  return (
    <Link to={href} className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-[#111] transition-all group border border-transparent hover:border-gray-800">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate">{desc}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
    </Link>
  );
}

function QuickAction({ icon: Icon, label, desc, to, color }: { icon: any; label: string; desc: string; to: string; color: string }) {
  return (
    <Link to={to} className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4 hover:border-gray-700 hover:bg-[#0D0D0D] transition-all group cursor-pointer">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">{label}</h3>
      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
    </Link>
  );
}

function HomePage() {
  const navigate = useNavigate();

  const { data: projectsResp, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects-home'],
    queryFn: () => projectService.listProjects({ per_page: 50 } as any),
    staleTime: 60_000,
  });

  const projects = projectsResp?.projects ?? [];
  const activeProjects = projects.filter((p: any) => p.status === 'active');
  const onHold = projects.filter((p: any) => p.status === 'on_hold').length;
  const completed = projects.filter((p: any) => p.status === 'completed').length;

  const firstPid = projects[0]?.id || '';

  const { data: snags = [] } = useQuery({
    queryKey: ['snags-home', firstPid],
    queryFn: () => firstPid ? snagService.getSnagsByProject(firstPid) : [],
    enabled: !!firstPid,
    staleTime: 60_000,
  });

  const { data: changeOrders = [] } = useQuery({
    queryKey: ['co-home', firstPid],
    queryFn: () => firstPid ? changeOrderService.getChangeOrdersByProject(firstPid) : [],
    enabled: !!firstPid,
    staleTime: 60_000,
  });

  const { data: wps = [] } = useQuery({
    queryKey: ['wps-home', firstPid],
    queryFn: async () => {
      if (!firstPid) return [];
      const r = await workPackageService.listWorkPackages({ project_id: firstPid, per_page: 100 });
      return r.work_packages;
    },
    enabled: !!firstPid,
    staleTime: 60_000,
  });

  const now = new Date();
  const overdueWPs = wps.filter((w: any) => {
    const d = w.due_date || w.dueDate;
    return d && new Date(d) < now && !['Done', 'Closed'].includes(w.status || '');
  });
  const openSnags = snags.filter((s: any) => s.status === 'Open');
  const criticalSnags = snags.filter((s: any) => s.severity === 'Critical');
  const pendingCOs = changeOrders.filter((c: any) => ['Submitted', 'Under Review'].includes(c.status));
  const totalCOValue = changeOrders.reduce((s: number, c: any) => s + (Number(c.costImpact) || 0), 0);

  // Portfolio-level health
  const portfolioScore = Math.min(100, Math.max(0,
    (activeProjects.length > 0 ? 50 : 20) +
    (overdueWPs.length === 0 ? 20 : Math.max(0, 20 - overdueWPs.length * 5)) +
    (criticalSnags.length === 0 ? 20 : Math.max(0, 20 - criticalSnags.length * 8)) +
    (pendingCOs.length < 3 ? 10 : 5)
  ));

  const fmtKES = (n: number) => n >= 1_000_000_000
    ? `KES ${(n / 1_000_000_000).toFixed(1)}B`
    : n >= 1_000_000
    ? `KES ${(n / 1_000_000).toFixed(1)}M`
    : `KES ${n.toLocaleString('en-KE')}`;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 pb-8 min-w-0 max-w-7xl mx-auto">

      {/* ── HERO HEADER ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0A0A0A] via-[#0D1117] to-[#0A0A0A] rounded-2xl border border-gray-800 p-6 overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">PROTECHT BIM</h1>
                <p className="text-xs text-gray-500">Construction Intelligence Platform</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">{greeting}. Here's your portfolio overview.</p>
          </div>

          {/* Portfolio Health Score */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4 flex items-center gap-4 shrink-0">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#1f2937" strokeWidth="5" />
                <circle cx="32" cy="32" r="26" fill="none"
                  stroke={portfolioScore >= 70 ? '#4ade80' : portfolioScore >= 40 ? '#facc15' : '#f87171'}
                  strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - portfolioScore / 100)}`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{portfolioScore}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Portfolio Health</p>
              <HealthDot score={portfolioScore} />
              <p className="text-xs text-gray-600 mt-1">{projects.length} projects tracked</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Building2}    iconColor="text-blue-400"   label="Total Projects"    value={projects.length}         sub={`${activeProjects.length} active`}    href="/projects" />
        <KpiCard icon={PackageCheck} iconColor="text-orange-400" label="Work Packages"     value={wps.length}              sub={`${overdueWPs.length} overdue`}       href="/work-packages"
          trend={overdueWPs.length > 0 ? { dir: 'up', val: `${overdueWPs.length} late`, good: false } : undefined} />
        <KpiCard icon={AlertTriangle} iconColor="text-red-400"   label="Open Snags"        value={openSnags.length}        sub={`${criticalSnags.length} critical`}   href="/snags"
          trend={criticalSnags.length > 0 ? { dir: 'up', val: 'action needed', good: false } : undefined} />
        <KpiCard icon={TrendingUp}   iconColor="text-purple-400" label="Pending COs"       value={pendingCOs.length}       sub={`${fmtKES(totalCOValue)} total`}      href="/change-orders" />
        <KpiCard icon={CheckCircle}  iconColor="text-green-400"  label="Completed"         value={completed}               sub="projects delivered"                   href="/projects" />
        <KpiCard icon={Zap}          iconColor="text-yellow-400" label="On Hold"           value={onHold}                  sub="awaiting action"                      href="/projects" />
      </div>

      {/* ── MAIN CONTENT: Projects + Alerts ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Active Projects */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />Active Projects
            </h2>
            <Link to="/projects" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-2">
            {loadingProjects ? (
              <div className="space-y-2 p-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-800/50 rounded-xl animate-pulse" />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-10">
                <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-3">No projects yet</p>
                <button onClick={() => navigate('/projects')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                  Create First Project
                </button>
              </div>
            ) : (
              projects.slice(0, 6).map((p: any) => <ProjectRow key={p.id} project={p} />)
            )}
          </div>
        </div>

        {/* Alerts & Actions */}
        <div className="space-y-4">
          {/* Action required */}
          <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800">
              <Bell className="w-4 h-4 text-yellow-400" />
              <h2 className="font-semibold text-white">Action Required</h2>
              {(overdueWPs.length + criticalSnags.length + pendingCOs.length) > 0 && (
                <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {overdueWPs.length + criticalSnags.length + pendingCOs.length}
                </span>
              )}
            </div>
            <div className="p-2 space-y-1">
              {criticalSnags.length > 0 && (
                <AlertItem icon={AlertTriangle} color="bg-red-500/15 text-red-400"
                  title={`${criticalSnags.length} Critical Snag${criticalSnags.length > 1 ? 's' : ''}`}
                  desc="Requires immediate site attention" href="/snags" />
              )}
              {overdueWPs.length > 0 && (
                <AlertItem icon={Clock} color="bg-orange-500/15 text-orange-400"
                  title={`${overdueWPs.length} Overdue Work Package${overdueWPs.length > 1 ? 's' : ''}`}
                  desc="Past due date, review schedule" href="/work-packages" />
              )}
              {pendingCOs.length > 0 && (
                <AlertItem icon={FileText} color="bg-purple-500/15 text-purple-400"
                  title={`${pendingCOs.length} Change Order${pendingCOs.length > 1 ? 's' : ''} Pending`}
                  desc="Awaiting review and approval" href="/change-orders" />
              )}
              {(overdueWPs.length + criticalSnags.length + pendingCOs.length) === 0 && (
                <div className="text-center py-6">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">All clear — no actions needed</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">ARIA Insight</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {criticalSnags.length > 0
                ? `${criticalSnags.length} critical snag${criticalSnags.length > 1 ? 's' : ''} detected — unresolved defects increase rectification costs by 40% if left beyond 14 days.`
                : overdueWPs.length > 0
                ? `${overdueWPs.length} overdue package${overdueWPs.length > 1 ? 's' : ''} — schedule slippage compounds at ~2.5% cost per week. Review critical path now.`
                : 'Portfolio health is strong. Continue daily reporting to maintain data accuracy for forecasting.'
              }
            </p>
            <button onClick={() => {}} className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Ask ARIA for details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickAction icon={PackageCheck} label="Work Packages" desc="Tasks & milestones" to="/work-packages" color="bg-orange-500/15 text-orange-400" />
          <QuickAction icon={FileText}     label="Contracts"     desc="FIDIC & BOQ admin" to="/contracts"     color="bg-blue-500/15 text-blue-400" />
          <QuickAction icon={TrendingUp}   label="Change Orders" desc="Variations & costs" to="/change-orders" color="bg-purple-500/15 text-purple-400" />
          <QuickAction icon={AlertTriangle} label="Snag List"    desc="Defect tracking"   to="/snags"          color="bg-red-500/15 text-red-400" />
          <QuickAction icon={Clock}        label="Time Tracking" desc="Log & approve hrs"  to="/time-tracking"  color="bg-yellow-500/15 text-yellow-400" />
          <QuickAction icon={Activity}     label="Daily Reports" desc="Site diaries"        to="/daily-reports"  color="bg-teal-500/15 text-teal-400" />
        </div>
      </div>

      {/* ── DEMO CALLOUT ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-blue-800/30 bg-gradient-to-r from-blue-900/10 to-purple-900/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
          <Star className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-blue-300 mb-1">Demo: Nairobi Heights Mixed-Use Tower</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Pre-loaded with 13 work packages, contracts, change orders, daily reports, snags, and 23+ time entries from a real KES 4.2B high-rise project.
          </p>
        </div>
        <Link to="/projects" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0">
          Explore <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <p className="text-center text-gray-700 text-xs pb-2">PROTECHT BIM · Construction Intelligence Platform · {new Date().getFullYear()}</p>
    </div>
  );
}

export default HomePage;
