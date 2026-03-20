import React, { useState, useEffect } from 'react';
import TimeEntryService, { TimeEntry } from '../services/TimeEntryService';
import './WeeklyTimesheet.css';

interface WeeklyTimesheetProps {
  startDate?: Date;
  userId?: string;
  onWeekChange?: (date: Date) => void;
}

interface DayRow {
  date: Date;
  dayName: string;
  entries: TimeEntry[];
  dailyTotal: number;
}

export const WeeklyTimesheet: React.FC<WeeklyTimesheetProps> = ({
  startDate,
  userId,
  onWeekChange,
}) => {
  const [weekData, setWeekData] = useState<DayRow[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const start = startDate || new Date();
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(start.setDate(diff));
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = new TimeEntryService();

  useEffect(() => {
    loadWeekData();
  }, [currentWeekStart, userId]);

  const getWeekDates = (): Date[] => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const loadWeekData = async () => {
    setLoading(true);
    setError(null);

    try {
      const weekDates = getWeekDates();
      const endDate = new Date(weekDates[6]);

      const result = await service.listTimeEntries({
        user_id: userId,
        date_from: currentWeekStart.toISOString().split('T')[0],
        date_to: endDate.toISOString().split('T')[0],
        per_page: 1000,
      });

      // Group entries by date
      const dayMap = new Map<string, TimeEntry[]>();
      result.time_entries.forEach((entry) => {
        const dateStr =
          typeof entry.date === 'string'
            ? entry.date.split('T')[0]
            : entry.date.toString().split('T')[0];
        if (!dayMap.has(dateStr)) {
          dayMap.set(dateStr, []);
        }
        dayMap.get(dateStr)!.push(entry);
      });

      // Build week data
      const week: DayRow[] = weekDates.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const entries = dayMap.get(dateStr) || [];
        const dailyTotal = entries.reduce((sum, e) => sum + e.hours, 0);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return {
          date,
          dayName: dayNames[date.getDay()],
          entries,
          dailyTotal,
        };
      });

      setWeekData(week);
    } catch (err: any) {
      setError(err.message || 'Failed to load weekly time entries');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
    onWeekChange?.(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    onWeekChange?.(newStart);
  };

  const handleThisWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    setCurrentWeekStart(weekStart);
    onWeekChange?.(weekStart);
  };

  const weekTotal = weekData.reduce((sum, day) => sum + day.dailyTotal, 0);
  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const isCurrentWeek =
    new Date().toISOString().split('T')[0] >=
      currentWeekStart.toISOString().split('T')[0] &&
    new Date().toISOString().split('T')[0] <=
      weekEndDate.toISOString().split('T')[0];

  return (
    <div className="weekly-timesheet">
      <div className="timesheet-header">
        <h2>Weekly Timesheet</h2>
        <div className="week-selector">
          <button
            onClick={handlePreviousWeek}
            className="btn-nav"
            disabled={loading}
          >
            ← Prev Week
          </button>

          <div className="week-display">
            <span>
              {currentWeekStart.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              -{' '}
              {weekEndDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <button
            onClick={handleNextWeek}
            className="btn-nav"
            disabled={loading}
          >
            Next Week →
          </button>

          {!isCurrentWeek && (
            <button
              onClick={handleThisWeek}
              className="btn-current"
              disabled={loading}
            >
              This Week
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading weekly data...</div>
      ) : (
        <>
          <div className="week-overview">
            <div className="overview-stat">
              <span className="stat-label">Week Total</span>
              <span
                className={`stat-value ${weekTotal > 40 ? 'overtime' : ''}`}
              >
                {weekTotal.toFixed(1)} hrs
              </span>
            </div>
            <div className="overview-stat">
              <span className="stat-label">Days Logged</span>
              <span className="stat-value">
                {weekData.filter((d) => d.dailyTotal > 0).length}/7
              </span>
            </div>
            <div className="overview-stat">
              <span className="stat-label">Average/Day</span>
              <span className="stat-value">
                {(weekTotal / 7).toFixed(1)} hrs
              </span>
            </div>
          </div>

          <div className="week-grid">
            {weekData.map((day, idx) => (
              <div key={idx} className="day-card">
                <div className="day-header">
                  <div className="day-name">{day.dayName}</div>
                  <div className="day-date">
                    {day.date.toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="day-total">
                  <span className="hours">{day.dailyTotal.toFixed(1)}h</span>
                </div>

                {day.entries.length > 0 ? (
                  <div className="day-entries">
                    {day.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`mini-entry ${entry.billable ? 'billable' : ''}`}
                      >
                        <span className="hours">{entry.hours}h</span>
                        <span className="subject" title={entry.work_package?.subject}>
                          {entry.work_package?.subject?.substring(0, 30) ||
                            'Work'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="day-empty">No entries</div>
                )}
              </div>
            ))}
          </div>

          <div className="week-legend">
            <span className="legend-item">
              <span className="legend-color billable"></span> Billable hours
            </span>
            <span className="legend-item">
              Standard hours tracked throughout the week
            </span>
          </div>
        </>
      )}
    </div>
  );
};
