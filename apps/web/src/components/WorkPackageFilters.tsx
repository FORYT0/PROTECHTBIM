import { useState } from 'react';
import { WorkPackageType, Priority } from '@protecht-bim/shared-types';

export interface WorkPackageFilterValues {
  search: string;
  type: WorkPackageType[];
  status: string[];
  priority: Priority[];
  assignee_id: string;
}

interface WorkPackageFiltersProps {
  filters: WorkPackageFilterValues;
  onFilterChange: (filters: WorkPackageFilterValues) => void;
  onReset: () => void;
}

function WorkPackageFilters({ filters, onFilterChange, onReset }: WorkPackageFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filters, search });
  };

  const handleTypeToggle = (type: WorkPackageType) => {
    const newTypes = filters.type.includes(type)
      ? filters.type.filter((t) => t !== type)
      : [...filters.type, type];
    onFilterChange({ ...filters, type: newTypes });
  };

  const handlePriorityToggle = (priority: Priority) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    onFilterChange({ ...filters, priority: newPriorities });
  };

  const handleStatusChange = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFilterChange({ ...filters, status: newStatuses });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.type.length > 0 || 
    filters.status.length > 0 || 
    filters.priority.length > 0 ||
    filters.assignee_id;

  return (
    <div className="card">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search work packages..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-material pl-10"
          />
          <svg
            className="absolute left-3 top-3 h-5 w-5 text-hint"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm font-medium text-primary hover:text-white transition-colors duration-200"
        >
          <svg
            className={`mr-2 h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="ml-2 rounded-full bg-primary-500/20 px-2.5 py-0.5 text-xs text-primary-400 border border-primary-500/30">
              Active
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-accent-500 hover:text-accent-400 transition-colors duration-200"
          >
            Reset
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-surface-light pt-4">
          {/* Type Filter */}
          <div>
            <label className="mb-3 block text-sm font-medium text-secondary">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(WorkPackageType).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    filters.type.includes(type)
                      ? 'bg-primary-500 text-white elevation-2 scale-105'
                      : 'bg-surface-light text-primary hover:bg-surface hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-3 block text-sm font-medium text-secondary">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {['new', 'in_progress', 'resolved', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    filters.status.includes(status)
                      ? 'bg-success-500 text-white elevation-2 scale-105'
                      : 'bg-surface-light text-primary hover:bg-surface hover:text-white'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="mb-3 block text-sm font-medium text-secondary">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(Priority).map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityToggle(priority)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    filters.priority.includes(priority)
                      ? 'bg-accent-500 text-white elevation-2 scale-105'
                      : 'bg-surface-light text-primary hover:bg-surface hover:text-white'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkPackageFilters;
