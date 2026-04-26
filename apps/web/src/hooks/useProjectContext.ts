/**
 * useProjectContext — resolves the active project ID for global pages.
 *
 * Pages like /snags, /daily-reports, /change-orders need a project_id to
 * fetch data. They can get it from:
 *   1. URL search param: ?project_id=xxx
 *   2. localStorage cache of last-used project
 *   3. First project from the API
 *
 * Returns { projectId, projects, isLoading, setProjectId }
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services/projectService';

const LAST_PROJECT_KEY = 'protecht_last_project_id';

export function useProjectContext() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlProjectId = searchParams.get('project_id') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['projects-context'],
    queryFn: () => projectService.listProjects({ per_page: 100 } as any),
    staleTime: 5 * 60 * 1000,
  });

  const projects = data?.projects ?? [];

  // Resolve active project: URL > localStorage > first
  const [projectId, _setProjectId] = useState<string>(() => {
    if (urlProjectId) return urlProjectId;
    return localStorage.getItem(LAST_PROJECT_KEY) || '';
  });

  // Once projects load, auto-select first if still no project
  useEffect(() => {
    if (!projectId && projects.length > 0) {
      const first = projects[0].id;
      _setProjectId(first);
      localStorage.setItem(LAST_PROJECT_KEY, first);
      setSearchParams({ project_id: first }, { replace: true });
    }
  }, [projects, projectId]);

  // Sync URL → state
  useEffect(() => {
    if (urlProjectId && urlProjectId !== projectId) {
      _setProjectId(urlProjectId);
      localStorage.setItem(LAST_PROJECT_KEY, urlProjectId);
    }
  }, [urlProjectId]);

  const setProjectId = (id: string) => {
    _setProjectId(id);
    localStorage.setItem(LAST_PROJECT_KEY, id);
    setSearchParams({ project_id: id }, { replace: true });
  };

  return { projectId, projects, isLoading, setProjectId };
}
