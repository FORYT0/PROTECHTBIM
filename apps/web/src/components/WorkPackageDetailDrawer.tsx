import { useState } from 'react';
import { WorkPackage, WorkPackageType, Priority } from '@protecht-bim/shared-types';
import WorkPackageFormModal from './WorkPackageFormModal';
import { workPackageService } from '../services/workPackageService';
import { CommentSection } from './CommentSection';
import AttachmentSection from './AttachmentSection';

interface WorkPackageDetailDrawerProps {
  workPackage: WorkPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Call this when updated to refresh the list
}

function WorkPackageDetailDrawer({ workPackage, isOpen, onClose, onUpdate }: WorkPackageDetailDrawerProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!isOpen || !workPackage) return null;

  const getTypeColor = (type: WorkPackageType) => {
    const colors = {
      [WorkPackageType.TASK]: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
      [WorkPackageType.MILESTONE]: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      [WorkPackageType.PHASE]: 'bg-success-500/20 text-success-400 border border-success-500/30',
      [WorkPackageType.FEATURE]: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
      [WorkPackageType.BUG]: 'bg-error-500/20 text-error-400 border border-error-500/30',
    };
    return colors[type] || 'bg-surface-light text-secondary border border-surface-light';
  };

  const getPriorityColor = (priority: Priority) => {
    const colors = {
      [Priority.LOW]: 'bg-surface-light text-secondary border border-surface-light',
      [Priority.NORMAL]: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
      [Priority.HIGH]: 'bg-warning-500/20 text-warning-400 border border-warning-500/30',
      [Priority.URGENT]: 'bg-error-500/20 text-error-400 border border-error-500/30',
    };
    return colors[priority] || 'bg-surface-light text-secondary border border-surface-light';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-75 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md md:max-w-2xl overflow-y-auto bg-surface shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-surface-light bg-surface/95 backdrop-blur-sm px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex rounded-lg px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold ${getTypeColor(workPackage.type)}`}>
                {workPackage.type}
              </span>
              <span className="text-xs sm:text-sm text-hint">
                #{workPackage.id.slice(0, 8)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-hint hover:text-white p-2 -mr-2 rounded-lg hover:bg-surface-light transition-all duration-200"
              aria-label="Close drawer"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-6">
          {/* Subject */}
          <h2 className="mb-6 text-xl sm:text-2xl font-bold text-white">
            {workPackage.subject}
          </h2>

          {/* Details Grid */}
          <div className="space-y-6">
            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-hint mb-2">
                  Status
                </label>
                <p className="text-sm sm:text-base text-white">
                  {workPackage.status}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-hint mb-2">
                  Priority
                </label>
                <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getPriorityColor(workPackage.priority)}`}>
                  {workPackage.priority}
                </span>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-hint mb-2">
                  Start Date
                </label>
                <p className="text-sm sm:text-base text-white">
                  {formatDate(workPackage.start_date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-hint mb-2">
                  Due Date
                </label>
                <p className="text-sm sm:text-base text-white">
                  {formatDate(workPackage.due_date)}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <label className="block text-sm font-medium text-hint mb-3">
                Progress
              </label>
              <div className="flex items-center">
                <div className="mr-3 h-3 flex-1 rounded-full bg-surface-light overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                    style={{ width: `${workPackage.progress_percent}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-white">
                  {workPackage.progress_percent}%
                </span>
              </div>
            </div>

            {/* Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-hint mb-2">
                  Estimated Hours
                </label>
                <p className="text-sm sm:text-base text-white">
                  {workPackage.estimated_hours ? `${workPackage.estimated_hours}h` : 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-hint mb-2">
                  Spent Hours
                </label>
                <p className="text-sm sm:text-base text-white">
                  {workPackage.spent_hours}h
                </p>
              </div>
            </div>

            {/* Description */}
            {workPackage.description && (
              <div>
                <label className="block text-sm font-medium text-hint mb-3">
                  Description
                </label>
                <p className="whitespace-pre-wrap text-sm sm:text-base text-secondary leading-relaxed">
                  {workPackage.description}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-surface-light pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs text-hint">
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(workPackage.created_at).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{' '}
                  {new Date(workPackage.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <AttachmentSection entityType="WorkPackage" entityId={workPackage.id} />

          {/* Comments Section */}
          <CommentSection entityType="WorkPackage" entityId={workPackage.id} />
        </div>
      </div>

      <WorkPackageFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        workPackage={workPackage}
        onSubmit={async (data) => {
          await workPackageService.updateWorkPackage(workPackage.id, data);
          onUpdate();
          setIsEditModalOpen(false);
        }}
      />
    </>
  );
}

export default WorkPackageDetailDrawer;
