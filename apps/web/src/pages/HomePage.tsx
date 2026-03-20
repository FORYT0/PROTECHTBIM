import { Link } from 'react-router-dom';
import { AIPulseAlert } from '../components/ai/AIPulseAlert';

function HomePage() {
  return (
    <div className="space-y-12">
      <AIPulseAlert />
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl flex items-center justify-center elevation-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-text-primary sm:text-6xl">
          Welcome to PROTECHT BIM
        </h1>
        <p className="mt-6 text-xl text-text-secondary max-w-3xl mx-auto">
          Construction Project Management Platform with BIM Integration
        </p>
        <p className="text-text-hint">
          Manage projects, track work packages, log hours, and monitor costs in one place
        </p>
      </div>

      {/* Feature Cards - Active Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">Available Now</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/projects"
            className="card group cursor-pointer"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-primary-600/10 rounded-xl flex items-center justify-center group-hover:bg-primary-600/20 transition-colors">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">
                Projects
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Manage your construction projects, programs, and portfolios with comprehensive tracking and reporting
            </p>
            <div className="mt-4 flex items-center text-primary-500 font-medium group-hover:text-primary-400 transition-colors">
              <span>View Projects</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            to="/work-packages"
            className="card group cursor-pointer"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-accent-600/10 rounded-xl flex items-center justify-center group-hover:bg-accent-600/20 transition-colors">
                <svg className="w-6 h-6 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">
                Work Packages
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Track tasks, milestones, and issues across your projects with powerful filtering and organization
            </p>
            <div className="mt-4 flex items-center text-accent-500 font-medium group-hover:text-accent-400 transition-colors">
              <span>View Work Packages</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            to="/calendar"
            className="card group cursor-pointer"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-success-main/10 rounded-xl flex items-center justify-center group-hover:bg-success-main/20 transition-colors">
                <svg className="w-6 h-6 text-success-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">
                Calendar
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed">
              View project timelines and work package schedules in an intuitive calendar interface
            </p>
            <div className="mt-4 flex items-center text-success-main font-medium group-hover:text-success-light transition-colors">
              <span>View Calendar</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            to="/time-tracking"
            className="card group cursor-pointer"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-warning-main/10 rounded-xl flex items-center justify-center group-hover:bg-warning-main/20 transition-colors">
                <svg className="w-6 h-6 text-warning-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">
                Time Tracking
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Log hours spent on work packages with daily and weekly views for comprehensive time management
            </p>
            <div className="mt-4 flex items-center text-warning-main font-medium group-hover:text-warning-light transition-colors">
              <span>Log Time</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            to="/cost-tracking"
            className="card group cursor-pointer"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-error-main/10 rounded-xl flex items-center justify-center group-hover:bg-error-main/20 transition-colors">
                <svg className="w-6 h-6 text-error-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">
                Cost Tracking
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Monitor project costs, track expenses, and manage budgets with detailed cost breakdowns and reports
            </p>
            <div className="mt-4 flex items-center text-error-main font-medium group-hover:text-error-light transition-colors">
              <span>Track Costs</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <div className="card opacity-60 cursor-not-allowed">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-text-disabled/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">
                BIM Models
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed">
              View and coordinate 3D building models with clash detection and issue tracking
            </p>
            <div className="mt-4 flex items-center text-text-disabled font-medium">
              <span>Phase 3 - Coming Soon</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">Coming in Future Phases</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="card opacity-60 cursor-not-allowed">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-text-disabled/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">
                Advanced Reports
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Comprehensive analytics and reporting for project performance
            </p>
            <div className="mt-4 flex items-center text-text-disabled font-medium">
              <span>Phase 6</span>
            </div>
          </div>

          <div className="card opacity-60 cursor-not-allowed">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-text-disabled/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">
                Team Management
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Manage team members, roles, and permissions
            </p>
            <div className="mt-4 flex items-center text-text-disabled font-medium">
              <span>Phase 2.11</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="card">
        <h3 className="text-xl font-semibold text-text-primary mb-6">Feature Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500">5</div>
            <div className="text-sm text-text-secondary mt-1">Active Features</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success-main">40+</div>
            <div className="text-sm text-text-secondary mt-1">Tests Passing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-500">17</div>
            <div className="text-sm text-text-secondary mt-1">API Endpoints</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-main">2/6</div>
            <div className="text-sm text-text-secondary mt-1">Phases Complete</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">100%</div>
            <div className="text-sm text-text-secondary mt-1">Type Safe</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
