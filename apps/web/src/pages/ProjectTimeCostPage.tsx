import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, DollarSign, TrendingUp, Users, Package, Calendar, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../utils/api';
import { useCurrency } from '../contexts/CurrencyContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface TimeAnalytics {
  project_id: string;
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  by_work_package: Array<{
    work_package_id: string;
    work_package_subject: string;
    hours: number;
    entry_count: number;
  }>;
  by_user: Array<{
    userId: string;
    userName: string;
    hours: number;
    entryCount: number;
  }>;
  by_date: Array<{
    date: string;
    hours: number;
  }>;
}

interface CostAnalytics {
  project_id: string;
  total_cost: number;
  billable_cost: number;
  non_billable_cost: number;
  by_type: Array<{
    type: string;
    amount: number;
  }>;
  by_work_package: Array<{
    work_package_id: string;
    work_package_subject: string;
    amount: number;
    entry_count: number;
  }>;
  by_date: Array<{
    date: string;
    amount: number;
  }>;
}

interface ProjectSummary {
  project_id: string;
  work_package_count: number;
  total_hours: number;
  total_cost: number;
  avg_hours_per_work_package: number;
  avg_cost_per_work_package: number;
  time_entry_count: number;
  cost_entry_count: number;
}

export const ProjectTimeCostPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [timeAnalytics, setTimeAnalytics] = useState<TimeAnalytics | null>(null);
  const [costAnalytics, setCostAnalytics] = useState<CostAnalytics | null>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  });

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  useEffect(() => {
    loadData();
  }, [projectId, dateRange]);

  const loadData = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append('date_from', dateRange.from);
      if (dateRange.to) params.append('date_to', dateRange.to);
      params.append('group_by', 'date');

      const [timeRes, costRes, summaryRes] = await Promise.all([
        api.get(`/projects/${projectId}/analytics/time?${params.toString()}`),
        api.get(`/projects/${projectId}/analytics/cost?${params.toString()}`),
        api.get(`/projects/${projectId}/analytics/summary`),
      ]);

      setTimeAnalytics(timeRes.data);
      setCostAnalytics(costRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const { formatCurrency } = useCurrency();

  const formatHours = (hours: number) => {
    return `${hours.toFixed(2)}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Project
          </Link>
          <h1 className="text-3xl font-bold text-white">
            Time & Cost Analytics
          </h1>
        </div>

        {/* Date Range Filter */}
        <div className="bg-[#0A0A0A] rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-300">
                Date Range:
              </label>
            </div>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
            />
            <button
              onClick={() => setDateRange({ from: '', to: '' })}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-[#0A0A0A] rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Hours</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatHours(summary.total_hours)}
                  </p>
                </div>
                <Clock className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-[#0A0A0A] rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Cost</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(summary.total_cost)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-[#0A0A0A] rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Work Packages</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {summary.work_package_count}
                  </p>
                </div>
                <Package className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-[#0A0A0A] rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Cost/WP</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(summary.avg_cost_per_work_package)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Time Analytics */}
        {timeAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Time by Work Package */}
            <div className="bg-[#0A0A0A] rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Time by Work Package
              </h2>
              <div className="space-y-3">
                {timeAnalytics.by_work_package.slice(0, 10).map((item) => (
                  <div key={item.work_package_id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.work_package_subject}
                      </p>
                      <p className="text-xs text-gray-500">{item.entry_count} entries</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-400 ml-4">
                      {formatHours(item.hours)}
                    </span>
                  </div>
                ))}
                {timeAnalytics.by_work_package.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No time entries yet</p>
                )}
              </div>
            </div>

            {/* Time by User */}
            <div className="bg-[#0A0A0A] rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Time by Team Member
              </h2>
              <div className="space-y-3">
                {timeAnalytics.by_user.map((item) => (
                  <div key={item.userId} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.userName}
                      </p>
                      <p className="text-xs text-gray-500">{item.entryCount} entries</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-400 ml-4">
                      {formatHours(item.hours)}
                    </span>
                  </div>
                ))}
                {timeAnalytics.by_user.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No time entries yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cost Analytics */}
        {costAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost by Type */}
            <div className="bg-[#0A0A0A] rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Cost by Type
              </h2>
              <div className="space-y-3">
                {costAnalytics.by_type.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white capitalize">
                      {item.type}
                    </span>
                    <span className="text-sm font-semibold text-green-400">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                {costAnalytics.by_type.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No cost entries yet</p>
                )}
              </div>
            </div>

            {/* Cost by Work Package */}
            <div className="bg-[#0A0A0A] rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Cost by Work Package
              </h2>
              <div className="space-y-3">
                {costAnalytics.by_work_package.slice(0, 10).map((item) => (
                  <div key={item.work_package_id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.work_package_subject}
                      </p>
                      <p className="text-xs text-gray-500">{item.entry_count} entries</p>
                    </div>
                    <span className="text-sm font-semibold text-green-400 ml-4">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                {costAnalytics.by_work_package.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No cost entries yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Billable vs Non-Billable */}
        {timeAnalytics && costAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-[#0A0A0A] rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Billable Time
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Billable</span>
                  <span className="text-sm font-semibold text-green-400">
                    {formatHours(timeAnalytics.billable_hours)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Non-Billable</span>
                  <span className="text-sm font-semibold text-gray-400">
                    {formatHours(timeAnalytics.non_billable_hours)}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(timeAnalytics.billable_hours / timeAnalytics.total_hours) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A0A] rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Billable Cost
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Billable</span>
                  <span className="text-sm font-semibold text-green-400">
                    {formatCurrency(costAnalytics.billable_cost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Non-Billable</span>
                  <span className="text-sm font-semibold text-gray-400">
                    {formatCurrency(costAnalytics.non_billable_cost)}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(costAnalytics.billable_cost / costAnalytics.total_cost) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
