/**
 * Shared date formatting utility — used across all pages.
 * Always formats as DD MMM YYYY (e.g. "27 Apr 2026") for consistency.
 */

export const formatDate = (
  date: string | Date | null | undefined,
  opts?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', opts || {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

export const formatDateShort = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
};

export const formatDateLong = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

export const isOverdue = (date: string | Date | null | undefined, status?: string): boolean => {
  if (!date) return false;
  const done = ['done', 'closed', 'completed', 'verified', 'approved'];
  if (status && done.includes(status.toLowerCase())) return false;
  return new Date(date) < new Date();
};

export const daysFromNow = (date: string | Date | null | undefined): number => {
  if (!date) return 0;
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
};
