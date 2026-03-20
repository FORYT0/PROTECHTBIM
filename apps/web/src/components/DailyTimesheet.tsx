import React, { useState, useEffect } from 'react';
import TimeEntryService, { TimeEntry } from '../services/TimeEntryService';
import { TimeEntryForm } from './TimeEntryForm';
import './DailyTimesheet.css';

interface DailyTimesheetProps {
  date?: Date;
  userId?: string;
  onDateChange?: (date: Date) => void;
}

export const DailyTimesheet: React.FC<DailyTimesheetProps> = ({
  date = new Date(),
  userId,
  onDateChange,
}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(date);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [totalHours, setTotalHours] = useState(0);

  const service = new TimeEntryService();

  useEffect(() => {
    loadTimeEntries();
  }, [selectedDate, userId]);

  const loadTimeEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const result = await service.listTimeEntries({
        user_id: userId,
        date_from: dateStr,
        date_to: dateStr,
        per_page: 100,
      });

      setTimeEntries(result.time_entries);
      calculateTotalHours(result.time_entries);
    } catch (err: any) {
      setError(err.message || 'Failed to load time entries');
      setTimeEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalHours = (entries: TimeEntry[]) => {
    const total = entries.reduce((sum, entry) => sum + entry.hours, 0);
    setTotalHours(total);
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onDateChange?.(today);
  };

  const handleAddEntry = async (data: any) => {
    try {
      setLoading(true);
      const newEntry = await service.createTimeEntry(data);
      setTimeEntries([...timeEntries, newEntry]);
      calculateTotalHours([...timeEntries, newEntry]);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create time entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return;
    }

    try {
      setLoading(true);
      await service.deleteTimeEntry(id);
      const updated = timeEntries.filter((te) => te.id !== id);
      setTimeEntries(updated);
      calculateTotalHours(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to delete time entry');
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="daily-timesheet">
      <div className="timesheet-header">
        <h2>Daily Timesheet</h2>
        <div className="date-selector">
          <button
            onClick={handlePreviousDay}
            className="btn-nav"
            disabled={loading}
            title="Previous day"
          >
            ← Prev
          </button>

          <div className="date-display">
            <span className="formatted-date">{formattedDate}</span>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                setSelectedDate(newDate);
                onDateChange?.(newDate);
              }}
              className="date-input"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleNextDay}
            className="btn-nav"
            disabled={loading}
            title="Next day"
          >
            Next →
          </button>

          {!isToday && (
            <button
              onClick={handleToday}
              className="btn-today"
              disabled={loading}
            >
              Today
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="timesheet-summary">
        <div className="summary-item">
          <span className="label">Total Hours Today:</span>
          <span className={`value ${totalHours > 8 ? 'overtime' : ''}`}>
            {totalHours.toFixed(1)} hrs
          </span>
        </div>
        <div className="summary-item">
          <span className="label">Entries:</span>
          <span className="value">{timeEntries.length}</span>
        </div>
      </div>

      {loading && !showForm && (
        <div className="loading-state">Loading time entries...</div>
      )}

      {!showForm ? (
        <>
          {timeEntries.length === 0 ? (
            <div className="empty-state">
              <p>No time entries for this day</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                + Log Time
              </button>
            </div>
          ) : (
            <>
              <div className="time-entries-list">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="time-entry-item">
                    <div className="entry-main">
                      <div className="entry-hours">{entry.hours}h</div>
                      <div className="entry-details">
                        <div className="entry-subject">
                          {entry.work_package?.subject ||
                            entry.work_package_id}
                        </div>
                        {entry.comment && (
                          <div className="entry-comment">{entry.comment}</div>
                        )}
                      </div>
                      {entry.billable && (
                        <span className="badge badge-billable">Billable</span>
                      )}
                    </div>
                    <div className="entry-actions">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="btn-delete"
                        title="Delete"
                        disabled={loading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
                disabled={loading}
              >
                + Log More Time
              </button>
            </>
          )}
        </>
      ) : (
        <div className="form-container">
          <TimeEntryForm
            workPackageId=""
            onSubmit={handleAddEntry}
            onCancel={() => setShowForm(false)}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
};
