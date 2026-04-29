import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Project, ProjectStatus, LifecyclePhase, CreateProjectRequest } from '@protecht-bim/shared-types';
import { projectService } from '../services/projectService';
import ProjectFormModal from '../components/ProjectFormModal';
import AttachmentSection from '../components/AttachmentSection';
import { ActivityFeed } from '../components/ActivityFeed';
import ICalendarSubscription from '../components/ICalendarSubscription';
import { InteractiveCard } from '../components/InteractiveCard';
import BudgetSetupModal, { BudgetData } from '../components/BudgetSetupModal';
import { getAuthToken } from '../utils/api';
import { dashboardService, DashboardData } from '../services/dashboardService';
import { useQuery } from '@tanstack/react-query';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
  Calendar, Clock, DollarSign, Users, Package, AlertTriangle, 
  FileText, CheckCircle, XCircle, AlertCircle,
  Star, Edit, Trash2, ExternalLink, ChevronRight, Activity,
  Layers, Target, Zap, TrendingUp, Clipboard, Download
} from 'lucide-react';
import { printProjectReport, downloadProjectReport } from '../utils/reportGenerator';
import { snagService as snagSvc } from '../services/snagService';
import { changeOrderService as coSvc } from '../services/changeOrderService';
import { dailyReportService as drSvc } from '../services/dailyReportService';
import { workPackageService as wpSvc } from '../services/workPackageService';

const statusColors: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]: 'bg-green-500/20 text-green-400 border border-green-500/30',
  [ProjectStatus.ON_HOLD]: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  [ProjectStatus.COMPLETED]: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  [ProjectStatus.ARCHIVED]: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

const phaseLabels: Record<LifecyclePhase, string> = {
  [LifecyclePhase.INITIATION]: 'Initiation',
  [LifecyclePhase.PLANNING]: 'Planning',
  [LifecyclePhase.EXECUTION]: 'Execution',
  [LifecyclePhase.MONITORING]: 'Monitoring',
  [LifecyclePhase.CLOSURE]: 'Closure',
};

const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]: 'Active',
  [ProjectStatus.ON_HOLD]: 'On Hold',
  [ProjectStatus.COMPLETED]: 'Completed',
  [ProjectStatus.ARCHIVED]: 'Archived',
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 80 }: { progress: number; size?: number }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1A1A1A"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2F80ED"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{progress}%</span>
      </div>
    </div>
  );
};

