import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import WorkPackageDetailDrawer from '../components/WorkPackageDetailDrawer';
import ICalendarSubscription from '../components/ICalendarSubscription';
import { InteractiveCard } from '../components/InteractiveCard';
import { workPackageService } from '../services/workPackageService';
import type { WorkPackage, WorkPackageType } from '@protecht-bim/shared-types';
import {
  Calendar as CalendarIcon, AlertTriangle, CheckCircle,
  Clock, Target, Download, Activity
} from 'lucide-react';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [filteredWorkPackages, setFilteredWorkPackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedWorkPackage, setSelectedWorkPackage] = useState<WorkPackage | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  // Filter state
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterType, setFilterType] = useState<WorkPackageType | ''>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Get project ID from URL params
  const projectId = searchParams.get('project_id') || undefined;

  // Mock calendar metrics - replace with real API calls
  const mockCalendarMetrics = {
    totalEvents: 89,
    thisWeek: 24,
    thisMonth: 89,
    overdue: 5,
    upcoming: 18,
    completed: 52,
    avgDuration: 8, // days
    utilizationRate: 76
  };

  // Load work packages
  useEffect(() => {
    loadWorkPackages();
  }, [projectId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...workPackages];

    if (filterAssignee) {
      filtered = filtered.filter((wp) => wp.assignee_id === filterAssignee);
    }

    if (filterType) {
      filtered = filtered.filter((wp) => wp.type === filterType);
    }

    if (filterStatus) {
      filtered = filtered.filter((wp) => wp.status === filterStatus);
    }

    setFilteredWorkPackages(filtered);
  }, [workPackages, filterAssignee, filterType, filterStatus]);

  const loadWorkPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await workPackageService.listWorkPackages({
        project_id: projectId,
        per_page: 100, // Maximum allowed per page by the API
      });
      setWorkPackages(response.work_packages);
    } catch (err) {
      console.error('Calendar - Error loading work packages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load work packages');
      setWorkPackages([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleWorkPackageClick = (workPackage: WorkPackage) => {
    setSelectedWorkPackage(workPackage);
    setDrawerOpen(true);
  };

  const handleDateChange = async (
    workPackageId: string,
    newStartDate: Date,
    newDueDate: Date
  ) => {
    try {
      await workPackageService.updateWorkPackage(workPackageId, {
        start_date: newStartDate,
        due_date: newDueDate,
      });
      // Reload work packages to reflect changes
      await loadWorkPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update work package');
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedWorkPackage(null);
  };

  // Get unique assignees and statuses for filters
  const uniqueAssignees = Array.from(
    new Set(workPackages.map((wp) => wp.assignee_id).filter(Boolean))
  );
  const uniqueStatuses = Array.from(new Set(workPackages.map((wp) => wp.status)));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <CalendarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <p className="mt-4 text-gray-400">Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
          <h1 className="text-3xl font-bold text-white">Schedule Calendar</h1>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-2">Unable to Load Calendar</h3>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <button onClick={loadWorkPackages} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
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
      {/* CALENDAR COMMAND HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Schedule Calendar</h1>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Events:</span>
                <span className="text-white font-semibold">{mockCalendarMetrics.totalEvents}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">This Week:</span>
                <span className="text-blue-400 font-semibold">{mockCalendarMetrics.thisWeek}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">This Month:</span>
                <span className="text-white font-semibold">{mockCalendarMetrics.thisMonth}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Overdue:</span>
                <span className="text-red-400 font-semibold">{mockCalendarMetrics.overdue}</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - EXECUTIVE METRICS */}
          <div className="grid grid-cols-2 gap-4">
            <InteractiveCard
              icon={Clock}
              iconColor="text-blue-400"
              title="Upcoming"
              value={mockCalendarMetrics.upcoming}
              subtitle="Next 7 days"
              to="/calendar?filter=upcoming"
              className="min-w-[160px]"
            />

            <InteractiveCard
              icon={CheckCircle}
              iconColor="text-green-400"
              title="Completed"
              value={mockCalendarMetrics.completed}
              subtitle="This month"
              to="/calendar?filter=completed"
              className="min-w-[160px]"
            />

            <InteractiveCard
              icon={AlertTriangle}
              iconColor="text-red-400"
              title="Overdue"
              value={mockCalendarMetrics.overdue}
              subtitle="Immediate action"
              to="/calendar?filter=overdue"
              className="min-w-[160px]"
            />

            <InteractiveCard
              icon={Target}
              iconColor="text-cyan-400"
              title="Utilization"
              value={`${mockCalendarMetrics.utilizationRate}%`}
              progress={{ value: mockCalendarMetrics.utilizationRate, color: "bg-cyan-400" }}
              to="/time-tracking"
              className="min-w-[160px]"
            />
          </div>
        </div>
      </div>

      {/* CALENDAR KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Events */}
        <InteractiveCard
          icon={CalendarIcon}
          iconColor="text-blue-400"
          title="Total Events"
          value={mockCalendarMetrics.totalEvents}
          subtitle="+12 this month"
          trend={{ value: "+12", direction: "up", color: "text-green-400" }}
          to="/calendar?view=all"
        />

        {/* This Week */}
        <InteractiveCard
          icon={Activity}
          iconColor="text-blue-400"
          title="This Week"
          value={mockCalendarMetrics.thisWeek}
          badge={{ text: "27%", color: "text-blue-400" }}
          progress={{ value: 27, color: "bg-blue-400" }}
          to="/calendar?view=week"
        />

        {/* Upcoming */}
        <InteractiveCard
          icon={Clock}
          iconColor="text-cyan-400"
          title="Upcoming"
          value={mockCalendarMetrics.upcoming}
          subtitle="Plan ahead"
          badge={{ text: "Next 7d", color: "text-cyan-400" }}
          to="/calendar?filter=upcoming"
        />

        {/* Completed */}
        <InteractiveCard
          icon={CheckCircle}
          iconColor="text-green-400"
          title="Completed"
          value={mockCalendarMetrics.completed}
          subtitle="On schedule"
          badge={{ text: "58%", color: "text-green-400" }}
          to="/calendar?filter=completed"
        />

        {/* Overdue */}
        <InteractiveCard
          icon={AlertTriangle}
          iconColor="text-red-400"
          title="Overdue"
          value={mockCalendarMetrics.overdue}
          subtitle="Needs attention"
          badge={{ text: "6%", color: "text-red-400" }}
          to="/calendar?filter=overdue"
        />

        {/* Utilization */}
        <InteractiveCard
          icon={Target}
          iconColor="text-purple-400"
          title="Utilization"
          value={`${mockCalendarMetrics.utilizationRate}%`}
          badge={{ text: `${mockCalendarMetrics.avgDuration}d`, color: "text-purple-400" }}
          progress={{ value: mockCalendarMetrics.utilizationRate, color: "bg-purple-400" }}
          to="/time-tracking"
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex-1 flex items-center gap-3">
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Assignees</option>
            {uniqueAssignees.map((assignee) => (
              <option key={assignee || 'unassigned'} value={assignee || ''}>
                {assignee || 'Unassigned'}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as WorkPackageType | '')}
            className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Types</option>
            <option value="task">Task</option>
            <option value="milestone">Milestone</option>
            <option value="phase">Phase</option>
            <option value="feature">Feature</option>
            <option value="bug">Bug</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {(filterAssignee || filterType || filterStatus) && (
            <button
              onClick={() => {
                setFilterAssignee('');
                setFilterType('');
                setFilterStatus('');
              }}
              className="px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Subscribe Button */}
        <button
          onClick={() => setSubscriptionModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/30"
        >
          <Download className="w-4 h-4" />
          <span>Subscribe</span>
        </button>
      </div>

      {/* CALENDAR VIEW */}
      {workPackages.length === 0 && !loading && !error ? (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Work Packages Found</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {projectId
              ? "This project doesn't have any work packages yet. Create some work packages to see them on the calendar."
              : "No work packages found. Create work packages in your projects to see them here."}
          </p>
          <Link
            to="/work-packages"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
          >
            Go to Work Packages
          </Link>
        </div>
      ) : (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-4 h-[calc(100vh-450px)] min-h-[600px]">
          <CalendarView
            workPackages={filteredWorkPackages}
            onWorkPackageClick={handleWorkPackageClick}
            onDateChange={handleDateChange}
          />
        </div>
      )}

      {/* Work package detail drawer */}
      {selectedWorkPackage && (
        <WorkPackageDetailDrawer
          workPackage={selectedWorkPackage}
          isOpen={drawerOpen}
          onClose={handleDrawerClose}
          onUpdate={loadWorkPackages}
        />
      )}

      {/* iCalendar subscription modal */}
      {subscriptionModalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <ICalendarSubscription
            projectId={projectId}
            onClose={() => setSubscriptionModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
