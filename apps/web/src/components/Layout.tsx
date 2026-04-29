import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef } from 'react';
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

/* ── Pulsating hand-drawn SVG line ──────────────────────────────────────── */
function GlowLine({ height }: { height: number }) {
  // Generate a slightly wobbly path that looks hand-drawn
  const cx = 22; // horizontal center of the 44px strip
  const segments = 20;
  const segH = height / segments;

  let d = `M ${cx} 0 `;
  for (let i = 0; i <= segments; i++) {
    const y = i * segH;
    // Small random-looking but deterministic wobble
    const wobble = [0.8, -1.2, 1.5, -0.7, 1.1, -1.4, 0.9, -0.6, 1.3, -1.0,
                    0.7, -1.3, 1.1, -0.8, 1.4, -1.1, 0.6, -1.2, 0.9, -0.7, 0.5];
    const x = cx + (wobble[i % wobble.length] ?? 0);
    if (i === 0) d += `L ${x} ${y} `;
    else d += `L ${x} ${y} `;
  }

  return (
    <svg
      width="44" height={height}
      viewBox={`0 0 44 ${height}`}
      style={{
        position: 'absolute', top: 0, left: 0,
        pointerEvents: 'none', overflow: 'visible',
      }}
    >
      <defs>
        {/* Gradient to fade top and bottom */}
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="white" stopOpacity="0" />
          <stop offset="6%"   stopColor="white" stopOpacity="0.15" />
          <stop offset="12%"  stopColor="white" stopOpacity="0.55" />
          <stop offset="88%"  stopColor="white" stopOpacity="0.55" />
          <stop offset="94%"  stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Glow filter — gives the 3D alive feel */}
        <filter id="glow" x="-300%" y="-10%" width="700%" height="120%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Clip to gradient so ends fade */}
        <mask id="lineMask">
          <rect x="0" y="0" width="44" height={height} fill="url(#lineGrad)" />
        </mask>
      </defs>

      {/* Outer glow — wide, soft */}
      <path d={d} fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        mask="url(#lineMask)" />

      {/* Mid glow */}
      <path d={d} fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        mask="url(#lineMask)"
        filter="url(#glow)" />

      {/* Core line — sharp, bright */}
      <path d={d} fill="none"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        mask="url(#lineMask)" />
    </svg>
  );
}

