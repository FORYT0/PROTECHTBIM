import React from 'react';
import { Activity, ActivityActionType, ActivityEntityType } from '../services/ActivityService';
import './ActivityItem.css';

interface ActivityItemProps {
  activity: Activity;
}

/**
 * Get human-readable action label
 */
const getActionLabel = (action: ActivityActionType): string => {
  const labels: Record<ActivityActionType, string> = {
    [ActivityActionType.CREATED]: 'Created',
    [ActivityActionType.UPDATED]: 'Updated',
    [ActivityActionType.DELETED]: 'Deleted',
    [ActivityActionType.COMMENTED]: 'Commented',
    [ActivityActionType.ATTACHED]: 'Attached',
    [ActivityActionType.MENTIONED]: 'Mentioned',
    [ActivityActionType.TRANSITIONED]: 'Transitioned',
    [ActivityActionType.ASSIGNED]: 'Assigned',
    [ActivityActionType.SHARED]: 'Shared',
  };
  return labels[action] || action;
};

/**
 * Get human-readable entity type label
 */
const getEntityLabel = (entity: ActivityEntityType): string => {
  const labels: Record<ActivityEntityType, string> = {
    [ActivityEntityType.PROJECT]: 'Project',
    [ActivityEntityType.WORK_PACKAGE]: 'Work Package',
    [ActivityEntityType.TIME_ENTRY]: 'Time Entry',
    [ActivityEntityType.COST_ENTRY]: 'Cost Entry',
    [ActivityEntityType.COMMENT]: 'Comment',
    [ActivityEntityType.ATTACHMENT]: 'Attachment',
    [ActivityEntityType.WIKI_PAGE]: 'Wiki Page',
    [ActivityEntityType.SPRINT]: 'Sprint',
    [ActivityEntityType.BOARD]: 'Board',
    [ActivityEntityType.BASELINE]: 'Baseline',
  };
  return labels[entity] || entity;
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Get icon for action type
 */
const getActionIcon = (action: ActivityActionType): JSX.Element => {
  const iconClass = 'activity-icon';

  switch (action) {
    case ActivityActionType.CREATED:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    case ActivityActionType.UPDATED:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case ActivityActionType.DELETED:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case ActivityActionType.COMMENTED:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      );
    case ActivityActionType.ATTACHED:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case ActivityActionType.MENTIONED:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h-2m0 0H10m2 0v2m0-2v-2m7-4a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case ActivityActionType.TRANSITIONED:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case ActivityActionType.ASSIGNED:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case ActivityActionType.SHARED:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C9.589 12.938 10 12.052 10 11c0-1.657-.895-3-2-3s-2 1.343-2 3c0 1.052.411 1.938 1.316 2.342m0 0H21m0 0h-8m-5 3v2a3 3 0 003 3h4a3 3 0 003-3v-2m0 0H9m0 0h8" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

/**
 * Get color class for action type
 */
const getActionColorClass = (action: ActivityActionType): string => {
  switch (action) {
    case ActivityActionType.CREATED:
      return 'action-created';
    case ActivityActionType.UPDATED:
      return 'action-updated';
    case ActivityActionType.DELETED:
      return 'action-deleted';
    case ActivityActionType.COMMENTED:
      return 'action-commented';
    case ActivityActionType.ATTACHED:
      return 'action-attached';
    case ActivityActionType.MENTIONED:
      return 'action-mentioned';
    case ActivityActionType.TRANSITIONED:
      return 'action-transitioned';
    case ActivityActionType.ASSIGNED:
      return 'action-assigned';
    case ActivityActionType.SHARED:
      return 'action-shared';
    default:
      return 'action-default';
  }
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const actionLabel = getActionLabel(activity.action_type);
  const entityLabel = getEntityLabel(activity.entity_type);
  const relativeTime = getRelativeTime(activity.created_at);
  const actionIcon = getActionIcon(activity.action_type);
  const colorClass = getActionColorClass(activity.action_type);

  return (
    <div className="activity-item">
      <div className={`activity-icon-container ${colorClass}`}>
        {actionIcon}
      </div>

      <div className="activity-content">
        <div className="activity-header">
          <div className="activity-user-action">
            <span className="activity-user-name">{activity.user_name || activity.user_email || 'Unknown User'}</span>
            <span className="activity-action">{actionLabel}</span>
            <span className="activity-entity-type">{entityLabel}</span>
          </div>
          <div className="activity-time" title={new Date(activity.created_at).toLocaleString()}>
            {relativeTime}
          </div>
        </div>

        <div className="activity-description">
          {activity.description}
        </div>

        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="activity-metadata">
            {activity.metadata.oldValue !== undefined && (
              <div className="metadata-item">
                <span className="metadata-label">From:</span>
                <span className="metadata-value old">{String(activity.metadata.oldValue)}</span>
              </div>
            )}
            {activity.metadata.newValue !== undefined && (
              <div className="metadata-item">
                <span className="metadata-label">To:</span>
                <span className="metadata-value new">{String(activity.metadata.newValue)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
