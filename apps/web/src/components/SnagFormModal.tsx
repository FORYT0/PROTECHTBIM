import { useState, useEffect } from 'react';
import { X, AlertCircle, MapPin, DollarSign, User, Calendar } from 'lucide-react';
import { projectService } from '../services/projectService';

interface SnagFormData {
  projectId: string;
  workPackageId?: string;
  location: string;
  description: string;
  severity: string;
  category: string;
  assignedTo?: string;
  dueDate?: string;
  costImpact: number;
}

interface SnagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SnagFormData) => Promise<void>;
  projectId?: string;
  initialData?: Partial<SnagFormData>;
}

function SnagFormModal({ isOpen, onClose, onSubmit, projectId, initialData }: SnagFormModalProps) {
  const [formData, setFormData] = useState<SnagFormData>({
    projectId: projectId || '',
    workPackageId: '',
    location: '',
    description: '',
    severity: 'Minor',
    category: 'Defect',
    assignedTo: '',
    dueDate: '',
    costImpact: 0,
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
      // Transform data to match backend API expectations
      const submitData = {
        projectId: formData.projectId,
        workPackageId: formData.workPackageId || undefined,
        location: formData.location,
        description: formData.description,
        severity: formData.severity,
        category: formData.category,
        assignedTo: formData.assignedTo || undefined,
        dueDate: formData.dueDate || undefined,
        costImpact: formData.costImpact || 0,
      };
      await onSubmit(submitData);
      onClose();
      // Reset form
      setFormData({
        projectId: projectId || '',
        workPackageId: '',
        location: '',
        description: '',
        severity: 'Minor',
        category: 'Defect',
        assignedTo: '',
        dueDate: '',
        costImpact: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save snag');
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
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {initialData ? 'Edit Snag' : 'New Snag'}
                </h2>
                <p className="text-sm text-gray-400">Report defect or punch list item</p>
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
              {/* Project Selection */}
              <div>
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

              {/* Location & Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g., Level 3, Grid A-5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    Severity *
                  </label>
                  <select
                    required
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Description */}
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
                  placeholder="Detailed description of the defect or issue..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Defect">Defect</option>
                  <option value="Incomplete">Incomplete</option>
                  <option value="Damage">Damage</option>
                  <option value="Non-Compliance">Non-Compliance</option>
                </select>
              </div>

              {/* Assignment & Due Date */}
              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-green-400" />
                  Assignment
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="User ID or name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Cost Impact */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  Estimated Cost Impact
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costImpact}
                  onChange={(e) => setFormData({ ...formData, costImpact: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Estimated cost to rectify this defect</p>
              </div>

              {/* Work Package Link */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Link to Work Package (Optional)
                </label>
                <input
                  type="text"
                  value={formData.workPackageId}
                  onChange={(e) => setFormData({ ...formData, workPackageId: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Work package ID"
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
                {isSubmitting ? 'Saving...' : initialData ? 'Update Snag' : 'Create Snag'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SnagFormModal;
