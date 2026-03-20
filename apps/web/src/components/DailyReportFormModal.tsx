import { useState, useEffect } from 'react';
import { X, Clipboard, Cloud, Users, Wrench, AlertTriangle } from 'lucide-react';
import { projectService } from '../services/projectService';

interface DailyReportFormData {
  projectId: string;
  reportDate: string;
  weather?: string;
  temperature?: number;
  manpowerCount: number;
  equipmentCount: number;
  workCompleted?: string;
  workPlannedTomorrow?: string;
  delays?: string;
  safetyIncidents?: string;
  siteNotes?: string;
  visitorsOnSite?: string;
  materialsDelivered?: string;
}

interface DailyReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DailyReportFormData) => Promise<void>;
  projectId?: string;
  initialData?: Partial<DailyReportFormData>;
}

function DailyReportFormModal({ isOpen, onClose, onSubmit, projectId, initialData }: DailyReportFormModalProps) {
  const [formData, setFormData] = useState<DailyReportFormData>({
    projectId: projectId || '',
    reportDate: new Date().toISOString().split('T')[0],
    weather: '',
    temperature: undefined,
    manpowerCount: 0,
    equipmentCount: 0,
    workCompleted: '',
    workPlannedTomorrow: '',
    delays: '',
    safetyIncidents: '',
    siteNotes: '',
    visitorsOnSite: '',
    materialsDelivered: '',
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
        ...formData,
        manpowerCount: formData.manpowerCount || 0,
        equipmentCount: formData.equipmentCount || 0,
      };
      await onSubmit(submitData);
      onClose();
      // Reset form
      setFormData({
        projectId: projectId || '',
        reportDate: new Date().toISOString().split('T')[0],
        weather: '',
        temperature: undefined,
        manpowerCount: 0,
        equipmentCount: 0,
        workCompleted: '',
        workPlannedTomorrow: '',
        delays: '',
        safetyIncidents: '',
        siteNotes: '',
        visitorsOnSite: '',
        materialsDelivered: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save daily report');
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
                <Clipboard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {initialData ? 'Edit Daily Report' : 'New Daily Report'}
                </h2>
                <p className="text-sm text-gray-400">Document daily site activities and progress</p>
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
              {/* Project Selection */}
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

              {/* Date & Weather */}
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  Date & Weather
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Report Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.reportDate}
                  onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Weather Conditions
                </label>
                <select
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Select weather</option>
                  <option value="Clear">Clear</option>
                  <option value="Partly Cloudy">Partly Cloudy</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Rain">Rain</option>
                  <option value="Heavy Rain">Heavy Rain</option>
                  <option value="Windy">Windy</option>
                  <option value="Hot">Hot</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature ?? ''}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., 28.5"
                />
              </div>

              {/* Resources */}
              <div className="col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  Resources On Site
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Manpower Count *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.manpowerCount}
                  onChange={(e) => setFormData({ ...formData, manpowerCount: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Equipment Count *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.equipmentCount}
                  onChange={(e) => setFormData({ ...formData, equipmentCount: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0"
                />
              </div>

              {/* Work Progress */}
              <div className="col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-400" />
                  Work Progress
                </h3>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Work Completed Today
                </label>
                <textarea
                  rows={3}
                  value={formData.workCompleted}
                  onChange={(e) => setFormData({ ...formData, workCompleted: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Describe work completed today..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Work Planned for Tomorrow
                </label>
                <textarea
                  rows={3}
                  value={formData.workPlannedTomorrow}
                  onChange={(e) => setFormData({ ...formData, workPlannedTomorrow: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Describe planned work for tomorrow..."
                />
              </div>

              {/* Issues & Safety */}
              <div className="col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Issues & Safety
                </h3>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Delays or Issues
                </label>
                <textarea
                  rows={2}
                  value={formData.delays}
                  onChange={(e) => setFormData({ ...formData, delays: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Any delays or issues encountered..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Safety Incidents
                </label>
                <textarea
                  rows={2}
                  value={formData.safetyIncidents}
                  onChange={(e) => setFormData({ ...formData, safetyIncidents: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Any safety incidents or near misses..."
                />
              </div>

              {/* Additional Information */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Visitors On Site
                </label>
                <input
                  type="text"
                  value={formData.visitorsOnSite}
                  onChange={(e) => setFormData({ ...formData, visitorsOnSite: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="List any visitors or inspectors..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Materials Delivered
                </label>
                <textarea
                  rows={2}
                  value={formData.materialsDelivered}
                  onChange={(e) => setFormData({ ...formData, materialsDelivered: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="List materials delivered today..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Site Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.siteNotes}
                  onChange={(e) => setFormData({ ...formData, siteNotes: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Any additional notes or observations..."
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
                {isSubmitting ? 'Saving...' : initialData ? 'Update Report' : 'Create Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DailyReportFormModal;
