import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkPackage, CreateWorkPackageRequest } from '@protecht-bim/shared-types';
import { workPackageService } from '../services/workPackageService';
import WorkPackageTable from '../components/WorkPackageTable';
import CalendarView from '../components/CalendarView';
import WorkPackageFilters, { WorkPackageFilterValues } from '../components/WorkPackageFilters';
import WorkPackageFormModal from '../components/WorkPackageFormModal';
import WorkPackageDetailDrawer from '../components/WorkPackageDetailDrawer';
import { InteractiveCard } from '../components/InteractiveCard';
import {
  Package, AlertTriangle, CheckCircle, Clock,
  Users, Target, Grid, Calendar as CalendarIcon, Plus,
  Search, Filter, Activity
} from 'lucide-react';

function WorkPackagesPage() {
  const navigate = useNavigate();
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [selectedWorkPackage, setSelectedWorkPackage] = useState<WorkPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  const [filters, setFilters] = useState<WorkPackageFilterValues>({
    search: '',
    type: [],
    status: [],
    priority: [],
    assignee_id: '',
  });

  // Mock work package metrics - replace with real API calls
  const mockWorkPackageMetrics = {
    totalPackages: 156,
    activePackages: 89,
    completedPackages: 52,
    blockedPackages: 8,
    avgCompletion: 64,
    onTrack: 72,
    atRisk: 12,
    overdue: 5,
    teamMembers: 24,
    avgDuration: 12 // days
  };

  const loadWorkPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await workPackageService.listWorkPackages({
        search: filters.search || undefined,
        type: filters.type.length > 0 ? filters.type : undefined,
        status: filters.status.length > 0 ? filters.status : undefined,
        priority: filters.priority.length > 0 ? filters.priority : undefined,
        assignee_id: filters.assignee_id || undefined,
        page: viewMode === 'calendar' ? 1 : currentPage,
        per_page: viewMode === 'calendar' ? 100 : 20,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      setWorkPackages(response.work_packages);
      setTotalPages(Math.ceil(response.total / response.per_page));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work packages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkPackages();
  }, [filters, currentPage, sortBy, sortOrder, viewMode]);

  const handleCreateWorkPackage = async (data: CreateWorkPackageRequest) => {
    try {
      console.log('WorkPackagesPage - Creating work package:', data);
      await workPackageService.createWorkPackage(data);
      console.log('WorkPackagesPage - Work package created, reloading list');
      await loadWorkPackages();
      console.log('WorkPackagesPage - List reloaded');
    } catch (err) {
      console.error('WorkPackagesPage - Error creating work package:', err);
      throw err; // Re-throw to let the modal handle the error display
    }
  };

  const handleRowClick = (workPackage: WorkPackage) => {
    setSelectedWorkPackage(workPackage);
    setIsDetailDrawerOpen(true);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleFilterChange = (newFilters: WorkPackageFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: [],
      status: [],
      priority: [],
      assignee_id: '',
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
      {/* WORK PACKAGE COMMAND HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Work Package Control Center</h1>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Packages:</span>
                <span className="text-white font-semibold">{mockWorkPackageMetrics.totalPackages}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Active:</span>
                <span className="text-green-400 font-semibold">{mockWorkPackageMetrics.activePackages}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Completed:</span>
                <span className="text-blue-400 font-semibold">{mockWorkPackageMetrics.completedPackages}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Blocked:</span>
                <span className="text-red-400 font-semibold">{mockWorkPackageMetrics.blockedPackages}</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - EXECUTIVE METRICS */}
          <div className="grid grid-cols-2 gap-4">
            <InteractiveCard
              icon={Target}
              iconColor="text-blue-400"
              title="Avg Completion"
              value={`${mockWorkPackageMetrics.avgCompletion}%`}
              progress={{ value: mockWorkPackageMetrics.avgCompletion, color: "bg-blue-400" }}
              to="/work-packages?sort=completion"
              className="min-w-[160px]"
            />

            <InteractiveCard
              icon={CheckCircle}
              iconColor="text-green-400"
              title="On Track"
              value={mockWorkPackageMetrics.onTrack}
              subtitle={`${Math.round((mockWorkPackageMetrics.onTrack / mockWorkPackageMetrics.activePackages) * 100)}% of active`}
              to="/work-packages?filter=on-track"
              className="min-w-[160px]"
            />

            <InteractiveCard
              icon={AlertTriangle}
              iconColor="text-orange-400"
              title="At Risk"
              value={mockWorkPackageMetrics.atRisk}
              subtitle="Needs attention"
              to="/work-packages?filter=at-risk"
              className="min-w-[160px]"
            />

            <InteractiveCard
              icon={Clock}
              iconColor="text-red-400"
              title="Overdue"
              value={mockWorkPackageMetrics.overdue}
              subtitle="Immediate action"
              to="/work-packages?filter=overdue"
              className="min-w-[160px]"
            />
          </div>
        </div>
      </div>

      {/* WORK PACKAGE KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Packages */}
        <InteractiveCard
          icon={Package}
          iconColor="text-blue-400"
          title="Total Packages"
          value={mockWorkPackageMetrics.totalPackages}
          subtitle="+12 this month"
          trend={{ value: "+12", direction: "up", color: "text-green-400" }}
          to="/work-packages?view=all"
        />

        {/* Active Packages */}
        <InteractiveCard
          icon={Activity}
          iconColor="text-green-400"
          title="Active Packages"
          value={mockWorkPackageMetrics.activePackages}
          badge={{ text: "57%", color: "text-green-400" }}
          progress={{ value: 57, color: "bg-green-400" }}
          onClick={() => navigate('/work-packages?status=active')}
        />

        {/* Completed */}
        <InteractiveCard
          icon={CheckCircle}
          iconColor="text-blue-400"
          title="Completed"
          value={mockWorkPackageMetrics.completedPackages}
          subtitle="+8 this week"
          badge={{ text: "33%", color: "text-blue-400" }}
          onClick={() => navigate('/work-packages?status=completed')}
        />

        {/* On Track */}
        <InteractiveCard
          icon={Target}
          iconColor="text-green-400"
          title="On Track"
          value={mockWorkPackageMetrics.onTrack}
          subtitle="Performing well"
          badge={{ text: "81%", color: "text-green-400" }}
          to="/work-packages?filter=on-track"
        />

        {/* At Risk / Overdue */}
        <InteractiveCard
          icon={AlertTriangle}
          iconColor="text-orange-400"
          title="At Risk / Overdue"
          value={mockWorkPackageMetrics.atRisk + mockWorkPackageMetrics.overdue}
          subtitle="Requires action"
          badge={{ text: "8%", color: "text-orange-400" }}
          to="/work-packages?filter=at-risk"
        />

        {/* Team */}
        <InteractiveCard
          icon={Users}
          iconColor="text-cyan-400"
          title="Team Members"
          value={mockWorkPackageMetrics.teamMembers}
          subtitle={`Avg ${mockWorkPackageMetrics.avgDuration} days`}
          badge={{ text: `${mockWorkPackageMetrics.avgDuration}d`, color: "text-cyan-400" }}
          to="/resources"
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex-1 flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search work packages..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Button */}
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {(filters.type.length > 0 || filters.status.length > 0 || filters.priority.length > 0 || filters.assignee_id) && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                {filters.type.length + filters.status.length + filters.priority.length + (filters.assignee_id ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* View Mode & New Package */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0A0A0A] border border-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>

          {/* New Package Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Package</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 sticky top-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            <WorkPackageFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        {/* Work Package List/Calendar */}
        <div className="lg:col-span-3">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">Unable to load work packages</p>
                  <p className="text-xs text-gray-400 mt-1">{error}</p>
                  <button
                    onClick={loadWorkPackages}
                    className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <p className="mt-4 text-gray-400">Loading work packages...</p>
            </div>
          ) : workPackages.length === 0 ? (
            <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Work Packages Found</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {filters.search || filters.type.length > 0 || filters.status.length > 0
                  ? 'No work packages match your filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first work package.'}
              </p>
              {!filters.search && filters.type.length === 0 && filters.status.length === 0 && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Work Package</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'table' ? (
                <>
                  <WorkPackageTable
                    workPackages={workPackages}
                    onRowClick={handleRowClick}
                    onSort={handleSort}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between bg-[#0A0A0A] rounded-xl border border-gray-800 px-6 py-4 mt-4">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-3"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-400">
                            Page <span className="font-medium text-white">{currentPage}</span> of{' '}
                            <span className="font-medium text-white">{totalPages}</span>
                          </p>
                        </div>
                        <div>
                          <nav className="isolate inline-flex -space-x-px rounded-lg" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center rounded-l-lg border border-gray-800 bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center rounded-r-lg border border-gray-800 bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-[calc(100vh-400px)] min-h-[600px] bg-[#0A0A0A] rounded-xl border border-gray-800 p-4">
                  <CalendarView
                    workPackages={workPackages}
                    onWorkPackageClick={handleRowClick}
                    onDateChange={async (id, start, due) => {
                      try {
                        await workPackageService.updateWorkPackage(id, { start_date: start, due_date: due });
                        loadWorkPackages();
                      } catch (e) {
                        console.error('Failed to update date:', e);
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <WorkPackageFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateWorkPackage}
      />

      {/* Detail Drawer */}
      <WorkPackageDetailDrawer
        workPackage={selectedWorkPackage}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onUpdate={() => {
          loadWorkPackages();
          setIsDetailDrawerOpen(false);
        }}
      />
    </div>
  );
}

export default WorkPackagesPage;
