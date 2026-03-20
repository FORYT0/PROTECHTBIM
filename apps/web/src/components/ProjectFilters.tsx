import { ProjectStatus } from '@protecht-bim/shared-types';

interface ProjectFiltersProps {
  filters: {
    status: ProjectStatus[];
    favorites_only: boolean;
    search: string;
  };
  onFilterChange: (filters: Partial<ProjectFiltersProps['filters']>) => void;
}

const statusOptions = [
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
  { value: ProjectStatus.ARCHIVED, label: 'Archived' },
];

function ProjectFilters({ filters, onFilterChange }: ProjectFiltersProps) {
  const handleStatusToggle = (status: ProjectStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFilterChange({ status: newStatus });
  };

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">
          Status
        </label>
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <label key={option.value} className="flex items-center group cursor-pointer">
              <input
                type="checkbox"
                checked={filters.status.includes(option.value)}
                onChange={() => handleStatusToggle(option.value)}
                className="h-4 w-4 rounded border-gray-700 bg-[#0A0A0A] text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200"
              />
              <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors duration-200">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Favorites Filter */}
      <div className="pt-2 border-t border-gray-800">
        <label className="flex items-center group cursor-pointer">
          <input
            type="checkbox"
            checked={filters.favorites_only}
            onChange={(e) => onFilterChange({ favorites_only: e.target.checked })}
            className="h-4 w-4 rounded border-gray-700 bg-[#0A0A0A] text-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200"
          />
          <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors duration-200 flex items-center">
            <svg className="h-4 w-4 mr-1.5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Favorites only
          </span>
        </label>
      </div>

      {/* Clear Filters */}
      {(filters.status.length > 0 || filters.favorites_only) && (
        <button
          onClick={() => onFilterChange({ status: [], favorites_only: false, search: '' })}
          className="w-full px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

export default ProjectFilters;
