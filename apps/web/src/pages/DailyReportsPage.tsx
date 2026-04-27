import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyReportService } from '../services/dailyReportService';
import { queryKeys } from '../lib/queryClient';
import { useProjectContext } from '../hooks/useProjectContext';
import { ProjectPicker } from '../components/ProjectPicker';
import DailyReportFormModal from '../components/DailyReportFormModal';
import { InteractiveCard } from '../components/InteractiveCard';
import { toast } from '../utils/toast';
import { Clipboard, Plus, Users, Wrench, AlertTriangle, CheckCircle, Activity, Search, Target, Calendar, Cloud, Edit2 } from 'lucide-react';

function DailyReportsPage() {
  const { projectId, projects, isLoading: projectsLoading, setProjectId } = useProjectContext();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any | null>(null);
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
    delays: reports.filter(r => r.delays?.trim()).length,
    incidents: reports.filter(r => r.safetyIncidents?.trim()).length,
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.projectDailyReports(projectId) });

  const handleCreate = async (data: any) => {
    try {
      if (editingReport?.id) {
        await dailyReportService.updateDailyReport(editingReport.id, data);
        toast.success('Report updated');
      } else {
        await dailyReportService.createDailyReport(data);
        toast.success('Report created');
      }
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save report');
      throw err;
    }
  };

  const filtered = reports.filter(r => {
    const q = searchQuery.toLowerCase();
    return !q || (r.workCompleted || '').toLowerCase().includes(q) || (r.weather || '').toLowerCase().includes(q);
  });

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  // Map a report to form initial data
  const reportToFormData = (r: any) => ({
    projectId: r.projectId,
    reportDate: r.reportDate?.split('T')[0] || '',
    weather: r.weather || '',
    temperature: r.temperature,
    manpowerCount: r.manpowerCount || 0,
    equipmentCount: r.equipmentCount || 0,
    workCompleted: r.workCompleted || '',
    workPlannedTomorrow: r.workPlannedTomorrow || '',
    delays: r.delays || '',
    safetyIncidents: r.safetyIncidents || '',
    siteNotes: r.siteNotes || '',
    visitorsOnSite: r.visitorsOnSite || '',
    materialsDelivered: r.materialsDelivered || '',
  });

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* Header */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Site Reports</h1>
            <p className="text-sm text-gray-400 mt-1">Daily progress, manpower, weather, and safety records</p>
          </div>
          <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <InteractiveCard icon={Clipboard}    iconColor="text-blue-400"   title="Total Reports" value={metrics.total} />
        <InteractiveCard icon={Activity}     iconColor="text-green-400"  title="This Week"     value={metrics.thisWeek} badge={{ text: 'Recent', color: 'text-green-400' }} />
        <InteractiveCard icon={Users}        iconColor="text-cyan-400"   title="Avg Manpower"  value={`${metrics.avgManpower} workers`} />
        <InteractiveCard icon={AlertTriangle} iconColor="text-orange-400" title="Days w/ Delays" value={metrics.delays} />
        <InteractiveCard icon={CheckCircle}  iconColor={metrics.incidents > 0 ? 'text-red-400' : 'text-green-400'} title="Safety Incidents" value={metrics.incidents} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search reports…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <button onClick={() => { setEditingReport(null); setIsModalOpen(true); }}
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
          <button onClick={refresh} className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">Retry</button>
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && !isLoading && !error && projectId && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <Clipboard className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">No Reports Found</h3>
          <p className="text-gray-400 text-sm mb-5">{searchQuery ? 'Try different search terms.' : 'Create your first daily site report.'}</p>
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
            <div key={report.id}
              className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5 hover:bg-[#0D0D0D] hover:border-gray-700 transition-all min-w-0 group">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-white">{fmtDate(report.reportDate)}</h3>
                  {report.weather && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30">
                      <Cloud className="w-3 h-3" />{report.weather}
                    </span>
                  )}
                  {report.delays?.trim() && (
                    <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-lg border border-orange-500/30">Delay Reported</span>
                  )}
                  {report.safetyIncidents?.trim() && (
                    <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30">Safety Incident</span>
                  )}
                </div>
                {/* Edit button */}
                <button
                  onClick={() => { setEditingReport({ id: report.id, ...reportToFormData(report) }); setIsModalOpen(true); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-blue-600 text-gray-400 hover:text-white transition-all"
                  title="Edit report">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {report.workCompleted && <p className="text-gray-400 text-sm line-clamp-2 mb-3">{report.workCompleted}</p>}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-gray-500">Manpower</span></div>
                  <p className="text-xs font-semibold text-white">{report.manpowerCount ?? 0} workers</p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><Wrench className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs text-gray-500">Equipment</span></div>
                  <p className="text-xs font-semibold text-white">{report.equipmentCount ?? 0} units</p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5 text-purple-400" /><span className="text-xs text-gray-500">Planned Tomorrow</span></div>
                  <p className="text-xs font-semibold text-white truncate">{report.workPlannedTomorrow || '—'}</p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /><span className="text-xs text-gray-500">Safety</span></div>
                  <p className={`text-xs font-semibold ${report.safetyIncidents ? 'text-red-400' : 'text-green-400'}`}>
                    {report.safetyIncidents ? 'Incident logged' : 'Clear'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DailyReportFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingReport(null); }}
        initialData={editingReport}
        onSubmit={handleCreate}
        projectId={projectId || undefined}
      />
    </div>
  );
}

export default DailyReportsPage;
