import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { snagService } from '../services/snagService';
import { queryKeys } from '../lib/queryClient';
import { useProjectContext } from '../hooks/useProjectContext';
import { ProjectPicker } from '../components/ProjectPicker';
import SnagFormModal from '../components/SnagFormModal';
import { InteractiveCard } from '../components/InteractiveCard';
import { toast } from '../utils/toast';
import {
  AlertCircle, Plus, MapPin, DollarSign, User, CheckCircle,
  Target, Activity, Search, XCircle, Clock
} from 'lucide-react';

function SnagsPage() {
  const navigate = useNavigate();
  const { projectId, projects, isLoading: projectsLoading, setProjectId } = useProjectContext();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const { data: snags = [], isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.projectSnags(projectId),
    queryFn: () => snagService.getSnagsByProject(projectId),
    enabled: !!projectId,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  const metrics = {
    total: snags.length,
    open: snags.filter(s => s.status === 'Open').length,
    inProgress: snags.filter(s => s.status === 'In Progress').length,
    resolved: snags.filter(s => s.status === 'Resolved').length,
    verified: snags.filter(s => s.status === 'Verified').length,
    critical: snags.filter(s => s.severity === 'Critical').length,
    major: snags.filter(s => s.severity === 'Major').length,
    minor: snags.filter(s => s.severity === 'Minor').length,
    totalCostImpact: snags.reduce((sum, s) => sum + (s.costImpact || 0), 0),
    avgResolutionTime: 0,
  };

  const handleCreateSnag = async (data: any) => {
    try {
      await snagService.createSnag(data);
      toast.success('Snag created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.projectSnags(projectId) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create snag');
      throw err;
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n);

  const sevColor = (s: string) => ({
    Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    Major: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Minor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }[s] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30');

  const stColor = (s: string) => ({
    Verified: 'bg-green-500/20 text-green-400 border-green-500/30',
    Resolved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'In Progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Open: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[s] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30');

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
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white">Snag & Defect Management</h1>
            <p className="text-sm text-gray-400 mt-1">Track and resolve site defects and punch list items</p>
          </div>
          <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <InteractiveCard icon={AlertCircle} iconColor="text-orange-400" title="Total" value={metrics.total} />
        <InteractiveCard icon={XCircle} iconColor="text-red-400" title="Critical" value={metrics.critical} badge={{ text: "Urgent", color: "text-red-400" }} />
        <InteractiveCard icon={AlertCircle} iconColor="text-orange-400" title="Major" value={metrics.major} />
        <InteractiveCard icon={AlertCircle} iconColor="text-yellow-400" title="Minor" value={metrics.minor} />
        <InteractiveCard icon={DollarSign} iconColor="text-yellow-400" title="Cost Impact" value={fmt(metrics.totalCostImpact)} />
        <InteractiveCard icon={Target} iconColor="text-purple-400" title="Resolved" value={`${metrics.total > 0 ? Math.round((metrics.resolved / metrics.total) * 100) : 0}%`} progress={{ value: metrics.total > 0 ? (metrics.resolved / metrics.total) * 100 : 0, color: "bg-purple-400" }} />
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
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0">
          <Plus className="w-4 h-4" /><span>New Snag</span>
        </button>
      </div>

      {/* No project selected */}
      {!projectId && !projectsLoading && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Select a Project</h3>
          <p className="text-gray-400 text-sm">Choose a project from the dropdown above to view snags.</p>
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
          <button onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.projectSnags(projectId) })}
            className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">Retry</button>
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && !isLoading && !error && projectId && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">No Snags Found</h3>
          <p className="text-gray-400 text-sm mb-5">
            {searchQuery || filterStatus !== 'all' || filterSeverity !== 'all' ? 'Try adjusting your filters.' : 'Create your first snag to get started.'}
          </p>
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
            <Plus className="w-4 h-4" />Create First Snag
          </button>
        </div>
      )}

      {/* Snag List */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(snag => (
            <div key={snag.id} onClick={() => navigate(`/snags/${snag.id}`)}
              className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5 cursor-pointer hover:bg-[#111] hover:border-gray-700 transition-all min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${sevColor(snag.severity)}`}>{snag.severity}</span>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${stColor(snag.status)}`}>{snag.status}</span>
                <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-lg border border-purple-500/30">{snag.category}</span>
              </div>
              <p className="text-gray-300 text-sm mb-3 line-clamp-2">{snag.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs text-gray-500">Location</span></div>
                  <p className="text-xs font-semibold text-white truncate">{snag.location}</p>
                </div>
                {snag.costImpact > 0 && (
                  <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                    <div className="flex items-center gap-1.5 mb-1"><DollarSign className="w-3.5 h-3.5 text-yellow-400" /><span className="text-xs text-gray-500">Cost Impact</span></div>
                    <p className="text-xs font-semibold text-yellow-400">{fmt(snag.costImpact)}</p>
                  </div>
                )}
                {snag.dueDate && (
                  <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                    <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-purple-400" /><span className="text-xs text-gray-500">Due Date</span></div>
                    <p className="text-xs font-semibold text-white">{new Date(snag.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SnagFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateSnag} projectId={projectId || undefined} />
    </div>
  );
}

export default SnagsPage;
