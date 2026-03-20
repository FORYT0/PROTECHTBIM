import { useRealtimeSync } from './hooks/useRealtimeSync';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { GlobalWebSocketListener } from './components/GlobalWebSocketListener';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectGanttPage from './pages/ProjectGanttPage';
import WorkPackagesPage from './pages/WorkPackagesPage';
import CalendarPage from './pages/CalendarPage';
import BoardListPage from './pages/BoardListPage';
import BoardPage from './pages/BoardPage';
import { BacklogPage } from './pages/BacklogPage';
import { SprintPlanningPage } from './pages/SprintPlanningPage';
import { SprintDetailPage } from './pages/SprintDetailPage';
import TimeTrackingPage from './pages/TimeTrackingPage';
import CostTrackingPage from './pages/CostTrackingPage';
import ResourceManagementPage from './pages/ResourceManagementPage';
import { ActivityPage } from './pages/ActivityPage';
import { WikiPageBoard } from './pages/WikiPageBoard';
import { ProjectTimeCostPage } from './pages/ProjectTimeCostPage';
import ContractsPage from './pages/ContractsPage';
import ChangeOrdersPage from './pages/ChangeOrdersPage';
import DailyReportsPage from './pages/DailyReportsPage';
import SnagsPage from './pages/SnagsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  // Enable real-time synchronization
  useRealtimeSync();

  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151',
        },
      }} />
      <GlobalWebSocketListener />
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
