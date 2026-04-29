import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BurndownChart } from '../components/BurndownChart';

interface Sprint {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: string;
  start_date: string;
  end_date: string;
  capacity?: number;
  story_points?: number;
  created_at: string;
  updated_at: string;
}

interface WorkPackage {
  id: string;
  subject: string;
  type: string;
  status: string;
  story_points?: number;
  progress_percent: number;
  assignee?: {
    id: string;
    name: string;
  };
}

export const SprintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSprintDetails();
    }
  }, [id]);

  const fetchSprintDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || "/api/v1"}/sprints/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sprint details');
      }

      const data = await response.json();
      setSprint(data.sprint);
      setWorkPackages(data.work_packages || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading sprint details...</div>
      </div>
    );
  }

  if (error || !sprint) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error || 'Sprint not found'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-[#000000] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-400 hover:text-blue-300 mb-4"
        >
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{sprint.name}</h1>
            {sprint.description && (
              <p className="text-gray-400 mt-2">{sprint.description}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sprint.status)}`}>
            {sprint.status}
          </span>
        </div>
      </div>

      {/* Sprint Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0A0A0A] p-4 rounded-lg shadow">
          <div className="text-sm text-gray-400">Start Date</div>
          <div className="text-lg font-semibold text-white">{sprint.start_date}</div>
        </div>
        <div className="bg-[#0A0A0A] p-4 rounded-lg shadow">
          <div className="text-sm text-gray-400">End Date</div>
          <div className="text-lg font-semibold text-white">{sprint.end_date}</div>
        </div>
        <div className="bg-[#0A0A0A] p-4 rounded-lg shadow">
          <div className="text-sm text-gray-400">Story Points</div>
          <div className="text-lg font-semibold text-white">{sprint.story_points || 0}</div>
        </div>
        <div className="bg-[#0A0A0A] p-4 rounded-lg shadow">
          <div className="text-sm text-gray-400">Capacity</div>
          <div className="text-lg font-semibold text-white">{sprint.capacity || 'N/A'}</div>
        </div>
      </div>

      {/* Burndown Chart */}
      <div className="mb-8">
        <BurndownChart sprintId={id} type="sprint" />
      </div>

      {/* Work Packages */}
      <div className="bg-[#0A0A0A] rounded-lg shadow">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Work Packages ({workPackages.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-[#000000]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Story Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Assignee
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#0A0A0A] divide-y divide-gray-800">
              {workPackages.map((wp) => (
                <tr key={wp.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{wp.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-300">{wp.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded bg-blue-900/30 text-blue-400">{wp.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {wp.story_points || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-800 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${wp.progress_percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">{wp.progress_percent}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {wp.assignee?.name || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
