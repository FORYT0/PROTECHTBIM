import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { snagService, Snag } from '../services/snagService';
import { queryKeys } from '../lib/queryClient';
import { useProjectContext } from '../hooks/useProjectContext';
import { ProjectPicker } from '../components/ProjectPicker';
import SnagFormModal from '../components/SnagFormModal';
import { InteractiveCard } from '../components/InteractiveCard';
import {
  AlertCircle, Plus, MapPin, DollarSign, CheckCircle,
  Target, Search, XCircle, Clock, Edit2, ChevronDown
} from 'lucide-react';

const SEV_COLOR: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  Major:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Minor:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};
const STATUS_COLOR: Record<string, string> = {
  Verified:    'bg-green-500/20 text-green-400 border-green-500/30',
  Resolved:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'In Progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Open:        'bg-red-500/20 text-red-400 border-red-500/30',
};

// Next valid status transitions
const TRANSITIONS: Record<string, { label: string; action: string }[]> = {
  Open:        [{ label: 'Start Work', action: 'in-progress' }],
  'In Progress': [{ label: 'Mark Resolved', action: 'resolve' }],
  Resolved:    [{ label: 'Verify & Close', action: 'verify' }],
  Verified:    [],
};

function SnagsPage() {
  const { projectId, projects, isLoading: projectsLoading, setProjectId } = useProjectContext();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnag, setEditingSnag] = useState<Snag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: snags = [], isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.projectSnags(projectId),
    queryFn: () => snagService.getSnagsByProject(projectId),
    enabled: !!projectId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.projectSnags(projectId) });

  const metrics = {
    total: snags.length,
    open: snags.filter(s => s.status === 'Open').length,
    inProgress: snags.filter(s => s.status === 'In Progress').length,
    resolved: snags.filter(s => s.status === 'Resolved').length,
    verified: snags.filter(s => s.status === 'Verified').length,
    critical: snags.filter(s => s.severity === 'Critical').length,
    totalCostImpact: snags.reduce((sum, s) => sum + (s.costImpact || 0), 0),
  };

  const handleCreate = async (data: any) => {
    await snagService.createSnag(data);
    refresh();
  };

  const handleEdit = async (data: any) => {
    if (!editingSnag) return;
    await snagService.updateSnag(editingSnag.id, data);
    refresh();
  };

  const handleAction = async (snag: Snag, action: string) => {
    setActionLoading(snag.id + action);
    try {
      if (action === 'in-progress') await snagService.updateSnag(snag.id, { status: 'In Progress' });
      else if (action === 'resolve')   await snagService.resolveSnag(snag.id);
      else if (action === 'verify')    await snagService.verifySnag(snag.id);
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n);
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const filtered = snags.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      (!q || s.location.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) &&
      (filterStatus === 'all' || s.status === filterStatus) &&
      (filterSeverity === 'all' || s.severity === filterSeverity)
    );
  });

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* Header */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Snag & Defect Management</h1>
            <p className="text-sm text-gray-400 mt-1">Track, assign, and resolve site defects and punch list items</p>
          </div>
          <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <InteractiveCard icon={AlertCircle} iconColor="text-orange-400"  title="Total"       value={metrics.total} />
        <InteractiveCard icon={XCircle}     iconColor="text-red-400"     title="Open"        value={metrics.open} badge={{ text: 'Action', color: 'text-red-400' }} />
        <InteractiveCard icon={Clock}       iconColor="text-yellow-400"  title="In Progress" value={metrics.inProgress} />
        <InteractiveCard icon={CheckCircle} iconColor="text-blue-400"    title="Resolved"    value={metrics.resolved} />
        <InteractiveCard icon={Target}      iconColor="text-green-400"   title="Verified"    value={metrics.verified} />
        <InteractiveCard icon={XCircle}     iconColor="text-red-400"     title="Critical"    value={metrics.critical} />
        <InteractiveCard icon={DollarSign}  iconColor="text-yellow-400"  title="Cost Impact" value={fmt(metrics.totalCostImpact)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search snags…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="all">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Verified">Verified</option>
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
          className="px-3 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="all">All Severity</option>
          <option value="Critical">Critical</option>
          <option value="Major">Major</option>
          <option value="Minor">Minor</option>
        </select>
        <button onClick={() => { setEditingSnag(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0">
          <Plus className="w-4 h-4" />New Snag
        </button>
      </div>

      {/* No project */}
      {!projectId && !projectsLoading && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Select a Project</h3>
          <p className="text-gray-400 text-sm">Choose a project above to view and manage snags.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && projectId && (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />
        </div>
      )}

      {/* Error */}
      {queryError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <p className="text-red-400 text-sm">{(queryError as Error).message}</p>
          <button onClick={refresh} className="mt-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm">Retry</button>
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && !isLoading && !queryError && projectId && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">No Snags Found</h3>
          <p className="text-gray-400 text-sm mb-5">
            {searchQuery || filterStatus !== 'all' || filterSeverity !== 'all' ? 'Try adjusting filters.' : 'Log the first site defect.'}
          </p>
          {!searchQuery && filterStatus === 'all' && filterSeverity === 'all' && (
            <button onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
              <Plus className="w-4 h-4" />Log First Snag
            </button>
          )}
        </div>
      )}

      {/* Snag list */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(snag => {
            const transitions = TRANSITIONS[snag.status] || [];
            return (
              <div key={snag.id} className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5 hover:bg-[#0D0D0D] hover:border-gray-700 transition-all min-w-0">
                {/* Row 1: badges + actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${SEV_COLOR[snag.severity] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {snag.severity}
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${STATUS_COLOR[snag.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {snag.status}
                    </span>
                    <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-lg border border-purple-500/30">
                      {snag.category}
                    </span>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {transitions.map(t => (
                      <button key={t.action}
                        onClick={() => handleAction(snag, t.action)}
                        disabled={actionLoading === snag.id + t.action}
                        className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">
                        {actionLoading === snag.id + t.action ? '…' : t.label}
                      </button>
                    ))}
                    <button
                      onClick={() => { setEditingSnag(snag); setIsModalOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                      title="Edit snag">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{snag.description}</p>

                {/* Detail grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                    <div className="flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs text-gray-500">Location</span></div>
                    <p className="text-xs font-semibold text-white truncate">{snag.location}</p>
                  </div>
                  <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                    <div className="flex items-center gap-1.5 mb-1"><DollarSign className="w-3.5 h-3.5 text-yellow-400" /><span className="text-xs text-gray-500">Cost Impact</span></div>
                    <p className="text-xs font-semibold text-yellow-400">{fmt(snag.costImpact || 0)}</p>
                  </div>
                  <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                    <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-purple-400" /><span className="text-xs text-gray-500">Due Date</span></div>
                    <p className="text-xs font-semibold text-white">{fmtDate(snag.dueDate)}</p>
                  </div>
                  <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                    <div className="flex items-center gap-1.5 mb-1"><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-gray-500">Logged</span></div>
                    <p className="text-xs font-semibold text-white">{fmtDate(snag.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <SnagFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSnag(null); }}
        onSubmit={editingSnag ? handleEdit : handleCreate}
        projectId={projectId || undefined}
        initialData={editingSnag ? {
          projectId: editingSnag.projectId,
          workPackageId: editingSnag.workPackageId,
          location: editingSnag.location,
          description: editingSnag.description,
          severity: editingSnag.severity,
          category: editingSnag.category,
          assignedTo: editingSnag.assignedTo,
          dueDate: editingSnag.dueDate?.split('T')[0],
          costImpact: editingSnag.costImpact,
        } : undefined}
      />
    </div>
  );
}

export default SnagsPage;
