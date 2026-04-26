import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { changeOrderService } from '../services/changeOrderService';
import { queryKeys } from '../lib/queryClient';
import { useProjectRoom } from '../hooks/useRealtimeSync';
import ChangeOrderFormModal from '../components/ChangeOrderFormModal';
import { InteractiveCard } from '../components/InteractiveCard';
import { toast } from '../utils/toast';
import {
  TrendingUp, Plus, DollarSign, Clock, AlertCircle, CheckCircle,
  Activity, Search, XCircle, FileText, Target
} from 'lucide-react';

function ChangeOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const projectId = searchParams.get('project_id') || '';

  // Join real-time room for this project
  useProjectRoom(projectId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Fetch change orders using React Query
  const { data: changeOrders = [], isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.projectChangeOrders(projectId || 'all'),
    queryFn: () => projectId
      ? changeOrderService.getChangeOrdersByProject(projectId)
      : changeOrderService.getAllChangeOrders(),
  });

  const error = queryError instanceof Error ? queryError.message : null;

  // Calculate metrics from real data
  const metrics = {
    total: changeOrders.length,
    draft: changeOrders.filter(co => co.status === 'Draft').length,
    submitted: changeOrders.filter(co => co.status === 'Submitted').length,
    underReview: changeOrders.filter(co => co.status === 'Under Review').length,
    approved: changeOrders.filter(co => co.status === 'Approved').length,
    rejected: changeOrders.filter(co => co.status === 'Rejected').length,
    totalCostImpact: changeOrders.reduce((sum, co) => sum + (Number(co.costImpact) || 0), 0),
    approvedCostImpact: changeOrders.filter(co => co.status === 'Approved').reduce((sum, co) => sum + (Number(co.costImpact) || 0), 0),
    pendingCostImpact: changeOrders.filter(co => co.status === 'Under Review' || co.status === 'Submitted').reduce((sum, co) => sum + (Number(co.costImpact) || 0), 0),
    avgApprovalTime: 0,
  };

  const handleCreateChangeOrder = async (data: any) => {
    try {
      await changeOrderService.createChangeOrder(data);
      toast.success('Change order created successfully');
      // Invalidate query to trigger refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.projectChangeOrders(projectId) });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create change order';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Under Review': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Submitted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-400';
      case 'High': return 'text-orange-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const filteredChangeOrders = changeOrders.filter(co => {
    const matchesSearch = co.changeNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      co.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || co.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || co.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <p className="mt-4 text-gray-400">Loading change orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* CHANGE ORDERS COMMAND HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
              <h1 className="text-2xl font-bold text-white">Change Order Management</h1>
              <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Change Orders:</span>
                <span className="text-white font-semibold">{metrics.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Approved:</span>
                <span className="text-green-400 font-semibold">{metrics.approved}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Impact:</span>
                <span className="text-white font-semibold">{formatCurrency(metrics.totalCostImpact)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Pending Review:</span>
                <span className="text-yellow-400 font-semibold">{metrics.underReview}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InteractiveCard
              icon={DollarSign}
              iconColor="text-green-400"
              title="Approved Impact"
              value={formatCurrency(metrics.approvedCostImpact)}
              subtitle="Contract increase"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={AlertCircle}
              iconColor="text-yellow-400"
              title="Pending Impact"
              value={formatCurrency(metrics.pendingCostImpact)}
              subtitle="Under review"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={CheckCircle}
              iconColor="text-green-400"
              title="Approved"
              value={metrics.approved}
              subtitle="Completed"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={Clock}
              iconColor="text-blue-400"
              title="Avg Time"
              value={`${metrics.avgApprovalTime}d`}
              subtitle="To approval"
              className="min-w-[160px]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <InteractiveCard
          icon={TrendingUp}
          iconColor="text-blue-400"
          title="Total"
          value={metrics.total}
          subtitle="+5 this month"
          trend={{ value: "+5", direction: "up", color: "text-green-400" }}
        />
        <InteractiveCard
          icon={FileText}
          iconColor="text-gray-400"
          title="Draft"
          value={metrics.draft}
          subtitle="In preparation"
        />
        <InteractiveCard
          icon={Activity}
          iconColor="text-yellow-400"
          title="Under Review"
          value={metrics.underReview}
          badge={{ text: "Active", color: "text-yellow-400" }}
        />
        <InteractiveCard
          icon={CheckCircle}
          iconColor="text-green-400"
          title="Approved"
          value={metrics.approved}
          badge={{ text: `${metrics.total > 0 ? Math.round((metrics.approved / metrics.total) * 100) : 0}%`, color: "text-green-400" }}
          progress={{ value: metrics.total > 0 ? (metrics.approved / metrics.total) * 100 : 0, color: "bg-green-400" }}
        />
        <InteractiveCard
          icon={XCircle}
          iconColor="text-red-400"
          title="Rejected"
          value={metrics.rejected}
          subtitle="Not approved"
        />
        <InteractiveCard
          icon={Target}
          iconColor="text-purple-400"
          title="Success Rate"
          value={`${metrics.total > 0 ? Math.round((metrics.approved / (metrics.approved + metrics.rejected)) * 100) : 0}%`}
          progress={{ value: metrics.total > 0 ? (metrics.approved / (metrics.approved + metrics.rejected)) * 100 : 0, color: "bg-purple-400" }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search change orders..."
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
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Voided">Voided</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterPriority('all');
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
          <span>New Change Order</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-2">Unable to Load Change Orders</h3>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.projectChangeOrders(projectId) })}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredChangeOrders.length === 0 && !error && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Change Orders Found</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'No change orders match your filters. Try adjusting your search criteria.'
              : 'Create your first change order to track contract variations and modifications.'}
          </p>
          {!searchQuery && filterStatus === 'all' && filterPriority === 'all' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Change Order</span>
            </button>
          )}
        </div>
      )}

      {filteredChangeOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing <span className="text-white font-semibold">{filteredChangeOrders.length}</span> change order{filteredChangeOrders.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-4">
            {filteredChangeOrders.map((co) => (
              <div
                key={co.id}
                onClick={() => navigate(`/change-orders/${co.id}`)}
                className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 hover:scale-[1.01] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{co.changeNumber}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(co.status)}`}>
                        {co.status}
                      </span>
                      <span className={`text-xs font-semibold ${getPriorityColor(co.priority)}`}>
                        {co.priority}
                      </span>
                    </div>
                    <h4 className="text-lg text-gray-300 mb-2">{co.title}</h4>
                    <p className="text-gray-500 text-sm line-clamp-2">{co.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-400">Cost Impact</span>
                    </div>
                    <p className={`text-sm font-semibold ${co.costImpact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {co.costImpact >= 0 ? '+' : ''}{formatCurrency(co.costImpact)}
                    </p>
                  </div>
                  <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-400">Schedule Impact</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {co.scheduleImpactDays > 0 ? '+' : ''}{co.scheduleImpactDays} days
                    </p>
                  </div>
                  <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-gray-400">Reason</span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{co.reason}</p>
                  </div>
                  <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-gray-400">Submitted</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {co.submittedAt ? new Date(co.submittedAt).toLocaleDateString() : 'Draft'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ChangeOrderFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateChangeOrder}
        projectId={projectId || undefined}
        contractId={searchParams.get('contract_id') || undefined}
      />
    </div>
  );
}

export default ChangeOrdersPage;
