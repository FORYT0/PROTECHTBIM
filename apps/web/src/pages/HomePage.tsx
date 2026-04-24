import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services/projectService';
import { Building2, PackageCheck, Clock, DollarSign, FileText, AlertTriangle, TrendingUp, Users, ChevronRight, Activity } from 'lucide-react';

function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function NavCard({ to, icon: Icon, title, desc, color }: { to: string; icon: any; title: string; desc: string; color: string }) {
  return (
    <Link to={to} className="card group cursor-pointer hover:border-[#333] transition-all">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary group-hover:text-primary-400 transition-colors">{title}</h3>
          <p className="text-sm text-text-secondary mt-0.5 leading-snug">{desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
      </div>
    </Link>
  );
}

function HomePage() {
  const { data: projectsResp, isLoading } = useQuery({
    queryKey: ['projects-summary'],
    queryFn: () => projectService.listProjects({ per_page: 100 } as any),
    staleTime: 60_000,
  });

  const projects = projectsResp?.projects ?? [];
  const active = projects.filter((p: any) => p.status === 'active').length;
  const onHold = projects.filter((p: any) => p.status === 'on_hold').length;
  const completed = projects.filter((p: any) => p.status === 'completed').length;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center elevation-3 shrink-0">
          <Building2 className="w-9 h-9 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">PROTECHT BIM</h1>
          <p className="text-text-secondary">Construction Project Management Platform</p>
        </div>
      </div>

      {/* Live portfolio stats */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Portfolio Overview</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Projects" value={projects.length} sub="in system" color="text-white" />
            <StatCard label="Active" value={active} sub="currently running" color="text-green-400" />
            <StatCard label="On Hold" value={onHold} sub="paused" color="text-yellow-400" />
            <StatCard label="Completed" value={completed} sub="delivered" color="text-blue-400" />
          </div>
        )}
      </section>

      {/* Quick nav */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Quick Access</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NavCard to="/projects"       icon={Building2}    title="Projects"          desc="Browse and manage all construction projects"          color="bg-primary-600/15 text-primary-400" />
          <NavCard to="/work-packages"  icon={PackageCheck} title="Work Packages"     desc="Tasks, milestones and phases across projects"         color="bg-orange-500/15 text-orange-400" />
          <NavCard to="/contracts"      icon={FileText}     title="Contracts"         desc="Lump sum, BOQ and EPC contract management"            color="bg-blue-500/15 text-blue-400" />
          <NavCard to="/change-orders"  icon={TrendingUp}   title="Change Orders"     desc="Track variations, approvals and cost impacts"         color="bg-purple-500/15 text-purple-400" />
          <NavCard to="/snags"          icon={AlertTriangle} title="Snags & Defects"  desc="Site issues, defects and quality tracking"            color="bg-red-500/15 text-red-400" />
          <NavCard to="/daily-reports"  icon={Activity}     title="Daily Reports"     desc="Site diaries, weather and progress logs"             color="bg-teal-500/15 text-teal-400" />
          <NavCard to="/time-tracking"  icon={Clock}        title="Time Tracking"     desc="Log hours and track resource utilisation"            color="bg-yellow-500/15 text-yellow-400" />
          <NavCard to="/cost-tracking"  icon={DollarSign}   title="Cost Tracking"     desc="Expenses, budgets and financial reconciliation"      color="bg-green-500/15 text-green-400" />
          <NavCard to="/resource-management" icon={Users}  title="Resources"         desc="Team members, utilisation and allocation"            color="bg-cyan-500/15 text-cyan-400" />
        </div>
      </section>

      {/* Demo callout */}
      <section className="rounded-2xl border border-primary-800/40 bg-primary-900/10 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-300 mb-1">Demo Project Loaded</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              The <span className="text-white font-medium">Nairobi Heights Mixed-Use Tower</span> demo project is pre-loaded with 10 work packages, 3 contracts, change orders, daily reports, snags and cost entries — all connected to a live database. Click <Link to="/projects" className="text-primary-400 hover:underline">Projects</Link> to explore it.
            </p>
          </div>
        </div>
      </section>

      <div className="text-center text-gray-600 text-xs pb-4">
        © 2026 PROTECHT BIM · Construction Project Management Platform
      </div>
    </div>
  );
}

export default HomePage;
