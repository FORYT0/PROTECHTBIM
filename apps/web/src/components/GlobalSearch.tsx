import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Building2, Package, FileText, TrendingUp,
  AlertTriangle, Clipboard, Clock, X, ArrowRight, Hash
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { snagService } from '../services/snagService';
import { changeOrderService } from '../services/changeOrderService';

interface SearchResult {
  id: string;
  type: 'project' | 'snag' | 'change-order' | 'work-package' | 'route';
  title: string;
  subtitle?: string;
  href: string;
  icon: any;
  iconColor: string;
}

const STATIC_ROUTES: SearchResult[] = [
  { id: 'r1', type: 'route', title: 'Projects', subtitle: 'View all projects', href: '/projects', icon: Building2, iconColor: 'text-blue-400' },
  { id: 'r2', type: 'route', title: 'Work Packages', subtitle: 'Tasks and milestones', href: '/work-packages', icon: Package, iconColor: 'text-orange-400' },
  { id: 'r3', type: 'route', title: 'Contracts', subtitle: 'Contract administration', href: '/contracts', icon: FileText, iconColor: 'text-blue-400' },
  { id: 'r4', type: 'route', title: 'Change Orders', subtitle: 'Variations and approvals', href: '/change-orders', icon: TrendingUp, iconColor: 'text-purple-400' },
  { id: 'r5', type: 'route', title: 'Snag List', subtitle: 'Site defects and quality', href: '/snags', icon: AlertTriangle, iconColor: 'text-red-400' },
  { id: 'r6', type: 'route', title: 'Daily Reports', subtitle: 'Site progress diaries', href: '/daily-reports', icon: Clipboard, iconColor: 'text-teal-400' },
  { id: 'r7', type: 'route', title: 'Time Tracking', subtitle: 'Log and review hours', href: '/time-tracking', icon: Clock, iconColor: 'text-yellow-400' },
  { id: 'r8', type: 'route', title: 'Calendar', subtitle: 'Schedule and timeline', href: '/calendar', icon: Hash, iconColor: 'text-cyan-400' },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(STATIC_ROUTES);
      setSelected(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(STATIC_ROUTES); return; }
    setLoading(true);
    try {
      const lq = q.toLowerCase();
      const filtered = STATIC_ROUTES.filter(r =>
        r.title.toLowerCase().includes(lq) || r.subtitle?.toLowerCase().includes(lq)
      );

      // Search projects
      const pr = await projectService.listProjects({ per_page: 100 } as any);
      const projectResults: SearchResult[] = (pr.projects || [])
        .filter((p: any) => p.name.toLowerCase().includes(lq) || (p.description || '').toLowerCase().includes(lq))
        .slice(0, 4)
        .map((p: any) => ({
          id: p.id, type: 'project' as const, title: p.name,
          subtitle: p.status?.replace('_', ' ') || 'Project',
          href: `/projects/${p.id}`, icon: Building2, iconColor: 'text-blue-400',
        }));

      setResults([...projectResults, ...filtered]);
      setSelected(0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.href);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) { handleSelect(results[selected]); }
  };

  const typeLabel = (t: string) => ({ project: 'Project', snag: 'Snag', 'change-order': 'Change Order', route: 'Navigate', 'work-package': 'Package' }[t] || t);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Search Panel */}
      <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-800">
          <Search className={`w-4 h-4 shrink-0 ${loading ? 'text-blue-400 animate-pulse' : 'text-gray-500'}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, snags, routes…"
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-400">ESC</kbd>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No results for "{query}"</div>
          ) : (
            results.map((r, i) => (
              <div key={r.id}
                onClick={() => handleSelect(r)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${i === selected ? 'bg-blue-600/20 text-white' : 'hover:bg-[#111] text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-lg bg-[#111] border border-gray-800 flex items-center justify-center shrink-0 ${i === selected ? 'border-blue-500/40' : ''}`}>
                  <r.icon className={`w-4 h-4 ${r.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  {r.subtitle && <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-500">{typeLabel(r.type)}</span>
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-800 flex items-center gap-4 text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700">↑↓</kbd>navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700">↵</kbd>select</span>
          <span className="ml-auto">⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}

export default GlobalSearch;
