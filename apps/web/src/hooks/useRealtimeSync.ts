import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsClient, RealtimeEventType } from '../lib/websocket';
import { invalidateProjectDashboard, queryKeys } from '../lib/queryClient';

/**
 * REAL-TIME SYNCHRONIZATION HOOK
 * 
 * This hook listens to WebSocket events and automatically invalidates React Query caches.
 * When ANY data changes, the unified dashboard cache is invalidated.
 * All pages stay synchronized through this single hook.
 * 
 * ARCHITECTURE:
 * - Backend emits events on mutations
 * - WebSocket broadcasts to all clients
 * - This hook catches them and invalidates caches
 * - React Query refetches fresh data
 * - All pages re-render with new data
 * 
 * USAGE:
 * Call this hook once in your App/Layout component.
 * It automatically syncs all real-time updates across ALL pages.
 */
export const useRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Budget events - trigger financial dashboard refresh
    const handleBudgetCreated = (event: any) => {
      console.log('[Realtime] Budget created:', event);
      if (event.projectId) {
        invalidateProjectDashboard(event.projectId);
      }
    };

    const handleBudgetUpdated = (event: any) => {
      console.log('[Realtime] Budget updated:', event);
      if (event.projectId) {
        invalidateProjectDashboard(event.projectId);
      }
    };

    const handleBudgetDeleted = (event: any) => {
      console.log('[Realtime] Budget deleted:', event);
      if (event.projectId) {
        invalidateProjectDashboard(event.projectId);
      }
    };

    // Cost entry events - trigger financial dashboard refresh
    const handleCostEntryCreated = (event: any) => {
      console.log('[Realtime] Cost entry created:', event);
      if (event.projectId) {
        invalidateProjectDashboard(event.projectId);
        queryClient.invalidateQueries({ queryKey: queryKeys.projectCostEntries(event.projectId) });
      }
    };

    const handleCostEntryUpdated = (event: any) => {
      console.log('[Realtime] Cost entry updated:', event);
      if (event.projectId) {
        invalidateProjectDashboard(event.projectId);
        queryClient.invalidateQueries({ queryKey: queryKeys.projectCostEntries(event.projectId) });
      }
    };

    const handleCostEntryDeleted = (event: any) => {
      console.log('[Realtime] Cost entry deleted:', event);
      if (event.projectId) {
        invalidateProjectDashboard(event.projectId);
        queryClient.invalidateQueries({ queryKey: queryKeys.projectCostEntries(event.projectId) });
      }
    };

    const handleCostEntryApproved = (event: any) => {
      console.log('[Realtime] Cost entry approved:', event);
      if (event.projectId) {
        invalidateProjectDashboard(event.projectId);
        queryClient.invalidateQueries({ queryKey: queryKeys.projectCostEntries(event.projectId) });
      }
    };

    // Time entry events - affects labor costs and resource utilization
    const handleTimeEntryCreated = (event: any) => {
      console.log('[Realtime] Time entry created:', event);
      if (event.projectId) {
        invalidateProjectDashboard(event.projectId);
        queryClient.invalidateQueries({ queryKey: queryKeys.projectTimeEntries(event.projectId) });
      }
    };

    const handleTimeEntryUpdated = (event: any) => {
      console.log('[Realtime] Time entry updated:', event);
      if (event.projectId) {
        invalidateProjectDashboard(event.projectId);
        queryClient.invalidateQueries({ queryKey: queryKeys.projectTimeEntries(event.projectId) });
      }
    };

    const handleTimeEntryDeleted = (event: any) => {
      console.log('[Realtime] Time entry deleted:', event);
      if (event.projectId) {
        invalidateProjectDashboard(event.projectId);
        queryClient.invalidateQueries({ queryKey: queryKeys.projectTimeEntries(event.projectId) });
      }
    };

    // Work package events - affects schedule and progress
    const handleWorkPackageCreated = (event: any) => {
      console.log('[Realtime] Work package created:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectWorkPackages(event.projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.project(event.projectId) });
        invalidateProjectDashboard(event.projectId);
      }
    };

    const handleWorkPackageUpdated = (event: any) => {
      console.log('[Realtime] Work package updated:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectWorkPackages(event.projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.workPackage(event.entityId) });
        invalidateProjectDashboard(event.projectId);
      }
    };

    const handleWorkPackageDeleted = (event: any) => {
      console.log('[Realtime] Work package deleted:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectWorkPackages(event.projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.project(event.projectId) });
        invalidateProjectDashboard(event.projectId);
      }
    };

    // ✅ COMPREHENSIVE FINANCIAL UPDATE EVENT
    // This is emitted by backend whenever ANY financial data changes
    const handleFinancialSummaryUpdated = (event: any) => {
      console.log('[Realtime] Financial summary updated:', event);
      if (event.projectId) {
        // Invalidate entire dashboard
        invalidateProjectDashboard(event.projectId);
      }
    };

    // Activity events
    const handleActivityCreated = (event: any) => {
      console.log('[Realtime] Activity created:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectActivities(event.projectId) });
      }
    };

    // Comment events
    const handleCommentCreated = (event: any) => {
      console.log('[Realtime] Comment created:', event);
      if (event.data?.entityType && event.data?.entityId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.entityComments(event.data.entityType, event.data.entityId)
        });
      }
    };

    const handleCommentUpdated = (event: any) => {
      console.log('[Realtime] Comment updated:', event);
      if (event.data?.entityType && event.data?.entityId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.entityComments(event.data.entityType, event.data.entityId)
        });
      }
    };

    const handleCommentDeleted = (event: any) => {
      console.log('[Realtime] Comment deleted:', event);
      if (event.data?.entityType && event.data?.entityId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.entityComments(event.data.entityType, event.data.entityId)
        });
      }
    };

    // Register event listeners
    // Change Order events
    const handleChangeOrderCreated = (event: any) => {
      console.log('[Realtime] Change order created:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectChangeOrders(event.projectId) });
        invalidateProjectDashboard(event.projectId);
      }
    };

    const handleChangeOrderUpdated = (event: any) => {
      console.log('[Realtime] Change order updated:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectChangeOrders(event.projectId) });
      }
    };

    // Daily Report events
    const handleDailyReportCreated = (event: any) => {
      console.log('[Realtime] Daily report created:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectDailyReports(event.projectId) });
      }
    };

    const handleDailyReportUpdated = (event: any) => {
      console.log('[Realtime] Daily report updated:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectDailyReports(event.projectId) });
      }
    };

    // Snag events
    const handleSnagCreated = (event: any) => {
      console.log('[Realtime] Snag created:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectSnags(event.projectId) });
      }
    };

    const handleSnagUpdated = (event: any) => {
      console.log('[Realtime] Snag updated:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectSnags(event.projectId) });
      }
    };

    // Contract events
    const handleContractCreated = (event: any) => {
      console.log('[Realtime] Contract created:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectContracts(event.projectId) });
        invalidateProjectDashboard(event.projectId);
      }
    };

    const handleContractUpdated = (event: any) => {
      console.log('[Realtime] Contract updated:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectContracts(event.projectId) });
        invalidateProjectDashboard(event.projectId);
      }
    };

    const handleContractDeleted = (event: any) => {
      console.log('[Realtime] Contract deleted:', event);
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectContracts(event.projectId) });
        invalidateProjectDashboard(event.projectId);
      }
    };

    // Register event listeners
    wsClient.on(RealtimeEventType.BUDGET_CREATED, handleBudgetCreated);
    wsClient.on(RealtimeEventType.BUDGET_UPDATED, handleBudgetUpdated);
    wsClient.on(RealtimeEventType.BUDGET_DELETED, handleBudgetDeleted);

    wsClient.on(RealtimeEventType.COST_ENTRY_CREATED, handleCostEntryCreated);
    wsClient.on(RealtimeEventType.COST_ENTRY_UPDATED, handleCostEntryUpdated);
    wsClient.on(RealtimeEventType.COST_ENTRY_DELETED, handleCostEntryDeleted);
    wsClient.on(RealtimeEventType.COST_ENTRY_APPROVED, handleCostEntryApproved);

    wsClient.on(RealtimeEventType.TIME_ENTRY_CREATED, handleTimeEntryCreated);
    wsClient.on(RealtimeEventType.TIME_ENTRY_UPDATED, handleTimeEntryUpdated);
    wsClient.on(RealtimeEventType.TIME_ENTRY_DELETED, handleTimeEntryDeleted);

    wsClient.on(RealtimeEventType.WORK_PACKAGE_CREATED, handleWorkPackageCreated);
    wsClient.on(RealtimeEventType.WORK_PACKAGE_UPDATED, handleWorkPackageUpdated);
    wsClient.on(RealtimeEventType.WORK_PACKAGE_DELETED, handleWorkPackageDeleted);

    wsClient.on(RealtimeEventType.CHANGE_ORDER_CREATED, handleChangeOrderCreated);
    wsClient.on(RealtimeEventType.CHANGE_ORDER_UPDATED, handleChangeOrderUpdated);
    wsClient.on(RealtimeEventType.CHANGE_ORDER_APPROVED, handleChangeOrderUpdated);
    wsClient.on(RealtimeEventType.CHANGE_ORDER_REJECTED, handleChangeOrderUpdated);

    wsClient.on(RealtimeEventType.DAILY_REPORT_CREATED, handleDailyReportCreated);
    wsClient.on(RealtimeEventType.DAILY_REPORT_UPDATED, handleDailyReportUpdated);

    wsClient.on(RealtimeEventType.SNAG_CREATED, handleSnagCreated);
    wsClient.on(RealtimeEventType.SNAG_UPDATED, handleSnagUpdated);
    wsClient.on(RealtimeEventType.SNAG_RESOLVED, handleSnagUpdated);

    wsClient.on(RealtimeEventType.CONTRACT_CREATED, handleContractCreated);
    wsClient.on(RealtimeEventType.CONTRACT_UPDATED, handleContractUpdated);
    wsClient.on(RealtimeEventType.CONTRACT_DELETED, handleContractDeleted);

    // ✅ CATCH-ALL FINANCIAL UPDATE EVENT
    wsClient.on(RealtimeEventType.FINANCIAL_SUMMARY_UPDATED, handleFinancialSummaryUpdated);

    wsClient.on(RealtimeEventType.ACTIVITY_CREATED, handleActivityCreated);

    wsClient.on(RealtimeEventType.COMMENT_CREATED, handleCommentCreated);
    wsClient.on(RealtimeEventType.COMMENT_UPDATED, handleCommentUpdated);
    wsClient.on(RealtimeEventType.COMMENT_DELETED, handleCommentDeleted);

    // Cleanup on unmount
    return () => {
      wsClient.off(RealtimeEventType.BUDGET_CREATED, handleBudgetCreated);
      wsClient.off(RealtimeEventType.BUDGET_UPDATED, handleBudgetUpdated);
      wsClient.off(RealtimeEventType.BUDGET_DELETED, handleBudgetDeleted);

      wsClient.off(RealtimeEventType.COST_ENTRY_CREATED, handleCostEntryCreated);
      wsClient.off(RealtimeEventType.COST_ENTRY_UPDATED, handleCostEntryUpdated);
      wsClient.off(RealtimeEventType.COST_ENTRY_DELETED, handleCostEntryDeleted);
      wsClient.off(RealtimeEventType.COST_ENTRY_APPROVED, handleCostEntryApproved);

      wsClient.off(RealtimeEventType.TIME_ENTRY_CREATED, handleTimeEntryCreated);
      wsClient.off(RealtimeEventType.TIME_ENTRY_UPDATED, handleTimeEntryUpdated);
      wsClient.off(RealtimeEventType.TIME_ENTRY_DELETED, handleTimeEntryDeleted);

      wsClient.off(RealtimeEventType.WORK_PACKAGE_CREATED, handleWorkPackageCreated);
      wsClient.off(RealtimeEventType.WORK_PACKAGE_UPDATED, handleWorkPackageUpdated);
      wsClient.off(RealtimeEventType.WORK_PACKAGE_DELETED, handleWorkPackageDeleted);

      wsClient.off(RealtimeEventType.CHANGE_ORDER_CREATED, handleChangeOrderCreated);
      wsClient.off(RealtimeEventType.CHANGE_ORDER_UPDATED, handleChangeOrderUpdated);
      wsClient.off(RealtimeEventType.CHANGE_ORDER_APPROVED, handleChangeOrderUpdated);
      wsClient.off(RealtimeEventType.CHANGE_ORDER_REJECTED, handleChangeOrderUpdated);

      wsClient.off(RealtimeEventType.DAILY_REPORT_CREATED, handleDailyReportCreated);
      wsClient.off(RealtimeEventType.DAILY_REPORT_UPDATED, handleDailyReportUpdated);

      wsClient.off(RealtimeEventType.SNAG_CREATED, handleSnagCreated);
      wsClient.off(RealtimeEventType.SNAG_UPDATED, handleSnagUpdated);
      wsClient.off(RealtimeEventType.SNAG_RESOLVED, handleSnagUpdated);

      wsClient.off(RealtimeEventType.CONTRACT_CREATED, handleContractCreated);
      wsClient.off(RealtimeEventType.CONTRACT_UPDATED, handleContractUpdated);
      wsClient.off(RealtimeEventType.CONTRACT_DELETED, handleContractDeleted);

      wsClient.off(RealtimeEventType.FINANCIAL_SUMMARY_UPDATED, handleFinancialSummaryUpdated);

      wsClient.off(RealtimeEventType.ACTIVITY_CREATED, handleActivityCreated);

      wsClient.off(RealtimeEventType.COMMENT_CREATED, handleCommentCreated);
      wsClient.off(RealtimeEventType.COMMENT_UPDATED, handleCommentUpdated);
      wsClient.off(RealtimeEventType.COMMENT_DELETED, handleCommentDeleted);
    };
  }, [queryClient]);
};

/**
 * Project Room Hook
 * 
 * Use this hook in project-specific pages to join/leave project rooms.
 * This ensures you receive real-time updates for the current project.
 */
export const useProjectRoom = (projectId: string | undefined) => {
  useEffect(() => {
    if (!projectId) return;

    // Join project room
    wsClient.joinProject(projectId);
    console.log('[Realtime] Joined project room:', projectId);

    // Leave on unmount
    return () => {
      wsClient.leaveProject(projectId);
      console.log('[Realtime] Left project room:', projectId);
    };
  }, [projectId]);
};
