import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { NotificationBell } from './NotificationBell';
import { notificationService } from '../services/NotificationService';
import { AIBrain } from './ai/AIBrain';
import { useAIStore } from '../stores/useAIStore';
import {
  Home, Building2, Package, Calendar, Clock,
  DollarSign, Users, LogOut, Menu, X,
  FileText, TrendingUp, Clipboard, AlertCircle, Sparkles, Box, ChevronDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services/projectService';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tokens, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { toggleAIBrain } = useAIStore();

  // Load projects for global pages that need a project context
  const { data: projectsData } = useQuery({
    queryKey: ['projects-layout'],
    queryFn: () => projectService.listProjects({ per_page: 50 } as any),
    staleTime: 5 * 60 * 1000,
    enabled: !!tokens?.accessToken,
  });
  const firstProjectId = projectsData?.projects?.[0]?.id || '';

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (tokens?.accessToken) {
        notificationService.connect(tokens.accessToken);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || '/api/v1'}/projects`,
            { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
          );
          if (response.ok && isMounted) {
            const data = await response.json();
            data.projects?.forEach((p: any) => notificationService.joinProject(p.id));
          }
        } catch {}
      } else {
        notificationService.disconnect();
      }
    };
    init();
    const handleMention = (payload: any) => {
      toast(() => (
        <div className="flex flex-col">
          <span className="font-bold">You were mentioned!</span>
          <span className="text-sm">{payload.authorName} mentioned you in {payload.entitySubject}</span>
        </div>
      ), { duration: 5000, icon: '💬' });
    };
    notificationService.on('comment:mentioned', handleMention);
    return () => { isMounted = false; notificationService.off('comment:mentioned', handleMention); };
  }, [tokens?.accessToken]);

  const handleLogout = () => { logout(); navigate('/login'); setIsMobileMenuOpen(false); };
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const navCls = (path: string) => {
    const base = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap';
    return isActive(path)
      ? `${base} bg-blue-600 text-white shadow-lg shadow-blue-500/20`
      : `${base} text-gray-400 hover:text-white hover:bg-[#111]`;
  };

  const mobileCls = (path: string) => {
    const base = 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all';
    return isActive(path)
      ? `${base} bg-blue-600 text-white`
      : `${base} text-gray-400 hover:text-white hover:bg-[#111]`;
  };

  // Build project-scoped links
  const projectLink = (path: string) =>
    firstProjectId ? `/projects/${firstProjectId}/${path}` : '/projects';

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Header */}
      <header className="bg-[#0A0A0A] border-b border-gray-800 sticky top-0 z-50">
        <nav className="px-3 sm:px-4 lg:px-6 max-w-[100vw]">
          <div className="flex h-14 items-center justify-between gap-2 min-w-0">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-bold text-white leading-none">PROTECHT</span>
                <span className="text-[10px] text-gray-500 leading-none">BIM Platform</span>
              </div>
            </Link>

            {/* Desktop Nav — scrollable pill strip, no wrapping */}
            <div className="hidden lg:flex items-center gap-0.5 overflow-x-auto flex-1 mx-3 scrollbar-none" style={{scrollbarWidth:'none'}}>
              <Link to="/" className={navCls('/')}><Home className="w-3.5 h-3.5" />Home</Link>
              <Link to="/projects" className={navCls('/projects')}><Building2 className="w-3.5 h-3.5" />Projects</Link>
              <Link to="/work-packages" className={navCls('/work-packages')}><Package className="w-3.5 h-3.5" />Packages</Link>
              <Link to={`/contracts${firstProjectId ? `?project_id=${firstProjectId}` : ''}`} className={navCls('/contracts')}><FileText className="w-3.5 h-3.5" />Contracts</Link>
              <Link to={`/change-orders${firstProjectId ? `?project_id=${firstProjectId}` : ''}`} className={navCls('/change-orders')}><TrendingUp className="w-3.5 h-3.5" />Changes</Link>
              <Link to={`/daily-reports${firstProjectId ? `?project_id=${firstProjectId}` : ''}`} className={navCls('/daily-reports')}><Clipboard className="w-3.5 h-3.5" />Reports</Link>
              <Link to={`/snags${firstProjectId ? `?project_id=${firstProjectId}` : ''}`} className={navCls('/snags')}><AlertCircle className="w-3.5 h-3.5" />Snags</Link>
              <Link to="/calendar" className={navCls('/calendar')}><Calendar className="w-3.5 h-3.5" />Calendar</Link>
              <Link to="/time-tracking" className={navCls('/time-tracking')}><Clock className="w-3.5 h-3.5" />Time</Link>
              <Link to="/cost-tracking" className={navCls('/cost-tracking')}><DollarSign className="w-3.5 h-3.5" />Costs</Link>
              <Link to="/resource-management" className={navCls('/resource-management')}><Users className="w-3.5 h-3.5" />Resources</Link>
              {firstProjectId && (
                <Link to={projectLink('bim')} className={navCls('/bim')}><Box className="w-3.5 h-3.5" />BIM</Link>
              )}
            </div>

            {/* Desktop Right */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              {user && (
                <>
                  <button onClick={toggleAIBrain} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-900/30 transition-all" title="AI Copilot">
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <NotificationBell />
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111] border border-gray-800">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-white max-w-[100px] truncate">{user.name}</span>
                  </div>
                  <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#111] transition-all" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile Right */}
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              {user && (
                <>
                  <button onClick={toggleAIBrain} className="p-1.5 text-blue-400"><Sparkles className="w-4 h-4" /></button>
                  <NotificationBell />
                </>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#111] transition-all"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-800 bg-[#0A0A0A] max-h-[80vh] overflow-y-auto">
            <div className="space-y-0.5 px-3 py-3">
              {[
                ['/','Home',<Home className="w-5 h-5"/>],
                ['/projects','Projects',<Building2 className="w-5 h-5"/>],
                ['/work-packages','Work Packages',<Package className="w-5 h-5"/>],
                [`/contracts${firstProjectId?`?project_id=${firstProjectId}`:''}`,'/contracts','Contracts',<FileText className="w-5 h-5"/>],
                [`/change-orders${firstProjectId?`?project_id=${firstProjectId}`:''}`,'/change-orders','Change Orders',<TrendingUp className="w-5 h-5"/>],
                [`/daily-reports${firstProjectId?`?project_id=${firstProjectId}`:''}`,'/daily-reports','Daily Reports',<Clipboard className="w-5 h-5"/>],
                [`/snags${firstProjectId?`?project_id=${firstProjectId}`:''}`,'/snags','Snag List',<AlertCircle className="w-5 h-5"/>],
                ['/calendar','Calendar',<Calendar className="w-5 h-5"/>],
                ['/time-tracking','Time Tracking',<Clock className="w-5 h-5"/>],
                ['/cost-tracking','Cost Tracking',<DollarSign className="w-5 h-5"/>],
                ['/resource-management','Resources',<Users className="w-5 h-5"/>],
              ].map(([to, label, icon]: any[]) => {
                const href = typeof to === 'string' ? to : to;
                const activePath = href.split('?')[0];
                return (
                  <Link key={activePath} to={href} className={mobileCls(activePath)} onClick={() => setIsMobileMenuOpen(false)}>
                    {icon}<span>{label}</span>
                  </Link>
                );
              })}
            </div>
            {user && (
              <div className="border-t border-gray-800 px-3 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white truncate max-w-[150px]">{user.name}</span>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#111]">
                    <LogOut className="w-4 h-4" /><span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[100vw] overflow-x-hidden px-3 py-6 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto min-w-0">
          <Outlet />
        </div>
      </main>

      <AIBrain />
    </div>
  );
}

export default Layout;
