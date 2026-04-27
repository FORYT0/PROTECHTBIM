import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyReportService } from '../services/dailyReportService';
import { queryKeys } from '../lib/queryClient';
import { useProjectContext } from '../hooks/useProjectContext';
import { ProjectPicker } from '../components/ProjectPicker';
import DailyReportFormModal from '../components/DailyReportFormModal';
import { InteractiveCard } from '../components/InteractiveCard';
import { toast } from '../utils/toast';
import { Clipboard, Plus, Users, Wrench, AlertTriangle, CheckCircle, Activity, Search, Target, Calendar, Cloud } from 'lucide-react';

function DailyReportsPage() {
  const navigate = useNavigate();
  const { projectId, projects, isLoading: projectsLoading, setProjectId } = useProjectContext();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: reports = [], isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.projectDailyReports(projectId),
    queryFn: () => dailyReportService.getDailyReportsByProject(projectId),
    enabled: !!projectId,
  });

  const error = queryError instanceof Error ? queryError.message : null;
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());

  const metrics = {
    total: reports.length,
    thisWeek: reports.filter(r => new Date(r.reportDate) >= weekStart).length,
    avgManpower: reports.length ? Math.round(reports.reduce((s, r) => s + (r.manpowerCount || 0), 0) / reports.length) : 0,
    avgEquipment: reports.length ? Math.round(reports.reduce((s, r) => s + (r.equipmentCount || 0), 0) / reports.length) : 0,
    delays: reports.filter(r => r.delays?.trim()).length,
    incidents: reports.filter(r => r.safetyIncidents?.trim()).length,
  };

  const handleCreate = async (data: any) => {
    try {
      await dailyReportService.createDailyReport(data);
      toast.success('Daily report created');
      queryClient.invalidateQueries({ queryKey: queryKeys.projectDailyReports(projectId) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create report');
      throw err;
    }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const filtered = reports.filter(r =>
    !searchQuery ||
    r.workCompleted?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.siteNotes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* DAILY REPORTS INTELLIGENCE HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Daily Site Intelligence Center</h1>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Reports:</span>
                <span className="text-white font-semibold">{metrics.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">This Week:</span>
                <span className="text-blue-400 font-semibold">{metrics.thisWeek}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Avg Manpower:</span>
                <span className="text-white font-semibold">{metrics.avgManpower} workers/day</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Delays Reported:</span>
                <span className={`font-semibold ${metrics.delays > 0 ? 'text-orange-400' : 'text-green-400'}`}>{metrics.delays}</span>
              </div>
            </div>
            <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
          </div>

          {/* RIGHT SIDE - EXECUTIVE METRICS */}
          <div className="grid grid-cols-2 gap-4 ml-6">
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Clipboard className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">Total Reports</span>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.total}</p>
              <span className="text-xs text-gray-400">All time</span>
            </div>
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">This Week</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{metrics.thisWeek}</p>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                <div className="bg-blue-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${metrics.total > 0 ? Math.min((metrics.thisWeek / metrics.total) * 100, 100) : 0}%` }} />
              </div>
            </div>
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-xs text-gray-400">Avg Manpower</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{metrics.avgManpower}</p>
              <span className="text-xs text-gray-400">workers/day</span>
            </div>
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <span className="text-xs text-gray-400">Delays</span>
              </div>
              <p className={`text-2xl font-bold ${metrics.delays > 0 ? 'text-orange-400' : 'text-green-400'}`}>{metrics.delays}</p>
              <span className={`text-xs ${metrics.delays > 0 ? 'text-orange-400' : 'text-green-400'}`}>{metrics.delays > 0 ? 'Reported' : 'None reported'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <InteractiveCard icon={Clipboard} iconColor="text-blue-400" title="Total Reports" value={metrics.total} />
        <InteractiveCard icon={Activity} iconColor="text-blue-400" title="This Week" value={metrics.thisWeek} badge={{ text: "Active", color: "text-blue-400" }} />
        <InteractiveCard icon={Users} iconColor="text-green-400" title="Avg Manpower" value={`${metrics.avgManpower}`} subtitle="workers/day" />
        <InteractiveCard icon={Wrench} iconColor="text-cyan-400" title="Avg Equipment" value={`${metrics.avgEquipment}`} subtitle="units/day" />
        <InteractiveCard icon={AlertTriangle} iconColor={metrics.delays > 0 ? "text-orange-400" : "text-green-400"} title="Delays" value={metrics.delays} subtitle={metrics.delays > 0 ? "Reported" : "None"} />
        <InteractiveCard icon={CheckCircle} iconColor={metrics.incidents === 0 ? "text-green-400" : "text-red-400"} title="Safety" value={metrics.incidents === 0 ? "0 Incidents" : `${metrics.incidents} Issues`} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search reports…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0">
          <Plus className="w-4 h-4" /><span>New Report</span>
        </button>
      </div>

      {/* No project */}
      {!projectId && !projectsLoading && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <Clipboard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Select a Project</h3>
          <p className="text-gray-400 text-sm">Choose a project above to view daily reports.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && projectId && (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.projectDailyReports(projectId) })}
            className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">Retry</button>
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && !isLoading && !error && projectId && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <Clipboard className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">No Reports Found</h3>
          <p className="text-gray-400 text-sm mb-5">{searchQuery ? 'Try different search terms.' : 'Create your first daily report.'}</p>
          {!searchQuery && (
            <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
              <Plus className="w-4 h-4" />Create First Report
            </button>
          )}
        </div>
      )}

      {/* Report List */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(report => (
            <div key={report.id} onClick={() => navigate(`/daily-reports/${report.id}`)}
              className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5 cursor-pointer hover:bg-[#111] hover:border-gray-700 transition-all min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-base font-semibold text-white">{fmtDate(report.reportDate)}</h3>
                {report.weather && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30">
                    <Cloud className="w-3 h-3" />{report.weather}
                  </span>
                )}
                {report.delays && (
                  <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-lg border border-orange-500/30">Delay</span>
                )}
              </div>
              {report.workCompleted && <p className="text-gray-400 text-sm line-clamp-2 mb-3">{report.workCompleted}</p>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-gray-500">Manpower</span></div>
                  <p className="text-xs font-semibold text-white">{report.manpowerCount ?? '—'} workers</p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><Wrench className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs text-gray-500">Equipment</span></div>
                  <p className="text-xs font-semibold text-white">{report.equipmentCount ?? '—'} units</p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5 text-purple-400" /><span className="text-xs text-gray-500">Date</span></div>
                  <p className="text-xs font-semibold text-white">{fmtDate(report.reportDate)}</p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /><span className="text-xs text-gray-500">Safety</span></div>
                  <p className="text-xs font-semibold text-white">{report.safetyIncidents ? 'Incident' : 'Clear'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DailyReportFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} projectId={projectId || undefined} />
    </div>
  );
}

export default DailyReportsPage;
