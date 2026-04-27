import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  const metrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p: any) => p.status === 'active').length,
    onHold: projects.filter((p: any) => p.status === 'on_hold').length,
    completed: projects.filter((p: any) => p.status === 'completed').length,
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

  useEffect(() => { loadProjects(); }, [filters.status, filters.favorites_only]);

  const handleCreateProject = async (data: CreateProjectRequest) => {
    await projectService.createProject(data);
    await loadProjects();
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await projectService.toggleFavorite(id, isFavorite);
      setProjects(projects.map(p => p.id === id ? { ...p, is_favorite: isFavorite } : p));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
    project.description?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-8 min-w-0">

      {/* Header */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Portfolio Command Center</h1>
            <p className="text-sm text-gray-400 mt-1">Manage and monitor all construction projects</p>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: 'Total', value: metrics.totalProjects, color: 'text-white' },
              { label: 'Active', value: metrics.activeProjects, color: 'text-green-400' },
              { label: 'On Hold', value: metrics.onHold, color: 'text-yellow-400' },
              { label: 'Done', value: metrics.completed, color: 'text-blue-400' },
            ].map(m => (
              <div key={m.label} className="bg-[#111] rounded-lg px-3 py-2 border border-gray-800">
                <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-[10px] text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          {/* Favorites */}
          <button onClick={() => setFilters({ ...filters, favorites_only: !filters.favorites_only })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${filters.favorites_only ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-[#0A0A0A] border-gray-800 text-gray-400 hover:border-gray-700'}`}>
            <Star className={`w-4 h-4 ${filters.favorites_only ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">Favorites</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Grid / List toggle — THIS IS WHAT MAKES IT WORK */}
          <div className="flex items-center bg-[#0A0A0A] border border-gray-800 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              title="List view"
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" /><span>New Project</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5 sticky top-20">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" />Filters
            </h3>
            <ProjectFilters filters={filters} onFilterChange={(f) => setFilters({ ...filters, ...f })} />
          </div>
        </div>

        {/* Projects */}
        <div className="lg:col-span-3 min-w-0">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5">
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={loadProjects} className="mt-2 text-xs text-red-400 underline">Retry</button>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />
              <p className="mt-4 text-sm text-gray-400">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Projects Found</h3>
              <p className="text-gray-400 mb-6 text-sm">
                {filters.search || filters.status.length > 0 || filters.favorites_only
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first project to get started.'}
              </p>
              {!filters.search && !filters.status.length && !filters.favorites_only && (
                <button onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
                  <Plus className="w-4 h-4" />Create First Project
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">
                  <span className="text-white font-semibold">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''}
                </p>
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  {viewMode === 'grid' ? <Grid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                  {viewMode === 'grid' ? 'Grid' : 'List'} view
                </span>
              </div>

              {/* ── GRID VIEW ── */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                  {filteredProjects.map((project) => (
                    <div key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5 cursor-pointer hover:bg-[#111] hover:border-gray-700 transition-all group">
                      {/* Status badge */}
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${
                          project.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          project.status === 'on_hold' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          project.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}>{(project.status || 'unknown').replace('_', ' ').toUpperCase()}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(project.id, !(project as any).is_favorite); }}
                          className="text-gray-600 hover:text-yellow-400 transition-colors">
                          <Star className={`w-4 h-4 ${(project as any).is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>
                      </div>
                      {/* Name */}
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1 line-clamp-2">{project.name}</h3>
                      {project.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.description}</p>
                      )}
                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Progress</span>
                          <span className="text-gray-400">{(project as any).progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(project as any).progress || 0}%` }} />
                        </div>
                      </div>
                      {/* Dates */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' }) : 'No start'}
                        </span>
                        <span className="text-xs text-gray-500">→</span>
                        <span className="text-xs text-gray-500">
                          {project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' }) : 'No end'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── LIST VIEW ── */}
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {filteredProjects.map((project) => (
                    <div key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-4 cursor-pointer hover:bg-[#111] hover:border-gray-700 transition-all group flex items-center gap-4 min-w-0">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-blue-400" />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">{project.name}</h3>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border shrink-0 ${
                            project.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            project.status === 'on_hold' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            project.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>{(project.status || '').replace('_', ' ').toUpperCase()}</span>
                        </div>
                        {project.description && (
                          <p className="text-xs text-gray-500 truncate">{project.description}</p>
                        )}
                      </div>
                      {/* Progress */}
                      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-24">
                        <span className="text-xs text-gray-400">{(project as any).progress || 0}%</span>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(project as any).progress || 0}%` }} />
                        </div>
                      </div>
                      {/* Date range */}
                      <div className="hidden md:flex items-center gap-1 shrink-0 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : 'No deadline'}</span>
                      </div>
                      {/* Favorite */}
                      <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(project.id, !(project as any).is_favorite); }}
                        className="text-gray-600 hover:text-yellow-400 transition-colors shrink-0">
                        <Star className={`w-4 h-4 ${(project as any).is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ProjectFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateProject} />
    </div>
  );
}

export default ProjectsPage;
