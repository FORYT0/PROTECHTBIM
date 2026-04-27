import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Shared LoadingState — uniform spinner across all pages.
 */
export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />
      <p className="mt-4 text-sm text-gray-400">{message}</p>
    </div>
  );
}

/**
 * Shared ErrorState — uniform error display across all pages.
 */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-400">Failed to load data</p>
          <p className="text-xs text-gray-400 mt-1 break-words">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3 h-3" />Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Shared EmptyState — uniform empty state across all pages.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-12 text-center">
      <Icon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
