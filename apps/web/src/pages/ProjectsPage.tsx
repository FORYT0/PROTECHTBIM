import { useState, useEffect } from 'react';
import { ProjectStatus, Project, CreateProjectRequest } from '@protecht-bim/shared-types';
import { projectService } from '../services/projectService';
import ProjectCard from '../components/ProjectCard';
import ProjectFilters from '../components/ProjectFilters';
import ProjectFormModal from '../components/ProjectFormModal';
import {
  Building2, TrendingUp, DollarSign, Users, AlertTriangle,
  CheckCircle, Target, Grid, List, Plus, Search,
  Filter, Star, Calendar, Activity
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState({
    status: [] as ProjectStatus[],
    favorites_only: false,
    search: '',
  });

  // Mock portfolio metrics - replace with real API calls
  const mockPortfolioMetrics = {
    totalProjects: 24,
    activeProjects: 18,
    totalValue: 45000000,
    totalBudget: 38500000,
    avgCompletion: 67,
    onTrack: 15,
    atRisk: 3,
    delayed: 2,
    teamMembers: 156,
    avgUtilization: 82
  };

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectService.listProjects({
        status: filters.status.length > 0 ? filters.status : undefined,
        favorites_only: filters.favorites_only || undefined,
      });
      setProjects(response.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [filters.status, filters.favorites_only]);

  const handleCreateProject = async (data: CreateProjectRequest) => {
    await projectService.createProject(data);
    await loadProjects();
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await projectService.toggleFavorite(id, isFavorite);
      setProjects(projects.map(p => 
        p.id === id ? { ...p, is_favorite: isFavorite } : p
      ));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
    project.description?.toLowerCase().includes(filters.search.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
      {/* PORTFOLIO COMMAND HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Portfolio Command Center</h1>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Projects:</span>
                <span className="text-white font-semibold">{mockPortfolioMetrics.totalProjects}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Active Projects:</span>
                <span className="text-green-400 font-semibold">{mockPortfolioMetrics.activeProjects}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Portfolio Value:</span>
                <span className="text-white font-semibold">{formatCurrency(mockPortfolioMetrics.totalValue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Budget:</span>
                <span className="text-white font-semibold">{formatCurrency(mockPortfolioMetrics.totalBudget)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - EXECUTIVE METRICS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">Avg Completion</span>
              </div>
              <p className="text-2xl font-bold text-white">{mockPortfolioMetrics.avgCompletion}%</p>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-400 h-1.5 rounded-full transition-all" 
                  style={{ width: `${mockPortfolioMetrics.avgCompletion}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-xs text-gray-400">On Track</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{mockPortfolioMetrics.onTrack}</p>
              <span className="text-xs text-gray-400">{Math.round((mockPortfolioMetrics.onTrack / mockPortfolioMetrics.activeProjects) * 100)}% of active</span>
            </div>

            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <span className="text-xs text-gray-400">At Risk</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">{mockPortfolioMetrics.atRisk}</p>
              <span className="text-xs text-orange-400">Needs attention</span>
            </div>

            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-xs text-gray-400">Team</span>
              </div>
              <p className="text-2xl font-bold text-white">{mockPortfolioMetrics.teamMembers}</p>
              <span className="text-xs text-cyan-400">{mockPortfolioMetrics.avgUtilization}% utilized</span>
            </div>
          </div>
        </div>
      </div>

      {/* PORTFOLIO KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Projects */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{mockPortfolioMetrics.totalProjects}</p>
          <p className="text-xs text-gray-400 mt-1">Total Projects</p>
          <p className="text-xs text-green-400 mt-1">+3 this quarter</p>
        </div>

        {/* Active Projects */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-400">75%</span>
          </div>
          <p className="text-2xl font-bold text-white">{mockPortfolioMetrics.activeProjects}</p>
          <p className="text-xs text-gray-400 mt-1">Active Projects</p>
          <div className="w-full bg-gray-800 rounded-full h-1 mt-2">
            <div className="bg-green-400 h-1 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(mockPortfolioMetrics.totalValue / 1000000)}M</p>
          <p className="text-xs text-gray-400 mt-1">Portfolio Value</p>
          <p className="text-xs text-green-400 mt-1">+12% YoY</p>
        </div>

        {/* On Track */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-400">83%</span>
          </div>
          <p className="text-2xl font-bold text-white">{mockPortfolioMetrics.onTrack}</p>
          <p className="text-xs text-gray-400 mt-1">On Track</p>
          <p className="text-xs text-green-400 mt-1">Performing well</p>
        </div>

        {/* At Risk */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span className="text-xs text-orange-400">17%</span>
          </div>
          <p className="text-2xl font-bold text-white">{mockPortfolioMetrics.atRisk + mockPortfolioMetrics.delayed}</p>
          <p className="text-xs text-gray-400 mt-1">At Risk / Delayed</p>
          <p className="text-xs text-orange-400 mt-1">Requires action</p>
        </div>

        {/* Team Utilization */}
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span className="text-xs text-cyan-400">{mockPortfolioMetrics.avgUtilization}%</span>
          </div>
          <p className="text-2xl font-bold text-white">{mockPortfolioMetrics.teamMembers}</p>
          <p className="text-xs text-gray-400 mt-1">Team Members</p>
          <div className="w-full bg-gray-800 rounded-full h-1 mt-2">
            <div className="bg-cyan-400 h-1 rounded-full" style={{ width: `${mockPortfolioMetrics.avgUtilization}%` }}></div>
          </div>
        </div>
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
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Button */}
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {(filters.status.length > 0 || filters.favorites_only) && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                {filters.status.length + (filters.favorites_only ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Favorites Toggle */}
          <button
            onClick={() => setFilters({ ...filters, favorites_only: !filters.favorites_only })}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.favorites_only
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-[#0A0A0A] border border-gray-800 text-gray-300 hover:bg-[#111111]'
            }`}
          >
            <Star className={`w-4 h-4 ${filters.favorites_only ? 'fill-current' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>

        {/* View Mode & New Project */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0A0A0A] border border-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* New Project Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
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
            <ProjectFilters
              filters={filters}
              onFilterChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
            />
          </div>
        </div>

        {/* Projects List */}
        <div className="lg:col-span-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">Unable to load projects</p>
                  <p className="text-xs text-gray-400 mt-1">{error}</p>
                  <button
                    onClick={loadProjects}
                    className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <p className="mt-4 text-gray-400">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Projects Found</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {filters.search || filters.status.length > 0 || filters.favorites_only
                  ? 'No projects match your filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first project.'}
              </p>
              {!filters.search && filters.status.length === 0 && !filters.favorites_only && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Project</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">
                  Showing <span className="text-white font-semibold">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Last updated: Just now</span>
                </div>
              </div>

              {/* Projects Grid/List */}
              <div className={viewMode === 'grid' ? 'space-y-4' : 'space-y-3'}>
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}

export default ProjectsPage;
