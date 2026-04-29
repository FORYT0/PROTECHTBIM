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
    ['/', 'Home', <Home className="w-5 h-5" />],
    ['/projects', 'Projects', <Building2 className="w-5 h-5" />],
    ['/work-packages', 'Packages', <Package className="w-5 h-5" />],
    [pq('/contracts'), 'Contracts', <FileText className="w-5 h-5" />],
    [pq('/change-orders'), 'Changes', <TrendingUp className="w-5 h-5" />],
    [pq('/daily-reports'), 'Reports', <Clipboard className="w-5 h-5" />],
    [pq('/snags'), 'Snags', <AlertCircle className="w-5 h-5" />],
    ['/calendar', 'Calendar', <Calendar className="w-5 h-5" />],
    ['/time-tracking', 'Time', <Clock className="w-5 h-5" />],
    ['/cost-tracking', 'Costs', <DollarSign className="w-5 h-5" />],
    ['/resource-management', 'Resources', <Users className="w-5 h-5" />],
    ['/activity', 'Activity', <Activity className="w-5 h-5" />],
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-x-hidden">
      <GlobalSearch />

      {/* ══════════════════════════════════════════════════
          TOP BAR — full width, logo left, controls right
          ══════════════════════════════════════════════════ */}
      <header className="bg-[#0A0A0A] border-b border-gray-800/60 sticky top-0 z-50 shrink-0 h-14 flex items-center px-3 sm:px-4 lg:px-5 justify-between">

        {/* Logo left */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-bold text-white">PROTECHT BIM</span>
            <span className="text-[10px] text-gray-500 tracking-wider">Construction Intelligence Platform</span>
          </div>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-gray-800 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:border-gray-700 transition-all">
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px]">⌘K</kbd>
          </button>
          {/* ARIA */}
          <button onClick={toggleAIBrain} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-900/30 transition-all" title="ARIA AI">
            <Sparkles className="w-4 h-4" />
          </button>
          {/* Currency */}
          <CurrencyToggle />
          {/* Notifications */}
          <NotificationBell />
          {/* User pill */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111] border border-gray-800">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-white max-w-[90px] truncate">{user.name}</span>
            </div>
          )}
          {/* Logout */}
          {user && (
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#111] transition-all" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          )}
          {/* Mobile hamburger */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          BELOW TOP BAR: left nav strip + content
          ══════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* ── VERTICAL NAV STRIP ── desktop only ─────────── */}
        <aside className="hidden lg:flex flex-col shrink-0 relative" style={{ width: '88px' }}>

          {/* THE GLOWING VERTICAL LINE — runs along the LEFT edge of items */}
          {/* Positioned at x=18px from left (centre of the icon column) */}
          <div className="absolute left-[18px] top-0 bottom-0 w-px pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.04) 4%, rgba(255,255,255,0.22) 10%, rgba(255,255,255,0.22) 90%, rgba(255,255,255,0.04) 96%, transparent 100%)',
              boxShadow: '0 0 6px 1px rgba(255,255,255,0.10)',
            }} />

          {/* Nav items */}
          <nav className="flex-1 flex flex-col pt-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {navItems.map(([href, label, icon]) => {
              const activePath = href.split('?')[0];
              const active = isActive(activePath);
              return (
                <Link key={activePath} to={href}
                  className="relative flex flex-col items-center justify-center gap-1 py-3 transition-all duration-150 group"
                  style={{ color: active ? '#ffffff' : 'rgba(107,114,128,1)' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#d1d5db'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(107,114,128,1)'; }}
                >
                  {/* Bright glowing dot/segment on the line at this item's vertical center — active only */}
                  {active && (
                    <div className="absolute left-[18px] top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ zIndex: 10 }}>
                      {/* Bright white segment over the line */}
                      <div style={{
                        width: '1px',
                        height: '36px',
                        marginLeft: '0px',
                        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,1), transparent)',
                        boxShadow: '0 0 4px 2px rgba(255,255,255,0.6), 0 0 10px 4px rgba(96,165,250,0.45)',
                      }} />
                    </div>
                  )}

                  {/* Icon — centred horizontally at x=44px (the centre of the 88px strip) */}
                  <span className="relative z-10 shrink-0 transition-all duration-150 ml-6"
                    style={{
                      color: active ? '#ffffff' : 'currentColor',
                      filter: active
                        ? 'drop-shadow(0 0 6px rgba(255,255,255,0.8)) drop-shadow(0 0 12px rgba(96,165,250,0.55))'
                        : 'none',
                    }}>
                    {icon}
                  </span>

                  {/* Label — small text below the icon */}
                  <span className="relative z-10 text-[11px] font-medium leading-none ml-6"
                    style={{
                      textShadow: active
                        ? '0 0 8px rgba(255,255,255,0.7), 0 0 16px rgba(96,165,250,0.5)'
                        : 'none',
                    }}>
                    {label}
                  </span>

                  {/* Subtle hover bg */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                    style={{ background: 'rgba(255,255,255,0.03)' }} />
                </Link>
              );
            })}

            {/* BIM if project loaded */}
            {pid && (() => {
              const active = location.pathname.includes('/bim');
              return (
                <Link to={`/projects/${pid}/bim`}
                  className="relative flex flex-col items-center justify-center gap-1 py-3 transition-all duration-150 group"
                  style={{ color: active ? '#ffffff' : 'rgba(107,114,128,1)' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#d1d5db'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(107,114,128,1)'; }}
                >
                  {active && (
                    <div className="absolute left-[18px] top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ zIndex: 10 }}>
                      <div style={{ width: '1px', height: '36px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,1), transparent)', boxShadow: '0 0 4px 2px rgba(255,255,255,0.6), 0 0 10px 4px rgba(96,165,250,0.45)' }} />
                    </div>
                  )}
                  <span className="relative z-10 ml-6" style={{ color: active ? '#ffffff' : 'currentColor', filter: active ? 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' : 'none' }}>
                    <Box className="w-5 h-5" />
                  </span>
                  <span className="relative z-10 text-[11px] font-medium ml-6" style={{ textShadow: active ? '0 0 8px rgba(255,255,255,0.7)' : 'none' }}>BIM</span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'rgba(255,255,255,0.03)' }} />
                </Link>
              );
            })()}
          </nav>

          {/* Logout at very bottom */}
          <div className="shrink-0 pb-5">
            <button onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-1 py-3 w-full text-gray-600 hover:text-white transition-all group"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              title="Logout">
              <LogOut className="w-5 h-5 ml-6" />
              <span className="text-[11px] font-medium ml-6">Logout</span>
            </button>
          </div>
        </aside>

        {/* ── MOBILE DRAWER ──────────────────────────────── */}
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
              {user && (
                <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-white">{user.name}</span>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#111] rounded-lg">
                    <LogOut className="w-4 h-4" />Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ───────────────────────────────── */}
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
