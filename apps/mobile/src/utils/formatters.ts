import {format, formatDistanceToNow, parseISO} from 'date-fns';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) {return '—';}
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM d, yyyy');
  } catch {
    return String(date);
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) {return '—';}
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM d, yyyy h:mm a');
  } catch {
    return String(date);
  }
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) {return '—';}
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, {addSuffix: true});
  } catch {
    return String(date);
  }
}

export function formatCurrency(
  amount: number | null | undefined,
  currency = 'USD',
): string {
  if (amount == null) {return '—';}
  return new Intl.NumberFormat('en-US', {
    style:    'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatHours(hours: number | null | undefined): string {
  if (hours == null) {return '—';}
  return `${Number(hours).toFixed(1)}h`;
}

export function capitalize(str: string | null | undefined): string {
  if (!str) {return '';}
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function initials(name: string | null | undefined): string {
  if (!name) {return '?';}
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}
