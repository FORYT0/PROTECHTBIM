import { Project, ProjectStatus, LifecyclePhase } from '@protecht-bim/shared-types';

interface ProjectCardProps {
  project: Project;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

const statusConfig: Record<ProjectStatus, { bg: string; text: string; border: string; icon: string }> = {
  [ProjectStatus.ACTIVE]: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  [ProjectStatus.ON_HOLD]: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    icon: 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  [ProjectStatus.COMPLETED]: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  [ProjectStatus.ARCHIVED]: {
    bg: 'bg-gray-500/20',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
  },
};

const phaseLabels: Record<LifecyclePhase, string> = {
  [LifecyclePhase.INITIATION]: 'Initiation',
  [LifecyclePhase.PLANNING]: 'Planning',
  [LifecyclePhase.EXECUTION]: 'Execution',
  [LifecyclePhase.MONITORING]: 'Monitoring',
  [LifecyclePhase.CLOSURE]: 'Closure',
};

const defaultStatusConfig = {
  bg: 'bg-gray-500/20',
  text: 'text-gray-400',
  border: 'border-gray-500/30',
  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
};

const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]: 'Active',
  [ProjectStatus.ON_HOLD]: 'On Hold',
  [ProjectStatus.COMPLETED]: 'Completed',
  [ProjectStatus.ARCHIVED]: 'Archived',
};

function ProjectCard({ project, onToggleFavorite }: ProjectCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const status = project.status?.toLowerCase() as ProjectStatus;
  const config = statusConfig[status] || defaultStatusConfig;
  const phase = project.lifecycle_phase?.toLowerCase() as LifecyclePhase;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the favorite button
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    window.location.href = `/projects/${project.id}`;
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 hover:border-gray-700 hover:bg-[#111111] transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0 border ${config.border}`}>
              <svg className={`w-6 h-6 ${config.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                  {project.name}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(project.id, !project.is_favorite);
                  }}
                  className={`flex-shrink-0 transition-all duration-200 z-10 ${project.is_favorite
                    ? 'text-yellow-400 hover:text-yellow-300'
                    : 'text-gray-600 hover:text-yellow-400'
                    }`}
                  aria-label={project.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg
                    className="h-5 w-5"
                    fill={project.is_favorite ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              </div>

              {project.description && (
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
              </svg>
              <span>{statusLabels[status] || project.status}</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-400 border border-purple-500/30">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{phaseLabels[phase] || project.lifecycle_phase}</span>
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Start Date</div>
                <div className="text-sm font-medium text-white truncate">{formatDate(project.start_date)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="min-w-0">
                <div className="text-xs text-gray-500">End Date</div>
                <div className="text-sm font-medium text-white truncate">{formatDate(project.end_date)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Indicator */}
        <div className="ml-4 flex-shrink-0 p-2 rounded-lg text-gray-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div >
  );
}

export default ProjectCard;
