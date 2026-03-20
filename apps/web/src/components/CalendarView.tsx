import React, { useState, useMemo } from 'react';
import { WorkPackage, Priority } from '@protecht-bim/shared-types';

export type CalendarViewType = 'day' | 'week' | 'month';

export interface CalendarViewProps {
  workPackages: WorkPackage[];
  onWorkPackageClick: (workPackage: WorkPackage) => void;
  onDateChange: (workPackageId: string, newStartDate: Date, newDueDate: Date) => void;
}

interface CalendarEvent {
  workPackage: WorkPackage;
  startDate: Date;
  dueDate: Date;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  workPackages,
  onWorkPackageClick,
  onDateChange,
}) => {
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  // Convert work packages to calendar events
  const events = useMemo(() => {
    return workPackages
      .filter((wp) => wp.start_date || wp.due_date)
      .map((wp) => {
        const start = wp.start_date ? new Date(wp.start_date) : new Date(wp.due_date!);
        const due = wp.due_date ? new Date(wp.due_date) : new Date(wp.start_date!);
        return {
          workPackage: wp,
          startDate: start,
          dueDate: due,
        };
      });
  }, [workPackages]);

  // Get days to display based on view type
  const displayDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(currentDate);

    if (viewType === 'day') {
      days.push(new Date(start));
    } else if (viewType === 'week') {
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      for (let i = 0; i < 7; i++) {
        days.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
    } else if (viewType === 'month') {
      start.setDate(1);
      const firstDayOfWeek = start.getDay();
      start.setDate(start.getDate() - firstDayOfWeek);
      for (let i = 0; i < 42; i++) {
        days.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
    }
    return days;
  }, [currentDate, viewType]);

  const getEventsForDay = (day: Date): CalendarEvent[] => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      return event.startDate <= dayEnd && event.dueDate >= dayStart;
    });
  };

  const isCurrentMonth = (day: Date): boolean => {
    return day.getMonth() === currentDate.getMonth();
  };

  const isToday = (day: Date): boolean => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (day: Date, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const duration = draggedEvent.dueDate.getTime() - draggedEvent.startDate.getTime();
    const newStartDate = new Date(day);
    newStartDate.setHours(draggedEvent.startDate.getHours());
    const newDueDate = new Date(newStartDate.getTime() + duration);

    onDateChange(draggedEvent.workPackage.id, newStartDate, newDueDate);
    setDraggedEvent(null);
  };

  const getPriorityColor = (priority: string | undefined): string => {
    switch (priority) {
      case Priority.URGENT:
        return 'bg-error-500/20 text-error-400 border border-error-500/30';
      case Priority.HIGH:
        return 'bg-warning-500/20 text-warning-400 border border-warning-500/30';
      case Priority.NORMAL:
        return 'bg-primary-500/20 text-primary-400 border border-primary-500/30';
      case Priority.LOW:
        return 'bg-surface-light text-secondary border border-surface-light';
      default:
        return 'bg-surface-light text-secondary border border-surface-light';
    }
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (viewType === 'week') newDate.setDate(newDate.getDate() - 7);
    else if (viewType === 'month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (viewType === 'week') newDate.setDate(newDate.getDate() + 7);
    else if (viewType === 'month') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const navigateToday = () => setCurrentDate(new Date());

  const getDateRangeText = (): string => {
    if (viewType === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (viewType === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  const renderDayView = () => {
    const day = displayDays[0];
    const dayEvents = getEventsForDay(day);

    return (
      <div className="flex-1 overflow-auto rounded-lg border border-surface-light bg-surface">
        <div className="min-h-full">
          <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-surface-light p-4">
            <h2 className="text-lg font-semibold text-white">
              {day.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
          </div>
          <div
            className="p-4 space-y-2"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(day, e)}
          >
            {dayEvents.length === 0 ? (
              <p className="text-hint text-center py-8">No work packages scheduled for this day</p>
            ) : (
              dayEvents.map((event) => (
                <div
                  key={event.workPackage.id}
                  draggable
                  onDragStart={(e) => handleDragStart(event, e)}
                  onClick={() => onWorkPackageClick(event.workPackage)}
                  className={`${getPriorityColor(event.workPackage.priority)} p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  <div className="font-medium text-white">{event.workPackage.subject}</div>
                  <div className="text-sm opacity-90">
                    {event.workPackage.type} • {event.workPackage.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => (
    <div className="flex-1 overflow-auto rounded-lg border border-surface-light">
      <div className="grid grid-cols-7 gap-px bg-surface-light">
        {displayDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={index}
              className="bg-surface min-h-[400px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(day, e)}
            >
              <div className={`p-3 text-center border-b border-surface-light ${isToday(day) ? 'bg-primary-500/10' : ''}`}>
                <div className="text-xs font-medium text-hint uppercase tracking-wider">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-xl mt-1 ${isToday(day) ? 'text-primary-400 font-bold' : 'text-secondary'}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="p-2 space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.workPackage.id}
                    draggable
                    onDragStart={(e) => handleDragStart(event, e)}
                    onClick={() => onWorkPackageClick(event.workPackage)}
                    className={`${getPriorityColor(event.workPackage.priority)} text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity truncate shadow-sm`}
                    title={event.workPackage.subject}
                  >
                    {event.workPackage.subject}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="flex-1 overflow-auto rounded-lg border border-surface-light">
      <div className="grid grid-cols-7 gap-px bg-surface-light">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-surface p-2 text-center text-xs font-medium text-hint uppercase tracking-wider">
            {day}
          </div>
        ))}
        {displayDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={index}
              className={`bg-surface min-h-[140px] p-1 ${!isCurrentMonth(day) ? 'opacity-40 bg-surface-light/30' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(day, e)}
            >
              <div className="flex justify-end mb-1">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${isToday(day) ? 'bg-primary-500 text-white font-bold' : 'text-secondary'}`}>
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 4).map((event) => (
                  <div
                    key={event.workPackage.id}
                    draggable
                    onDragStart={(e) => handleDragStart(event, e)}
                    onClick={() => onWorkPackageClick(event.workPackage)}
                    className={`${getPriorityColor(event.workPackage.priority)} text-[10px] sm:text-xs py-1 px-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity truncate shadow-sm leading-tight`}
                    title={event.workPackage.subject}
                  >
                    {event.workPackage.subject}
                  </div>
                ))}
                {dayEvents.length > 4 && (
                  <div className="text-[10px] text-hint text-center font-medium mt-1">
                    +{dayEvents.length - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in">
      {/* Calendar Controls Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 card px-4 py-3 sm:px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={navigatePrevious}
              className="p-1.5 sm:px-3 sm:py-1.5 text-sm font-medium text-secondary bg-surface-light hover:bg-white/10 hover:text-white rounded-md transition-colors"
              aria-label="Previous"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navigateToday}
              className="px-3 py-1.5 text-sm font-medium text-secondary bg-surface-light hover:bg-white/10 hover:text-white rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={navigateNext}
              className="p-1.5 sm:px-3 sm:py-1.5 text-sm font-medium text-secondary bg-surface-light hover:bg-white/10 hover:text-white rounded-md transition-colors"
              aria-label="Next"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="text-base sm:text-lg font-semibold text-white truncate min-w-[150px]">
            {getDateRangeText()}
          </div>
        </div>

        <div className="flex rounded-lg shadow-sm border border-surface-light overflow-hidden bg-surface-light/50">
          <button
            onClick={() => setViewType('day')}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${viewType === 'day'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-secondary hover:text-white hover:bg-surface-light'
              }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-1.5 text-sm font-medium border-x border-surface-light transition-colors ${viewType === 'week'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-secondary hover:text-white hover:bg-surface-light'
              }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewType('month')}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${viewType === 'month'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-secondary hover:text-white hover:bg-surface-light'
              }`}
          >
            Month
          </button>
        </div>
      </div>

      {viewType === 'day' && renderDayView()}
      {viewType === 'week' && renderWeekView()}
      {viewType === 'month' && renderMonthView()}
    </div>
  );
};

export default CalendarView;
