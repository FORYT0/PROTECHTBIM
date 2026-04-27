import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resourceService } from '../services/ResourceService';
import { InteractiveCard } from '../components/InteractiveCard';
import { useProjectContext } from '../hooks/useProjectContext';
import { ProjectPicker } from '../components/ProjectPicker';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { queryKeys } from '../lib/queryClient';
import { Users, AlertTriangle, CheckCircle, Clock, Target, Activity, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

function ResourceManagementPage() {
  const navigate = useNavigate();
  const { projectId, projects, isLoading: projectsLoading, setProjectId } = useProjectContext();
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const { data: utilization, isLoading: loadingUtil, error } = useQuery({
    queryKey: queryKeys.resourceUtilization(
      projectId, format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')
    ),
    queryFn: () => resourceService.getProjectResourceUtilization(
      projectId, format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')
    ),
    enabled: !!projectId,
  });

  const isLoading = projectsLoading || (loadingUtil && !!projectId);

  // Real metrics from API data
  const team = utilization?.teamWorkload || [];
  const metrics = {
    total: team.length,
    active: team.filter((u: any) => u.utilizationPercentage > 0).length,
    optimal: team.filter((u: any) => u.utilizationPercentage <= 80).length,
    warning: team.filter((u: any) => u.utilizationPercentage > 80 && u.utilizationPercentage <= 100).length,
    overCapacity: team.filter((u: any) => u.utilizationPercentage > 100).length,
    avgUtil: team.length ? Math.round(team.reduce((s: number, u: any) => s + u.utilizationPercentage, 0) / team.length) : 0,
  };

  const nextWeek = () => setDateRange({ start: addWeeks(dateRange.start, 1), end: addWeeks(dateRange.end, 1) });
  const prevWeek = () => setDateRange({ start: subWeeks(dateRange.start, 1), end: subWeeks(dateRange.end, 1) });

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* Header */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Resource Management</h1>
            <p className="text-sm text-gray-400 mt-1">Team workload and capacity planning</p>
          </div>
          <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
        </div>
      </div>

      {/* KPI cards — real data */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <InteractiveCard icon={Users}         iconColor="text-cyan-400"   title="Team Size"      value={metrics.total} />
        <InteractiveCard icon={Activity}      iconColor="text-green-400"  title="Active"         value={metrics.active} badge={{ text: 'Working', color: 'text-green-400' }} />
        <InteractiveCard icon={CheckCircle}   iconColor="text-green-400"  title="Optimal"        value={metrics.optimal} subtitle="≤80% load" />
        <InteractiveCard icon={Zap}           iconColor="text-orange-400" title="Near Capacity"  value={metrics.warning} subtitle="81–100%" />
        <InteractiveCard icon={AlertTriangle} iconColor="text-red-400"    title="Overloaded"     value={metrics.overCapacity} subtitle=">100%" />
        <InteractiveCard icon={Target}        iconColor="text-blue-400"   title="Avg Utilisation" value={`${metrics.avgUtil}%`} progress={{ value: metrics.avgUtil, color: metrics.avgUtil > 100 ? 'bg-red-400' : metrics.avgUtil > 80 ? 'bg-orange-400' : 'bg-green-400' }} />
      </div>

      {/* Date range toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0A0A0A] rounded-xl border border-gray-800 p-4">
        <div className="flex items-center gap-2 bg-[#111] border border-gray-800 rounded-lg overflow-hidden">
          <button onClick={prevWeek} className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors border-r border-gray-800">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 text-sm font-medium text-white whitespace-nowrap">
            {format(dateRange.start, 'MMM d')} – {format(dateRange.end, 'MMM d, yyyy')}
          </span>
          <button onClick={nextWeek} className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors border-l border-gray-800">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live sync active
        </span>
      </div>

      {/* No project */}
      {!projectId && !projectsLoading && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-10 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Select a Project</h3>
          <p className="text-gray-400 text-sm">Choose a project above to view team resource utilisation.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <p className="text-red-400 text-sm">{(error as Error).message}</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm">Retry</button>
        </div>
      )}

      {/* Loading */}
      {isLoading && projectId && (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />
        </div>
      )}

      {/* Resource table */}
      {!isLoading && projectId && (
        <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
          {team.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">No resource data</h3>
              <p className="text-gray-500 text-sm">No team members have logged hours in this period.</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
                {[
                  { label: 'Total hours committed', value: `${utilization?.totalProjectEstimatedHours || 0}h`, color: 'text-white' },
                  { label: 'Team members', value: team.length, color: 'text-white' },
                  { label: 'Avg utilisation', value: `${metrics.avgUtil}%`, color: metrics.avgUtil > 100 ? 'text-red-400' : metrics.avgUtil > 80 ? 'text-orange-400' : 'text-green-400' },
                ].map(s => (
                  <div key={s.label} className="p-5">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Team Member', 'Hours Assigned', 'Capacity', 'Utilisation', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {team.map((u: any) => {
                      const pct = Math.round(u.utilizationPercentage);
                      const status = pct > 100 ? { label: 'Overloaded', cls: 'bg-red-500/20 text-red-400 border-red-500/30' }
                        : pct > 80 ? { label: 'Near cap', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
                        : { label: 'Optimal', cls: 'bg-green-500/20 text-green-400 border-green-500/30' };
                      return (
                        <tr key={u.userId} className="hover:bg-[#111] transition-colors cursor-pointer group"
                          onClick={() => navigate(`/resource-management?user=${u.userId}`)}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-sm shrink-0">
                                {u.userName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors">{u.userName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-mono text-white">{u.totalEstimatedHours}h</td>
                          <td className="px-5 py-4 text-sm font-mono text-gray-400">{Math.round(u.capacityHours)}h</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-[120px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-orange-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-sm font-mono text-gray-400 w-10">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${status.cls}`}>{status.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ResourceManagementPage;
