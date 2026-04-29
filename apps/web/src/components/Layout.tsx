import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { NotificationBell } from './NotificationBell';
import { notificationService } from '../services/NotificationService';
import { AIBrain } from './ai/AIBrain';
import { useAIStore } from '../stores/useAIStore';
import { CurrencyToggle } from './CurrencyToggle';
import { GlobalSearch } from './GlobalSearch';
import {
  Home, Building2, Package, Calendar, Clock,
  DollarSign, Users, LogOut, Menu, X,
  FileText, TrendingUp, Clipboard, AlertCircle, Sparkles, Box, Activity, Search
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services/projectService';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tokens, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleAIBrain } = useAIStore();

  const { data: projectsData } = useQuery({
    queryKey: ['projects-layout'],
    queryFn: () => projectService.listProjects({ per_page: 50 } as any),
    staleTime: 5 * 60 * 1000,
    enabled: !!tokens?.accessToken,
  });
  const pid = projectsData?.projects?.[0]?.id || '';

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (tokens?.accessToken) {
        notificationService.connect(tokens.accessToken);
        try {
          const r = await fetch(
            `${import.meta.env.VITE_API_URL || '/api/v1'}/projects`,
            { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
          );
          if (r.ok && mounted) {
            const d = await r.json();
            d.projects?.forEach((p: any) => notificationService.joinProject(p.id));
          }
        } catch {}
      } else {
        notificationService.disconnect();
      }
    };
    init();
    const onMention = (payload: any) => {
      toast(() => (
        <div className="flex flex-col">
          <span className="font-bold">You were mentioned!</span>
          <span className="text-sm">{payload.authorName} mentioned you</span>
        </div>
      ), { duration: 5000, icon: '💬' });
    };
    notificationService.on('comment:mentioned', onMention);
    return () => { mounted = false; notificationService.off('comment:mentioned', onMention); };
  }, [tokens?.accessToken]);

  const handleLogout = () => { logout(); navigate('/login'); setIsMobileMenuOpen(false); };

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  const pq = (path: string) => `${path}${pid ? `?project_id=${pid}` : ''}`;

  const navItems: [string, string, React.ReactNode][] = [
    ['/', 'Home', <Home className="w-[18px] h-[18px]" />],
    ['/projects', 'Projects', <Building2 className="w-[18px] h-[18px]" />],
    ['/work-packages', 'Packages', <Package className="w-[18px] h-[18px]" />],
    [pq('/contracts'), 'Contracts', <FileText className="w-[18px] h-[18px]" />],
    [pq('/change-orders'), 'Changes', <TrendingUp className="w-[18px] h-[18px]" />],
    [pq('/daily-reports'), 'Reports', <Clipboard className="w-[18px] h-[18px]" />],
    [pq('/snags'), 'Snags', <AlertCircle className="w-[18px] h-[18px]" />],
    ['/calendar', 'Calendar', <Calendar className="w-[18px] h-[18px]" />],
    ['/time-tracking', 'Time', <Clock className="w-[18px] h-[18px]" />],
    ['/cost-tracking', 'Costs', <DollarSign className="w-[18px] h-[18px]" />],
    ['/resource-management', 'Resources', <Users className="w-[18px] h-[18px]" />],
    ['/activity', 'Activity', <Activity className="w-[18px] h-[18px]" />],
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-x-hidden">
      <GlobalSearch />

      {/* ══════════════════════════════════════════════════════════
          TOP BAR — full width, exactly as before
          ══════════════════════════════════════════════════════ */}
      <header className="bg-[#0A0A0A] border-b border-gray-800 sticky top-0 z-50 shrink-0">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4 lg:px-5">

          {/* Logo — left */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-bold text-white">PROTECHT BIM</span>
              <span className="text-[10px] text-gray-500 tracking-wider">Construction Intelligence Platform</span>
            </div>
          </Link>

          {/* Right controls — exactly as before */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Search */}
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-gray-800 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:border-gray-700 transition-all">
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px]">⌘K</kbd>
            </button>
            {/* ARIA */}
            <button onClick={toggleAIBrain}
              className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-900/30 transition-all" title="ARIA AI">
              <Sparkles className="w-4 h-4" />
            </button>
            {/* Currency */}
            <CurrencyToggle />
            {/* Notifications */}
            <NotificationBell />
            {/* User */}
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111] border border-gray-800">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-white max-w-[90px] truncate">{user.name}</span>
                </div>
                <button onClick={handleLogout}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#111] transition-all" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
            {/* Mobile hamburger */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#111] transition-all">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          BODY ROW — left nav strip + content
          ══════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* ── VERTICAL NAV STRIP — desktop only ──────────────── */}
        <aside className="hidden lg:flex flex-col shrink-0 relative select-none"
          style={{ width: '148px' }}>

          {/* The glowing vertical line on the RIGHT edge of the strip */}
          <div className="absolute right-0 top-0 bottom-0 w-px pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.05) 5%, rgba(255,255,255,0.20) 12%, rgba(255,255,255,0.20) 88%, rgba(255,255,255,0.05) 95%, transparent 100%)',
              boxShadow: '0 0 6px 1px rgba(255,255,255,0.07)',
            }} />

          {/* Nav items scroll area */}
          <nav className="flex-1 flex flex-col py-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {navItems.map(([href, label, icon]) => {
              const activePath = href.split('?')[0];
              const active = isActive(activePath);
              return (
                <Link key={activePath} to={href}
                  className="relative flex items-center gap-2.5 pl-5 pr-4 py-2.5 transition-all duration-150 group"
                  style={{ color: active ? '#ffffff' : 'rgba(107,114,128,1)' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#e5e7eb'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(107,114,128,1)'; }}
                >
                  {/* Active: bright notch on the right line at this item's vertical center */}
                  {active && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px"
                      style={{
                        height: '28px',
                        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,1), transparent)',
                        boxShadow: '0 0 5px 2px rgba(255,255,255,0.5), 0 0 10px 3px rgba(96,165,250,0.35)',
                        zIndex: 10,
                      }} />
                  )}

                  {/* Icon — glows blue when active */}
                  <span className="shrink-0 transition-all duration-150 relative z-10"
                    style={{
                      color: active ? '#93c5fd' : 'currentColor',
                      filter: active
                        ? 'drop-shadow(0 0 5px rgba(96,165,250,0.9)) drop-shadow(0 0 10px rgba(96,165,250,0.5))'
                        : 'none',
                    }}>
                    {icon}
                  </span>

                  {/* Label — glows white when active */}
                  <span className="text-[13px] font-medium relative z-10 transition-all duration-150"
                    style={{
                      textShadow: active
                        ? '0 0 10px rgba(255,255,255,0.7), 0 0 20px rgba(96,165,250,0.45)'
                        : 'none',
                    }}>
                    {label}
                  </span>

                  {/* Hover shimmer */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                    style={{ background: 'rgba(255,255,255,0.03)' }} />
                </Link>
              );
            })}

            {/* BIM */}
            {pid && (() => {
              const active = location.pathname.includes('/bim');
              return (
                <Link to={`/projects/${pid}/bim`}
                  className="relative flex items-center gap-2.5 pl-5 pr-4 py-2.5 transition-all duration-150 group"
                  style={{ color: active ? '#ffffff' : 'rgba(107,114,128,1)' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#e5e7eb'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(107,114,128,1)'; }}
                >
                  {active && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px"
                      style={{ height: '28px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,1), transparent)', boxShadow: '0 0 5px 2px rgba(255,255,255,0.5), 0 0 10px 3px rgba(96,165,250,0.35)', zIndex: 10 }} />
                  )}
                  <span className="shrink-0" style={{ color: active ? '#93c5fd' : 'currentColor', filter: active ? 'drop-shadow(0 0 5px rgba(96,165,250,0.9))' : 'none' }}>
                    <Box className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[13px] font-medium" style={{ textShadow: active ? '0 0 10px rgba(255,255,255,0.7)' : 'none' }}>BIM</span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'rgba(255,255,255,0.03)' }} />
                </Link>
              );
            })()}
          </nav>

          {/* Logout at bottom of strip */}
          {user && (
            <div className="shrink-0 pb-4 pt-2 border-t border-white/[0.04]">
              <button onClick={handleLogout}
                className="flex items-center gap-2.5 pl-5 pr-4 py-2.5 w-full text-left text-gray-600 hover:text-white transition-all group"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <LogOut className="w-[18px] h-[18px] shrink-0" />
                <span className="text-[13px] font-medium">Logout</span>
              </button>
            </div>
          )}
        </aside>

        {/* ── MOBILE DRAWER ──────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 top-14">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0A0A0A] border-r border-gray-800 overflow-y-auto">
              <div className="px-3 py-3">
                <button onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#111] border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
                  <Search className="w-4 h-4" />
                  <span className="text-sm flex-1 text-left">Search…</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px]">⌘K</kbd>
                </button>
              </div>
              <nav className="px-2 pb-4 space-y-0.5">
                {navItems.map(([href, label, icon]) => {
                  const activePath = href.split('?')[0];
                  const active = isActive(activePath);
                  return (
                    <Link key={activePath} to={href} onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                      style={{
                        color: active ? '#ffffff' : 'rgba(156,163,175,1)',
                        background: active ? 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(37,99,235,0.08))' : 'transparent',
                        border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                      }}>
                      <span style={{ color: active ? '#93c5fd' : 'currentColor', filter: active ? 'drop-shadow(0 0 5px rgba(96,165,250,0.8))' : 'none' }}>{icon}</span>
                      <span className="text-sm font-medium" style={{ textShadow: active ? '0 0 10px rgba(255,255,255,0.5)' : 'none' }}>{label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ───────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-5 lg:px-6 min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      <AIBrain />
    </div>
  );
}

export default Layout;
