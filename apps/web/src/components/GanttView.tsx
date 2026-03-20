import React, { useState, useEffect } from 'react';
import { ViewMode, Task } from 'gantt-task-react';
import { GanttChart } from './GanttChart';
import { WorkPackage, WorkPackageRelation, BaselineListItem, BaselineWorkPackage } from '@protecht-bim/shared-types';

interface GanttViewProps {
  workPackages: WorkPackage[];
  relations?: WorkPackageRelation[];
  projectId: string;
  onTaskUpdate?: (taskId: string, updates: Partial<WorkPackage>) => Promise<void>;
  onTaskClick?: (taskId: string) => void;
}

/**
 * GanttView component with controls for zoom levels and view options
 * Provides a complete Gantt chart interface with toolbar
 */
export const GanttView: React.FC<GanttViewProps> = ({
  workPackages,
  relations = [],
  projectId,
  onTaskUpdate,
  onTaskClick,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
  const [isUpdating, setIsUpdating] = useState(false);
  const [baselines, setBaselines] = useState<BaselineListItem[]>([]);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('');
  const [baselineWorkPackages, setBaselineWorkPackages] = useState<BaselineWorkPackage[]>([]);
  const [isLoadingBaselines, setIsLoadingBaselines] = useState(false);

  // Load baselines for the project
  useEffect(() => {
    const loadBaselines = async () => {
      setIsLoadingBaselines(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/v1/projects/${projectId}/baselines`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBaselines(data.baselines || []);
        }
      } catch (error) {
        console.error('Failed to load baselines:', error);
      } finally {
        setIsLoadingBaselines(false);
      }
    };

    if (projectId) {
      loadBaselines();
    }
  }, [projectId]);

  // Load baseline work packages when a baseline is selected
  useEffect(() => {
    const loadBaselineWorkPackages = async () => {
      if (!selectedBaselineId) {
        setBaselineWorkPackages([]);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/v1/baselines/${selectedBaselineId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBaselineWorkPackages(data.baseline.work_packages || []);
        }
      } catch (error) {
        console.error('Failed to load baseline work packages:', error);
        setBaselineWorkPackages([]);
      }
    };

    loadBaselineWorkPackages();
  }, [selectedBaselineId]);

  // Handle task date changes from drag-and-drop
  const handleTaskChange = async (task: Task) => {
    if (!onTaskUpdate) return;

    setIsUpdating(true);
    try {
      await onTaskUpdate(task.id, {
        start_date: task.start,
        due_date: task.end,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      // TODO: Show error notification
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle progress changes
  const handleProgressChange = async (task: Task) => {
    if (!onTaskUpdate) return;

    setIsUpdating(true);
    try {
      await onTaskUpdate(task.id, {
        progress_percent: task.progress,
      });
    } catch (error) {
      console.error('Failed to update task progress:', error);
      // TODO: Show error notification
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle double-click to open task details
  const handleDoubleClick = (task: Task) => {
    if (onTaskClick) {
      onTaskClick(task.id);
    }
  };

  return (
    <div className="gantt-view">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Gantt Chart</h2>

          {/* Baseline Selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="baseline-select" className="text-sm text-gray-600">
              Compare to Baseline:
            </label>
            <select
              id="baseline-select"
              value={selectedBaselineId}
              onChange={(e) => setSelectedBaselineId(e.target.value)}
              disabled={isLoadingBaselines}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {baselines.map((baseline) => (
                <option key={baseline.id} value={baseline.id}>
                  {baseline.name} ({new Date(baseline.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-2">Zoom:</span>
            <button
              onClick={() => setViewMode(ViewMode.Hour)}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === ViewMode.Hour
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hour
            </button>
            <button
              onClick={() => setViewMode(ViewMode.QuarterDay)}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === ViewMode.QuarterDay
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quarter Day
            </button>
            <button
              onClick={() => setViewMode(ViewMode.HalfDay)}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === ViewMode.HalfDay
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Half Day
            </button>
            <button
              onClick={() => setViewMode(ViewMode.Day)}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === ViewMode.Day
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode(ViewMode.Week)}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === ViewMode.Week
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode(ViewMode.Month)}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === ViewMode.Month
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode(ViewMode.Year)}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === ViewMode.Year
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 space-y-2">
          {/* Priority Legend */}
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600 font-medium">Priority:</span>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-700">Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-700">Normal</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-gray-700">High</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-700">Urgent</span>
            </div>
          </div>

          {/* Type Legend */}
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600 font-medium">Type:</span>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-700">Task</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded border-2 border-yellow-400"></div>
              <span className="text-gray-700">Milestone</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded border-2 border-purple-500"></div>
              <span className="text-gray-700">Phase</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded border-2 border-cyan-500"></div>
              <span className="text-gray-700">Feature</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded border-2 border-rose-500"></div>
              <span className="text-gray-700">Bug</span>
            </div>
          </div>

          {/* Status Legend */}
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600 font-medium">Status:</span>
            <span className="text-gray-700">Opacity indicates status (Full=In Progress, Faded=Completed/On Hold)</span>
          </div>

          {/* Baseline Legend */}
          {selectedBaselineId && (
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-600 font-medium">Baseline:</span>
              <div className="flex items-center space-x-1">
                <div className="w-8 h-4 bg-gray-300 rounded border-2 border-dashed border-gray-500"></div>
                <span className="text-gray-700">Baseline dates</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span className="text-gray-700">Has variance (amber color)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-gray-600">Updating...</div>
        </div>
      )}

      {/* Gantt Chart */}
      <div className="px-4">
        <GanttChart
          workPackages={workPackages}
          relations={relations}
          baselineWorkPackages={baselineWorkPackages}
          viewMode={viewMode}
          onTaskChange={handleTaskChange}
          onProgressChange={handleProgressChange}
          onDoubleClick={handleDoubleClick}
        />
      </div>
    </div>
  );
};
