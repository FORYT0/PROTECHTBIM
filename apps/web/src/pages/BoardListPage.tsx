import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Board, BoardType } from '@protecht-bim/shared-types';
import { boardService } from '../services/boardService';
import { projectService } from '../services/projectService';

export default function BoardListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBoards();
  }, [projectId]);

  const loadBoards = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      // Load boards
      const { boards: boardsData } = await boardService.listBoards(projectId);
      setBoards(boardsData);

      // Load project name
      const project = await projectService.getProject(projectId);
      setProjectName(project.name);
    } catch (err) {
      console.error('Failed to load boards:', err);
      setError('Failed to load boards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBoardClick = (boardId: string) => {
    navigate(`/projects/${projectId}/boards/${boardId}`);
  };

  const boardTypeLabels: Record<BoardType, string> = {
    [BoardType.BASIC]: 'Basic',
    [BoardType.STATUS]: 'Status',
    [BoardType.TEAM]: 'Team',
    [BoardType.VERSION]: 'Version',
  };

  const boardTypeColors: Record<BoardType, string> = {
    [BoardType.BASIC]: 'bg-gray-100 text-gray-700',
    [BoardType.STATUS]: 'bg-blue-100 text-blue-700',
    [BoardType.TEAM]: 'bg-green-100 text-green-700',
    [BoardType.VERSION]: 'bg-purple-100 text-purple-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading boards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadBoards}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
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
          <h1 className="text-3xl font-bold text-gray-900">Boards</h1>
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

      {/* Boards Grid */}
      {boards.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No boards</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new board for this project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => handleBoardClick(board.id)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{board.name}</h3>
                <span
                  className={`${boardTypeColors[board.board_type]} text-xs px-2 py-1 rounded-full font-medium`}
                >
                  {boardTypeLabels[board.board_type]}
                </span>
              </div>

              {board.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {board.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Updated {new Date(board.updated_at).toLocaleDateString()}
                </span>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