/* ── Active dot on the line ─────────────────────────────────────────────── */
function ActiveDot({ top }: { top: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: '22px',
      top: `${top}px`,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 20,
    }}>
      {/* Outermost halo — slow pulse */}
      <div style={{
        position: 'absolute',
        width: '20px', height: '20px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        animation: 'dotHalo 2.4s ease-in-out infinite',
      }} />
      {/* Mid ring */}
      <div style={{
        position: 'absolute',
        width: '10px', height: '10px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.25)',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        animation: 'dotHalo 2.4s ease-in-out infinite 0.3s',
      }} />
      {/* Core bright dot */}
      <div style={{
        width: '5px', height: '5px',
        borderRadius: '50%',
        background: '#ffffff',
        boxShadow: '0 0 6px 2px rgba(255,255,255,0.9), 0 0 14px 5px rgba(96,165,250,0.6)',
        position: 'relative',
      }} />
    </div>
  );
}

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tokens, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleAIBrain } = useAIStore();
  const navRef = useRef<HTMLElement>(null);
  const [navHeight, setNavHeight] = useState(600);
  const [activeY, setActiveY] = useState(0);

  const { data: projectsData } = useQuery({
    queryKey: ['projects-layout'],
    queryFn: () => projectService.listProjects({ per_page: 50 } as any),
    staleTime: 5 * 60 * 1000,
    enabled: !!tokens?.accessToken,
  });
  const pid = projectsData?.projects?.[0]?.id || '';

  // Measure nav strip height and active item center for the dot
  useEffect(() => {
    const update = () => {
      if (!navRef.current) return;
      setNavHeight(navRef.current.offsetHeight);
      const active = navRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      if (active) {
        const stripTop = navRef.current.getBoundingClientRect().top;
        const itemTop = active.getBoundingClientRect().top;
        const itemH = active.offsetHeight;
        setActiveY(itemTop - stripTop + itemH / 2);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [location.pathname, navHeight]);

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
    <div className="min-h-screen bg-black flex flex-col overflow-hidden">
      {/* ── Keyframe styles ─────────────────────────────────── */}
      <style>{`
        @keyframes dotHalo {
          0%, 100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1); }
          50%       { opacity: 0.15; transform: translate(-50%,-50%) scale(1.8); }
        }
        @keyframes linePulse {
          0%, 100% { opacity: 0.85; }
          50%       { opacity: 0.45; }
        }
        .nav-line-pulse { animation: linePulse 3.5s ease-in-out infinite; }
      `}</style>

      <GlobalSearch />

      {/* ══ TOP BAR ═══════════════════════════════════════════ */}
      <header className="bg-[#0A0A0A] border-b border-gray-800/60 sticky top-0 z-50 shrink-0 h-14 flex items-center px-3 sm:px-4 lg:px-5 justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-bold text-white">PROTECHT BIM</span>
            <span className="text-[10px] text-gray-500 tracking-wider">Construction Intelligence Platform</span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-gray-800 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:border-gray-700 transition-all">
            <Search className="w-3.5 h-3.5" /><span>Search</span>
            <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px]">⌘K</kbd>
          </button>
          <button onClick={toggleAIBrain} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-900/30 transition-all" title="ARIA AI">
            <Sparkles className="w-4 h-4" />
          </button>
          <CurrencyToggle />
          <NotificationBell />
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111] border border-gray-800">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-white max-w-[90px] truncate">{user.name}</span>
            </div>
          )}
          {user && (
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#111] transition-all" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ══ BODY ═══════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── VERTICAL NAV STRIP — fixed, does NOT scroll ───── */}
        <aside
          ref={navRef}
          className="hidden lg:flex flex-col shrink-0 relative overflow-hidden"
          style={{ width: '88px', position: 'sticky', top: '56px', height: 'calc(100vh - 56px)', alignSelf: 'flex-start' }}
        >
          {/* THE PULSATING HAND-DRAWN GLOWING LINE — through icon centres */}
          <div className="nav-line-pulse" style={{ position: 'absolute', top: 0, left: 0, width: '44px', height: navHeight, pointerEvents: 'none', zIndex: 1 }}>
            <GlowLine height={navHeight} />
          </div>

          {/* Active dot on the line */}
          {activeY > 0 && <ActiveDot top={activeY} />}

          {/* Nav items — do NOT scroll; they sit on top of the line */}
          <nav className="flex-1 flex flex-col pt-3" style={{ overflowY: 'hidden' }}>
            {navItems.map(([href, label, icon]) => {
              const activePath = href.split('?')[0];
              const active = isActive(activePath);
              return (
                <Link
                  key={activePath}
                  to={href}
                  data-active={active ? 'true' : undefined}
                  className="relative flex flex-col items-center justify-center gap-[3px] py-[11px] transition-all duration-150 group z-10"
                  style={{
                    color: active ? '#ffffff' : 'rgba(100,110,120,1)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#d1d5db'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(100,110,120,1)'; }}
                >
                  {/* Icon — sits ON the line */}
                  <span
                    className="shrink-0 transition-all duration-200 relative"
                    style={{
                      color: active ? '#ffffff' : 'currentColor',
                      filter: active
                        ? 'drop-shadow(0 0 7px rgba(255,255,255,0.9)) drop-shadow(0 0 14px rgba(200,220,255,0.6))'
                        : 'none',
                      zIndex: 2,
                    }}>
                    {icon}
                  </span>

                  {/* Label */}
                  <span
                    className="text-[10px] font-medium leading-none relative"
                    style={{
                      zIndex: 2,
                      textShadow: active
                        ? '0 0 8px rgba(255,255,255,0.8), 0 0 18px rgba(200,220,255,0.5)'
                        : 'none',
                    }}>
                    {label}
                  </span>

                  {/* Hover shimmer */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                    style={{ background: 'rgba(255,255,255,0.035)' }}
                  />
                </Link>
              );
            })}

            {pid && (() => {
              const active = location.pathname.includes('/bim');
              return (
                <Link
                  to={`/projects/${pid}/bim`}
                  data-active={active ? 'true' : undefined}
                  className="relative flex flex-col items-center justify-center gap-[3px] py-[11px] transition-all duration-150 group z-10"
                  style={{ color: active ? '#ffffff' : 'rgba(100,110,120,1)', textDecoration: 'none' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#d1d5db'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(100,110,120,1)'; }}
                >
                  <span style={{ color: active ? '#ffffff' : 'currentColor', filter: active ? 'drop-shadow(0 0 7px rgba(255,255,255,0.9))' : 'none', zIndex: 2 }}>
                    <Box className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[10px] font-medium" style={{ zIndex: 2, textShadow: active ? '0 0 8px rgba(255,255,255,0.8)' : 'none' }}>BIM</span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'rgba(255,255,255,0.035)' }} />
                </Link>
              );
            })()}
          </nav>

          {/* Logout — bottom of strip, non-scrolling */}
          <div className="shrink-0 pb-4 z-10">
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-[3px] py-3 w-full text-gray-600 hover:text-white transition-all group"
              title="Logout"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span className="text-[10px] font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* ── MOBILE DRAWER ──────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 top-14">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0A0A0A] border-r border-gray-800 overflow-y-auto">
              <div className="px-3 py-3">
                <button onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#111] border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
                  <Search className="w-4 h-4" /><span className="text-sm flex-1 text-left">Search…</span>
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
                        background: active ? 'linear-gradient(135deg,rgba(37,99,235,0.25),rgba(37,99,235,0.08))' : 'transparent',
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

        {/* ── MAIN CONTENT — scrollable ──────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
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
