import { useState, FormEvent, useEffect } from 'react';
import { WorkPackageType, Project, WorkPackage } from '@protecht-bim/shared-types';
import { projectService } from '../services/projectService';

interface WorkPackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  projectId?: string;
  workPackage?: WorkPackage; // Optional work package to edit
}

interface FormState {
  project_id: string;
  type: WorkPackageType;
  subject: string;
  description: string;
  start_date?: Date;
  due_date?: Date;
  estimated_hours?: number;
}

function WorkPackageFormModal({ isOpen, onClose, onSubmit, projectId, workPackage }: WorkPackageFormModalProps) {
  const [formData, setFormData] = useState<FormState>({
    project_id: projectId || '',
    type: WorkPackageType.TASK,
    subject: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Load projects if no projectId is provided
  useEffect(() => {
    if (isOpen && !projectId && !workPackage) {
      loadProjects();
    }
  }, [isOpen, projectId, workPackage]);

  // Sync formData with workPackage when editing
  useEffect(() => {
    if (isOpen && workPackage) {
      setFormData({
        project_id: workPackage.project_id,
        type: workPackage.type,
        subject: workPackage.subject,
        description: workPackage.description || '',
        start_date: workPackage.start_date || undefined,
        due_date: workPackage.due_date || undefined,
        estimated_hours: workPackage.estimated_hours || undefined,
      });
    } else if (isOpen && !workPackage) {
      setFormData({
        project_id: projectId || (projects.length > 0 ? projects[0].id : ''),
        type: WorkPackageType.TASK,
        subject: '',
        description: '',
      });
    }
  }, [isOpen, workPackage, projectId, projects.length]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await projectService.listProjects({ per_page: 100 });
      setProjects(response.projects);

      // Auto-select first project if available
      if (response.projects.length > 0 && !formData.project_id) {
        setFormData(prev => ({ ...prev, project_id: response.projects[0].id }));
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('Form submitted with data:', formData);

    // Validate project_id
    if (!formData.project_id && !workPackage) {
      setError('Please select a project');
      console.error('Validation failed: No project selected');
      return;
    }

    // Validate subject
    if (!formData.subject || formData.subject.trim() === '') {
      setError('Please enter a subject');
      console.error('Validation failed: No subject provided');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Calling onSubmit with data:', formData);
      await onSubmit(formData);
      console.log(workPackage ? 'Work package updated successfully' : 'Work package created successfully');
      onClose();
      // Reset form
      setFormData({
        project_id: projectId || (projects.length > 0 ? projects[0].id : ''),
        type: WorkPackageType.TASK,
        subject: '',
        description: '',
      });
      setError(null);
    } catch (err) {
      console.error('Error creating work package:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create work package';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity duration-200"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl card elevation-5 animate-fade-in">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
              <div className="w-1 h-8 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full mr-3"></div>
              {workPackage ? 'Edit Work Package' : 'Create Work Package'}
            </h2>
            <button
              onClick={onClose}
              className="text-hint hover:text-white p-2 -mr-2 rounded-lg hover:bg-surface-light transition-all duration-200"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-error-500/10 border border-error-500/20 p-4">
              <p className="text-sm text-error-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project Selector (only show if no projectId prop) */}
            {!projectId && (
              <div>
                <label htmlFor="project_id" className="block text-sm font-medium text-secondary mb-2">
                  Project *
                </label>
                {loadingProjects ? (
                  <div className="input-material flex items-center justify-center py-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mr-2"></div>
                    <span className="text-sm text-text-secondary">Loading projects...</span>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="rounded-lg bg-warning-main/10 border border-warning-main/20 p-3">
                    <p className="text-sm text-warning-main">
                      No projects available. Please create a project first.
                    </p>
                  </div>
                ) : (
                  <select
                    id="project_id"
                    required
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="input-material"
                    disabled={!!workPackage}
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-secondary mb-2">
                Type *
              </label>
              <select
                id="type"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkPackageType })}
                className="input-material"
                disabled={!!workPackage}
              >
                {Object.values(WorkPackageType).map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-secondary mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="input-material"
                placeholder="Enter work package subject"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-secondary mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-material resize-none"
                placeholder="Enter work package description"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-secondary mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  value={formData.start_date ? new Date(formData.start_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value) : undefined })}
                  className="input-material"
                />
              </div>
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-secondary mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  id="due_date"
                  value={formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value ? new Date(e.target.value) : undefined })}
                  className="input-material"
                />
              </div>
            </div>

            {/* Estimated Hours */}
            <div>
              <label htmlFor="estimated_hours" className="block text-sm font-medium text-secondary mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                id="estimated_hours"
                min="0"
                step="0.5"
                value={formData.estimated_hours || ''}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="input-material"
                placeholder="0.0"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-surface-light">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || loadingProjects}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loadingProjects || (projects.length === 0 && !projectId)}
                className="btn-primary w-full sm:w-auto"
                onClick={() => console.log('Submit button clicked')}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {workPackage ? 'Saving...' : 'Creating...'}
                  </span>
                ) : loadingProjects ? (
                  'Loading...'
                ) : (
                  workPackage ? 'Save Changes' : 'Create Work Package'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default WorkPackageFormModal;
