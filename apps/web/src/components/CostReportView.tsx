import React, { useState, useEffect } from 'react';
import CostTrackingService, { CostType } from '../services/CostTrackingService';
import './CostReportView.css';

interface CostReportViewProps {
  projectId: string;
  workPackageId?: string;
}

interface CostSummary {
  total: number;
  byType: Record<string, number>;
  billable: number;
  nonBillable: number;
  variance?: number;
  variancePercent?: number;
}

export const CostReportView: React.FC<CostReportViewProps> = ({
  projectId,
  workPackageId,
}) => {
  const [summary, setSummary] = useState<CostSummary>({
    total: 0,
    byType: {},
    billable: 0,
    nonBillable: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const service = new CostTrackingService();

  useEffect(() => {
    loadCostData();
  }, [dateFrom, dateTo]);

  const loadCostData = async () => {
    setLoading(true);
    setError(null);

    try {
      let filters: any = {
        date_from: dateFrom,
        date_to: dateTo,
        per_page: 1000,
      };

      if (workPackageId) {
        filters.work_package_id = workPackageId;
      }

      const result = await service.listCostEntries(filters);

      // Calculate breakdown by type
      const byType: Record<string, number> = {};
      let totalAmount = 0;
      let billableAmount = 0;
      let nonBillableAmount = 0;

      result.cost_entries.forEach((entry) => {
        const typeKey = entry.type;
        byType[typeKey] = (byType[typeKey] || 0) + entry.amount;
        totalAmount += entry.amount;

        if (entry.billable) {
          billableAmount += entry.amount;
        } else {
          nonBillableAmount += entry.amount;
        }
      });

      setSummary({
        total: totalAmount,
        byType,
        billable: billableAmount,
        nonBillable: nonBillableAmount,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load cost data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const blob = await service.exportCostReportToCSV(projectId, {
        dateFrom,
        dateTo,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cost-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const blob = await service.exportCostReportToPDF(projectId, {
        dateFrom,
        dateTo,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cost-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export PDF');
    } finally {
      setLoading(false);
    }
  };

  const totalByTypeEntries = Object.entries(summary.byType).sort(
    ([, a], [, b]) => b - a
  );

  const billablePercent =
    summary.total > 0 ? ((summary.billable / summary.total) * 100).toFixed(1) : 0;

  return (
    <div className="cost-report-view">
      <div className="report-header">
        <h2>Cost Report</h2>
        <div className="report-controls">
          <div className="date-range">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={loading}
            />
            <span>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="export-buttons">
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary"
              disabled={loading}
              title="Export as CSV"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="btn btn-secondary"
              disabled={loading}
              title="Export as PDF"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && <div className="loading-state">Loading cost data...</div>}

      {!loading && (
        <>
          <div className="cost-summary">
            <div className="summary-card">
              <div className="card-label">Total Costs</div>
              <div className="card-value">${summary.total.toFixed(2)}</div>
            </div>

            <div className="summary-card highlight">
              <div className="card-label">Billable</div>
              <div className="card-value">${summary.billable.toFixed(2)}</div>
              <div className="card-percent">{billablePercent}%</div>
            </div>

            <div className="summary-card">
              <div className="card-label">Non-Billable</div>
              <div className="card-value">${summary.nonBillable.toFixed(2)}</div>
            </div>

            <div className="summary-card">
              <div className="card-label">Entries Count</div>
              <div className="card-value">
                {Object.values(summary.byType).length || 0}
              </div>
            </div>
          </div>

          <div className="cost-breakdown">
            <div className="breakdown-section">
              <h3>Cost by Type</h3>

              {totalByTypeEntries.length === 0 ? (
                <div className="empty-state">No cost entries for selected period</div>
              ) : (
                <>
                  <div className="breakdown-list">
                    {totalByTypeEntries.map(([type, amount]) => {
                      const percentage = (
                        (amount / summary.total) *
                        100
                      ).toFixed(1);
                      return (
                        <div key={type} className="breakdown-item">
                          <div className="item-label">
                            <span className="type-badge">{type}</span>
                            <span className="amount">${amount.toFixed(2)}</span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="item-percent">{percentage}%</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="chart-section">
                    <div className="chart-controls">
                      <button
                        onClick={() => setChartType('pie')}
                        className={`chart-btn ${
                          chartType === 'pie' ? 'active' : ''
                        }`}
                      >
                        Pie Chart
                      </button>
                      <button
                        onClick={() => setChartType('bar')}
                        className={`chart-btn ${
                          chartType === 'bar' ? 'active' : ''
                        }`}
                      >
                        Bar Chart
                      </button>
                    </div>

                    {chartType === 'pie' ? (
                      <div className="pie-chart">
                        <svg viewBox="0 0 200 200">
                          {totalByTypeEntries.map(([type, amount], idx) => {
                            const percentage = (amount / summary.total) * 100;
                            const startAngle =
                              totalByTypeEntries
                                .slice(0, idx)
                                .reduce(
                                  (sum, [, a]) =>
                                    sum + (a / summary.total) * 360,
                                  0
                                ) * (Math.PI / 180);
                            const endAngle =
                              startAngle +
                              (percentage / 100) * 2 * Math.PI;
                            const colors = [
                              '#3b82f6',
                              '#ef4444',
                              '#10b981',
                              '#f59e0b',
                              '#8b5cf6',
                            ];
                            const color = colors[idx % colors.length];

                            const x1 =
                              100 +
                              80 * Math.cos(startAngle - Math.PI / 2);
                            const y1 =
                              100 +
                              80 * Math.sin(startAngle - Math.PI / 2);
                            const x2 =
                              100 +
                              80 * Math.cos(endAngle - Math.PI / 2);
                            const y2 =
                              100 +
                              80 * Math.sin(endAngle - Math.PI / 2);
                            const largeArcFlag =
                              percentage > 50 ? 1 : 0;

                            const pathData = [
                              `M 100 100`,
                              `L ${x1} ${y1}`,
                              `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                              'Z',
                            ].join(' ');

                            return (
                              <path
                                key={type}
                                d={pathData}
                                fill={color}
                                stroke="white"
                                strokeWidth="2"
                              />
                            );
                          })}
                        </svg>
                      </div>
                    ) : (
                      <div className="bar-chart">
                        {totalByTypeEntries.map(([type, amount], idx) => {
                          const maxAmount = Math.max(
                            ...totalByTypeEntries.map(([, a]) => a)
                          );
                          const heightPercent = (amount / maxAmount) * 100;
                          const colors = [
                            '#3b82f6',
                            '#ef4444',
                            '#10b981',
                            '#f59e0b',
                            '#8b5cf6',
                          ];
                          const color = colors[idx % colors.length];

                          return (
                            <div key={type} className="bar-item">
                              <div className="bar-label">{type}</div>
                              <div className="bar-container">
                                <div
                                  className="bar-fill"
                                  style={{
                                    height: `${heightPercent}%`,
                                    backgroundColor: color,
                                  }}
                                ></div>
                              </div>
                              <div className="bar-value">
                                ${amount.toFixed(0)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
