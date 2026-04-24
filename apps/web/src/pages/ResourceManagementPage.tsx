import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resourceService } from '../services/ResourceService';
import { projectService } from '../services/projectService';
import { InteractiveCard } from '../components/InteractiveCard';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { queryKeys } from '../lib/queryClient';
import { useProjectRoom } from '../hooks/useRealtimeSync';
import {
    Users, AlertTriangle, CheckCircle, Clock,
    Target, Activity, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

export function ResourceManagementPage() {
    const navigate = useNavigate();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [dateRange, setDateRange] = useState({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 }),
    });

    // JOIN REAL-TIME ROOM
    useProjectRoom(selectedProjectId);

    // FETCH PROJECTS
    const { data: projectsData, isLoading: loadingProjects } = useQuery({
        queryKey: queryKeys.projects,
        queryFn: () => projectService.listProjects({ per_page: 100 }),
    });

    useEffect(() => {
        if (projectsData?.projects?.length && !selectedProjectId) {
            setSelectedProjectId(projectsData.projects[0].id);
        }
    }, [projectsData, selectedProjectId]);

    const projects = projectsData?.projects || [];

    // FETCH UTILIZATION
    const { data: utilization, isLoading: loadingUtilization, error } = useQuery({
        queryKey: queryKeys.resourceUtilization(
            selectedProjectId,
            format(dateRange.start, 'yyyy-MM-dd'),
            format(dateRange.end, 'yyyy-MM-dd')
        ),
        queryFn: () => resourceService.getProjectResourceUtilization(
            selectedProjectId,
            format(dateRange.start, 'yyyy-MM-dd'),
            format(dateRange.end, 'yyyy-MM-dd')
        ),
        enabled: !!selectedProjectId,
    });

    const isLoading = loadingProjects || (loadingUtilization && !!selectedProjectId);

      // Resource metrics
    const mockResourceMetrics = {
      totalTeamMembers: 0,
      activeMembers: 0,
      optimal: 0,
      atCapacity: 0,
      overCapacity: 0,
      avgUtilization: 0,
    };

    const nextWeek = () => {
        setDateRange({
            start: addWeeks(dateRange.start, 1),
            end: addWeeks(dateRange.end, 1),
        });
    };

    const prevWeek = () => {
        setDateRange({
            start: subWeeks(dateRange.start, 1),
            end: subWeeks(dateRange.end, 1),
        });
    };

    return (
        <div className="min-h-screen bg-[#000000] space-y-6 pb-8 animate-in fade-in duration-500">
            {/* RESOURCE COMMAND HEADER */}
            <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* LEFT SIDE */}
                    <div className="flex-1">
                        <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase">RESOURCE INTELLIGENCE</h1>
                        <p className="text-gray-400 mb-6 font-medium italic">EXECUTIVE WORKLOAD & CAPACITY ANALYTICS</p>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Total Team:</span>
                                <span className="text-white font-mono font-bold">{mockResourceMetrics.totalTeamMembers}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Active:</span>
                                <span className="text-green-400 font-mono font-bold">{mockResourceMetrics.activeMembers}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Avg Utilization:</span>
                                <span className="text-blue-400 font-mono font-bold">{mockResourceMetrics.avgUtilization}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Critical (Over):</span>
                                <span className="text-red-400 font-mono font-bold">{mockResourceMetrics.overCapacity}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE - QUICK INDICATORS */}
                    <div className="grid grid-cols-2 gap-3 sm:w-auto">
                        <InteractiveCard
                            icon={Users}
                            iconColor="text-cyan-400"
                            title="Squad Size"
                            value={mockResourceMetrics.totalTeamMembers}
                            subtitle="Full portfolio"
                            className="w-full lg:w-44"
                        />
                        <InteractiveCard
                            icon={Activity}
                            iconColor="text-blue-400"
                            title="Load Level"
                            value={`${mockResourceMetrics.avgUtilization}%`}
                            progress={{ value: mockResourceMetrics.avgUtilization, color: "bg-blue-400" }}
                            className="w-full lg:w-44"
                        />
                    </div>
                </div>
            </div>

            {/* RESOURCE KPI ROW */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <InteractiveCard
                    icon={Users}
                    iconColor="text-cyan-400"
                    title="Allocated"
                    value={mockResourceMetrics.totalTeamMembers}
                    trend={{ value: "+2", direction: "up", color: "text-green-400" }}
                />
                <InteractiveCard
                    icon={Activity}
                    iconColor="text-green-400"
                    title="Engagement"
                    value={mockResourceMetrics.activeMembers}
                    badge={{ text: "Active", color: "text-green-400" }}
                />
                <InteractiveCard
                    icon={CheckCircle}
                    iconColor="text-green-400"
                    title="Optimal"
                    value={mockResourceMetrics.optimal}
                    subtitle="Balanced"
                />
                <InteractiveCard
                    icon={Zap}
                    iconColor="text-orange-400"
                    title="Warning"
                    value={mockResourceMetrics.atCapacity}
                    subtitle="Monitor"
                />
                <InteractiveCard
                    icon={AlertTriangle}
                    iconColor="text-red-400"
                    title="Critical"
                    value={mockResourceMetrics.overCapacity}
                    subtitle="Action Required"
                />
                <InteractiveCard
                    icon={Target}
                    iconColor="text-blue-400"
                    title="Efficiency"
                    value={`${mockResourceMetrics.avgUtilization}%`}
                    progress={{ value: mockResourceMetrics.avgUtilization, color: "bg-blue-400" }}
                />
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A0A0A] p-4 rounded-xl border border-gray-800">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="w-full sm:w-64">
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                        >
                            <option value="">Select Target Project</option>
                            {projects.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                    {p.name.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center bg-[#111111] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                        <button
                            onClick={prevWeek}
                            className="p-2.5 hover:bg-[#1A1A1A] transition-colors text-gray-400 hover:text-white border-r border-gray-800"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="px-6 text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">
                            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
                        </span>
                        <button
                            onClick={nextWeek}
                            className="p-2.5 hover:bg-[#1A1A1A] transition-colors text-gray-400 hover:text-white border-l border-gray-800"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Sync Active</span>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-2xl min-h-[400px] relative overflow-hidden">
                {error ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Intelligence Feed Interrupted</h3>
                        <p className="text-gray-400 max-w-md mx-auto mb-6">{(error as Error).message || 'Unable to sync with resource matrix.'}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-red-500/20"
                        >
                            RE-INITIALIZE
                        </button>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-6">
                        <div className="relative">
                            <div className="h-20 w-20 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Users className="w-8 h-8 text-blue-500 opacity-50" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-white font-black uppercase tracking-[0.2em] text-xs">Processing Matrix</p>
                            <p className="text-gray-500 text-[10px] mt-1 font-mono">CALCULATING TEAM UTILIZATION...</p>
                        </div>
                    </div>
                ) : utilization ? (
                    <div className="divide-y divide-gray-800/50 animate-in slide-in-from-bottom-4 duration-700">
                        {/* Summary Header */}
                        <div className="grid grid-cols-1 md:grid-cols-3">
                            <div className="p-8 border-r border-gray-800/50">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Committed Hours</p>
                                </div>
                                <p className="text-5xl font-black text-white tabular-nums tracking-tighter">{utilization.totalProjectEstimatedHours}H</p>
                                <p className="text-[10px] text-gray-500 mt-2 font-mono">Aggregated across all active tasks</p>
                            </div>

                            <div className="p-8 border-r border-gray-800/50">
                                <div className="flex items-center gap-2 mb-4">
                                    <Users className="w-4 h-4 text-cyan-400" />
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Personnel Allocated</p>
                                </div>
                                <p className="text-5xl font-black text-white tabular-nums tracking-tighter">{utilization.teamWorkload.length}</p>
                                <p className="text-[10px] text-gray-500 mt-2 font-mono">Specialists in current project room</p>
                            </div>

                            <div className="p-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Target className="w-4 h-4 text-green-400" />
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Efficiency Index</p>
                                </div>
                                <div className="flex items-end gap-3">
                                    <p className="text-5xl font-black text-white tabular-nums tracking-tighter">{mockResourceMetrics.avgUtilization}%</p>
                                    <div className="mb-2 h-8 w-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="bg-green-400 w-full h-full transform origin-bottom" style={{ transform: `scaleY(${mockResourceMetrics.avgUtilization / 100})` }}></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2 font-mono">Optimized for project performance</p>
                            </div>
                        </div>

                        {/* Detailed Member Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/[0.02]">
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Resource Entity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Workload</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Max Limit</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Saturation</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/10">
                                    {utilization.teamWorkload.map((user: any) => (
                                        <tr
                                            key={user.userId}
                                            className="hover:bg-white/[0.03] transition-all cursor-pointer group"
                                            onClick={() => navigate(`/resources?user=${user.userId}`)}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#111] to-[#222] border border-gray-800 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                                                        <span className="text-sm font-black text-white">{user.userName.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase">{user.userName}</p>
                                                        <p className="text-[10px] text-gray-500 font-mono mt-0.5 tracking-tighter">ID: {user.userId.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-sm font-black font-mono text-white">{user.totalEstimatedHours}H</span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-sm font-black font-mono text-gray-500">{Math.round(user.capacityHours)}H</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 max-w-[120px] h-1.5 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${user.utilizationPercentage > 100 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                                                user.utilizationPercentage > 80 ? 'bg-orange-500' : 'bg-green-500'
                                                                }`}
                                                            style={{ width: `${Math.min(user.utilizationPercentage, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[11px] font-black font-mono text-gray-400 w-10">
                                                        {Math.round(user.utilizationPercentage)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {user.utilizationPercentage > 100 ? (
                                                    <span className="px-3 py-1.5 rounded-lg text-[9px] font-black bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-widest shadow-lg shadow-red-500/5">
                                                        Critical
                                                    </span>
                                                ) : user.utilizationPercentage > 80 ? (
                                                    <span className="px-3 py-1.5 rounded-lg text-[9px] font-black bg-orange-500/10 text-orange-500 border border-orange-500/20 uppercase tracking-widest shadow-lg shadow-orange-500/5">
                                                        Near-Cap
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1.5 rounded-lg text-[9px] font-black bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-widest shadow-lg shadow-green-500/5">
                                                        Optimal
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-[400px] space-y-4">
                        <div className="w-20 h-20 bg-[#111] rounded-3xl border border-gray-800 flex items-center justify-center mb-2">
                            <Users className="w-10 h-10 text-gray-700" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Zero Attribution</h3>
                            <p className="text-gray-500 font-medium italic mt-1">No resource data detected for the selected parameters</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResourceManagementPage;
