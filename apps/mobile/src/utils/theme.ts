/**
 * Design tokens — matches the web app's dark theme exactly.
 */
export const COLORS = {
  // Backgrounds
  bg:        '#000000',
  surface:   '#0A0A0A',
  card:      '#111111',
  cardHover: '#161616',

  // Borders
  border:    '#1F1F1F',
  borderSub: '#2A2A2A',

  // Text
  textPrimary: '#FFFFFF',
  textSecond:  '#9CA3AF',  // gray-400
  textMuted:   '#6B7280',  // gray-500
  textDisabled:'#374151',  // gray-700

  // Accent
  blue:        '#3B82F6',
  blueDim:     '#1D4ED8',
  blueAlpha:   'rgba(59,130,246,0.15)',
  green:       '#4ADE80',
  greenAlpha:  'rgba(74,222,128,0.15)',
  yellow:      '#FBBF24',
  yellowAlpha: 'rgba(251,191,36,0.15)',
  red:         '#F87171',
  redAlpha:    'rgba(248,113,113,0.15)',
  purple:      '#A78BFA',
  purpleAlpha: 'rgba(167,139,250,0.15)',

  // Status badges
  statusActive:    '#4ADE80',
  statusOnHold:    '#FBBF24',
  statusCompleted: '#3B82F6',
  statusCancelled: '#6B7280',
  statusPlanning:  '#A78BFA',
};

export const FONTS = {
  xs:   11,
  sm:   13,
  base: 15,
  lg:   17,
  xl:   20,
  '2xl':24,
  '3xl':30,
};

export const RADIUS = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  18,
  full:9999,
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl':24,
  '3xl':32,
};

export function statusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':      return COLORS.statusActive;
    case 'on_hold':     return COLORS.statusOnHold;
    case 'completed':   return COLORS.statusCompleted;
    case 'cancelled':   return COLORS.statusCancelled;
    case 'planning':    return COLORS.statusPlanning;
    case 'approved':    return COLORS.statusCompleted;
    case 'pending':     return COLORS.statusOnHold;
    case 'rejected':    return COLORS.red;
    case 'open':        return COLORS.red;
    case 'resolved':    return COLORS.green;
    case 'in_progress': return COLORS.blue;
    default:            return COLORS.textMuted;
  }
}

export function priorityColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case 'critical': return COLORS.red;
    case 'high':     return COLORS.yellow;
    case 'medium':   return COLORS.blue;
    case 'low':      return COLORS.green;
    default:         return COLORS.textMuted;
  }
}
