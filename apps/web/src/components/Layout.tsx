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
    <div className="min-h-screen bg-black flex">
      {/* ── GLOBAL SEARCH ─────────────────────────────────────── */}
      <GlobalSearch />

      {/* ══════════════════════════════════════════════════════════
          VERTICAL SIDEBAR — desktop only (hidden on mobile)
          ══════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-50 select-none"
        style={{ width: '200px' }}>

        {/* The glowing vertical line — sits on the right edge of the sidebar */}
        <div className="absolute right-0 top-0 h-full w-px"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.06) 8%, rgba(255,255,255,0.18) 15%, rgba(255,255,255,0.18) 85%, rgba(255,255,255,0.06) 92%, transparent 100%)',
            boxShadow: '0 0 8px 1px rgba(255,255,255,0.08)',
          }} />

        {/* Sidebar background */}
        <div className="absolute inset-0 bg-[#060608]" />

        {/* Content wrapper */}
        <div className="relative flex flex-col h-full z-10">

          {/* ── LOGO ───────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 px-5 pt-6 pb-5 group shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-bold text-white tracking-wide">PROTECHT</span>
              <span className="text-[9px] text-gray-600 tracking-widest mt-0.5">BIM PLATFORM</span>
            </div>
          </Link>

          {/* ── NAV ITEMS ──────────────────────────────────────── */}
          <nav className="flex-1 flex flex-col gap-0.5 px-3 pb-3 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}>

            {navItems.map(([href, label, icon]) => {
              const activePath = href.split('?')[0];
              const active = isActive(activePath);
              return (
                <Link key={activePath} to={href}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
                  style={{
                    color: active ? '#ffffff' : 'rgba(156,163,175,1)',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(156,163,175,1)'; }}
                >
                  {/* Active background glow */}
                  {active && (
                    <div className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0.08) 100%)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        boxShadow: 'inset 0 0 20px rgba(59,130,246,0.05)',
                      }} />
                  )}

                  {/* Hover background */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ background: active ? 'transparent' : 'rgba(255,255,255,0.04)' }} />

                  {/* Active left indicator dot on the glow line */}
                  {active && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-px h-8"
                      style={{
                        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.9), transparent)',
                        boxShadow: '0 0 6px 2px rgba(255,255,255,0.4), 0 0 12px 3px rgba(59,130,246,0.3)',
                      }} />
                  )}

                  {/* Icon */}
                  <span className="relative z-10 shrink-0 transition-all duration-200"
                    style={{
                      filter: active
                        ? 'drop-shadow(0 0 6px rgba(96,165,250,0.8)) drop-shadow(0 0 12px rgba(96,165,250,0.4))'
                        : 'none',
                      color: active ? '#93c5fd' : 'currentColor',
                    }}>
                    {icon}
                  </span>

                  {/* Label */}
                  <span className="relative z-10 text-sm font-medium tracking-wide transition-all duration-200"
                    style={{
                      textShadow: active ? '0 0 12px rgba(255,255,255,0.6), 0 0 24px rgba(96,165,250,0.4)' : 'none',
                    }}>
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* BIM link if project exists */}
            {pid && (() => {
              const active = isActive('/bim') || location.pathname.includes('/bim');
              return (
                <Link to={`/projects/${pid}/bim`}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
                  style={{ color: active ? '#ffffff' : 'rgba(156,163,175,1)' }}>
                  {active && (
                    <div className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0.08) 100%)', border: '1px solid rgba(59,130,246,0.2)' }} />
                  )}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(255,255,255,0.04)' }} />
                  <span className="relative z-10 shrink-0" style={{ filter: active ? 'drop-shadow(0 0 6px rgba(96,165,250,0.8))' : 'none', color: active ? '#93c5fd' : 'currentColor' }}>
                    <Box className="w-[18px] h-[18px]" />
                  </span>
                  <span className="relative z-10 text-sm font-medium" style={{ textShadow: active ? '0 0 12px rgba(255,255,255,0.6)' : 'none' }}>
                    BIM
                  </span>
                </Link>
              );
            })()}
          </nav>

          {/* ── BOTTOM ACTIONS ─────────────────────────────────── */}
          <div className="px-3 pb-5 flex flex-col gap-1 shrink-0 border-t border-white/[0.04] pt-3">

            {/* Search */}
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-white transition-all group"
              style={{ background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <Search className="w-[18px] h-[18px] shrink-0" />
              <span className="text-sm font-medium flex-1 text-left">Search</span>
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-600">⌘K</kbd>
            </button>

            {/* ARIA */}
            <button onClick={toggleAIBrain}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-blue-400 transition-all group"
              style={{ background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <Sparkles className="w-[18px] h-[18px] shrink-0 text-blue-500" />
              <span className="text-sm font-medium">ARIA AI</span>
            </button>

            {/* Divider */}
            <div className="h-px bg-white/[0.04] my-1" />

            {/* User row */}
            {user && (
              <div className="flex items-center gap-2.5 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate leading-none">{user.name}</p>
                  <p className="text-[10px] text-gray-600 truncate mt-0.5">{user.email || 'User'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CurrencyToggle />
                  <NotificationBell />
                  <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/5 transition-all" title="Logout">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════
          MOBILE TOP BAR — visible only on mobile
          ══════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#060608] border-b border-white/[0.06] flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">PROTECHT</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleAIBrain} className="p-2 text-blue-400"><Sparkles className="w-4 h-4" /></button>
          <CurrencyToggle />
          <NotificationBell />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-14 bottom-0 w-72 bg-[#060608] border-r border-white/[0.06] overflow-y-auto">
            {/* Mobile search */}
            <div className="px-4 py-3">
              <button onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                <Search className="w-4 h-4" />
                <span className="text-sm flex-1 text-left">Search everything…</span>
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">⌘K</kbd>
              </button>
            </div>

            {/* Mobile nav */}
            <nav className="px-3 pb-4 space-y-0.5">
              {navItems.map(([href, label, icon]) => {
                const activePath = href.split('?')[0];
                const active = isActive(activePath);
                return (
                  <Link key={activePath} to={href}
                    onClick={() => setIsMobileMenuOpen(false)}
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

            {/* Mobile user */}
            {user && (
              <div className="border-t border-white/[0.06] px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <LogOut className="w-4 h-4" />Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT — offset left by sidebar width on desktop
          ══════════════════════════════════════════════════════ */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0"
        style={{ marginLeft: '0px' }}
        data-sidebar-layout>
        <style>{`
          @media (min-width: 1024px) {
            [data-sidebar-layout] {
              margin-left: 200px;
            }
          }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 min-w-0">
          <Outlet />
        </div>
      </main>

      <AIBrain />
    </div>
  );
}

export default Layout;
