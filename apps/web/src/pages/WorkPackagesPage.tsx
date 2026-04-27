import { useState, useEffect } from 'react';
import { WorkPackage, CreateWorkPackageRequest } from '@protecht-bim/shared-types';
import { workPackageService } from '../services/workPackageService';
import WorkPackageTable from '../components/WorkPackageTable';
import CalendarView from '../components/CalendarView';
import WorkPackageFilters, { WorkPackageFilterValues } from '../components/WorkPackageFilters';
import WorkPackageFormModal from '../components/WorkPackageFormModal';
import WorkPackageDetailDrawer from '../components/WorkPackageDetailDrawer';
import { InteractiveCard } from '../components/InteractiveCard';
import { useProjectContext } from '../hooks/useProjectContext';
import { ProjectPicker } from '../components/ProjectPicker';
import {
  Package, AlertTriangle, CheckCircle, Clock,
  Target, Grid, Calendar as CalendarIcon, List, Plus,
  Filter, Activity, ChevronLeft, ChevronRight
} from 'lucide-react';

type ViewMode = 'table' | 'grid' | 'calendar';

const PRIORITY_COLOR: Record<string, string> = {
  Urgent:  'bg-red-500/20 text-red-400 border-red-500/30',
  High:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Normal:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Low:     'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_COLOR: Record<string, string> = {
  'New':           'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'In Progress':   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Done':          'bg-green-500/20 text-green-400 border-green-500/30',
  'Closed':        'bg-green-500/20 text-green-400 border-green-500/30',
  'Rejected':      'bg-red-500/20 text-red-400 border-red-500/30',
  'On Hold':       'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

function WorkPackagesPage() {
  const { projectId, projects, isLoading: projectsLoading, setProjectId } = useProjectContext();
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [selectedWP, setSelectedWP] = useState<WorkPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<WorkPackageFilterValues>({
    search: '', type: [], status: [], priority: [], assignee_id: '',
  });

  const now = new Date();
  const metrics = {
    total: workPackages.length,
    active: workPackages.filter(w => ['In Progress', 'New'].includes((w as any).status || '')).length,
    completed: workPackages.filter(w => ['Done', 'Closed'].includes((w as any).status || '')).length,
    overdue: workPackages.filter(w => {
      const d = w.due_date || (w as any).dueDate;
      return d && new Date(d) < now && !['Done','Closed'].includes((w as any).status || '');
    }).length,
    avgCompletion: workPackages.length
      ? Math.round(workPackages.reduce((s, w) => s + ((w as any).percentageDone || 0), 0) / workPackages.length)
      : 0,
    atRisk: workPackages.filter(w => {
      const d = w.due_date || (w as any).dueDate;
      return d && new Date(d) < new Date(Date.now() + 7*86400000) && ((w as any).percentageDone || 0) < 80;
    }).length,
  };

  const loadWorkPackages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await workPackageService.listWorkPackages({
        project_id: projectId || undefined,
        search: filters.search || undefined,
        type: filters.type.length > 0 ? filters.type : undefined,
        status: filters.status.length > 0 ? filters.status : undefined,
        priority: filters.priority.length > 0 ? filters.priority : undefined,
        assignee_id: filters.assignee_id || undefined,
        page: viewMode === 'calendar' ? 1 : currentPage,
        per_page: viewMode === 'calendar' ? 200 : viewMode === 'grid' ? 24 : 20,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setWorkPackages(response.work_packages);
      setTotalPages(Math.ceil(response.total / response.per_page));
      setTotalItems(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work packages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadWorkPackages(); }, [filters, currentPage, sortBy, sortOrder, viewMode, projectId]);

  const handleCreate = async (data: CreateWorkPackageRequest) => {
    await workPackageService.createWorkPackage(data);
    await loadWorkPackages();
  };

  const handleRowClick = (wp: WorkPackage) => { setSelectedWP(wp); setIsDetailDrawerOpen(true); };
  const handleSort = (field: string) => {
    setSortBy(field);
    setSortOrder(sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const fmtDate = (d?: string | Date | null) =>
    d ? new Date(d as any).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* Header */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Work Packages</h1>
            <p className="text-sm text-gray-400 mt-1">Plan, assign, and track all project work items</p>
          </div>
          <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <InteractiveCard icon={Package}      iconColor="text-blue-400"   title="Total"        value={metrics.total} />
        <InteractiveCard icon={Activity}     iconColor="text-yellow-400" title="Active"       value={metrics.active} />
        <InteractiveCard icon={CheckCircle}  iconColor="text-green-400"  title="Completed"    value={metrics.completed} />
        <InteractiveCard icon={AlertTriangle} iconColor="text-red-400"   title="Overdue"      value={metrics.overdue} />
        <InteractiveCard icon={Clock}        iconColor="text-orange-400" title="At Risk"      value={metrics.atRisk} />
        <InteractiveCard icon={Target}       iconColor="text-cyan-400"   title="Avg Progress" value={`${metrics.avgCompletion}%`} progress={{ value: metrics.avgCompletion, color: 'bg-cyan-400' }} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{totalItems} work package{totalItems !== 1 ? 's' : ''}</span>
          {projectId && <span className="text-gray-600">· {projects.find(p => p.id === projectId)?.name}</span>}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle: Table / Grid / Calendar */}
          <div className="flex items-center bg-[#0A0A0A] border border-gray-800 rounded-lg p-1">
            <button onClick={() => setViewMode('table')} title="Table view"
              className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} title="Grid view"
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('calendar')} title="Calendar view"
              className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" />New Package
          </button>
        </div>
      </div>

      {/* Main content: sidebar + content */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Filters sidebar */}
        {viewMode !== 'calendar' && (
          <div className="lg:col-span-1">
            <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5 sticky top-20">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />Filters
              </h3>
              <WorkPackageFilters
                filters={filters}
                onFilterChange={f => { setFilters(f); setCurrentPage(1); }}
                onReset={() => setFilters({ search: '', type: [], status: [], priority: [], assignee_id: '' })}
              />
            </div>
          </div>
        )}

        {/* Content area */}
        <div className={viewMode !== 'calendar' ? 'lg:col-span-3 min-w-0' : 'lg:col-span-4 min-w-0'}>
          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={loadWorkPackages} className="mt-2 text-xs text-red-400 underline">Retry</button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && workPackages.length === 0 && !error && (
            <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">No Work Packages</h3>
              <p className="text-gray-400 text-sm mb-5">
                {filters.search || filters.type.length || filters.status.length
                  ? 'No packages match your filters.'
                  : 'Create the first work package for this project.'}
              </p>
              {!filters.search && !filters.type.length && !filters.status.length && (
                <button onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
                  <Plus className="w-4 h-4" />Create Package
                </button>
              )}
            </div>
          )}

          {/* ── TABLE VIEW ── */}
          {!isLoading && workPackages.length > 0 && viewMode === 'table' && (
            <>
              <WorkPackageTable
                workPackages={workPackages}
                onRowClick={handleRowClick}
                onSort={handleSort}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-[#0A0A0A] rounded-xl border border-gray-800 px-5 py-3 mt-3">
                  <p className="text-sm text-gray-400">Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span></p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── GRID VIEW ── */}
          {!isLoading && workPackages.length > 0 && viewMode === 'grid' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {workPackages.map(wp => {
                  const pct = (wp as any).percentageDone || 0;
                  const status = (wp as any).status || 'New';
                  const priority = (wp as any).priority || 'Normal';
                  const dueDate = wp.due_date || (wp as any).dueDate;
                  const isOverdue = dueDate && new Date(dueDate) < now && !['Done','Closed'].includes(status);

                  return (
                    <div key={wp.id}
                      onClick={() => handleRowClick(wp)}
                      className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-[#111] hover:border-gray-700 transition-all group min-w-0">
                      {/* Status + Priority */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border ${STATUS_COLOR[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                          {status}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border ${PRIORITY_COLOR[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                          {priority}
                        </span>
                        {(wp as any).type && (
                          <span className="px-2 py-0.5 text-[10px] text-gray-500 bg-gray-800 rounded-lg capitalize">{(wp as any).type}</span>
                        )}
                      </div>
                      {/* Title */}
                      <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-3">
                        {wp.subject}
                      </h3>
                      {wp.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{wp.description}</p>
                      )}
                      {/* Progress */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Progress</span>
                          <span className="text-gray-400">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span className={isOverdue ? 'text-red-400' : ''}>
                            {dueDate ? fmtDate(dueDate) : 'No due date'}
                          </span>
                        </div>
                        {(wp as any).assigneeId && (
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-semibold">
                            {((wp as any).assigneeId as string).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Grid pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-[#0A0A0A] rounded-xl border border-gray-800 px-5 py-3 mt-3">
                  <p className="text-sm text-gray-400">Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span></p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── CALENDAR VIEW ── */}
          {!isLoading && viewMode === 'calendar' && (
            <CalendarView
              workPackages={workPackages}
              onWorkPackageClick={handleRowClick}
              onDateChange={async (id, start, due) => {
                try {
                  await workPackageService.updateWorkPackage(id, { start_date: start, due_date: due });
                  loadWorkPackages();
                } catch {}
              }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <WorkPackageFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
      <WorkPackageDetailDrawer
        workPackage={selectedWP}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onUpdate={() => { loadWorkPackages(); setIsDetailDrawerOpen(false); }}
      />
    </div>
  );
}

export default WorkPackagesPage;
