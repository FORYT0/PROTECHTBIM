import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contractService } from '../services/contractService';
import ContractFormModal from '../components/ContractFormModal';
import { InteractiveCard } from '../components/InteractiveCard';
import { toast } from '../utils/toast';
import { queryKeys } from '../lib/queryClient';
import { useProjectRoom } from '../hooks/useRealtimeSync';
import {
  FileText, Plus, TrendingUp, Calendar, AlertCircle,
  CheckCircle, Search, Building2,
  Scale, ArrowUpRight
} from 'lucide-react';

export function ContractsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project_id') || undefined;
  const queryClient = useQueryClient();

  // JOIN REAL-TIME ROOM
  useProjectRoom(projectId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // FETCH CONTRACTS WITH REACT QUERY
  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: queryKeys.projectContracts(projectId || 'all'),
    queryFn: async () => {
      if (projectId) {
        return await contractService.getContractsByProjectId(projectId);
      }
      return await contractService.getAllContracts();
    },
  });

  const filteredContracts = contracts.filter((contract: any) => {
    const matchesSearch =
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // METRICS CALCULATIONS
  const totalValue = contracts.reduce((sum: number, c: any) => sum + (Number(c.revisedContractValue) || 0), 0);
  const totalVariations = contracts.reduce((sum: number, c: any) => sum + (Number(c.totalApprovedVariations) || 0), 0);
  const activeContracts = contracts.filter((c: any) => c.status === 'ACTIVE' || c.status === 'active').length;
  const variationExposure = totalValue > 0 ? (totalVariations / totalValue) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'DRAFT': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'TERMINATED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-xl">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Contracts</h2>
        <p className="text-gray-400">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* CONTRACTS COMMAND HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Contract Management</h1>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Contracts:</span>
                <span className="text-white font-semibold">{contracts.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Active Phase:</span>
                <span className="text-green-400 font-semibold">{activeContracts}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Portfolio Value:</span>
                <span className="text-white font-semibold">{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Variations:</span>
                <span className="text-yellow-400 font-semibold">{formatCurrency(totalVariations)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InteractiveCard
              icon={FileText}
              iconColor="text-blue-400"
              title="Portfolio Value"
              value={formatCurrency(totalValue)}
              subtitle="Current total"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={CheckCircle}
              iconColor="text-green-400"
              title="Active"
              value={activeContracts}
              subtitle="Executional"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={Scale}
              iconColor="text-yellow-400"
              title="Exposure"
              value={`${variationExposure.toFixed(1)}%`}
              subtitle="Variation risk"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={TrendingUp}
              iconColor="text-purple-400"
              title="Retention"
              value={formatCurrency(totalValue * 0.05)}
              subtitle="Held amount"
              className="min-w-[160px]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <InteractiveCard
          icon={FileText}
          iconColor="text-blue-400"
          title="Total"
          value={contracts.length}
          trend={{ value: "+2", direction: "up", color: "text-green-400" }}
        />
        <InteractiveCard
          icon={CheckCircle}
          iconColor="text-green-400"
          title="Active"
          value={activeContracts}
          badge={{ text: "On Track", color: "text-green-400" }}
        />
        <InteractiveCard
          icon={Scale}
          iconColor="text-yellow-400"
          title="Exposure"
          value={`${variationExposure.toFixed(1)}%`}
          progress={{ value: variationExposure, color: "bg-yellow-400" }}
        />
        <InteractiveCard
          icon={TrendingUp}
          iconColor="text-purple-400"
          title="Retention"
          value={formatCurrency(totalValue * 0.05)}
        />
        <InteractiveCard
          icon={AlertCircle}
          iconColor="text-red-400"
          title="Critical"
          value={contracts.filter((c: any) => c.status === 'TERMINATED').length}
          subtitle="Action needed"
        />
        <InteractiveCard
          icon={ArrowUpRight}
          iconColor="text-cyan-400"
          title="Variation Value"
          value={formatCurrency(totalVariations)}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="terminated">Terminated</option>
          </select>

          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
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
          <span>New Contract</span>
        </button>
      </div>

      {/* CONTRACTS TABLE/LIST */}
      <div className="bg-[#0A0A0A] border border-gray-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">Indexing Portfolio...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No contracts found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Identification</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Entity / Client</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Portfolio Value</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-center">Phase</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Timeline</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredContracts.map((contract: any) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => navigate(`/projects/${contract.projectId}/time-cost`)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          {contract.contractNumber}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 mt-0.5">ID: {contract.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-300">{contract.clientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-white font-mono">{formatCurrency(contract.revisedContractValue)}</span>
                        {contract.totalApprovedVariations > 0 && (
                          <span className="text-[10px] text-yellow-400 font-bold">
                            +{formatCurrency(contract.totalApprovedVariations)} variations
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight border ${getStatusColor(contract.status)} shadow-sm`}>
                          {contract.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(contract.startDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-5 h-5 text-blue-500" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ContractFormModal
          projectId={projectId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projectContracts(projectId || 'all') });
            setIsModalOpen(false);
            toast.success('Contract synchronized successfully');
          }}
        />
      )}
    </div>
  );
}

export default ContractsPage;
