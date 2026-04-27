import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProjectContext } from '../hooks/useProjectContext';
import { ProjectPicker } from '../components/ProjectPicker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contractService } from '../services/contractService';
import ContractFormModal from '../components/ContractFormModal';
import { InteractiveCard } from '../components/InteractiveCard';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  FileText, Plus, TrendingUp, Calendar, AlertCircle,
  CheckCircle, Search, Building2, Scale, ArrowUpRight,
  Edit2, DollarSign, Percent
} from 'lucide-react';

function ContractsPage() {
  const navigate = useNavigate();
  const { projectId, projects, isLoading: projectsLoading, setProjectId } = useProjectContext();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── Fetch contracts ───────────────────────────────────────────
  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ['contracts', projectId || 'all'],
    queryFn: async () => {
      if (projectId) return contractService.getContractsByProjectId(projectId);
      return contractService.getAllContracts();
    },
    enabled: true, // always fetch even without projectId
    staleTime: 30_000,
  });

  const filteredContracts = contracts.filter((c: any) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      (c.contractNumber || '').toLowerCase().includes(q) ||
      (c.clientName || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' ||
      (c.status || '').toLowerCase().includes(statusFilter.toLowerCase());
    return matchSearch && matchStatus;
  });

  // ── Metrics ───────────────────────────────────────────────────
  const totalValue = contracts.reduce((s: number, c: any) => s + (Number(c.revisedContractValue) || 0), 0);
  const totalVariations = contracts.reduce((s: number, c: any) => s + (Number(c.totalApprovedVariations) || 0), 0);
  const activeContracts = contracts.filter((c: any) => ['active', 'Active', 'ACTIVE'].includes(c.status)).length;
  const variationPct = totalValue > 0 ? (totalVariations / totalValue) * 100 : 0;

  const { formatCurrency: fmtCur } = useCurrency();
  const fmt = (n: number) => fmtCur(n, 'KES');

  const statusColor = (s: string) => {
    switch ((s || '').toUpperCase()) {
      case 'ACTIVE':     return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'COMPLETED':  return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'DRAFT':      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'TERMINATED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:           return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['contracts'] });
    setIsModalOpen(false);
    setEditingContract(null);
  };

  return (
    <div className="space-y-5 pb-8 min-w-0">

      {/* CONTRACT INTELLIGENCE HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Contract Management Center</h1>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Contracts:</span>
                <span className="text-white font-semibold">{contracts.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Active:</span>
                <span className="text-green-400 font-semibold">{activeContracts}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Portfolio Value:</span>
                <span className="text-white font-semibold">{fmt(totalValue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Variation %:</span>
                <span className="text-yellow-400 font-semibold">{variationPct.toFixed(1)}%</span>
              </div>
            </div>
            <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
          </div>

          {/* RIGHT SIDE - EXECUTIVE METRICS */}
          <div className="grid grid-cols-2 gap-4 ml-6">
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">Total Contracts</span>
              </div>
              <p className="text-2xl font-bold text-white">{contracts.length}</p>
              <span className="text-xs text-gray-400">In portfolio</span>
            </div>
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-xs text-gray-400">Active</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{activeContracts}</p>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                <div className="bg-green-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${contracts.length > 0 ? (activeContracts / contracts.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-white" />
                <span className="text-xs text-gray-400">Portfolio Value</span>
              </div>
              <p className="text-2xl font-bold text-white">{fmt(totalValue)}</p>
              <span className="text-xs text-gray-400">Total contracted</span>
            </div>
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <span className="text-xs text-gray-400">Variation %</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{variationPct.toFixed(1)}%</p>
              <span className="text-xs text-gray-400">{fmt(totalVariations)} total</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTRACT KPI ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <InteractiveCard icon={FileText}    iconColor="text-blue-400"   title="Total Contracts"   value={contracts.length} />
        <InteractiveCard icon={CheckCircle} iconColor="text-green-400"  title="Active"            value={activeContracts} badge={{ text: 'Live', color: 'text-green-400' }} />
        <InteractiveCard icon={DollarSign}  iconColor="text-white"      title="Portfolio Value"   value={fmt(totalValue)} />
        <InteractiveCard icon={TrendingUp}  iconColor="text-yellow-400" title="Variations"        value={fmt(totalVariations)} />
        <InteractiveCard icon={Percent}     iconColor="text-orange-400" title="Variation %"       value={`${variationPct.toFixed(1)}%`} progress={{ value: variationPct, color: 'bg-orange-400' }} />
        <InteractiveCard icon={Scale}       iconColor="text-purple-400" title="Retention Held"    value={fmt(totalValue * 0.05)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search contracts..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
        <button onClick={() => { setEditingContract(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0 shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" /><span>New Contract</span>
        </button>
      </div>

      {/* No project */}
      {!projectId && !projectsLoading && contracts.length === 0 && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Select a Project</h3>
          <p className="text-gray-400 text-sm">Choose a project above to view its contracts, or view all contracts.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <p className="text-red-400 text-sm">{(error as Error).message}</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['contracts'] })}
            className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">Retry</button>
        </div>
      )}

      {/* Contract table */}
      <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />
            <p className="text-gray-400 text-sm">Loading contracts…</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">
              {contracts.length === 0 ? 'No contracts yet' : 'No contracts match your filters'}
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              {contracts.length === 0
                ? 'Create your first contract for this project.'
                : 'Try adjusting your search or status filter.'}
            </p>
            {contracts.length === 0 && (
              <button onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
                <Plus className="w-4 h-4" />Create First Contract
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Contract #', 'Client', 'Type', 'Value (KES)', 'Status', 'Start Date', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredContracts.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[#111] transition-colors group cursor-pointer"
                    onClick={() => navigate(`/projects/${c.projectId}`)}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">{c.contractNumber}</p>
                        <p className="text-[10px] text-gray-600 font-mono">{c.id?.slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-300 truncate max-w-[160px]">{c.clientName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-400">{c.contractType || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-sm font-semibold text-white font-mono">
                        {fmt(Number(c.revisedContractValue || c.originalContractValue || 0))}
                      </p>
                      {Number(c.totalApprovedVariations) > 0 && (
                        <p className="text-[10px] text-yellow-400">
                          +{fmt(Number(c.totalApprovedVariations))} var.
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${statusColor(c.status)}`}>
                        {(c.status || 'Draft').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{c.startDate ? new Date(c.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingContract(c); setIsModalOpen(true); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-blue-600 text-gray-400 hover:text-white transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ContractFormModal
          projectId={projectId}
          contract={editingContract}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingContract(null); }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default ContractsPage;
