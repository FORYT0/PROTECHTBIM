import React, { useState, useEffect } from 'react';
import ActivityService, {
  ActivityActionType,
  ActivityEntityType,
  ActivityFilters as IActivityFilters,
} from '../services/ActivityService';
import './ActivityFilters.css';

interface ActivityFiltersProps {
  onFiltersChange: (filters: IActivityFilters) => void;
  isLoading?: boolean;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  onFiltersChange,
  isLoading = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [actionTypes, setActionTypes] = useState<ActivityActionType[]>([]);
  const [entityTypes, setEntityTypes] = useState<ActivityEntityType[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActivityActionType | ''>('');
  const [selectedEntity, setSelectedEntity] = useState<ActivityEntityType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterCount, setFilterCount] = useState(0);

  const service = new ActivityService();

  useEffect(() => {
    loadAvailableFilters();
  }, []);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (selectedAction) count++;
    if (selectedEntity) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    setFilterCount(count);
  }, [selectedAction, selectedEntity, dateFrom, dateTo]);

  const loadAvailableFilters = async () => {
    try {
      const filters = await service.getAvailableFilters();
      setActionTypes(filters.action_types);
      setEntityTypes(filters.entity_types);
    } catch (error) {
      console.error('Failed to load available filters:', error);
    }
  };

  const handleApplyFilters = () => {
    const filters: IActivityFilters = {
      action_type: selectedAction || undefined,
      entity_type: selectedEntity || undefined,
      date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
      page: 1, // Reset to first page when filters change
      per_page: 20,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof IActivityFilters] === undefined) {
        delete filters[key as keyof IActivityFilters];
      }
    });

    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    setSelectedAction('');
    setSelectedEntity('');
    setDateFrom('');
    setDateTo('');
    onFiltersChange({
      page: 1,
      per_page: 20,
    });
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAction((e.target.value as ActivityActionType) || '');
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEntity((e.target.value as ActivityEntityType) || '');
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(e.target.value);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(e.target.value);
  };

  return (
    <div className="activity-filters">
      <div className="filters-header">
        <button
          className="filters-toggle"
          onClick={() => setShowFilters(!showFilters)}
          disabled={isLoading}
        >
          <svg
            className="filters-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span>Filters</span>
          {filterCount > 0 && <span className="filter-badge">{filterCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label htmlFor="action-filter">Action Type</label>
            <select
              id="action-filter"
              value={selectedAction}
              onChange={handleActionChange}
              disabled={isLoading}
              className="filter-select"
            >
              <option value="">All Actions</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="entity-filter">Entity Type</label>
            <select
              id="entity-filter"
              value={selectedEntity}
              onChange={handleEntityChange}
              disabled={isLoading}
              className="filter-select"
            >
              <option value="">All Entities</option>
              {entityTypes.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="date-from">From</label>
            <input
              type="date"
              id="date-from"
              value={dateFrom}
              onChange={handleDateFromChange}
              disabled={isLoading}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="date-to">To</label>
            <input
              type="date"
              id="date-to"
              value={dateTo}
              onChange={handleDateToChange}
              disabled={isLoading}
              className="filter-input"
            />
          </div>

          <div className="filter-actions">
            <button
              className="btn btn-primary"
              onClick={handleApplyFilters}
              disabled={isLoading}
            >
              Apply Filters
            </button>
            {filterCount > 0 && (
              <button
                className="btn btn-secondary"
                onClick={handleClearFilters}
                disabled={isLoading}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
