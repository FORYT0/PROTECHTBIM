import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityFeed } from '../components/ActivityFeed';
import { InteractiveCard } from '../components/InteractiveCard';
import {
  Activity, TrendingUp, Users, Clock, FileText, Package, AlertTriangle
} from 'lucide-react';

interface ActivityPageProps {
  projectId?: string;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projectId);

    // Activity metrics - will be replaced by real feed data below
  const mockActivityMetrics = {
    totalActivities: 0,
    todayActivities: 0,
    activeUsers: 0,
    avgResponseTime: 0,
    criticalAlerts: 0,
    fileChanges: 0,
    workPackageUpdates: 0,
  };

  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  if (!selectedProjectId) {
    return (
      <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
        {/* ACTIVITY COMMAND HEADER */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-3">Activity Intelligence Center</h1>
              <p className="text-gray-400">Track all changes and activities across your projects</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center">
              <Activity className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Project Selected</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Please select a project to view its activity feed and track all changes.
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
          >
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
      {/* ACTIVITY COMMAND HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Activity Intelligence Center</h1>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Activities:</span>
                <span className="text-white font-semibold">{mockActivityMetrics.totalActivities}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Today:</span>
                <span className="text-blue-400 font-semibold">{mockActivityMetrics.todayActivities}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Active Users:</span>
                <span className="text-green-400 font-semibold">{mockActivityMetrics.activeUsers}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Critical Alerts:</span>
                <span className="text-red-400 font-semibold">{mockActivityMetrics.criticalAlerts}</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - EXECUTIVE METRICS */}
          <div className="grid grid-cols-2 gap-4">
            <InteractiveCard
              icon={Activity}
              iconColor="text-blue-400"
              title="Today's Activity"
              value={mockActivityMetrics.todayActivities}
              trend={{ value: "+12%", direction: "up", color: "text-green-400" }}
              to="/activity?filter=today"
              className="min-w-[160px]"
            />

            <InteractiveCard
              icon={Users}
              iconColor="text-green-400"
              title="Active Users"
              value={mockActivityMetrics.activeUsers}
              subtitle="Currently online"
              to="/resources"
              className="min-w-[160px]"
            />

            <InteractiveCard
              icon={Clock}
              iconColor="text-cyan-400"
              title="Avg Response"
              value={`${mockActivityMetrics.avgResponseTime}m`}
              subtitle="Response time"
              to="/activity?view=analytics"
              className="min-w-[160px]"
            />

            <InteractiveCard
              icon={AlertTriangle}
              iconColor="text-red-400"
              title="Critical Alerts"
              value={mockActivityMetrics.criticalAlerts}
              subtitle="Needs attention"
              to="/activity?filter=critical"
              className="min-w-[160px]"
            />
          </div>
        </div>
      </div>

      {/* ACTIVITY KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Activities */}
        <InteractiveCard
          icon={Activity}
          iconColor="text-blue-400"
          title="Total Activities"
          value={mockActivityMetrics.totalActivities}
          trend={{ value: "+8%", direction: "up", color: "text-green-400" }}
          to="/activity?view=all"
        />

        {/* Today */}
        <InteractiveCard
          icon={TrendingUp}
          iconColor="text-green-400"
          title="Today"
          value={mockActivityMetrics.todayActivities}
          subtitle="Last 24 hours"
          to="/activity?filter=today"
        />

        {/* File Changes */}
        <InteractiveCard
          icon={FileText}
          iconColor="text-purple-400"
          title="File Changes"
          value={mockActivityMetrics.fileChanges}
          subtitle="This week"
          to="/activity?type=file"
        />

        {/* Work Package Updates */}
        <InteractiveCard
          icon={Package}
          iconColor="text-orange-400"
          title="WP Updates"
          value={mockActivityMetrics.workPackageUpdates}
          subtitle="This week"
          to="/activity?type=work-package"
        />

        {/* Active Users */}
        <InteractiveCard
          icon={Users}
          iconColor="text-cyan-400"
          title="Active Users"
          value={mockActivityMetrics.activeUsers}
          subtitle="Currently online"
          to="/resources"
        />

        {/* Critical Alerts */}
        <InteractiveCard
          icon={AlertTriangle}
          iconColor="text-red-400"
          title="Critical Alerts"
          value={mockActivityMetrics.criticalAlerts}
          subtitle="Immediate action"
          to="/activity?filter=critical"
        />
      </div>

      {/* ACTIVITY FEED */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <ActivityFeed
          projectId={selectedProjectId}
          title="Project Activities"
          pageSize={20}
        />
      </div>
    </div>
  );
};
