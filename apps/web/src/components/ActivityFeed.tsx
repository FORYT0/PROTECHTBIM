import React, { useState, useEffect } from 'react';
import ActivityService, {
  Activity,
  ActivityFilters,
  ActivityListResult,
} from '../services/ActivityService';
import { ActivityItem } from './ActivityItem';
import { notificationService } from '../services/NotificationService';
import { ActivityFilters as FilterComponent } from './ActivityFilters';
import './ActivityFeed.css';

interface ActivityFeedProps {
  projectId?: string;
  workPackageId?: string;
  userFeed?: boolean;
  title?: string;
  pageSize?: number;
}

type FeedType = 'project' | 'work-package' | 'user';

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  projectId,
  workPackageId,
  userFeed = false,
  title = 'Activity Feed',
  pageSize = 20,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<ActivityFilters>({
    page: 1,
    per_page: pageSize,
  });

  const service = new ActivityService();

  // Determine feed type based on props
  const feedType: FeedType = userFeed ? 'user' : workPackageId ? 'work-package' : 'project';

  useEffect(() => {
    loadActivities();

    if (feedType === 'project' && projectId) {
      notificationService.joinProject(projectId);

      const handleActivityCreated = (newActivity: Activity) => {
        setActivities(prev => [newActivity, ...prev]);
        setTotalItems(prev => prev + 1);
      };

      notificationService.on('activity:created', handleActivityCreated);

      return () => {
        notificationService.off('activity:created', handleActivityCreated);
        notificationService.leaveProject(projectId);
      };
    }

    // Explicit return for other feed types
    return () => { };
  }, [projectId, workPackageId, userFeed, filters]);

  const loadActivities = async () => {
    if (feedType === 'project' && !projectId) {
      setError('Project ID is required');
      return;
    }
    if (feedType === 'work-package' && !workPackageId) {
      setError('Work Package ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result: ActivityListResult;

      switch (feedType) {
        case 'project':
          result = await service.getProjectActivities(projectId!, filters);
          break;
        case 'work-package':
          result = await service.getWorkPackageActivities(workPackageId!, filters);
          break;
        case 'user':
          result = await service.getUserActivityFeed(filters);
          break;
      }

      setActivities(result.activities);
      setTotalItems(result.total);
      setCurrentPage(result.page);
    } catch (err: any) {
      setError(err.message || 'Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: ActivityFilters) => {
    setFilters({
      ...newFilters,
      page: 1,
      per_page: pageSize,
    });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setFilters({
        ...filters,
        page: currentPage - 1,
      });
    }
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (currentPage < totalPages) {
      setFilters({
        ...filters,
        page: currentPage + 1,
      });
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="activity-feed">
      <div className="feed-header">
        <h2 className="feed-title">{title}</h2>
        {totalItems > 0 && (
          <div className="feed-stats">
            <span className="stat-count">{totalItems} activities</span>
          </div>
        )}
      </div>

      <FilterComponent onFiltersChange={handleFiltersChange} isLoading={loading} />

      {error && <div className="error-banner">{error}</div>}

      {loading && activities.length === 0 && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading activities...</p>
        </div>
      )}

      {!loading && activities.length === 0 && !error && (
        <div className="empty-state">
          <svg
            className="empty-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>No activities found</p>
          <span className="empty-hint">Activities will appear here as changes are made</span>
        </div>
      )}

      {activities.length > 0 && (
        <>
          <div className="activities-list">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-pagination"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                title="Previous page"
              >
                ← Prev
              </button>

              <div className="pagination-info">
                <span className="current-page">{currentPage}</span>
                <span className="divider">/</span>
                <span className="total-pages">{totalPages}</span>
              </div>

              <button
                className="btn btn-pagination"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages || loading}
                title="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
