import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';

interface HealthFactor {
  label: string;
  score: number; // 0–100
  detail: string;
  status: 'good' | 'warn' | 'bad';
}

interface ProjectHealthCardProps {
  progress: number;
  openSnags: number;
  criticalSnags: number;
  overdueWPs: number;
  totalWPs: number;
  pendingCOs: number;
  daysRemaining?: number;
  totalDays?: number;
}

function computeFactors(props: ProjectHealthCardProps): HealthFactor[] {
  const { progress, openSnags, criticalSnags, overdueWPs, totalWPs, pendingCOs, daysRemaining, totalDays } = props;

  const scheduleScore = overdueWPs === 0 ? 100
    : Math.max(0, 100 - (overdueWPs / Math.max(totalWPs, 1)) * 200);

  const qualityScore = criticalSnags === 0 ? (openSnags === 0 ? 100 : Math.max(30, 100 - openSnags * 8))
    : Math.max(0, 100 - criticalSnags * 25 - openSnags * 5);

  const contractScore = pendingCOs === 0 ? 100 : Math.max(40, 100 - pendingCOs * 15);

  const progressScore = progress;

  let timeScore = 80;
  if (daysRemaining !== undefined && totalDays) {
    const elapsed = totalDays - daysRemaining;
    const timeUsedPct = elapsed / totalDays;
    const progressExpected = timeUsedPct * 100;
    const variance = progress - progressExpected;
    timeScore = variance >= 0 ? 100 : Math.max(0, 100 + variance * 1.5);
  }

  return [
    {
      label: 'Schedule',
      score: Math.round(scheduleScore),
      detail: overdueWPs === 0 ? 'On track' : `${overdueWPs} overdue`,
      status: scheduleScore >= 70 ? 'good' : scheduleScore >= 40 ? 'warn' : 'bad',
    },
    {
      label: 'Quality',
      score: Math.round(qualityScore),
      detail: criticalSnags === 0 ? (openSnags === 0 ? 'No defects' : `${openSnags} open snags`) : `${criticalSnags} critical`,
      status: qualityScore >= 70 ? 'good' : qualityScore >= 40 ? 'warn' : 'bad',
    },
    {
      label: 'Progress',
      score: Math.round(progressScore),
      detail: `${progress}% complete`,
      status: progress >= 50 ? 'good' : progress >= 25 ? 'warn' : 'bad',
    },
    {
      label: 'Contract',
      score: Math.round(contractScore),
      detail: pendingCOs === 0 ? 'All clear' : `${pendingCOs} pending COs`,
      status: contractScore >= 70 ? 'good' : contractScore >= 40 ? 'warn' : 'bad',
    },
    {
      label: 'Timeline',
      score: Math.round(timeScore),
      detail: daysRemaining !== undefined ? `${daysRemaining} days left` : 'No deadline set',
      status: timeScore >= 70 ? 'good' : timeScore >= 40 ? 'warn' : 'bad',
    },
  ];
}

const factorStatusColor = (s: 'good' | 'warn' | 'bad') =>
  s === 'good' ? 'text-green-400' : s === 'warn' ? 'text-yellow-400' : 'text-red-400';

const factorBarColor = (s: 'good' | 'warn' | 'bad') =>
  s === 'good' ? 'bg-green-500' : s === 'warn' ? 'bg-yellow-500' : 'bg-red-500';

export function ProjectHealthCard(props: ProjectHealthCardProps) {
  const factors = computeFactors(props);
  const overall = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  const overallStatus = overall >= 70 ? 'good' : overall >= 40 ? 'warn' : 'bad';
  const overallLabel = overall >= 70 ? 'Healthy' : overall >= 40 ? 'At Risk' : 'Critical';
  const overallColor = overallStatus === 'good' ? 'text-green-400' : overallStatus === 'warn' ? 'text-yellow-400' : 'text-red-400';
  const ringColor = overallStatus === 'good' ? '#4ade80' : overallStatus === 'warn' ? '#facc15' : '#f87171';

  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - overall / 100);

  return (
    <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-white">Project Health</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${
          overallStatus === 'good' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
          overallStatus === 'warn' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
          'bg-red-500/20 text-red-400 border-red-500/30'
        }`}>{overallLabel}</span>
      </div>

      {/* Overall ring */}
      <div className="flex items-center gap-5 mb-5">
        <div className="relative shrink-0">
          <svg className="-rotate-90" width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r={r} fill="none" stroke="#1f2937" strokeWidth="5" />
            <circle cx="45" cy="45" r={r} fill="none" stroke={ringColor} strokeWidth="5"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{overall}</span>
            <span className="text-[9px] text-gray-500">/ 100</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-lg font-bold ${overallColor}`}>{overallLabel}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            {overallStatus === 'good'
              ? 'Project is on track. Continue maintaining current pace.'
              : overallStatus === 'warn'
              ? 'Some areas need attention. Review highlighted factors.'
              : 'Immediate action required on critical items.'}
          </p>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2.5">
        {factors.map(f => (
          <div key={f.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16">{f.label}</span>
                <span className="text-xs text-gray-600">{f.detail}</span>
              </div>
              <span className={`text-xs font-semibold ${factorStatusColor(f.status)}`}>{f.score}</span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${factorBarColor(f.status)}`}
                style={{ width: `${f.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectHealthCard;
