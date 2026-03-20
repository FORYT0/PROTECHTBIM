import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { snagService } from '../services/snagService';
import { queryKeys } from '../lib/queryClient';
import SnagFormModal from '../components/SnagFormModal';
import { InteractiveCard } from '../components/InteractiveCard';
import { toast } from '../utils/toast';
import {
  AlertCircle, Plus, MapPin, DollarSign, User, CheckCircle,
  Target, Activity, Search, XCircle, Clock
} from 'lucide-react';

function SnagsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const projectId = searchParams.get('project_id') || '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Fetch snags using React Query
  const { data: snags = [], isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.projectSnags(projectId),
    queryFn: () => snagService.getSnagsByProject(projectId),
    enabled: !!projectId,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  // Calculate metrics
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
      // Invalidate query
      queryClient.invalidateQueries({ queryKey: queryKeys.projectSnags(projectId) });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create snag';
      toast.error(errorMessage);
      throw err;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MAJOR': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MINOR': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'RESOLVED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'OPEN': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredSnags = snags.filter(snag => {
    const matchesSearch = snag.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snag.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || snag.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || snag.severity === filterSeverity;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <p className="mt-4 text-gray-400">Loading snags...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Snag & Defect Management</h1>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Snags:</span>
                <span className="text-white font-semibold">{metrics.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Open:</span>
                <span className="text-red-400 font-semibold">{metrics.open}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Critical:</span>
                <span className="text-red-400 font-semibold">{metrics.critical}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Resolved:</span>
                <span className="text-green-400 font-semibold">{metrics.resolved}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InteractiveCard
              icon={AlertCircle}
              iconColor="text-red-400"
              title="Open"
              value={metrics.open}
              subtitle="Needs attention"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={Activity}
              iconColor="text-yellow-400"
              title="In Progress"
              value={metrics.inProgress}
              subtitle="Being resolved"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={CheckCircle}
              iconColor="text-green-400"
              title="Resolved"
              value={metrics.resolved}
              subtitle="Completed"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={Clock}
              iconColor="text-blue-400"
              title="Avg Time"
              value={`${metrics.avgResolutionTime}d`}
              subtitle="To resolution"
              className="min-w-[160px]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <InteractiveCard
          icon={AlertCircle}
          iconColor="text-orange-400"
          title="Total Snags"
          value={metrics.total}
          subtitle="+8 this week"
          trend={{ value: "+8", direction: "up", color: "text-orange-400" }}
        />
        <InteractiveCard
          icon={XCircle}
          iconColor="text-red-400"
          title="Critical"
          value={metrics.critical}
          badge={{ text: "Urgent", color: "text-red-400" }}
        />
        <InteractiveCard
          icon={AlertCircle}
          iconColor="text-orange-400"
          title="Major"
          value={metrics.major}
          badge={{ text: "High", color: "text-orange-400" }}
        />
        <InteractiveCard
          icon={AlertCircle}
          iconColor="text-yellow-400"
          title="Minor"
          value={metrics.minor}
          badge={{ text: "Low", color: "text-yellow-400" }}
        />
        <InteractiveCard
          icon={DollarSign}
          iconColor="text-yellow-400"
          title="Cost Impact"
          value={formatCurrency(metrics.totalCostImpact)}
          subtitle="Rectification cost"
        />
        <InteractiveCard
          icon={Target}
          iconColor="text-purple-400"
          title="Resolution Rate"
          value={`${metrics.total > 0 ? Math.round((metrics.resolved / metrics.total) * 100) : 0}%`}
          progress={{ value: metrics.total > 0 ? (metrics.resolved / metrics.total) * 100 : 0, color: "bg-purple-400" }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search snags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Verified">Verified</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
          </select>

          {(searchQuery || filterStatus !== 'all' || filterSeverity !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterSeverity('all');
              }}
              className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Snag</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-2">Unable to Load Snags</h3>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.projectSnags(projectId) })}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredSnags.length === 0 && !error && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Snags Found</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {searchQuery || filterStatus !== 'all' || filterSeverity !== 'all'
              ? 'No snags match your filters. Try adjusting your search criteria.'
              : 'Create your first snag to track defects and punch list items.'}
          </p>
          {!searchQuery && filterStatus === 'all' && filterSeverity === 'all' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Snag</span>
            </button>
          )}
        </div>
      )}

      {filteredSnags.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing <span className="text-white font-semibold">{filteredSnags.length}</span> snag{filteredSnags.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-4">
            {filteredSnags.map((snag) => (
              <div
                key={snag.id}
                onClick={() => navigate(`/snags/${snag.id}`)}
                className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 hover:scale-[1.01] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${getSeverityColor(snag.severity)}`}>
                        {snag.severity}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(snag.status)}`}>
                        {snag.status}
                      </span>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-lg border border-purple-500/30">
                        {snag.category}
                      </span>
                    </div>
                    <p className="text-gray-300 text-base mb-2">{snag.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-400">Location</span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{snag.location}</p>
                  </div>
                  {snag.assignedTo && (
                    <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-gray-400">Assigned To</span>
                      </div>
                      <p className="text-sm font-semibold text-white truncate">{snag.assignedTo}</p>
                    </div>
                  )}
                  {snag.costImpact > 0 && (
                    <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-gray-400">Cost Impact</span>
                      </div>
                      <p className="text-sm font-semibold text-yellow-400">
                        {formatCurrency(snag.costImpact)}
                      </p>
                    </div>
                  )}
                  {snag.dueDate && (
                    <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Due Date</span>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {new Date(snag.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SnagFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSnag}
        projectId={projectId || undefined}
      />
    </div>
  );
}

export default SnagsPage;
