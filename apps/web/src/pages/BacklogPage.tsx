import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workPackageService } from '../services/workPackageService';
import { sprintService } from '../services/sprintService';
import { projectService } from '../services/projectService';
import { WorkPackage, SprintStatus } from '@protecht-bim/shared-types';
import { queryKeys } from '../lib/queryClient';
import { useProjectRoom } from '../hooks/useRealtimeSync';
import { toast } from '../utils/toast';
import {
  Package, CheckSquare, Square,
  Layers, Target, Clock, ExternalLink
} from 'lucide-react';

export const BacklogPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // JOIN REAL-TIME ROOM
  useProjectRoom(projectId);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  // FETCH PROJECT DETAILS
  const { data: project } = useQuery({
    queryKey: queryKeys.project(projectId!),
    queryFn: () => projectService.getProject(projectId!),
    enabled: !!projectId,
  });

  // FETCH BACKLOG ITEMS
  const {
    data: backlogData,
    isLoading: loadingBacklog,
    error: backlogError
  } = useQuery({
    queryKey: queryKeys.projectBacklog(projectId!),
    queryFn: () => workPackageService.getBacklog(projectId!),
    enabled: !!projectId,
  });

  // FETCH PLANNED SPRINTS
  const {
    data: sprintsData,
    isLoading: loadingSprints
  } = useQuery({
    queryKey: queryKeys.projectSprints(projectId!, SprintStatus.PLANNED),
    queryFn: () => sprintService.listSprints(projectId!, { status: SprintStatus.PLANNED }),
    enabled: !!projectId,
  });

  const backlogItems = backlogData?.work_packages || [];
  const sprints = sprintsData?.sprints || [];

  // MUTATION: ADD TO SPRINT
  const addToSprintMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSprint || selectedItems.size === 0) return;
      return await sprintService.addWorkPackagesToSprint(
        selectedSprint,
        Array.from(selectedItems)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectBacklog(projectId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectSprints(projectId!, SprintStatus.PLANNED) });
      setSelectedItems(new Set());
      setSelectedSprint('');
      toast.success(`Moved ${selectedItems.size} items to sprint`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to sync with sprint engine');
    }
  });

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === backlogItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(backlogItems.map((item: any) => item.id)));
    }
  };

  const getTotalStoryPoints = () => {
    return Array.from(selectedItems).reduce((total: number, itemId: string) => {
      const item = backlogItems.find((i: any) => i.id === itemId);
      return total + (item?.story_points || 0);
    }, 0);
  };

  const isLoading = loadingBacklog || loadingSprints;

  if (backlogError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
        <Layers className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">System Desync</h2>
        <p className="text-gray-400 mb-6">{(backlogError as Error).message}</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.projectBacklog(projectId!) })}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
        >
          RE-INITIALIZE
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Product Backlog</h1>
          <p className="text-gray-500 mt-1 font-mono text-[10px] tracking-[0.2em]">{project?.name.toUpperCase() || 'CORE ASSET'} // ARCHITECTURAL PIPELINE</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="px-5 py-2.5 text-xs font-black text-gray-400 bg-[#0A0A0A] border border-gray-800 rounded-xl hover:text-white hover:border-gray-600 transition-all uppercase tracking-widest"
          >
            Project Detail
          </button>
        </div>
      </div>

      {/* PLANNING COMMAND CENTER */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/5 animate-in slide-in-from-top-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-black text-white text-lg tracking-tight uppercase">
                  {selectedItems.size} Entities Targeted
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    Load: {getTotalStoryPoints()} SP
                  </span>
                  <span className="text-gray-600 mx-1">|</span>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Awaiting Assignment</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={selectedSprint}
                onChange={(e) => setSelectedSprint(e.target.value)}
                className="w-full sm:w-64 px-4 py-2.5 bg-[#0A0A0A] border border-gray-800 rounded-xl text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase tracking-widest"
              >
                <option value="">Select Target Sprint</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name.toUpperCase()} (Cap: {sprint.capacity || 'Inf'})
                  </option>
                ))}
              </select>
              <button
                onClick={() => addToSprintMutation.mutate()}
                disabled={!selectedSprint || addToSprintMutation.isPending}
                className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-blue-600/20 disabled:opacity-30 disabled:grayscale uppercase tracking-widest"
              >
                {addToSprintMutation.isPending ? 'Syncing...' : 'Deploy to Sprint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BACKLOG GRID */}
      <div className="bg-[#0A0A0A] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-8 py-5 border-b border-gray-800 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-gray-500" />
            <h2 className="text-xs font-black text-white uppercase tracking-widest">
              Available Work Packages ({backlogItems.length})
            </h2>
          </div>
          <button
            onClick={handleSelectAll}
            className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
          >
            {selectedItems.size === backlogItems.length ? 'Reset All' : 'Select All In View'}
          </button>
        </div>

        {isLoading ? (
          <div className="p-24 flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-800 border-t-blue-500"></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4">Streaming Backbone Data...</p>
          </div>
        ) : backlogItems.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Layers className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Empty Pipeline</h3>
            <p className="text-gray-500 font-medium italic">All packages are assigned or none exist.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/30">
            {backlogItems.map((item: any) => (
              <div
                key={item.id}
                className={`group px-8 py-6 hover:bg-white/[0.02] transition-all cursor-pointer ${selectedItems.has(item.id) ? 'bg-blue-600/5' : ''
                  }`}
                onClick={() => handleSelectItem(item.id)}
              >
                <div className="flex items-start gap-6">
                  {/* Action */}
                  <div className="mt-1">
                    {selectedItems.has(item.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-500 animate-in zoom-in" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-700 group-hover:text-gray-500 transition-colors" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                          {item.subject}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-1 italic font-medium">
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                          <span className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            {item.type}
                          </span>
                          <span className={`px-2 py-1 border rounded text-[9px] font-black uppercase tracking-widest ${item.priority?.toLowerCase() === 'urgent' || item.priority?.toLowerCase() === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            item.priority?.toLowerCase() === 'normal' || item.priority?.toLowerCase() === 'medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                              'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            }`}>
                            {item.priority}
                          </span>
                          {item.assignee && (
                            <div className="flex items-center gap-1.5 ml-2">
                              <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-black text-white">
                                {item.assignee.name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase">{item.assignee.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 text-right">
                        {item.story_points !== null && (
                          <div className="text-xl font-black text-white group-hover:text-blue-500 transition-colors tabular-nums tracking-tighter">
                            {item.story_points} <span className="text-[10px] text-gray-500 uppercase ml-1 tracking-widest">SP</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600">
                          <Clock className="w-3 h-3" />
                          {item.estimated_hours || 0}H EST
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 mt-2">
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BacklogPage;
