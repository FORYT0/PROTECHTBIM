import { useNavigate } from 'react-router-dom';
import { Building2, Home, ArrowLeft, Search } from 'lucide-react';

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-[120px] font-black text-gray-900 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Check the URL or navigate back to the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0A0A0A] border border-gray-800 hover:border-gray-700 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />Go Back
          </button>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-blue-500/20">
            <Home className="w-4 h-4" />Dashboard
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-10 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-600 mb-4">Quick navigation</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              ['Projects', '/projects'],
              ['Work Packages', '/work-packages'],
              ['Contracts', '/contracts'],
              ['Snags', '/snags'],
              ['Change Orders', '/change-orders'],
              ['Time Tracking', '/time-tracking'],
            ].map(([label, href]) => (
              <button key={href} onClick={() => navigate(href)}
                className="px-3 py-1.5 bg-[#0A0A0A] border border-gray-800 hover:border-gray-700 rounded-lg text-xs text-gray-500 hover:text-white transition-all">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
