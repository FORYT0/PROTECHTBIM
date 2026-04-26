import { Building2, ChevronDown } from 'lucide-react';

interface Project { id: string; name: string; status: string; }

interface Props {
  projectId: string;
  projects: Project[];
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export function ProjectPicker({ projectId, projects, onSelect, isLoading }: Props) {
  const selected = projects.find(p => p.id === projectId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-gray-800 text-sm text-gray-500 animate-pulse">
        <Building2 className="w-4 h-4" />
        <span>Loading projects…</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-gray-800 text-sm text-gray-500">
        <Building2 className="w-4 h-4" />
        <span>No projects found</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <select
        value={projectId}
        onChange={e => onSelect(e.target.value)}
        className="appearance-none pl-9 pr-8 py-2 rounded-lg bg-[#0A0A0A] border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer hover:border-gray-600 transition-colors"
        style={{ minWidth: 200, maxWidth: 320 }}
      >
        {!projectId && <option value="" disabled>Select a project…</option>}
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  );
}
