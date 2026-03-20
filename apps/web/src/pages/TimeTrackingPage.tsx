import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyTimesheet } from '../components/DailyTimesheet';
import { WeeklyTimesheet } from '../components/WeeklyTimesheet';
import { TimelineTable } from '../components/TimelineTable';
import { InteractiveCard } from '../components/InteractiveCard';
import TimeEntryService, { TimeEntry } from '../services/TimeEntryService';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import {
  Clock, Users, Calendar, BarChart3,
  Target, AlertCircle, CheckCircle, ArrowUp,
  Download, Settings, Activity, DollarSign
} from 'lucide-react';

type ViewType = 'daily' | 'weekly' | 'timeline';

const timeEntryService = new TimeEntryService();

export const TimeTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('daily');
  const [filterType, setFilterType] = useState<'all' | 'billable' | 'non-billable'>('all');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date range for current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  // Load time entries
  useEffect(() => {
    loadTimeEntries();
  }, []);

  const loadTimeEntries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await timeEntryService.listTimeEntries({
        date_from: format(weekStart, 'yyyy-MM-dd'),
        date_to: format(weekEnd, 'yyyy-MM-dd'),
        per_page: 1000,
      });
      setTimeEntries(result.time_entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load time entries');
      setTimeEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate real metrics from loaded data
  const laborMetrics = {
    totalHours: timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
    billableHours: timeEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0),
    nonBillableHours: timeEntries.filter(e => !e.billable).reduce((sum, e) => sum + e.hours, 0),
    billablePercent: timeEntries.length > 0 
      ? (timeEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0) / 
         timeEntries.reduce((sum, e) => sum + e.hours, 0)) * 100 
      : 0,
    activeWorkers: new Set(timeEntries.map(e => e.user_id)).size,
    avgDailyHours: timeEntries.length > 0 
      ? timeEntries.reduce((sum, e) => sum + e.hours, 0) / 5 
      : 0,
    plannedHours: 480, // This would come from project planning
    utilization: 0, // Calculated below
    overtime: 0, // Calculated below
    overtimeHours: 0,
    laborCostGenerated: timeEntries.reduce((sum, e) => sum + e.hours, 0) * 100, // $100/hour rate
  };

  // Calculate utilization
  laborMetrics.utilization = laborMetrics.plannedHours > 0 
    ? (laborMetrics.totalHours / laborMetrics.plannedHours) * 100 
    : 0;

  // Calculate overtime (hours over 40 per person per week)
  const userHours = timeEntries.reduce((acc, entry) => {
    acc[entry.user_id] = (acc[entry.user_id] || 0) + entry.hours;
    return acc;
  }, {} as Record<string, number>);
  
  laborMetrics.overtimeHours = Object.values(userHours).reduce((sum, hours) => 
    sum + Math.max(0, hours - 40), 0
  );
  laborMetrics.overtime = laborMetrics.totalHours > 0 
    ? (laborMetrics.overtimeHours / laborMetrics.totalHours) * 100 
    : 0;

  // Calculate team utilization from real data
  const teamUtilization = Array.from(new Set(timeEntries.map(e => e.user_id))).map(userId => {
    const userEntries = timeEntries.filter(e => e.user_id === userId);
    const hours = userEntries.reduce((sum, e) => sum + e.hours, 0);
    const billable = userEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0);
    const utilization = (hours / 40) * 100; // 40 hours per week standard
    
    return {
      userId,
      name: userEntries[0]?.user?.name || `User ${userId.substring(0, 8)}`,
      hours,
      billable,
      utilization: Math.round(utilization),
      status: utilization > 100 ? 'over' : utilization > 85 ? 'optimal' : utilization > 70 ? 'good' : 'low'
    };
  }).sort((a, b) => b.hours - a.hours);

  // Calculate weekly breakdown from real data
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weeklyData = weekDays.slice(0, 5).map(day => {
    const dayEntries = timeEntries.filter(e => isSameDay(new Date(e.date), day));
    return {
      day: format(day, 'EEE'),
      billable: dayEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0),
      nonBillable: dayEntries.filter(e => !e.billable).reduce((sum, e) => sum + e.hours, 0),
    };
  });

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 85) return 'text-green-400';
    if (utilization >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    if (status === 'optimal') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (status === 'good') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (status === 'over') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <p className="mt-4 text-gray-400">Loading time tracking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
          <h1 className="text-3xl font-bold text-white">Workforce Intelligence Center</h1>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-2">Unable to Load Time Data</h3>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <button 
                onClick={loadTimeEntries} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
      {/* TIME INTELLIGENCE HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Workforce Intelligence Center</h1>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Date Range:</span>
                <span className="text-gray-300">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Active Workers:</span>
                <span className="text-white font-semibold">{laborMetrics.activeWorkers}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Planned Hours:</span>
                <span className="text-white font-semibold">{formatHours(laborMetrics.plannedHours)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Reporting Period:</span>
                <span className="text-gray-300">Week {format(new Date(), 'w, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - EXECUTIVE METRICS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">Hours Logged</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatHours(laborMetrics.totalHours)}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-gray-400">This week</span>
              </div>
            </div>

            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-xs text-gray-400">Utilization</span>
              </div>
              <p className={`text-2xl font-bold ${getUtilizationColor(laborMetrics.utilization)}`}>
                {laborMetrics.utilization.toFixed(1)}%
              </p>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-green-400 h-1.5 rounded-full transition-all" 
                  style={{ width: `${Math.min(laborMetrics.utilization, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">Billable %</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{laborMetrics.billablePercent.toFixed(1)}%</p>
              <span className="text-xs text-gray-400">of total hours</span>
            </div>

            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <span className="text-xs text-gray-400">Overtime</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">{laborMetrics.overtime.toFixed(1)}%</p>
              <span className="text-xs text-orange-400">{laborMetrics.overtime > 5 ? 'Monitor closely' : 'Within limits'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LABOR KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Hours */}
        <InteractiveCard
          icon={Clock}
          iconColor="text-blue-400"
          title="Total Hours"
          value={formatHours(laborMetrics.totalHours)}
          subtitle="This week"
          to="/time-tracking/summary"
        />

        {/* Billable Hours */}
        <InteractiveCard
          icon={CheckCircle}
          iconColor="text-green-400"
          title="Billable Hours"
          value={formatHours(laborMetrics.billableHours)}
          badge={{ text: `${laborMetrics.billablePercent.toFixed(0)}%`, color: "text-green-400" }}
          progress={{ value: laborMetrics.billablePercent, color: "bg-green-400" }}
          onClick={() => setFilterType('billable')}
        />

        {/* Non-Billable */}
        <InteractiveCard
          icon={AlertCircle}
          iconColor="text-yellow-400"
          title="Non-Billable"
          value={formatHours(laborMetrics.nonBillableHours)}
          subtitle="Review allocation"
          badge={{ text: `${(100 - laborMetrics.billablePercent).toFixed(0)}%`, color: "text-yellow-400" }}
          onClick={() => setFilterType('non-billable')}
        />

        {/* Overtime */}
        <InteractiveCard
          icon={AlertCircle}
          iconColor="text-orange-400"
          title="Overtime"
          value={formatHours(laborMetrics.overtimeHours)}
          subtitle={laborMetrics.overtime > 5 ? "Above threshold" : "Within limits"}
          to="/time-tracking/overtime"
        />

        {/* Active Workers */}
        <InteractiveCard
          icon={Users}
          iconColor="text-cyan-400"
          title="Active Workers"
          value={laborMetrics.activeWorkers}
          subtitle="This period"
          to="/resources"
        />

        {/* Avg Daily Hours */}
        <InteractiveCard
          icon={Activity}
          iconColor="text-purple-400"
          title="Avg Daily Hours"
          value={formatHours(laborMetrics.avgDailyHours)}
          subtitle="Per day"
          to="/time-tracking/performance"
        />
      </div>

      {/* VIEW SELECTOR */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('daily')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
            view === 'daily'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-[#0A0A0A] border border-gray-800 text-gray-300 hover:bg-[#111111]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily View</span>
        </button>
        <button
          onClick={() => setView('weekly')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
            view === 'weekly'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-[#0A0A0A] border border-gray-800 text-gray-300 hover:bg-[#111111]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Weekly View</span>
        </button>
        <button
          onClick={() => setView('timeline')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
            view === 'timeline'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-[#0A0A0A] border border-gray-800 text-gray-300 hover:bg-[#111111]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Timeline View</span>
        </button>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (70%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Hours Chart */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Weekly Hours Breakdown
              </h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                  This Week
                </button>
                <button className="px-3 py-1 text-xs text-gray-400 hover:bg-[#111111] rounded-lg">
                  Last Week
                </button>
              </div>
            </div>
            
            {/* Bar Chart Placeholder */}
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {weeklyData.map((day, idx) => {
                const total = day.billable + day.nonBillable;
                const maxHeight = 200;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col gap-1">
                      {day.billable > 0 && (
                        <div 
                          className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-400"
                          style={{ height: `${(day.billable / 80) * maxHeight}px` }}
                          title={`Billable: ${day.billable.toFixed(1)}h`}
                        ></div>
                      )}
                      {day.nonBillable > 0 && (
                        <div 
                          className="w-full bg-yellow-500 rounded-b-lg transition-all hover:bg-yellow-400"
                          style={{ height: `${(day.nonBillable / 80) * maxHeight}px` }}
                          title={`Non-billable: ${day.nonBillable.toFixed(1)}h`}
                        ></div>
                      )}
                      {total === 0 && (
                        <div className="w-full h-2 bg-gray-800 rounded-lg"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{day.day}</span>
                    <span className="text-xs text-white font-semibold">{total.toFixed(1)}h</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-400">Billable Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-400">Non-Billable Hours</span>
              </div>
            </div>
          </div>

          {/* Timesheet View */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Timesheet</h2>
            {view === 'daily' && <DailyTimesheet />}
            {view === 'weekly' && <WeeklyTimesheet />}
            {view === 'timeline' && <TimelineTable />}
          </div>

          {/* Work Package Breakdown */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Work Package Breakdown</h2>
              <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="space-y-3">
              {timeEntries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No time entries this week</p>
              ) : (
                // Group by work package
                Object.entries(
                  timeEntries.reduce((acc, entry) => {
                    const wpId = entry.work_package_id;
                    const wpName = entry.work_package?.subject || `Work Package ${wpId.substring(0, 8)}`;
                    if (!acc[wpId]) {
                      acc[wpId] = { name: wpName, hours: 0, id: wpId };
                    }
                    acc[wpId].hours += entry.hours;
                    return acc;
                  }, {} as Record<string, { name: string; hours: number; id: string }>)
                )
                .sort(([, a], [, b]) => b.hours - a.hours)
                .slice(0, 5)
                .map(([wpId, item]) => {
                  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
                  const percent = totalHours > 0 ? (item.hours / totalHours) * 100 : 0;
                  return (
                    <div 
                      key={wpId} 
                      onClick={() => navigate(`/work-packages/${wpId}`)}
                      className="flex items-center gap-3 cursor-pointer hover:bg-[#111111] rounded-lg p-2 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-300">{item.name}</span>
                          <span className="text-sm font-semibold text-white">{formatHours(item.hours)}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-12 text-right">{percent.toFixed(0)}%</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (30%) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Utilization Rate */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Utilization Rate
            </h2>
            <div className="space-y-4">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#1A1A1A"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#27AE60"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - laborMetrics.utilization / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{laborMetrics.utilization}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Planned Hours</span>
                  <span className="text-sm font-semibold text-white">{formatHours(laborMetrics.plannedHours)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Logged Hours</span>
                  <span className="text-sm font-semibold text-green-400">{formatHours(laborMetrics.totalHours)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Variance</span>
                  <span className={`text-sm font-semibold ${laborMetrics.totalHours < laborMetrics.plannedHours ? 'text-yellow-400' : 'text-green-400'}`}>
                    {laborMetrics.totalHours >= laborMetrics.plannedHours ? '+' : ''}{formatHours(laborMetrics.totalHours - laborMetrics.plannedHours)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Billable Percentage */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              Billable Analysis
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Billable Ratio</span>
                  <span className="text-sm font-bold text-blue-400">{laborMetrics.billablePercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${laborMetrics.billablePercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Billable Hours</span>
                  <span className="text-sm font-semibold text-blue-400">{formatHours(laborMetrics.billableHours)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Non-Billable</span>
                  <span className="text-sm font-semibold text-yellow-400">{formatHours(laborMetrics.nonBillableHours)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-800">
                  <span className="text-sm font-medium text-gray-300">Target</span>
                  <span className="text-sm font-bold text-white">75%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Utilization */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Team Comparison
            </h2>
            <div className="space-y-3">
              {teamUtilization.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No team data available</p>
              ) : (
                teamUtilization.slice(0, 5).map((member) => (
                  <div 
                    key={member.userId} 
                    onClick={() => navigate(`/resources/member/${member.userId}`)}
                    className="p-3 bg-[#111111] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{member.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-lg border ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Hours</span>
                        <p className="text-white font-semibold">{formatHours(member.hours)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Billable</span>
                        <p className="text-blue-400 font-semibold">{formatHours(member.billable)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Util.</span>
                        <p className={`font-semibold ${getUtilizationColor(member.utilization)}`}>
                          {member.utilization}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cost Integration */}
          <div 
            onClick={() => navigate('/cost-tracking?filter=labor')}
            className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/30 p-6 cursor-pointer hover:border-green-500/50 hover:scale-[1.01] transition-all duration-200"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/cost-tracking?filter=labor');
              }
            }}
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Labor Cost Generated
            </h2>
            <div className="space-y-3">
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-green-400">
                  ${laborMetrics.laborCostGenerated.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">This period</p>
              </div>
              <div className="pt-3 border-t border-green-500/20 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg Rate/Hour</span>
                  <span className="text-white font-semibold">$100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Billable Revenue</span>
                  <span className="text-green-400 font-semibold">${(laborMetrics.billableHours * 100).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export Timesheet
              </button>
              <button className="w-full px-4 py-2 bg-[#111111] hover:bg-[#1A1A1A] text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Report
              </button>
              <button className="w-full px-4 py-2 bg-[#111111] hover:bg-[#1A1A1A] text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                Configure Alerts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingPage;
