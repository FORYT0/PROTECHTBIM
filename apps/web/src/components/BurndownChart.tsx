import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BurndownDataPoint {
  date: string;
  remaining: number;
  completed: number;
  ideal: number;
}

interface BurndownChartData {
  sprint_id: string;
  sprint_name: string;
  start_date: string;
  end_date: string;
  total_story_points: number;
  data_points: BurndownDataPoint[];
}

interface BurndownChartProps {
  sprintId?: string;
  projectId?: string;
  versionId?: string;
  startDate?: string;
  endDate?: string;
  type?: 'sprint' | 'release';
}

export const BurndownChart: React.FC<BurndownChartProps> = ({
  sprintId,
  projectId,
  versionId,
  startDate,
  endDate,
  type = 'sprint',
}) => {
  const [data, setData] = useState<BurndownChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBurndownData();
  }, [sprintId, projectId, versionId, startDate, endDate, type]);

  const fetchBurndownData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      let url = '';
      if (type === 'sprint' && sprintId) {
        url = `http://localhost:3000/api/v1/sprints/${sprintId}/burndown`;
      } else if (type === 'release' && projectId) {
        const params = new URLSearchParams();
        if (versionId) params.append('version_id', versionId);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        url = `http://localhost:3000/api/v1/projects/${projectId}/burndown?${params}`;
      } else {
        throw new Error('Invalid burndown chart configuration');
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch burndown data');
      }

      const result = await response.json();
      setData(result.burndown);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading burndown chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data || data.data_points.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No burndown data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{data.sprint_name}</h3>
        <p className="text-sm text-gray-600">
          {data.start_date} to {data.end_date} • Total: {data.total_story_points} story points
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data.data_points}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#9CA3AF"
            strokeDasharray="5 5"
            name="Ideal"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="remaining"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Remaining"
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#10B981"
            strokeWidth={2}
            name="Completed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
