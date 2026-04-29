import { useRealtimeSync } from './hooks/useRealtimeSync';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import { GlobalWebSocketListener } from './components/GlobalWebSocketListener';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import React, { Suspense } from 'react';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = React.lazy(() => import('./pages/ProjectDetailPage'));
const ProjectGanttPage = React.lazy(() => import('./pages/ProjectGanttPage'));
const WorkPackagesPage = React.lazy(() => import('./pages/WorkPackagesPage'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const BoardListPage = React.lazy(() => import('./pages/BoardListPage'));
const BoardPage = React.lazy(() => import('./pages/BoardPage'));
const BacklogPage = React.lazy(() => import('./pages/BacklogPage').then(module => ({ default: module.BacklogPage })));
const SprintPlanningPage = React.lazy(() => import('./pages/SprintPlanningPage').then(module => ({ default: module.SprintPlanningPage })));
const SprintDetailPage = React.lazy(() => import('./pages/SprintDetailPage').then(module => ({ default: module.SprintDetailPage })));
const TimeTrackingPage = React.lazy(() => import('./pages/TimeTrackingPage'));
const CostTrackingPage = React.lazy(() => import('./pages/CostTrackingPage'));
const ResourceManagementPage = React.lazy(() => import('./pages/ResourceManagementPage'));
const ActivityPage = React.lazy(() => import('./pages/ActivityPage').then(module => ({ default: module.ActivityPage })));
const WikiPageBoard = React.lazy(() => import('./pages/WikiPageBoard').then(module => ({ default: module.WikiPageBoard })));
const ProjectTimeCostPage = React.lazy(() => import('./pages/ProjectTimeCostPage').then(module => ({ default: module.ProjectTimeCostPage })));
const ContractsPage = React.lazy(() => import('./pages/ContractsPage'));
const ChangeOrdersPage = React.lazy(() => import('./pages/ChangeOrdersPage'));
const DailyReportsPage = React.lazy(() => import('./pages/DailyReportsPage'));
const SnagsPage = React.lazy(() => import('./pages/SnagsPage'));
const BIMViewerPage = React.lazy(() => import('./features/bim/BIMViewerPage'));

const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

function App() {
  // Enable real-time synchronization
  useRealtimeSync();

  return (
    <AuthProvider>
      <CurrencyProvider>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151',
        },
      }} />
      <GlobalWebSocketListener />
      <Suspense fallback={<div className="flex h-screen w-full flex-col items-center justify-center bg-black gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">PROTECHT BIM</p>
            <p className="text-gray-600 text-xs mt-0.5">Loading…</p>
          </div>
          <div className="h-0.5 w-32 bg-gray-900 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-blue-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{width: '60%'}} />
          </div>
        </div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="projects/:projectId/gantt" element={<ProjectGanttPage />} />
            <Route path="projects/:projectId/boards" element={<BoardListPage />} />
            <Route path="projects/:projectId/boards/:boardId" element={<BoardPage />} />
            <Route path="projects/:projectId/backlog" element={<BacklogPage />} />
            <Route path="sprints/:sprintId/planning" element={<SprintPlanningPage />} />
            <Route path="sprints/:id" element={<SprintDetailPage />} />
            <Route path="work-packages" element={<WorkPackagesPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="time-tracking" element={<TimeTrackingPage />} />
            <Route path="cost-tracking" element={<CostTrackingPage />} />
            <Route path="resource-management" element={<ResourceManagementPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="change-orders" element={<ChangeOrdersPage />} />
            <Route path="daily-reports" element={<DailyReportsPage />} />
            <Route path="snags" element={<SnagsPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="projects/:projectId/wiki" element={<WikiPageBoard />} />
            <Route path="projects/:projectId/wiki/:slug" element={<WikiPageBoard />} />
            <Route path="projects/:projectId/time-cost" element={<ProjectTimeCostPage />} />
            <Route path="projects/:projectId/bim" element={<BIMViewerPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
