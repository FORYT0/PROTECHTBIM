import React, { useState, useEffect } from 'react';
import TimeEntryService, { TimeEntry } from '../services/TimeEntryService';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface TimelineData {
  workPackage: string;
  workPackageId: string;
  dates: { [date: string]: number }; // date -> hours
  total: number;
}

export const TimelineTable: React.FC = () => {
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Start from 7 days ago
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // End 7 days from now
    return date;
  });

  const service = new TimeEntryService();

  useEffect(() => {
    loadTimelineData();
  }, [startDate, endDate]);

  const loadTimelineData = async () => {
    setLoading(true);
    try {
      const result = await service.listTimeEntries({
        date_from: startDate.toISOString().split('T')[0],
        date_to: endDate.toISOString().split('T')[0],
        per_page: 1000,
      });

      // Group by work package
      const grouped = new Map<string, TimelineData>();
      
      result.time_entries.forEach((entry) => {
        const wpId = entry.work_package_id;
        const wpName = entry.work_package?.subject || 'Unknown Work Package';
        const dateKey = new Date(entry.date).toISOString().split('T')[0];

        if (!grouped.has(wpId)) {
          grouped.set(wpId, {
            workPackage: wpName,
            workPackageId: wpId,
            dates: {},
            total: 0,
          });
        }

        const data = grouped.get(wpId)!;
        data.dates[dateKey] = (data.dates[dateKey] || 0) + entry.hours;
        data.total += entry.hours;
      });

      setTimelineData(Array.from(grouped.values()));
    } catch (error) {
      console.error('Failed to load timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDateRange = (): string[] => {
    const dates: string[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const shiftDates = (days: number) => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + days);
    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() + days);
    
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return { day, month, dayName };
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const dates = generateDateRange();

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Project Timeline</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDates(-7)}
            className="p-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-lg transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={() => {
              setStartDate(new Date(new Date().setDate(new Date().getDate() - 7)));
              setEndDate(new Date(new Date().setDate(new Date().getDate() + 7)));
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => shiftDates(7)}
            className="p-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-lg transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Timeline Table - Horizontally Scrollable */}
      <div className="relative">
        <div className="overflow-x-auto overflow-y-visible custom-scrollbar">
          <div className="inline-block min-w-full">
            <table className="w-full border-collapse">
              {/* Header Row */}
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 z-20 bg-[#0A0A0A] border-b border-r border-gray-800 px-4 py-3 text-left">
                    <div className="min-w-[200px]">
                      <span className="text-sm font-semibold text-white">Work Package</span>
                    </div>
                  </th>
                  {dates.map((date) => {
                    const { day, month, dayName } = formatDate(date);
                    const today = isToday(date);
                    return (
                      <th
                        key={date}
                        className={`border-b border-gray-800 px-3 py-2 text-center min-w-[80px] ${
                          today ? 'bg-blue-900/20' : 'bg-[#0A0A0A]'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`text-xs ${today ? 'text-blue-400' : 'text-gray-500'}`}>
                            {dayName}
                          </span>
                          <span className={`text-sm font-semibold ${today ? 'text-blue-400' : 'text-white'}`}>
                            {day}
                          </span>
                          <span className={`text-xs ${today ? 'text-blue-400' : 'text-gray-500'}`}>
                            {month}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="sticky right-0 z-20 bg-[#0A0A0A] border-b border-l border-gray-800 px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-white">Total</span>
                  </th>
                </tr>
              </thead>

              {/* Body Rows */}
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={dates.length + 2} className="text-center py-8 text-gray-400">
                      Loading timeline data...
                    </td>
                  </tr>
                ) : timelineData.length === 0 ? (
                  <tr>
                    <td colSpan={dates.length + 2} className="text-center py-8 text-gray-400">
                      No time entries found for this period
                    </td>
                  </tr>
                ) : (
                  timelineData.map((row, idx) => (
                    <tr
                      key={row.workPackageId}
                      className="hover:bg-[#1A1A1A] transition-colors"
                    >
                      <td className="sticky left-0 z-10 bg-[#000000] hover:bg-[#1A1A1A] border-b border-r border-gray-800 px-4 py-3">
                        <div className="min-w-[200px]">
                          <span className="text-sm text-white font-medium">{row.workPackage}</span>
                        </div>
                      </td>
                      {dates.map((date) => {
                        const hours = row.dates[date] || 0;
                        const today = isToday(date);
                        return (
                          <td
                            key={date}
                            className={`border-b border-gray-800 px-3 py-3 text-center ${
                              today ? 'bg-blue-900/10' : ''
                            }`}
                          >
                            {hours > 0 ? (
                              <div
                                className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold ${
                                  hours >= 8
                                    ? 'bg-green-600/20 text-green-400'
                                    : hours >= 4
                                    ? 'bg-blue-600/20 text-blue-400'
                                    : 'bg-gray-600/20 text-gray-400'
                                }`}
                              >
                                {hours.toFixed(1)}h
                              </div>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="sticky right-0 z-10 bg-[#000000] hover:bg-[#1A1A1A] border-b border-l border-gray-800 px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-white">{row.total.toFixed(1)}h</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Footer Row - Totals */}
              {timelineData.length > 0 && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-[#0A0A0A]">
                    <td className="sticky left-0 z-20 bg-[#0A0A0A] border-t border-r border-gray-800 px-4 py-3">
                      <span className="text-sm font-semibold text-white">Daily Total</span>
                    </td>
                    {dates.map((date) => {
                      const dayTotal = timelineData.reduce(
                        (sum, row) => sum + (row.dates[date] || 0),
                        0
                      );
                      const today = isToday(date);
                      return (
                        <td
                          key={date}
                          className={`border-t border-gray-800 px-3 py-3 text-center ${
                            today ? 'bg-blue-900/20' : ''
                          }`}
                        >
                          <span className="text-sm font-semibold text-white">
                            {dayTotal > 0 ? `${dayTotal.toFixed(1)}h` : '-'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-20 bg-[#0A0A0A] border-t border-l border-gray-800 px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-blue-400">
                        {timelineData.reduce((sum, row) => sum + row.total, 0).toFixed(1)}h
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-600/20"></div>
          <span>8+ hours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-600/20"></div>
          <span>4-8 hours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-600/20"></div>
          <span>&lt;4 hours</span>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0A0A0A;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2A2A2A;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3A3A3A;
        }
      `}</style>
    </div>
  );
};
