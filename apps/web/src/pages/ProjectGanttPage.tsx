import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { WorkPackage, WorkPackageRelation, UpdateWorkPackageRequest } from '@protecht-bim/shared-types';
import { workPackageService } from '../services/workPackageService';
import { projectService } from '../services/projectService';
import { GanttView } from '../components/GanttView';

function ProjectGanttPage() {
  const { id } = useParams<{ id: string }>();
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [relations, setRelations] = useState<WorkPackageRelation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGanttData = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      // Use the new Gantt API endpoint from Task 7.2
      const ganttData = await projectService.getGanttData(id, {
        include_relations: true,
      });
      
      setWorkPackages(ganttData.work_packages);
      setRelations(ganttData.relations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Gantt data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGanttData();
  }, [id]);

  const handleTaskUpdate = async (taskId: string, updates: Partial<WorkPackage>) => {
    try {
      // Convert WorkPackage partial to UpdateWorkPackageRequest
      const updateRequest: Partial<UpdateWorkPackageRequest> = {};
      
      if (updates.start_date !== undefined && updates.start_date !== null) {
        updateRequest.start_date = updates.start_date;
      }
      if (updates.due_date !== undefined && updates.due_date !== null) {
        updateRequest.due_date = updates.due_date;
      }
      if (updates.progress_percent !== undefined) {
        updateRequest.progress_percent = updates.progress_percent;
      }
      
      await workPackageService.updateWorkPackage(taskId, updateRequest);
      // Reload data to get updated work packages
      await loadGanttData();
    } catch (err) {
      console.error('Failed to update work package:', err);
      throw err;
    }
  };

  const handleTaskClick = (taskId: string) => {
    // TODO: Open work package detail drawer
    console.log('Task clicked:', taskId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to={`/projects/${id}`}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              ← Back to Project
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Project Schedule
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Interactive Gantt chart showing project timeline and dependencies
          </p>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <GanttView
          workPackages={workPackages}
          relations={relations}
          projectId={id!}
          onTaskUpdate={handleTaskUpdate}
          onTaskClick={handleTaskClick}
        />
      </div>

      {/* Help Text */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
          How to use the Gantt chart:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Drag task bars to change start and end dates</li>
          <li>Drag the progress bar within a task to update completion percentage</li>
          <li>Double-click a task to view details</li>
          <li>Use the zoom controls to change the time scale (Hour to Year)</li>
          <li>Task colors indicate priority: Green (Low), Blue (Normal), Amber (High), Red (Urgent)</li>
          <li>Task borders indicate type: Yellow (Milestone), Purple (Phase), Cyan (Feature), Rose (Bug)</li>
          <li>Task opacity indicates status: Full opacity (In Progress), Faded (Completed/On Hold)</li>
          <li>Dependency lines show relationships between tasks</li>
        </ul>
      </div>
    </div>
  );
}

export default ProjectGanttPage;
