import { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services/projectService';
import { contractService } from '../services/contractService';
import { queryKeys } from '../lib/queryClient';

interface ChangeOrderFormData {
  projectId: string;
  contractId: string;
  title: string;
  description: string;
  reason: string;
  costImpact: number;
  scheduleImpactDays: number;
  priority: string;
  notes?: string;
}

interface ChangeOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ChangeOrderFormData) => Promise<void>;
  projectId?: string;
  contractId?: string;
  initialData?: Partial<ChangeOrderFormData>;
}

function ChangeOrderFormModal({ isOpen, onClose, onSubmit, projectId, contractId, initialData }: ChangeOrderFormModalProps) {
  const [formData, setFormData] = useState<ChangeOrderFormData>({
    projectId: projectId || '',
    contractId: contractId || '',
    title: '',
    description: '',
    reason: 'Client Change',
    costImpact: 0,
    scheduleImpactDays: 0,
    priority: 'Medium',
    notes: '',
    ...initialData,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects using React Query
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => projectService.listProjects({ per_page: 100 }),
    enabled: isOpen,
  });
  const projects = projectsData?.projects || [];

  // Fetch contracts for the selected project (using array for cache consistency with ContractsPage)
  const { data: contractsData, isLoading: loadingContract } = useQuery({
    queryKey: queryKeys.projectContracts(formData.projectId),
    queryFn: () => contractService.getContractsByProjectId(formData.projectId),
    enabled: isOpen && !!formData.projectId && !contractId,
  });

  const contract = contractsData && contractsData.length > 0 ? contractsData[0] : null;


  // Keep contractId in sync with the fetched contract
  useEffect(() => {
    if (contract && !contractId) {
      setFormData((prev: ChangeOrderFormData) => ({ ...prev, contractId: contract.id }));
    } else if (!contract && !contractId && formData.projectId) {
      setFormData((prev: ChangeOrderFormData) => ({ ...prev, contractId: '' }));
    }
  }, [contract, contractId, formData.projectId]);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData((prev: ChangeOrderFormData) => ({ ...prev, ...initialData }));
    }
  }, [isOpen, initialData]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Transform data to match backend API expectations
      const submitData = {
        ...formData,
        costLines: [], // Backend expects costLines array (can be empty)
      };
      await onSubmit(submitData);
      onClose();
      // Reset form
      setFormData({
        projectId: projectId || '',
        contractId: contractId || '',
        title: '',
        description: '',
        reason: 'Client Change',
        costImpact: 0,
        scheduleImpactDays: 0,
        priority: 'Medium',
        notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save change order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-3xl rounded-xl bg-[#0A0A0A] border border-gray-800 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {initialData ? 'Edit Change Order' : 'New Change Order'}
                </h2>
                <p className="text-sm text-gray-400">Document contract variation and impact</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Project & Contract Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project *
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value, contractId: '' })}
                  disabled={!!projectId || loadingProjects}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingProjects ? 'Loading projects...' : 'Select a project'}
                  </option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {!projectId && projects.length === 0 && !loadingProjects && (
                  <p className="text-xs text-yellow-400 mt-1">No projects available. Create a project first.</p>
                )}
              </div>

              {formData.projectId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contract *
                  </label>
                  {loadingContract ? (
                    <div className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-gray-400">
                      Loading contract...
                    </div>
                  ) : contract ? (
                    <div className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white">
                      {contract.contractNumber} - {contract.clientName}
                    </div>
                  ) : (
                    <div className="w-full px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      No contract found for this project. Create a contract first.
                    </div>
                  )}
                </div>
              )}

              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., Additional HVAC Units Required"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Detailed description of the change and justification..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reason *
                  </label>
                  <select
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Client Change">Client Change</option>
                    <option value="Site Condition">Site Condition</option>
                    <option value="Design Error">Design Error</option>
                    <option value="Regulatory">Regulatory</option>
                    <option value="Unforeseen">Unforeseen</option>
                    <option value="Scope Addition">Scope Addition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority *
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Impact Assessment */}
              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  Impact Assessment
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      Cost Impact *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.costImpact || ''}
                      onChange={(e) => setFormData({ ...formData, costImpact: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use negative values for cost savings</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      Schedule Impact (Days) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.scheduleImpactDays || ''}
                      onChange={(e) => setFormData({ ...formData, scheduleImpactDays: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use negative values for time savings</p>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Any additional information or context..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#111111] border border-gray-800 rounded-lg text-gray-300 hover:bg-[#1A1A1A] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : initialData ? 'Update Change Order' : 'Create Change Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangeOrderFormModal;
