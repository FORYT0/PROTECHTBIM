import React, { useMemo } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import './GanttChart.css';
import { WorkPackage, WorkPackageRelation, BaselineWorkPackage } from '@protecht-bim/shared-types';

interface GanttChartProps {
  workPackages: WorkPackage[];
  relations?: WorkPackageRelation[];
  baselineWorkPackages?: BaselineWorkPackage[];
  onTaskChange?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onProgressChange?: (task: Task) => void;
  onDoubleClick?: (task: Task) => void;
  viewMode?: ViewMode;
}

/**
 * GanttChart component wrapper for gantt-task-react library
 * Converts work packages to Gantt tasks and handles interactions
 */
export const GanttChart: React.FC<GanttChartProps> = ({
  workPackages,
  relations = [],
  baselineWorkPackages = [],
  onTaskChange,
  onTaskDelete,
  onProgressChange,
  onDoubleClick,
  viewMode = ViewMode.Day,
}) => {
  // Create a map of baseline work packages for quick lookup
  const baselineMap = useMemo(() => {
    const map = new Map<string, BaselineWorkPackage>();
    baselineWorkPackages.forEach((bwp) => {
      map.set(bwp.work_package_id, bwp);
    });
    return map;
  }, [baselineWorkPackages]);

  // Convert work packages to Gantt tasks
  const tasks: Task[] = useMemo(() => {
    const taskList: Task[] = [];

    workPackages
      .filter((wp) => wp.start_date && wp.due_date)
      .forEach((wp) => {
        const startDate = new Date(wp.start_date!);
        const endDate = new Date(wp.due_date!);

        // Determine task type based on work package type
        let type: 'task' | 'milestone' | 'project' = 'task';
        if (wp.type === 'milestone') {
          type = 'milestone';
        } else if (wp.type === 'phase') {
          type = 'project';
        }

        // Find dependencies from relations
        const dependencies = relations
          .filter(
            (rel) =>
              rel.to_id === wp.id &&
              (rel.relation_type === 'predecessor' || rel.relation_type === 'successor')
          )
          .map((rel) => rel.from_id);

        // Check if there's a baseline for this work package
        const baseline = baselineMap.get(wp.id);
        const hasVariance = baseline && 
          (baseline.start_date || baseline.due_date) &&
          (new Date(baseline.start_date || 0).getTime() !== startDate.getTime() ||
           new Date(baseline.due_date || 0).getTime() !== endDate.getTime());

        // Add the main task
        taskList.push({
          id: wp.id,
          name: wp.subject,
          start: startDate,
          end: endDate,
          progress: wp.progress_percent,
          type,
          dependencies,
          project: wp.project_id,
          styles: getTaskStyles(wp, hasVariance),
        });

        // Add baseline task if it exists and has dates
        if (baseline && baseline.start_date && baseline.due_date) {
          const baselineStart = new Date(baseline.start_date);
          const baselineEnd = new Date(baseline.due_date);

          taskList.push({
            id: `${wp.id}-baseline`,
            name: `${wp.subject} (Baseline)`,
            start: baselineStart,
            end: baselineEnd,
            progress: 0,
            type: 'task',
            dependencies: [],
            project: wp.project_id,
            styles: {
              backgroundColor: '#d1d5db', // gray-300
              backgroundSelectedColor: '#9ca3af', // gray-400
              progressColor: 'transparent',
              progressSelectedColor: 'transparent',
            },
            isDisabled: true, // Make baseline tasks non-interactive
          });
        }
      });

    return taskList;
  }, [workPackages, relations, baselineMap]);

  // Handle task date/duration changes from drag-and-drop
  const handleTaskChange = (task: Task) => {
    if (onTaskChange) {
      onTaskChange(task);
    }
  };

  // Handle task deletion
  const handleTaskDelete = (task: Task) => {
    if (onTaskDelete) {
      onTaskDelete(task);
    }
  };

  // Handle progress changes
  const handleProgressChange = (task: Task) => {
    if (onProgressChange) {
      onProgressChange(task);
    }
  };

  // Handle double-click to open task details
  const handleDoubleClick = (task: Task) => {
    if (onDoubleClick) {
      onDoubleClick(task);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No tasks with dates to display</p>
          <p className="text-gray-400 text-sm">
            Add start and due dates to work packages to see them in the Gantt chart
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gantt-container">
      <Gantt
        tasks={tasks}
        viewMode={viewMode}
        onDateChange={handleTaskChange}
        onDelete={handleTaskDelete}
        onProgressChange={handleProgressChange}
        onDoubleClick={handleDoubleClick}
        listCellWidth="200px"
        columnWidth={60}
      />
    </div>
  );
};

/**
 * Get custom styles for tasks based on work package properties
 * Combines priority, status, and type for comprehensive visual feedback
 */
function getTaskStyles(wp: WorkPackage, hasVariance: boolean = false) {
  // Base color coding by priority
  const priorityColors: Record<string, string> = {
    low: '#10b981', // green
    normal: '#3b82f6', // blue
    high: '#f59e0b', // amber
    urgent: '#ef4444', // red
  };

  // Status-based opacity/saturation adjustments
  const statusModifiers: Record<string, { opacity: number; progressColor: string }> = {
    'new': { opacity: 0.7, progressColor: '#9ca3af' },
    'in_progress': { opacity: 1.0, progressColor: '#1e40af' },
    'completed': { opacity: 0.5, progressColor: '#059669' },
    'on_hold': { opacity: 0.6, progressColor: '#6b7280' },
    'blocked': { opacity: 0.8, progressColor: '#dc2626' },
    'cancelled': { opacity: 0.4, progressColor: '#4b5563' },
  };

  let baseColor = priorityColors[wp.priority] || '#3b82f6';
  const statusMod = statusModifiers[wp.status.toLowerCase()] || statusModifiers['in_progress'];

  // If there's a variance, use amber color to highlight
  if (hasVariance) {
    baseColor = '#f59e0b'; // amber
  }

  // Apply opacity to base color for status indication
  const backgroundColor = adjustColorOpacity(baseColor, statusMod.opacity);

  return {
    backgroundColor,
    backgroundSelectedColor: baseColor, // Full opacity when selected
    progressColor: statusMod.progressColor,
    progressSelectedColor: statusMod.progressColor,
  };
}

/**
 * Adjust color opacity by converting hex to rgba
 */
function adjustColorOpacity(hexColor: string, opacity: number): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
