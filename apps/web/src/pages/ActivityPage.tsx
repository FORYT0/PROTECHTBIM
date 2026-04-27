import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '../hooks/useProjectContext';
import { ProjectPicker } from '../components/ProjectPicker';
import { ActivityFeed } from '../components/ActivityFeed';
import { InteractiveCard } from '../components/InteractiveCard';
import { Activity, TrendingUp, Users, Clock, FileText, Package, AlertTriangle } from 'lucide-react';

function ActivityPage() {
  const navigate = useNavigate();
  const { projectId, projects, isLoading: projectsLoading, setProjectId } = useProjectContext();

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* Header */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Feed</h1>
            <p className="text-sm text-gray-400 mt-1">Track all changes and events across your project</p>
          </div>
          <ProjectPicker projectId={projectId} projects={projects} onSelect={setProjectId} isLoading={projectsLoading} />
        </div>
      </div>

      {/* No project */}
      {!projectId && !projectsLoading && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-12 text-center">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Select a Project</h3>
          <p className="text-gray-400 text-sm mb-5">Choose a project above to view its activity feed.</p>
          <button onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
            Browse Projects
          </button>
        </div>
      )}

      {/* Activity feed */}
      {projectId && (
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
          <ActivityFeed projectId={projectId} title="Project Activity" pageSize={25} />
        </div>
      )}
    </div>
  );
}

export default ActivityPage;
export { ActivityPage };