function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = async (mode: 'print' | 'download' = 'download') => {
    if (!project) return;
    setIsGeneratingReport(true);
    try {
      const [snags, cos, drs, wpsResp] = await Promise.all([
        snagSvc.getSnagsByProject(project.id).catch(() => []),
        coSvc.getChangeOrdersByProject(project.id).catch(() => []),
        drSvc.getDailyReportsByProject(project.id).catch(() => []),
        wpSvc.listWorkPackages({ project_id: project.id, per_page: 200 }).catch(() => ({ work_packages: [] })),
      ]);
      const wps = (wpsResp as any).work_packages || [];
      const openSnags = snags.filter((s: any) => s.status === 'Open').length;
      const criticalSnags = snags.filter((s: any) => s.severity === 'Critical').length;
      const pendingCOs = cos.filter((c: any) => ['Submitted','Under Review'].includes(c.status)).length;
      const totalCOValue = cos.reduce((s: number, c: any) => s + (Number(c.costImpact) || 0), 0);
      const reportData = {
        projectName: project.name,
        projectStatus: project.status || 'active',
        progress: (project as any).progress || 0,
        startDate: project.start_date ? String(project.start_date) : undefined,
        endDate: project.end_date ? String(project.end_date) : undefined,
        generatedAt: new Date().toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }),
        workPackages: wps.map((w: any) => ({
          subject: w.subject, status: w.status || 'New',
          percentageDone: w.percentageDone || 0, dueDate: w.due_date || w.dueDate,
        })),
        snags: snags.map((s: any) => ({
          description: s.description, location: s.location,
          severity: s.severity, status: s.status,
        })),
        changeOrders: cos.map((c: any) => ({
          title: c.title, reason: c.reason,
          status: c.status, costImpact: Number(c.costImpact) || 0,
        })),
        dailyReports: drs.map((r: any) => ({
          reportDate: r.reportDate, workCompleted: r.workCompleted || '',
          manpowerCount: r.manpowerCount || 0, weather: r.weather,
        })),
        metrics: { totalWPs: wps.length, completedWPs: wps.filter((w: any) => ['Done','Closed'].includes(w.status || '')).length, openSnags, criticalSnags, pendingCOs, totalCOValue },
      };
      if (mode === 'print') printProjectReport(reportData);
      else downloadProjectReport(reportData);
    } catch (e) { console.error('Report error:', e); }
    finally { setIsGeneratingReport(false); }
  };

  // Real dashboard data from API
  const { data: dashboard } = useQuery<DashboardData>({
    queryKey: ['project-dashboard', id],
    queryFn: () => dashboardService.getProjectDashboard(id!),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });

    // ── Real data queries ────────────────────────────────────────────
  const { data: realSnags = [] } = useQuery({
    queryKey: ['proj-detail-snags', id],
    queryFn: () => snagSvc.getSnagsByProject(id!),
    enabled: !!id, staleTime: 60_000, retry: 1,
  });
  const { data: realCOs = [] } = useQuery({
    queryKey: ['proj-detail-cos', id],
    queryFn: () => coSvc.getChangeOrdersByProject(id!),
    enabled: !!id, staleTime: 60_000, retry: 1,
  });
  const { data: realWPsResp } = useQuery({
    queryKey: ['proj-detail-wps', id],
    queryFn: () => wpSvc.listWorkPackages({ project_id: id!, per_page: 200 }),
    enabled: !!id, staleTime: 60_000, retry: 1,
  });
  const realWPs: any[] = (realWPsResp as any)?.work_packages || [];
  const now = new Date();

  // Computed KPIs from real data
  const realKPIs = {
    tasks: { total: realWPs.length, overdue: realWPs.filter((w: any) => { const d = w.due_date || w.dueDate; return d && new Date(d) < now && !['Done','Closed'].includes(w.status || ''); }).length },
    openSnags: (realSnags as any[]).filter((s: any) => s.status === 'Open').length,
    criticalSnags: (realSnags as any[]).filter((s: any) => s.severity === 'Critical').length,
    pendingCOs: (realCOs as any[]).filter((c: any) => ['Submitted','Under Review'].includes(c.status)).length,
    totalCOValue: (realCOs as any[]).reduce((s: number, c: any) => s + (Number(c.costImpact) || 0), 0),
    completedWPs: realWPs.filter((w: any) => ['Done','Closed'].includes(w.status || '')).length,
    completion: (project as any)?.progress || 0,
  };

  const loadProject = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await projectService.getProject(id);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleUpdateProject = async (data: CreateProjectRequest) => {
    if (!id) return;
    await projectService.updateProject(id, data);
    await loadProject();
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    try {
      await projectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleToggleFavorite = async () => {
    if (!project) return;
    try {
      const updated = await projectService.toggleFavorite(project.id, !project.is_favorite);
      setProject(updated);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleSaveBudget = async (budgetData: BudgetData) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const token = getAuthToken();
    
    console.log('[ProjectDetail] Saving budget to:', `${API_URL}/projects/${budgetData.projectId}/budget`);
    console.log('[ProjectDetail] Token exists:', !!token);
    
    try {
      const response = await fetch(`${API_URL}/projects/${budgetData.projectId}/budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          total_budget: budgetData.totalBudget,
          contingency_percentage: budgetData.contingencyPercentage,
          contingency_amount: budgetData.contingencyAmount,
          budget_lines: budgetData.budgetLines.map((line) => ({
            cost_code_id: line.costCodeId,
            budgeted_amount: line.budgetedAmount,
          })),
        }),
      });

      console.log('[ProjectDetail] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ProjectDetail] Error response:', errorText);
        throw new Error(`Failed to save budget: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[ProjectDetail] Budget saved:', result);

      // Reload project to get updated budget data
      await loadProject();
    } catch (err) {
      console.error('[ProjectDetail] Failed to save budget:', err);
      throw err;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const { formatCurrency } = useCurrency();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
        <p className="text-sm text-red-400">{error || 'Project not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 min-w-0">
      {/* EXECUTIVE HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <Link
              to="/projects"
              className="inline-flex items-center text-sm text-gray-400 hover:text-gray-200 mb-3 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back to Projects
            </Link>
            
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl font-bold text-white">{project.name}</h1>
              <button
                onClick={handleToggleFavorite}
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                <Star
                  className="w-6 h-6"
                  fill={project.is_favorite ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Project Code:</span>
                <span className="text-gray-300 font-mono">PRJ-{project.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Client:</span>
                <span className="text-gray-300">{(project.custom_fields as any)?.client || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Location:</span>
                <span className="text-gray-300">{(project.custom_fields as any)?.location || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Duration:</span>
                <span className="text-gray-300">{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${statusColors[project.status?.toLowerCase() as ProjectStatus] || 'bg-gray-500/20 text-gray-400'}`}>
                {statusLabels[project.status?.toLowerCase() as ProjectStatus] || project.status}
              </span>
              <span className="inline-flex items-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 text-xs font-semibold">
                {phaseLabels[project.lifecycle_phase?.toLowerCase() as LifecyclePhase] || project.lifecycle_phase}
              </span>
            </div>
          </div>

          {/* RIGHT SIDE - CRITICAL INDICATORS */}
          <div className="flex items-start gap-6">
            {/* Progress Ring */}
            <div className="text-center">
              <ProgressRing progress={realKPIs.completion} />
              <p className="text-xs text-gray-400 mt-2">Progress</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Schedule</span>
                </div>
                <p className="text-sm font-semibold text-green-400">On Track</p>
              </div>

              <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400">Budget</span>
                </div>
                <p className="text-sm font-semibold text-yellow-400">{realKPIs.pendingCOs > 0 ? `${realKPIs.pendingCOs} pending` : "On Budget"}</p>
              </div>

              <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Timeline</span>
                </div>
                <p className="text-sm font-semibold text-blue-400">12 days</p>
              </div>

              <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-400">Risk</span>
                </div>
                <p className="text-sm font-semibold text-orange-400">Low</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI SUMMARY ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Tasks */}
        <InteractiveCard
          icon={Package}
          iconColor="text-blue-400"
          title="Total Tasks"
          value={realKPIs.tasks.total}
          subtitle={`${realKPIs.tasks.overdue} overdue`}
          trend={{ value: "+12%", direction: "up", color: "text-green-400" }}
          to="/work-packages"
        />

        {/* Budget */}
        <InteractiveCard
          icon={DollarSign}
          iconColor="text-green-400"
          title="Budget"
          value={formatCurrency(mockKPIs.budget.total)}
          subtitle={`${formatCurrency(mockKPIs.budget.used)} used`}
          badge={{ text: "86%", color: "text-yellow-400" }}
          onClick={() => setIsBudgetModalOpen(true)}
        />

        {/* RFIs */}
        <InteractiveCard
          icon={FileText}
          iconColor="text-purple-400"
          title="Open RFIs"
          value={realKPIs.pendingCOs}
          subtitle="Awaiting response"
          to="/issues?type=rfi"
        />

        {/* Issues */}
        <InteractiveCard
          icon={AlertTriangle}
          iconColor="text-red-400"
          title="Active Issues"
          value={realKPIs.openSnags}
          subtitle="Needs attention"
          badge={{ text: `${realKPIs.criticalSnags} critical`, color: "text-red-400" }}
          to="/issues"
        />

        {/* Team */}
        <InteractiveCard
          icon={Users}
          iconColor="text-cyan-400"
          title="Team Members"
          value={realWPs.length}
          subtitle="Active contributors"
          badge={{ text: "8 online", color: "text-green-400" }}
          to="/resources"
        />

        {/* Completion */}
        <InteractiveCard
          icon={Zap}
          iconColor="text-yellow-400"
          title="Completion"
          value={`${mockKPIs.completion}%`}
          subtitle="+3% this week"
          trend={{ value: "+3%", direction: "up", color: "text-green-400" }}
          to={`/projects/${id}/gantt`}
        />
      </div>

      {/* ENTERPRISE KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Revised Contract Value */}
        <InteractiveCard
          icon={FileText}
          iconColor="text-blue-400"
          title="Contract Value"
          value={formatCurrency((dashboard?.financial_summary?.contract_value || 0))}
          subtitle="Revised value"
          badge={{ text: "+$400K", color: "text-green-400" }}
          to="/contracts"
        />

        {/* Variation Exposure */}
        <InteractiveCard
          icon={TrendingUp}
          iconColor="text-yellow-400"
          title="Variations"
          value={formatCurrency((dashboard?.financial_summary?.approved_budget || 0) - (dashboard?.financial_summary?.contract_value || 0) + 400000)}
          subtitle="Approved changes"
          to="/change-orders"
        />

        {/* Open Snags */}
        <InteractiveCard
          icon={AlertCircle}
          iconColor="text-orange-400"
          title="Open Snags"
          value={0}
          subtitle="Defects pending"
          to="/snags"
        />

        {/* Field Activity */}
        <InteractiveCard
          icon={Clipboard}
          iconColor="text-purple-400"
          title="Field Reports"
          value={0}
          subtitle="This week"
          to="/daily-reports"
        />
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (70%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/projects/${id}/gantt`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Gantt Chart
            </Link>
            <Link
              to={`/calendar?project_id=${id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </Link>
            <Link
              to={`/projects/${id}/wiki`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-all"
            >
              <FileText className="w-4 h-4" />
              Wiki
            </Link>
            <Link
              to={`/projects/${id}/time-cost`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-all"
            >
              <Clock className="w-4 h-4" />
              Time & Cost
            </Link>
            <Link
              to={`/projects/${id}/boards`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-all"
            >
              <Layers className="w-4 h-4" />
              Boards
            </Link>
            <Link
              to={`/projects/${id}/backlog`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-all"
            >
              <Package className="w-4 h-4" />
              Backlog
            </Link>
                      <button
              onClick={() => handleGenerateReport('download')}
              disabled={isGeneratingReport}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGeneratingReport ? 'Generating…' : 'Report'}
            </button>
          <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-[#111111] hover:border-gray-700 transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          {/* Activity Timeline */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Activity Timeline
              </h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                  All
                </button>
                <button className="px-3 py-1 text-xs text-gray-400 hover:bg-[#111111] rounded-lg">
                  Files
                </button>
                <button className="px-3 py-1 text-xs text-gray-400 hover:bg-[#111111] rounded-lg">
                  Tasks
                </button>
                <button className="px-3 py-1 text-xs text-gray-400 hover:bg-[#111111] rounded-lg">
                  Financial
                </button>
              </div>
            </div>
            <ActivityFeed projectId={project.id} title="" pageSize={10} />
          </div>

          {/* Milestones Preview */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Milestone Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-400">Foundation</div>
                <div className="flex-1 bg-[#111111] rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-xs text-green-400 w-16 text-right">Complete</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-400">Structure</div>
                <div className="flex-1 bg-[#111111] rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-xs text-blue-400 w-16 text-right">65%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-400">Envelope</div>
                <div className="flex-1 bg-[#111111] rounded-full h-2 overflow-hidden">
                  <div className="bg-yellow-500 h-full" style={{ width: '20%' }}></div>
                </div>
                <span className="text-xs text-yellow-400 w-16 text-right">20%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-400">MEP Systems</div>
                <div className="flex-1 bg-[#111111] rounded-full h-2 overflow-hidden">
                  <div className="bg-gray-600 h-full" style={{ width: '0%' }}></div>
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">Pending</span>
              </div>
            </div>
          </div>

          {/* Risk & Alerts */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Risk & Alerts
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">3 Delayed Work Packages</p>
                  <p className="text-xs text-gray-400 mt-1">Structural steel delivery behind schedule</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-400">2 Overdue Tasks</p>
                  <p className="text-xs text-gray-400 mt-1">Site inspection reports pending</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-400">Budget Variance Warning</p>
                  <p className="text-xs text-gray-400 mt-1">Material costs 2.3% over budget</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Project Description</h2>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{project.description}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (30%) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Project Snapshot */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Project Snapshot</h2>
            <dl className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <dt className="text-sm text-gray-400">Start Date</dt>
                <dd className="text-sm text-white font-medium">{formatDate(project.start_date)}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <dt className="text-sm text-gray-400">End Date</dt>
                <dd className="text-sm text-white font-medium">{formatDate(project.end_date)}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <dt className="text-sm text-gray-400">Duration</dt>
                <dd className="text-sm text-white font-medium">18 months</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <dt className="text-sm text-gray-400">Phase</dt>
                <dd className="text-sm text-white font-medium">
                  {phaseLabels[project.lifecycle_phase?.toLowerCase() as LifecyclePhase] || project.lifecycle_phase}
                </dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <dt className="text-sm text-gray-400">Contract Type</dt>
                <dd className="text-sm text-white font-medium">Design-Build</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <dt className="text-sm text-gray-400">Created</dt>
                <dd className="text-sm text-white font-medium">{formatDate(project.created_at)}</dd>
              </div>
              <div className="flex justify-between items-center py-2">
                <dt className="text-sm text-gray-400">Last Updated</dt>
                <dd className="text-sm text-white font-medium">{formatDate(project.updated_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Financial Summary */}
          <div 
            onClick={() => navigate('/cost-tracking')}
            className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 hover:scale-[1.01] transition-all duration-200"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/cost-tracking');
              }
            }}
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Financial Summary
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">Contract Value</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency((dashboard?.financial_summary?.contract_value || 0))}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">Approved Budget</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency((dashboard?.financial_summary?.approved_budget || 0))}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">Committed Cost</span>
                  <span className="text-sm font-semibold text-blue-400">{formatCurrency((dashboard?.financial_summary?.committed_cost || 0))}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">Actual Cost</span>
                  <span className="text-sm font-semibold text-yellow-400">{formatCurrency((dashboard?.financial_summary?.actual_cost || 0))}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-300">Variance</span>
                  <span className={`text-sm font-bold ${mockFinancials.variance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {mockFinancials.variance > 0 ? '+' : ''}{mockFinancials.variance}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div 
            onClick={() => navigate('/resources')}
            className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 hover:scale-[1.01] transition-all duration-200"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/resources');
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Team Members
              </h2>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle invite
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Invite
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'John Smith', role: 'Project Manager', online: true },
                { name: 'Sarah Johnson', role: 'Site Engineer', online: true },
                { name: 'Mike Chen', role: 'BIM Coordinator', online: false },
                { name: 'Emily Davis', role: 'QA/QC Lead', online: true },
              ].map((member, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-[#111111] rounded-lg transition-colors">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {member.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0A0A0A]"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BIM Model Status */}
          <div 
            onClick={() => navigate('/bim-model')}
            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30 p-6 cursor-pointer hover:border-blue-500/50 hover:scale-[1.01] transition-all duration-200"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/bim-model');
              }
            }}
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              BIM Model Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Latest Model</span>
                <span className="text-sm font-semibold text-blue-400">{"v5.2"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Last Sync</span>
                <span className="text-sm text-gray-400">{mockBIM.lastSync}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Clash Detections</span>
                <span className="text-sm font-semibold text-orange-400">{0} open</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Linked Sheets</span>
                <span className="text-sm text-gray-400">{realWPs.length}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-blue-500/20">
                <span className="text-sm font-medium text-gray-300">Model Health</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  {"Good"}
                </span>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // Handle BIM viewer
              }}
              className="w-full mt-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open BIM Viewer
            </button>
          </div>

          {/* Documents */}
          <div 
            onClick={() => navigate('/documents')}
            className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 hover:scale-[1.01] transition-all duration-200"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/documents');
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Documents
              </h2>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/documents');
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                View All →
              </button>
            </div>
            <AttachmentSection entityType="Project" entityId={project.id} />
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateProject}
        initialData={{
          name: project.name,
          description: project.description,
          start_date: project.start_date || undefined,
          end_date: project.end_date || undefined,
        }}
        title="Edit Project"
      />

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative w-full max-w-md rounded-xl bg-[#0A0A0A] border border-red-500/30 p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Delete Project</h3>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Are you sure you want to delete <span className="font-semibold text-white">"{project.name}"</span>? 
                This action cannot be undone and will permanently remove all associated data.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#1A1A1A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iCalendar Subscription Modal */}
      {subscriptionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <ICalendarSubscription
            projectId={id}
            onClose={() => setSubscriptionModalOpen(false)}
          />
        </div>
      )}

      {/* Budget Setup Modal */}
      {isBudgetModalOpen && project && (
        <BudgetSetupModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          projectId={project.id}
          projectName={project.name}
          onSave={handleSaveBudget}
        />
      )}
    </div>
  );
}

export default ProjectDetailPage;
