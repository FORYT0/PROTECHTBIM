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
  FileText, TrendingUp, Clipboard, AlertCircle, Sparkles, Box
} from 'lucide-react';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tokens, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleAIBrain } = useAIStore();

  // Fetch projects and connect socket
  useEffect(() => {
    let isMounted = true;

    const initializeSocket = async () => {
      if (tokens?.accessToken) {
        notificationService.connect(tokens.accessToken);

        try {
          // Fetch user projects to join their rooms natively
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/projects`, {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (isMounted) {
              data.projects.forEach((project: any) => {
                notificationService.joinProject(project.id);
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch projects for socket rooms:', error);
        }
      } else {
        notificationService.disconnect();
      }
    };

    initializeSocket();

    // Listen for mentions
    const handleMention = (payload: any) => {
      toast((_t) => (
        <div className="flex flex-col">
          <span className="font-bold">You were mentioned!</span>
          <span className="text-sm">{payload.authorName} mentioned you in {payload.entitySubject}</span>
          <p className="text-xs italic mt-1 text-hint">"{payload.excerpt}..."</p>
        </div>
      ), { duration: 5000, icon: '💬' });
    };

    notificationService.on('comment:mentioned', handleMention);

    return () => {
      isMounted = false;
      notificationService.off('comment:mentioned', handleMention);
    };
  }, [tokens?.accessToken]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkClass = (path: string) => {
    const baseClass = 'group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2';
    return isActive(path)
      ? `${baseClass} bg-blue-600 text-white shadow-lg shadow-blue-500/30`
      : `${baseClass} text-gray-400 hover:text-white hover:bg-[#0A0A0A]`;
  };

  const mobileNavLinkClass = (path: string) => {
    const baseClass = 'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200';
    return isActive(path)
      ? `${baseClass} bg-blue-600 text-white`
      : `${baseClass} text-gray-400 hover:text-white hover:bg-[#0A0A0A]`;
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Header */}
      <header className="bg-[#0A0A0A] border-b border-gray-800 sticky top-0 z-50 backdrop-blur-xl bg-opacity-95">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-200">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white tracking-tight">PROTECHT</span>
                  <span className="text-xs text-gray-500 -mt-1">BIM Platform</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                <Link to="/" className={navLinkClass('/')}>
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
                <Link to="/projects" className={navLinkClass('/projects')}>
                  <Building2 className="w-4 h-4" />
                  <span>Projects</span>
                </Link>
                <Link to="/work-packages" className={navLinkClass('/work-packages')}>
                  <Package className="w-4 h-4" />
                  <span>Packages</span>
                </Link>
                
                {/* Commercial Group */}
                <Link to="/contracts" className={navLinkClass('/contracts')}>
                  <FileText className="w-4 h-4" />
                  <span>Contracts</span>
                </Link>
                <Link to="/change-orders" className={navLinkClass('/change-orders')}>
                  <TrendingUp className="w-4 h-4" />
                  <span>Changes</span>
                </Link>
                
                {/* Field Group */}
                <Link to="/daily-reports" className={navLinkClass('/daily-reports')}>
                  <Clipboard className="w-4 h-4" />
                  <span>Reports</span>
                </Link>
                <Link to="/snags" className={navLinkClass('/snags')}>
                  <AlertCircle className="w-4 h-4" />
                  <span>Snags</span>
                </Link>
                
                <Link to="/calendar" className={navLinkClass('/calendar')}>
                  <Calendar className="w-4 h-4" />
                  <span>Calendar</span>
                </Link>
                <Link to="/time-tracking" className={navLinkClass('/time-tracking')}>
                  <Clock className="w-4 h-4" />
                  <span>Time</span>
                </Link>
                <Link to="/cost-tracking" className={navLinkClass('/cost-tracking')}>
                  <DollarSign className="w-4 h-4" />
                  <span>Costs</span>
                </Link>
                <Link to="/resource-management" className={navLinkClass('/resource-management')}>
                  <Users className="w-4 h-4" />
                  <span>Resources</span>
                </Link>
                <Link to="/projects" className={navLinkClass('/projects/') + ' bim-nav-hint'} title="Open a project to access BIM Viewer">
                  <Box className="w-4 h-4" />
                  <span>BIM</span>
                </Link>
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center gap-3">
              {user && (
                <>
                  <button
                    onClick={toggleAIBrain}
                    className="p-2 rounded-lg text-blue-400 hover:text-white hover:bg-blue-900/40 transition-all duration-200 relative group"
                    title="AI Copilot"
                  >
                    <Sparkles className="w-5 h-5" />
                    <div className="absolute inset-0 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                  <NotificationBell />
                  
                  {/* User Profile */}
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#111111] border border-gray-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/20">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white">
                      {user.name}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#111111] transition-all duration-200"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-3 lg:hidden">
              {user && (
                <>
                  <button onClick={toggleAIBrain} className="p-2 text-blue-400">
                    <Sparkles className="w-5 h-5" />
                  </button>
                  <NotificationBell />
                </>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#111111] transition-all duration-200"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <Menu className="w-6 h-6" />
                ) : (
                  <X className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-800 bg-[#0A0A0A]">
            <div className="space-y-1 px-4 py-4">
              <Link to="/" className={mobileNavLinkClass('/')} onClick={closeMobileMenu}>
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link to="/projects" className={mobileNavLinkClass('/projects')} onClick={closeMobileMenu}>
                <Building2 className="w-5 h-5" />
                <span>Projects</span>
              </Link>
              <Link to="/work-packages" className={mobileNavLinkClass('/work-packages')} onClick={closeMobileMenu}>
                <Package className="w-5 h-5" />
                <span>Work Packages</span>
              </Link>
              
              {/* Commercial Section */}
              <div className="pt-2 pb-1">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">Commercial</div>
              </div>
              <Link to="/contracts" className={mobileNavLinkClass('/contracts')} onClick={closeMobileMenu}>
                <FileText className="w-5 h-5" />
                <span>Contracts</span>
              </Link>
              <Link to="/change-orders" className={mobileNavLinkClass('/change-orders')} onClick={closeMobileMenu}>
                <TrendingUp className="w-5 h-5" />
                <span>Change Orders</span>
              </Link>
              
              {/* Field Section */}
              <div className="pt-2 pb-1">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">Field</div>
              </div>
              <Link to="/daily-reports" className={mobileNavLinkClass('/daily-reports')} onClick={closeMobileMenu}>
                <Clipboard className="w-5 h-5" />
                <span>Daily Reports</span>
              </Link>
              <Link to="/snags" className={mobileNavLinkClass('/snags')} onClick={closeMobileMenu}>
                <AlertCircle className="w-5 h-5" />
                <span>Snag List</span>
              </Link>
              
              <Link to="/calendar" className={mobileNavLinkClass('/calendar')} onClick={closeMobileMenu}>
                <Calendar className="w-5 h-5" />
                <span>Calendar</span>
              </Link>
              <Link to="/time-tracking" className={mobileNavLinkClass('/time-tracking')} onClick={closeMobileMenu}>
                <Clock className="w-5 h-5" />
                <span>Time Tracking</span>
              </Link>
              <Link to="/cost-tracking" className={mobileNavLinkClass('/cost-tracking')} onClick={closeMobileMenu}>
                <DollarSign className="w-5 h-5" />
                <span>Cost Tracking</span>
              </Link>
              <Link to="/resource-management" className={mobileNavLinkClass('/resource-management')} onClick={closeMobileMenu}>
                <Users className="w-5 h-5" />
                <span>Resource Management</span>
              </Link>
            </div>

            {/* Mobile User Section */}
            {user && (
              <div className="border-t border-gray-800 px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/20">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-base font-medium text-white">
                      {user.name}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-gray-400 hover:text-white hover:bg-[#111111] transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* AI Assistant */}
      <AIBrain />
    </div>
  );
}

export default Layout;
