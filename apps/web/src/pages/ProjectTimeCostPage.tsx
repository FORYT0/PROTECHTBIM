import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, DollarSign, TrendingUp, Users, Package, Calendar, ArrowLeft } from 'lucide-react';
import apiRequest from '../utils/api';
import { useCurrency } from '../contexts/CurrencyContext';

interface TimeAnalytics {
  project_id: string; total_hours: number; billable_hours: number; non_billable_hours: number;
  by_work_package: Array<{ work_package_id: string; work_package_subject: string; hours: number; entry_count: number; }>;
  by_user: Array<{ userId: string; userName: string; hours: number; entryCount: number; }>;
}

interface CostAnalytics {
  project_id: string; total_cost: number; billable_cost: number; non_billable_cost: number;
  by_type: Array<{ type: string; amount: number; }>;
  by_work_package: Array<{ work_package_id: string; work_package_subject: string; amount: number; entry_count: number; }>;
}

interface ProjectSummary {
  project_id: string; work_package_count: number; total_hours: number; total_cost: number;
  avg_hours_per_work_package: number; avg_cost_per_work_package: number;
  time_entry_count: number; cost_entry_count: number;
}

export const ProjectTimeCostPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [timeData, setTimeData] = useState<TimeAnalytics | null>(null);
  const [costData, setCostData] = useState<CostAnalytics | null>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const { formatCurrency } = useCurrency();

  useEffect(() => { loadData(); }, [projectId, dateRange]);

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.set('date_from', dateRange.from);
      if (dateRange.to) params.set('date_to', dateRange.to);
      params.set('group_by', 'date');

      const [tr, cr, sr] = await Promise.all([
        apiRequest(`/projects/${projectId}/analytics/time?${params}`),
        apiRequest(`/projects/${projectId}/analytics/cost?${params}`),
        apiRequest(`/projects/${projectId}/analytics/summary`),
      ]);

      if (tr.ok) setTimeData(await tr.json());
      if (cr.ok) setCostData(await cr.json());
      if (sr.ok) setSummary(await sr.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fmtH = (h: number) => `${h.toFixed(1)}h`;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* Header */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
        <Link to={`/projects/${projectId}`} className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />Back to Project
        </Link>
        <h1 className="text-2xl font-bold text-white">Time & Cost Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Detailed time and cost breakdown by work package and team member</p>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0A0A0A] rounded-xl border border-gray-800 p-4">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-400">Date range:</span>
        <input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({...p, from: e.target.value}))}
          className="px-3 py-1.5 bg-[#111] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
        <span className="text-gray-600">—</span>
        <input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({...p, to: e.target.value}))}
          className="px-3 py-1.5 bg-[#111] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
        {(dateRange.from || dateRange.to) && (
          <button onClick={() => setDateRange({ from: '', to: '' })}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white">Clear</button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={loadData} className="mt-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm">Retry</button>
        </div>
      )}

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Clock,       color: 'text-blue-400',   label: 'Total Hours',     value: fmtH(summary.total_hours) },
            { icon: DollarSign,  color: 'text-green-400',  label: 'Total Cost',      value: formatCurrency(summary.total_cost) },
            { icon: Package,     color: 'text-purple-400', label: 'Work Packages',   value: summary.work_package_count },
            { icon: TrendingUp,  color: 'text-orange-400', label: 'Avg Cost / WP',   value: formatCurrency(summary.avg_cost_per_work_package) },
          ].map(s => (
            <div key={s.label} className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-white truncate">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Analytics grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Time by WP */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Time by work package</h2>
          <div className="space-y-3">
            {timeData?.by_work_package.slice(0, 8).map(item => (
              <div key={item.work_package_id} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.work_package_subject}</p>
                  <p className="text-xs text-gray-500">{item.entry_count} entries</p>
                </div>
                <span className="text-sm font-semibold text-blue-400 shrink-0">{fmtH(item.hours)}</span>
              </div>
            ))}
            {(!timeData?.by_work_package.length) && <p className="text-sm text-gray-500 text-center py-4">No time entries yet</p>}
          </div>
          {timeData && (
            <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-500">Billable</p><p className="text-sm font-semibold text-green-400">{fmtH(timeData.billable_hours)}</p></div>
              <div><p className="text-xs text-gray-500">Non-billable</p><p className="text-sm font-semibold text-gray-400">{fmtH(timeData.non_billable_hours)}</p></div>
            </div>
          )}
        </div>

        {/* Time by team member */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400" />Time by team member</h2>
          <div className="space-y-3">
            {timeData?.by_user.map(u => (
              <div key={u.userId} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold shrink-0">
                    {u.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white truncate">{u.userName}</span>
                </div>
                <span className="text-sm font-semibold text-blue-400 shrink-0">{fmtH(u.hours)}</span>
              </div>
            ))}
            {(!timeData?.by_user.length) && <p className="text-sm text-gray-500 text-center py-4">No team members yet</p>}
          </div>
        </div>

        {/* Cost by type */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Cost by type</h2>
          <div className="space-y-3">
            {costData?.by_type.map(item => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm text-white capitalize">{item.type}</span>
                <span className="text-sm font-semibold text-green-400">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            {(!costData?.by_type.length) && <p className="text-sm text-gray-500 text-center py-4">No cost entries yet</p>}
          </div>
          {costData && (
            <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-500">Billable</p><p className="text-sm font-semibold text-green-400">{formatCurrency(costData.billable_cost)}</p></div>
              <div><p className="text-xs text-gray-500">Non-billable</p><p className="text-sm font-semibold text-gray-400">{formatCurrency(costData.non_billable_cost)}</p></div>
            </div>
          )}
        </div>

        {/* Cost by WP */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Cost by work package</h2>
          <div className="space-y-3">
            {costData?.by_work_package.slice(0, 8).map(item => (
              <div key={item.work_package_id} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.work_package_subject}</p>
                  <p className="text-xs text-gray-500">{item.entry_count} entries</p>
                </div>
                <span className="text-sm font-semibold text-green-400 shrink-0">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            {(!costData?.by_work_package.length) && <p className="text-sm text-gray-500 text-center py-4">No cost entries yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
