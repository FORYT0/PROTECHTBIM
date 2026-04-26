/**
 * useProjectContext — resolves the active project ID for global pages.
 *
 * Auto-selects the first project from the API when no project_id is in the URL.
 * Caches the last-used project in localStorage.
 */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services/projectService';

const LAST_PROJECT_KEY = 'protecht_last_project_id';

export function useProjectContext() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlProjectId = searchParams.get('project_id') || '';
  const initialized = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects-context'],
    queryFn: () => projectService.listProjects({ per_page: 100 } as any),
    staleTime: 10 * 60 * 1000,   // 10 minutes — rarely changes
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,   // don't re-fetch on tab switch
  });

  const projects = data?.projects ?? [];

  // Initial value: URL param > localStorage > ''
  const [projectId, _setProjectId] = useState<string>(() => {
    if (urlProjectId) return urlProjectId;
    return localStorage.getItem(LAST_PROJECT_KEY) || '';
  });

  // Once projects are loaded, pick first if we still have no project
  // Use ref to only run this once to avoid double-renders
  useEffect(() => {
    if (initialized.current) return;
    if (isLoading) return;
    if (projects.length === 0) return;

    const cached = localStorage.getItem(LAST_PROJECT_KEY);
    const target = urlProjectId || cached || projects[0]?.id || '';

    if (!target) return;

    initialized.current = true;

    // Validate the cached/url project still exists
    const exists = projects.some(p => p.id === target) ? target : projects[0]?.id;

    if (exists && exists !== projectId) {
      _setProjectId(exists);
      localStorage.setItem(LAST_PROJECT_KEY, exists);
      // Only update URL if it doesn't already have the param
      if (!urlProjectId) {
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('project_id', exists);
          return next;
        }, { replace: true });
      }
    } else if (!projectId && exists) {
      _setProjectId(exists);
      localStorage.setItem(LAST_PROJECT_KEY, exists);
    }
  }, [isLoading, projects.length]); // Only depends on loading state and project count

  // Sync URL → state when user navigates with a project_id param
  useEffect(() => {
    if (urlProjectId && urlProjectId !== projectId) {
      _setProjectId(urlProjectId);
      localStorage.setItem(LAST_PROJECT_KEY, urlProjectId);
    }
  }, [urlProjectId]);

  const setProjectId = (id: string) => {
    _setProjectId(id);
    localStorage.setItem(LAST_PROJECT_KEY, id);
    initialized.current = true; // prevent auto-select overriding user choice
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('project_id', id);
      return next;
    }, { replace: true });
  };

  return { projectId, projects, isLoading, setProjectId };
}
