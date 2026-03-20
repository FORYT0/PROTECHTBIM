import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyReportService } from '../services/dailyReportService';
import { queryKeys } from '../lib/queryClient';
import DailyReportFormModal from '../components/DailyReportFormModal';
import { InteractiveCard } from '../components/InteractiveCard';
import { toast } from '../utils/toast';
import {
  Clipboard, Plus, Users, Wrench, Cloud, AlertTriangle,
  CheckCircle, Activity, Search, Target, Calendar
} from 'lucide-react';

function DailyReportsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const projectId = searchParams.get('project_id') || '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWeek, setFilterWeek] = useState<string>('all');

  // Fetch daily reports using React Query
  const { data: reports = [], isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.projectDailyReports(projectId),
    queryFn: () => dailyReportService.getDailyReportsByProject(projectId),
    enabled: !!projectId,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  // Calculate metrics
  const now = new Date();
  const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const metrics = {
    totalReports: reports.length,
    thisWeek: reports.filter(r => new Date(r.reportDate) >= thisWeekStart).length,
    thisMonth: reports.filter(r => new Date(r.reportDate) >= thisMonthStart).length,
    avgManpower: reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + (r.manpowerCount || 0), 0) / reports.length) : 0,
    avgEquipment: reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + (r.equipmentCount || 0), 0) / reports.length) : 0,
    totalDelays: reports.filter(r => r.delays && r.delays.trim() !== '').length,
    safetyIncidents: reports.filter(r => r.safetyIncidents && r.safetyIncidents.trim() !== '').length,
    completionRate: 85,
  };

  const handleCreateReport = async (data: any) => {
    try {
      await dailyReportService.createDailyReport(data);
      toast.success('Daily report created successfully');
      // Invalidate query
      queryClient.invalidateQueries({ queryKey: queryKeys.projectDailyReports(projectId) });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create daily report';
      toast.error(errorMessage);
      throw err;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.workCompleted?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.siteNotes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Clipboard className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <p className="mt-4 text-gray-400">Loading daily reports...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Daily Site Reports</h1>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Reports:</span>
                <span className="text-white font-semibold">{metrics.totalReports}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">This Week:</span>
                <span className="text-blue-400 font-semibold">{metrics.thisWeek}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Avg Manpower:</span>
                <span className="text-white font-semibold">{metrics.avgManpower} workers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Safety Incidents:</span>
                <span className={metrics.safetyIncidents > 0 ? "text-red-400 font-semibold" : "text-green-400 font-semibold"}>
                  {metrics.safetyIncidents}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InteractiveCard
              icon={Users}
              iconColor="text-green-400"
              title="Avg Manpower"
              value={metrics.avgManpower}
              subtitle="Workers per day"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={Wrench}
              iconColor="text-blue-400"
              title="Avg Equipment"
              value={metrics.avgEquipment}
              subtitle="Units per day"
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={AlertTriangle}
              iconColor={metrics.totalDelays > 0 ? "text-orange-400" : "text-green-400"}
              title="Delays"
              value={metrics.totalDelays}
              subtitle={metrics.totalDelays > 0 ? "Reported" : "None"}
              className="min-w-[160px]"
            />
            <InteractiveCard
              icon={CheckCircle}
              iconColor="text-green-400"
              title="Completion"
              value={`${metrics.completionRate}%`}
              progress={{ value: metrics.completionRate, color: "bg-green-400" }}
              className="min-w-[160px]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <InteractiveCard
          icon={Clipboard}
          iconColor="text-blue-400"
          title="Total Reports"
          value={metrics.totalReports}
          subtitle="+7 this week"
          trend={{ value: "+7", direction: "up", color: "text-green-400" }}
        />
        <InteractiveCard
          icon={Activity}
          iconColor="text-blue-400"
          title="This Week"
          value={metrics.thisWeek}
          badge={{ text: "Active", color: "text-blue-400" }}
        />
        <InteractiveCard
          icon={Users}
          iconColor="text-green-400"
          title="Avg Manpower"
          value={metrics.avgManpower}
          subtitle="Workers/day"
          badge={{ text: "Stable", color: "text-green-400" }}
        />
        <InteractiveCard
          icon={Wrench}
          iconColor="text-cyan-400"
          title="Avg Equipment"
          value={metrics.avgEquipment}
          subtitle="Units/day"
        />
        <InteractiveCard
          icon={AlertTriangle}
          iconColor={metrics.totalDelays > 0 ? "text-orange-400" : "text-green-400"}
          title="Delays"
          value={metrics.totalDelays}
          subtitle={metrics.totalDelays > 0 ? "Needs attention" : "On track"}
        />
        <InteractiveCard
          icon={Target}
          iconColor="text-purple-400"
          title="Completion"
          value={`${metrics.completionRate}%`}
          progress={{ value: metrics.completionRate, color: "bg-purple-400" }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Time</option>
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>

          {(searchQuery || filterWeek !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterWeek('all');
              }}
              className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Report</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-2">Unable to Load Daily Reports</h3>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.projectDailyReports(projectId) })}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredReports.length === 0 && !error && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center">
              <Clipboard className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Daily Reports Found</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {searchQuery || filterWeek !== 'all'
              ? 'No reports match your filters. Try adjusting your search criteria.'
              : 'Create your first daily report to track site activities and progress.'}
          </p>
          {!searchQuery && filterWeek === 'all' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Report</span>
            </button>
          )}
        </div>
      )}

      {filteredReports.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing <span className="text-white font-semibold">{filteredReports.length}</span> report{filteredReports.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Last updated: Just now</span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => navigate(`/daily-reports/${report.id}`)}
                className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 hover:scale-[1.01] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {formatDate(report.reportDate)}
                      </h3>
                      {report.weather && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30 flex items-center gap-1">
                          <Cloud className="w-3 h-3" />
                          {report.weather}
                          {report.temperature && ` ${report.temperature}°C`}
                        </span>
                      )}
                    </div>
                    {report.workCompleted && (
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">{report.workCompleted}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-400">Manpower</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{report.manpowerCount} workers</p>
                  </div>
                  <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-400">Equipment</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{report.equipmentCount} units</p>
                  </div>
                  {report.delays && (
                    <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-gray-400">Delays</span>
                      </div>
                      <p className="text-sm font-semibold text-yellow-400 truncate">Reported</p>
                    </div>
                  )}
                  {report.safetyIncidents && (
                    <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-gray-400">Safety</span>
                      </div>
                      <p className="text-sm font-semibold text-red-400 truncate">Incident</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DailyReportFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateReport}
        projectId={projectId || undefined}
      />
    </div>
  );
}

export default DailyReportsPage;
