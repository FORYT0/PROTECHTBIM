import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface InteractiveCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral'; color: string; };
  progress?: { value: number; color: string; };
  badge?: { text: string; color: string; };
  onClick?: () => void;
  to?: string;
  className?: string;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  icon: Icon, iconColor, title, value, subtitle, trend, progress, badge,
  onClick, to, className = ''
}) => {
  const navigate = useNavigate();
  const handleClick = () => { if (onClick) onClick(); else if (to) navigate(to); };
  const clickable = !!(onClick || to);

  return (
    <div
      onClick={handleClick}
      className={`bg-[#0A0A0A] rounded-xl border border-gray-800 p-4 min-w-0 overflow-hidden
        transition-all duration-200
        ${clickable ? 'cursor-pointer hover:bg-[#111] hover:border-gray-700 hover:shadow-lg hover:shadow-blue-500/10' : ''}
        ${className}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
        {trend && (
          <div className={`flex items-center gap-1 shrink-0 ${trend.color}`}>
            {trend.direction === 'up' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
            {trend.direction === 'down' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
            <span className="text-xs font-medium">{trend.value}</span>
          </div>
        )}
        {badge && <span className={`text-xs font-medium truncate ${badge.color}`}>{badge.text}</span>}
      </div>
      <p className="text-xl font-bold text-white mb-0.5 truncate">{value}</p>
      <p className="text-xs text-gray-400 truncate">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
      {progress && (
        <div className="w-full bg-gray-800 rounded-full h-1 mt-2">
          <div className={`h-1 rounded-full transition-all duration-500 ${progress.color}`} style={{ width: `${Math.min(100, progress.value)}%` }} />
        </div>
      )}
    </div>
  );
};

export default InteractiveCard;
