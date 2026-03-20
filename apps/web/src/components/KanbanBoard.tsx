import { useState, useCallback } from 'react';
import { WorkPackage, BoardColumn } from '@protecht-bim/shared-types';
import WorkPackageCard from './WorkPackageCard';
import { workPackageService } from '../services/workPackageService';

interface KanbanBoardProps {
  columns: BoardColumn[];
  workPackages: WorkPackage[];
  onWorkPackageClick?: (workPackage: WorkPackage) => void;
  onWorkPackageUpdate?: () => void;
}

export default function KanbanBoard({
  columns,
  workPackages,
  onWorkPackageClick,
  onWorkPackageUpdate,
}: KanbanBoardProps) {
  const [draggedWorkPackage, setDraggedWorkPackage] = useState<WorkPackage | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Group work packages by status
  const workPackagesByStatus = columns.reduce((acc, column) => {
    const status = column.status_mapping || column.name.toLowerCase();
    acc[column.id] = workPackages.filter(
      (wp) => wp.status.toLowerCase() === status.toLowerCase()
    );
    return acc;
  }, {} as Record<string, WorkPackage[]>);

  const handleDragStart = useCallback((e: React.DragEvent, workPackage: WorkPackage) => {
    setDraggedWorkPackage(workPackage);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedWorkPackage(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, column: BoardColumn) => {
      e.preventDefault();
      setDragOverColumn(null);

      if (!draggedWorkPackage) return;

      const newStatus = column.status_mapping || column.name.toLowerCase();
      
      // Don't update if dropping in the same column
      if (draggedWorkPackage.status.toLowerCase() === newStatus.toLowerCase()) {
        setDraggedWorkPackage(null);
        return;
      }

      try {
        // Update work package status
        await workPackageService.updateWorkPackage(draggedWorkPackage.id, {
          status: newStatus,
        });

        // Notify parent to refresh data
        if (onWorkPackageUpdate) {
          onWorkPackageUpdate();
        }
      } catch (error) {
        console.error('Failed to update work package status:', error);
        alert('Failed to update work package status. Please try again.');
      } finally {
        setDraggedWorkPackage(null);
      }
    },
    [draggedWorkPackage, onWorkPackageUpdate]
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnWorkPackages = workPackagesByStatus[column.id] || [];
        const isOver = dragOverColumn === column.id;
        const wipLimitExceeded = column.wip_limit && columnWorkPackages.length >= column.wip_limit;

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className="bg-gray-100 rounded-lg p-4">
              {/* Column Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{column.name}</h3>
                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                    {columnWorkPackages.length}
                    {column.wip_limit && ` / ${column.wip_limit}`}
                  </span>
                </div>
                {wipLimitExceeded && (
                  <p className="text-xs text-red-600 mt-1">WIP limit exceeded</p>
                )}
              </div>

              {/* Drop Zone */}
              <div
                className={`min-h-[200px] transition-colors ${
                  isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg' : ''
                }`}
              >
                {columnWorkPackages.length === 0 && !isOver && (
                  <div className="text-center text-gray-400 text-sm py-8">
                    No work packages
                  </div>
                )}

                {/* Work Package Cards */}
                {columnWorkPackages.map((workPackage) => (
                  <div
                    key={workPackage.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, workPackage)}
                    onDragEnd={handleDragEnd}
                    className={`${
                      draggedWorkPackage?.id === workPackage.id ? 'opacity-50' : ''
                    }`}
                  >
                    <WorkPackageCard
                      workPackage={workPackage}
                      onClick={() => onWorkPackageClick?.(workPackage)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
