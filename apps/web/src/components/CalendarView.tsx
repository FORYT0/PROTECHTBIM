import React, { useState, useMemo } from 'react';
import { WorkPackage } from '@protecht-bim/shared-types';
import { ChevronLeft, ChevronRight, X, Grid, List, Package, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export type CalendarViewType = 'month';

export interface CalendarViewProps {
  workPackages: WorkPackage[];
  onWorkPackageClick: (workPackage: WorkPackage) => void;
  onDateChange: (workPackageId: string, newStartDate: Date, newDueDate: Date) => void;
}

interface DayPopupState {
  date: Date;
  packages: WorkPackage[];
}

type PopupViewMode = 'grid' | 'list';

const statusColor = (status: string) => {
  const s = (status || '').toLowerCase().replace(' ', '_').replace('-', '_');
  if (s.includes('closed') || s.includes('done')) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (s.includes('progress')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (s.includes('new') || s === '') return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
};

const priorityColor = (priority: string) => {
  switch ((priority || '').toLowerCase()) {
    case 'urgent': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'normal': case 'medium': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const CalendarView: React.FC<CalendarViewProps> = ({ workPackages, onWorkPackageClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayPopup, setDayPopup] = useState<DayPopupState | null>(null);
  const [popupView, setPopupView] = useState<PopupViewMode>('list');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  // Build day grid: 6 weeks × 7 days
  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) calendarDays.push(null);
  for (let d = 1; d <= totalDays; d++) calendarDays.push(new Date(year, month, d));

  // Map of date-key → packages active on that day
  const dayPackages = useMemo(() => {
    const map = new Map<string, WorkPackage[]>();
    workPackages.forEach(wp => {
      const start = wp.start_date ? new Date(wp.start_date) : wp.startDate ? new Date(wp.startDate as any) : null;
      const end = wp.due_date ? new Date(wp.due_date) : wp.dueDate ? new Date(wp.dueDate as any) : null;
      if (!start && !end) return;

      const s = start || end!;
      const e = end || start!;

      // iterate each calendar day in view
      for (let d = 1; d <= totalDays; d++) {
        const day = new Date(year, month, d);
        if (day >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
            day <= new Date(e.getFullYear(), e.getMonth(), e.getDate())) {
          const key = `${year}-${month}-${d}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(wp);
        }
      }
    });
    return map;
  }, [workPackages, year, month, totalDays]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();

  const handleDayClick = (date: Date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const pkgs = dayPackages.get(key) || [];
    setDayPopup({ date, packages: pkgs });
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h3 className="font-semibold text-white">{monthName}</h3>
          <p className="text-xs text-gray-500">{workPackages.length} packages in view</p>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-gray-800">
        {dayLabels.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-800/50 bg-[#050505]" />;
          }

          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const pkgs = dayPackages.get(key) || [];
          const isToday = date.toDateString() === today.toDateString();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div key={key}
              onClick={() => handleDayClick(date)}
              className={`h-24 border-b border-r border-gray-800/50 p-1.5 cursor-pointer transition-colors overflow-hidden group
                ${isToday ? 'bg-blue-500/5 border-blue-500/20' : isWeekend ? 'bg-[#050505]' : 'hover:bg-[#111]'}`}>
              {/* Day number */}
              <div className={`text-xs font-medium mb-1 flex items-center justify-between ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] ${isToday ? 'bg-blue-600 text-white' : ''}`}>
                  {date.getDate()}
                </span>
                {pkgs.length > 0 && (
                  <span className="text-[9px] text-gray-600 group-hover:text-gray-400">{pkgs.length}</span>
                )}
              </div>
              {/* Package pills */}
              <div className="space-y-0.5">
                {pkgs.slice(0, 3).map((wp, j) => (
                  <div key={wp.id}
                    onClick={(e) => { e.stopPropagation(); onWorkPackageClick(wp); }}
                    className="text-[9px] leading-none px-1.5 py-1 rounded truncate font-medium cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: `${['#1d4ed8','#b45309','#15803d','#7c3aed','#0891b2'][j % 5]}30`, color: ['#93c5fd','#fcd34d','#86efac','#c4b5fd','#67e8f9'][j % 5] }}>
                    {wp.subject}
                  </div>
                ))}
                {pkgs.length > 3 && (
                  <div className="text-[9px] text-gray-600 px-1">+{pkgs.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Popup Modal */}
      {dayPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDayPopup(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[#0A0A0A] border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>

            {/* Popup Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <div>
                <h3 className="font-semibold text-white">
                  {dayPopup.date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dayPopup.packages.length} work package{dayPopup.packages.length !== 1 ? 's' : ''} active
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Grid/List toggle for popup */}
                <div className="flex items-center bg-[#111] border border-gray-800 rounded-lg p-0.5">
                  <button onClick={() => setPopupView('grid')}
                    className={`p-1.5 rounded-md transition-all ${popupView === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setPopupView('list')}
                    className={`p-1.5 rounded-md transition-all ${popupView === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => setDayPopup(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Popup Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {dayPopup.packages.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No work packages on this day</p>
                </div>
              ) : popupView === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-2 gap-3">
                  {dayPopup.packages.map(wp => (
                    <div key={wp.id}
                      onClick={() => { onWorkPackageClick(wp); setDayPopup(null); }}
                      className="bg-[#111] border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-gray-700 hover:bg-[#161616] transition-all">
                      {/* Priority dot */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${priorityColor((wp as any).priority || '')}`} />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColor((wp as any).status || '')}`}>
                          {(wp as any).status || 'New'}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-white line-clamp-2 mb-2">{wp.subject}</h4>
                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Progress</span>
                          <span>{(wp as any).percentageDone || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1">
                          <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${(wp as any).percentageDone || 0}%` }} />
                        </div>
                      </div>
                      {/* Due date */}
                      {(wp.due_date || (wp as any).dueDate) && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Due {new Date((wp.due_date || (wp as any).dueDate) as any).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-2">
                  {dayPopup.packages.map(wp => (
                    <div key={wp.id}
                      onClick={() => { onWorkPackageClick(wp); setDayPopup(null); }}
                      className="bg-[#111] border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-gray-700 hover:bg-[#161616] transition-all flex items-center gap-3">
                      {/* Priority dot */}
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityColor((wp as any).priority || '')}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-medium text-white truncate">{wp.subject}</h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${statusColor((wp as any).status || '')}`}>
                            {(wp as any).status || 'New'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                          {(wp.due_date || (wp as any).dueDate) && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date((wp.due_date || (wp as any).dueDate) as any).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                            </span>
                          )}
                          <span>{(wp as any).percentageDone || 0}% done</span>
                        </div>
                      </div>
                      {/* Mini progress */}
                      <div className="w-16 shrink-0">
                        <div className="w-full bg-gray-800 rounded-full h-1">
                          <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${(wp as any).percentageDone || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
