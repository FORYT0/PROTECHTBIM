import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import WorkPackageDetailDrawer from '../components/WorkPackageDetailDrawer';
import ICalendarSubscription from '../components/ICalendarSubscription';
import { InteractiveCard } from '../components/InteractiveCard';
import { useProjectContext } from '../hooks/useProjectContext';
import { ProjectPicker } from '../components/ProjectPicker';
import { workPackageService } from '../services/workPackageService';
import type { WorkPackage } from '@protecht-bim/shared-types';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle, Clock, Target, Download, Activity } from 'lucide-react';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId, projects, isLoading: projectsLoading, setProjectId } = useProjectContext();
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWP, setSelectedWP] = useState<WorkPackage | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (projectId) loadWorkPackages();
  }, [projectId]);

  const loadWorkPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await workPackageService.listWorkPackages({ project_id: projectId, per_page: 200 });
      setWorkPackages(r.work_packages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load work packages');
      setWorkPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const filtered = workPackages.filter(wp => !filterStatus || wp.status === filterStatus);
  const uniqueStatuses = [...new Set(workPackages.map(w => w.status).filter(Boolean))];

  // Real metrics computed from loaded data
  const metrics = {
    total: workPackages.length,
    upcoming: workPackages.filter(w => { const d = w.due_date || (w as any).dueDate; return d && new Date(d) > now && new Date(d) < new Date(Date.now() + 7*86400000); }).length,
    completed: workPackages.filter(w => ['closed','Closed','done','Done'].includes(w.status || '')).length,
    overdue: workPackages.filter(w => { const d = w.due_date || (w as any).dueDate; return d && new Date(d) < now && !['closed','Closed'].includes(w.status || ''); }).length,
    inProgress: workPackages.filter(w => ['in_progress','In Progress'].includes(w.status || '')).length,
  };

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* Header */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Schedule Calendar</h1>
            <p className="text-sm text-gray-400 mt-1">Work package timeline and scheduling overview</p>
          </div>
          <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
        </div>
      </div>

      {/* KPI Cards — real data */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <InteractiveCard icon={CalendarIcon} iconColor="text-blue-400"   title="Total Packages" value={metrics.total} />
        <InteractiveCard icon={Clock}        iconColor="text-cyan-400"   title="Due This Week"  value={metrics.upcoming} badge={{ text: 'Upcoming', color: 'text-cyan-400' }} />
        <InteractiveCard icon={Activity}     iconColor="text-yellow-400" title="In Progress"    value={metrics.inProgress} />
        <InteractiveCard icon={CheckCircle}  iconColor="text-green-400"  title="Completed"      value={metrics.completed} />
        <InteractiveCard icon={AlertTriangle} iconColor={metrics.overdue > 0 ? 'text-red-400' : 'text-gray-500'} title="Overdue" value={metrics.overdue} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
            <option value="">All Status</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {filterStatus && (
            <button onClick={() => setFilterStatus('')}
              className="px-3 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
              Clear
            </button>
          )}
        </div>
        <button onClick={() => setSubscriptionOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:border-gray-700 transition-colors">
          <Download className="w-4 h-4" />Subscribe iCal
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={loadWorkPackages} className="mt-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm">Retry</button>
        </div>
      )}

      {/* No project */}
      {!projectId && !projectsLoading && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Select a Project</h3>
          <p className="text-gray-400 text-sm">Choose a project above to view its schedule calendar.</p>
        </div>
      )}

      {/* Loading */}
      {loading && projectId && (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />
        </div>
      )}

      {/* Calendar */}
      {!loading && projectId && workPackages.length === 0 && !error && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">No Work Packages</h3>
          <p className="text-gray-400 text-sm mb-5">Create work packages for this project to see them on the calendar.</p>
          <button onClick={() => navigate('/work-packages')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
            Go to Work Packages
          </button>
        </div>
      )}

      {!loading && projectId && workPackages.length > 0 && (
        <CalendarView
          workPackages={filtered}
          onWorkPackageClick={wp => { setSelectedWP(wp); setDrawerOpen(true); }}
          onDateChange={async (id, start, due) => {
            try {
              await workPackageService.updateWorkPackage(id, { start_date: start, due_date: due });
              loadWorkPackages();
            } catch {}
          }}
        />
      )}

      {selectedWP && (
        <WorkPackageDetailDrawer
          workPackage={selectedWP} isOpen={drawerOpen}
          onClose={() => { setDrawerOpen(false); setSelectedWP(null); }}
          onUpdate={loadWorkPackages}
        />
      )}

      {subscriptionOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <ICalendarSubscription projectId={projectId} onClose={() => setSubscriptionOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
