import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { changeOrderService, ChangeOrder } from '../services/changeOrderService';
import { queryKeys } from '../lib/queryClient';
import { useProjectContext } from '../hooks/useProjectContext';
import { ProjectPicker } from '../components/ProjectPicker';
import ChangeOrderFormModal from '../components/ChangeOrderFormModal';
import { InteractiveCard } from '../components/InteractiveCard';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  TrendingUp, Plus, DollarSign, Clock, AlertCircle, CheckCircle,
  Search, XCircle, FileText, Target, ThumbsUp, ThumbsDown, Send
} from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  Approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  'Under Review': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Submitted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  Draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const PRIORITY_COLOR: Record<string, string> = {
  Critical: 'text-red-400',
  High:     'text-orange-400',
  Medium:   'text-yellow-400',
  Low:      'text-gray-400',
};

function ChangeOrdersPage() {
  const { projectId, projects, isLoading: projectsLoading, setProjectId } = useProjectContext();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: changeOrders = [], isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.projectChangeOrders(projectId || 'all'),
    queryFn: () => projectId
      ? changeOrderService.getChangeOrdersByProject(projectId)
      : changeOrderService.getAllChangeOrders(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.projectChangeOrders(projectId || 'all') });

  const metrics = {
    total: changeOrders.length,
    draft: changeOrders.filter(co => co.status === 'Draft').length,
    submitted: changeOrders.filter(co => co.status === 'Submitted').length,
    underReview: changeOrders.filter(co => co.status === 'Under Review').length,
    approved: changeOrders.filter(co => co.status === 'Approved').length,
    rejected: changeOrders.filter(co => co.status === 'Rejected').length,
    totalCostImpact: changeOrders.reduce((s, co) => s + (Number(co.costImpact) || 0), 0),
    approvedCostImpact: changeOrders.filter(co => co.status === 'Approved').reduce((s, co) => s + (Number(co.costImpact) || 0), 0),
  };

  const handleCreate = async (data: any) => {
    await changeOrderService.createChangeOrder(data);
    refresh();
  };

  const handleAction = async (co: ChangeOrder, action: 'submit' | 'approve' | 'reject') => {
    if (action === 'reject') {
      setRejectingId(co.id);
      return;
    }
    setActionLoading(co.id + action);
    try {
      if (action === 'submit')  await changeOrderService.submitChangeOrder(co.id);
      if (action === 'approve') await changeOrderService.approveChangeOrder(co.id);
      refresh();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleRejectConfirm = async (id: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id + 'reject');
    try {
      await changeOrderService.rejectChangeOrder(id, rejectReason);
      refresh();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); setRejectingId(null); setRejectReason(''); }
  };

  const filtered = changeOrders.filter(co => {
    const q = searchQuery.toLowerCase();
    return (
      (!q || co.changeNumber.toLowerCase().includes(q) || co.title.toLowerCase().includes(q)) &&
      (filterStatus === 'all' || co.status === filterStatus)
    );
  });

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Draft';

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* Header */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Change Order Management</h1>
            <p className="text-sm text-gray-400 mt-1">Review, approve, and track contract variations</p>
          </div>
          <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <InteractiveCard icon={FileText}    iconColor="text-blue-400"   title="Total"       value={metrics.total} />
        <InteractiveCard icon={Target}      iconColor="text-gray-400"   title="Draft"       value={metrics.draft} />
        <InteractiveCard icon={Send}        iconColor="text-yellow-400" title="Submitted"   value={metrics.submitted} />
        <InteractiveCard icon={AlertCircle} iconColor="text-blue-400"   title="In Review"   value={metrics.underReview} />
        <InteractiveCard icon={CheckCircle} iconColor="text-green-400"  title="Approved"    value={metrics.approved} badge={{ text: 'Approved', color: 'text-green-400' }} />
        <InteractiveCard icon={XCircle}     iconColor="text-red-400"    title="Rejected"    value={metrics.rejected} />
        <InteractiveCard icon={DollarSign}  iconColor="text-yellow-400" title="Total Impact" value={formatCurrency(metrics.totalCostImpact)} />
        <InteractiveCard icon={TrendingUp}  iconColor="text-green-400"  title="Approved Value" value={formatCurrency(metrics.approvedCostImpact)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search change orders…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Under Review">Under Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0">
          <Plus className="w-4 h-4" />New Change Order
        </button>
      </div>

      {/* No project */}
      {!projectId && !projectsLoading && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Select a Project</h3>
          <p className="text-gray-400 text-sm">Choose a project above to view change orders.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
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
          <TrendingUp className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">
            {changeOrders.length === 0 ? 'No Change Orders Yet' : 'No Results'}
          </h3>
          <p className="text-gray-400 text-sm mb-5">
            {changeOrders.length === 0 ? 'Create the first change order for this project.' : 'Try adjusting your search or filter.'}
          </p>
          {changeOrders.length === 0 && (
            <button onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
              <Plus className="w-4 h-4" />Create First Change Order
            </button>
          )}
        </div>
      )}

      {/* Change Order List */}
      {filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map(co => (
            <div key={co.id} className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5 hover:bg-[#0D0D0D] hover:border-gray-700 transition-all min-w-0">
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-white">{co.changeNumber}</h3>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${STATUS_COLOR[co.status] || STATUS_COLOR.Draft}`}>
                    {co.status}
                  </span>
                  <span className={`text-xs font-semibold ${PRIORITY_COLOR[co.priority] || 'text-gray-400'}`}>
                    {co.priority} priority
                  </span>
                </div>
                {/* Workflow action buttons */}
                <div className="flex items-center gap-2">
                  {co.status === 'Draft' && (
                    <button onClick={() => handleAction(co, 'submit')} disabled={!!actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50">
                      <Send className="w-3 h-3" />Submit for Review
                    </button>
                  )}
                  {(co.status === 'Submitted' || co.status === 'Under Review') && (
                    <>
                      <button onClick={() => handleAction(co, 'approve')} disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
                        <ThumbsUp className="w-3 h-3" />Approve
                      </button>
                      <button onClick={() => handleAction(co, 'reject')} disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
                        <ThumbsDown className="w-3 h-3" />Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-medium text-gray-200 mb-1">{co.title}</h4>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4">{co.description}</p>

              {/* Reject inline form */}
              {rejectingId === co.id && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium text-red-400 mb-2">Rejection reason (required)</p>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                    className="w-full px-3 py-2 bg-[#111] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none mb-2"
                    placeholder="State the reason for rejection…" />
                  <div className="flex gap-2">
                    <button onClick={() => handleRejectConfirm(co.id)} disabled={!rejectReason.trim() || !!actionLoading}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50">
                      {actionLoading === co.id + 'reject' ? '…' : 'Confirm Rejection'}
                    </button>
                    <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                      className="px-4 py-1.5 bg-[#111] border border-gray-800 text-gray-400 rounded-lg text-sm hover:text-white">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Detail grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><DollarSign className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-gray-500">Cost Impact</span></div>
                  <p className={`text-xs font-semibold ${Number(co.costImpact) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Number(co.costImpact) >= 0 ? '+' : ''}{formatCurrency(Number(co.costImpact) || 0)}
                  </p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs text-gray-500">Schedule</span></div>
                  <p className="text-xs font-semibold text-white">
                    {Number(co.scheduleImpactDays) > 0 ? '+' : ''}{co.scheduleImpactDays} days
                  </p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><AlertCircle className="w-3.5 h-3.5 text-yellow-400" /><span className="text-xs text-gray-500">Reason</span></div>
                  <p className="text-xs font-semibold text-white truncate">{co.reason}</p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5 border border-gray-800">
                  <div className="flex items-center gap-1.5 mb-1"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /><span className="text-xs text-gray-500">Submitted</span></div>
                  <p className="text-xs font-semibold text-white">{fmtDate(co.submittedAt)}</p>
                </div>
              </div>

              {/* Rejection reason display */}
              {co.status === 'Rejected' && co.rejectionReason && (
                <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400"><span className="font-semibold">Rejection reason: </span>{co.rejectionReason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ChangeOrderFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        projectId={projectId || undefined}
      />
    </div>
  );
}

export default ChangeOrdersPage;
