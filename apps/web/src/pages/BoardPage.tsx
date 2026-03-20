import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Board, WorkPackage } from '@protecht-bim/shared-types';
import { boardService } from '../services/boardService';
import { projectService } from '../services/projectService';
import KanbanBoard from '../components/KanbanBoard';
import WorkPackageDetailDrawer from '../components/WorkPackageDetailDrawer';

export default function BoardPage() {
  const { projectId, boardId } = useParams<{ projectId: string; boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkPackage, setSelectedWorkPackage] = useState<WorkPackage | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

  const loadBoardData = async () => {
    if (!boardId || !projectId) return;

    try {
      setLoading(true);
      setError(null);

      // Load board with columns and work packages
      const { board: boardData } = await boardService.getBoard(boardId);
      setBoard(boardData);
      setColumns(boardData.columns || []);
      setWorkPackages(boardData.workPackages || []);

      // Load project name
      const project = await projectService.getProject(projectId);
      setProjectName(project.name);
    } catch (err) {
      console.error('Failed to load board:', err);
      setError('Failed to load board. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkPackageClick = (workPackage: WorkPackage) => {
    setSelectedWorkPackage(workPackage);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedWorkPackage(null);
    // Reload board data after closing drawer (in case work package was updated)
    loadBoardData();
  };

  const handleWorkPackageUpdate = () => {
    // Reload board data after work package update
    loadBoardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadBoardData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Board not found</p>
        <Link
          to={`/projects/${projectId}`}
          className="mt-2 text-yellow-600 hover:text-yellow-800 underline"
        >
          Back to project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-gray-600 mb-2">
            <Link to="/projects" className="hover:text-gray-900">
              Projects
            </Link>
            <span className="mx-2">/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-gray-900">
              {projectName}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Boards</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">{board.name}</h1>
          {board.description && (
            <p className="text-gray-600 mt-1">{board.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${projectId}`}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Project
          </Link>
        </div>
      </div>

      {/* Board Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Type:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {board.board_type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Columns:</span>
            <span>{columns.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Work Packages:</span>
            <span>{workPackages.length}</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {columns.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-yellow-800">
            This board has no columns yet. Please configure columns to start using the board.
          </p>
        </div>
      ) : (
        <KanbanBoard
          columns={columns}
          workPackages={workPackages}
          onWorkPackageClick={handleWorkPackageClick}
          onWorkPackageUpdate={handleWorkPackageUpdate}
        />
      )}

      {/* Work Package Detail Drawer */}
      {selectedWorkPackage && (
        <WorkPackageDetailDrawer
          workPackage={selectedWorkPackage}
          isOpen={isDrawerOpen}
          onClose={handleDrawerClose}
          onUpdate={handleWorkPackageUpdate}
        />
      )}
    </div>
  );
}
