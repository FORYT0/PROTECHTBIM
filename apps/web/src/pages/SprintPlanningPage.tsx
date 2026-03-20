import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sprintService } from '../services/sprintService';
import { Sprint, WorkPackage, SprintStatus } from '@protecht-bim/shared-types';

/**
 * SprintPlanningPage - Detailed sprint planning interface
 * Shows sprint details, capacity, and assigned work packages
 */
export const SprintPlanningPage: React.FC = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const navigate = useNavigate();

  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [totalStoryPoints, setTotalStoryPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sprintId) {
      loadSprintData();
    }
  }, [sprintId]);

  const loadSprintData = async () => {
    if (!sprintId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await sprintService.getSprint(sprintId);
      setSprint(data.sprint);
      setWorkPackages(data.work_packages || []);
      setTotalStoryPoints(data.total_story_points || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load sprint data');
      console.error('Error loading sprint:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromSprint = async (workPackageIds: string[]) => {
    try {
      await sprintService.removeWorkPackagesFromSprint(workPackageIds);
      await loadSprintData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove work packages');
      console.error('Error removing work packages:', err);
    }
  };

  const getCapacityPercentage = () => {
    if (!sprint?.capacity) return 0;
    return Math.round((totalStoryPoints / sprint.capacity) * 100);
  };

  const getCapacityColor = () => {
    const percentage = getCapacityPercentage();
    if (percentage > 100) return 'text-red-600';
    if (percentage > 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading sprint...</div>
      </div>
    );
  }

  if (error || !sprint) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Sprint not found'}</p>
        <button
          onClick={loadSprintData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#000000] min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{sprint.name}</h1>
          {sprint.description && (
            <p className="text-gray-400 mt-1">{sprint.description}</p>
          )}
        </div>
        <button
          onClick={() => navigate(`/projects/${sprint.project_id}/backlog`)}
          className="px-4 py-2 text-gray-300 bg-[#0A0A0A] border border-gray-700 rounded-lg hover:bg-gray-800"
        >
          Back to Backlog
        </button>
      </div>

      {/* Sprint Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status */}
        <div className="bg-[#0A0A0A] rounded-lg shadow p-4">
          <div className="text-sm text-gray-400">Status</div>
          <div className="mt-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                sprint.status === SprintStatus.ACTIVE
                  ? 'bg-green-100 text-green-800'
                  : sprint.status === SprintStatus.COMPLETED
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {sprint.status}
            </span>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-[#0A0A0A] rounded-lg shadow p-4">
          <div className="text-sm text-gray-400">Duration</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {new Date(sprint.start_date).toLocaleDateString()} -{' '}
            {new Date(sprint.end_date).toLocaleDateString()}
          </div>
        </div>

        {/* Story Points */}
        <div className="bg-[#0A0A0A] rounded-lg shadow p-4">
          <div className="text-sm text-gray-400">Story Points</div>
          <div className="mt-2 text-2xl font-bold text-white">
            {totalStoryPoints}
            {sprint.capacity && (
              <span className="text-lg text-gray-500 ml-2">/ {sprint.capacity}</span>
            )}
          </div>
        </div>

        {/* Capacity */}
        {sprint.capacity && (
          <div className="bg-[#0A0A0A] rounded-lg shadow p-4">
            <div className="text-sm text-gray-400">Capacity</div>
            <div className={`mt-2 text-2xl font-bold ${getCapacityColor()}`}>
              {getCapacityPercentage()}%
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  getCapacityPercentage() > 100
                    ? 'bg-red-600'
                    : getCapacityPercentage() > 80
                    ? 'bg-yellow-600'
                    : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(getCapacityPercentage(), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Work Packages */}
      <div className="bg-[#0A0A0A] rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-white">
            Work Packages ({workPackages.length})
          </h2>
        </div>

        {workPackages.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>No work packages in this sprint</p>
            <p className="text-sm mt-2">
              Add work packages from the backlog to start planning
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {workPackages.map((wp) => (
              <div key={wp.id} className="px-6 py-4 hover:bg-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-white">{wp.subject}</h3>
                    {wp.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {wp.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">{wp.type}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">{wp.status}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        Priority: {wp.priority}
                      </span>
                      {wp.assignee_id && <span>Assigned to: {wp.assignee_id.substring(0, 8)}</span>}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-4">
                    {wp.story_points !== null && wp.story_points !== undefined && (
                      <div className="text-lg font-semibold text-blue-600">
                        {wp.story_points} SP
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveFromSprint([wp.id])}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Remove from sprint"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
