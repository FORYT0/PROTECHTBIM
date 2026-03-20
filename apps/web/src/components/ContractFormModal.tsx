import { useState, useEffect } from 'react';
import { X, FileText, DollarSign, Calendar, Percent } from 'lucide-react';
import { projectService } from '../services/projectService';
import { contractService } from '../services/contractService';

interface ContractFormData {
  projectId: string;
  contractNumber: string;
  contractType: string;
  clientName: string;
  originalContractValue: number;
  originalDurationDays: number;
  startDate: string;
  completionDate: string;
  retentionPercentage: number;
  advancePaymentAmount: number;
  performanceBondValue: number;
  currency: string;
  description?: string;
  terms?: string;
}

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: ContractFormData) => Promise<void>;
  onSuccess?: () => void;
  projectId?: string;
  initialData?: Partial<ContractFormData>;
}

function ContractFormModal({ isOpen, onClose, onSubmit, onSuccess, projectId, initialData }: ContractFormModalProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    projectId: projectId || '',
    contractNumber: '',
    contractType: 'Lump Sum',
    clientName: '',
    originalContractValue: 0,
    originalDurationDays: 0,
    startDate: '',
    completionDate: '',
    retentionPercentage: 10,
    advancePaymentAmount: 0,
    performanceBondValue: 0,
    currency: 'USD',
    description: '',
    terms: '',
    ...initialData,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      if (initialData) {
        setFormData({ ...formData, ...initialData });
      }
    }
  }, [isOpen, initialData]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await projectService.listProjects({ per_page: 100 });
      setProjects(response.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      console.log('Form data before submission:', formData);

      // Validate required fields
      if (!formData.projectId) {
        throw new Error('Please select a project');
      }
      if (!formData.contractNumber) {
        throw new Error('Contract number is required');
      }
      if (!formData.clientName) {
        throw new Error('Client name is required');
      }
      if (!formData.startDate) {
        throw new Error('Start date is required');
      }
      if (!formData.completionDate) {
        throw new Error('Completion date is required');
      }

      // Transform form data to match backend API expectations
      const apiData = {
        projectId: formData.projectId,
        contractNumber: formData.contractNumber,
        contractType: formData.contractType,
        clientName: formData.clientName,
        originalContractValue: formData.originalContractValue,
        originalDurationDays: formData.originalDurationDays,
        startDate: formData.startDate,
        completionDate: formData.completionDate,
        retentionPercentage: formData.retentionPercentage,
        advancePaymentAmount: formData.advancePaymentAmount,
        performanceBondValue: formData.performanceBondValue,
        currency: formData.currency,
        description: formData.description,
        terms: formData.terms,
      };

      console.log('Submitting contract data:', apiData);
      if (onSubmit) {
        await onSubmit(apiData);
      } else {
        await contractService.createContract(apiData);
      }
      console.log('Contract created successfully');

      if (onSuccess) {
        onSuccess();
      }

      onClose();
      // Reset form
      setFormData({
        projectId: projectId || '',
        contractNumber: '',
        contractType: 'Lump Sum',
        clientName: '',
        originalContractValue: 0,
        originalDurationDays: 0,
        startDate: '',
        completionDate: '',
        retentionPercentage: 10,
        advancePaymentAmount: 0,
        performanceBondValue: 0,
        currency: 'USD',
        description: '',
        terms: '',
      });
    } catch (err) {
      console.error('Error submitting contract:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save contract';
      setError(errorMessage);
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
        <div className="relative w-full max-w-4xl rounded-xl bg-[#0A0A0A] border border-gray-800 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {initialData ? 'Edit Contract' : 'New Contract'}
                </h2>
                <p className="text-sm text-gray-400">Enter contract details and financial terms</p>
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

            <div className="grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Basic Information */}
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Basic Information
                </h3>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project *
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contract Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., CNT-2026-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contract Type *
                </label>
                <select
                  required
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Lump Sum">Lump Sum</option>
                  <option value="Unit Price">Unit Price</option>
                  <option value="Cost Plus">Cost Plus</option>
                  <option value="Design-Build">Design-Build</option>
                  <option value="EPC">EPC</option>
                  <option value="BOQ">BOQ</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Client organization name"
                />
              </div>

              {/* Financial Terms */}
              <div className="col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Financial Terms
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Original Contract Value *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.originalContractValue}
                  onChange={(e) => setFormData({ ...formData, originalContractValue: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Currency *
                </label>
                <select
                  required
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Retention Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.retentionPercentage}
                    onChange={(e) => setFormData({ ...formData, retentionPercentage: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 pr-10 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="10"
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Advance Payment Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.advancePaymentAmount}
                  onChange={(e) => setFormData({ ...formData, advancePaymentAmount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Performance Bond Value
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.performanceBondValue}
                  onChange={(e) => setFormData({ ...formData, performanceBondValue: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              {/* Schedule */}
              <div className="col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Schedule
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Completion Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.completionDate}
                  onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Original Duration (Days) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.originalDurationDays}
                  onChange={(e) => setFormData({ ...formData, originalDurationDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="365"
                />
              </div>

              {/* Additional Details */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Contract description and scope..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Key terms and conditions..."
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
                {isSubmitting ? 'Saving...' : initialData ? 'Update Contract' : 'Create Contract'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContractFormModal;
