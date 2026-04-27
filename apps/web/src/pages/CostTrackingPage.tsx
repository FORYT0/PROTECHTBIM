import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CostReportView } from '../components/CostReportView';
import { InteractiveCard } from '../components/InteractiveCard';
import CostEntryService, { CostEntry, CostSummary } from '../services/CostEntryService';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Calendar, PieChart, BarChart3, Download, Settings, RefreshCw,
  ArrowUp, ArrowDown, Minus, Target, Zap
} from 'lucide-react';

const costEntryService = new CostEntryService();

export const CostTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ 
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), 
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd') 
  });
  const [filterType, setFilterType] = useState<'all' | 'billable' | 'non-billable'>('all');
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cost data
  useEffect(() => {
    loadCostData();
  }, [dateRange, selectedProject]);

  const loadCostData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await costEntryService.listCostEntries({
        project_id: selectedProject || undefined,
        date_from: dateRange.from,
        date_to: dateRange.to,
        per_page: 1000,
      });
      setCostEntries(result.cost_entries);

      // Load summary if project is selected
      if (selectedProject) {
        const summary = await costEntryService.getCostSummary(
          selectedProject,
          dateRange.from,
          dateRange.to
        );
        setCostSummary(summary);
      } else {
        // Calculate summary from all entries
        const totalCost = result.cost_entries.reduce((sum, e) => sum + e.total_cost, 0);
        const billableCost = result.cost_entries.filter(e => e.is_billable).reduce((sum, e) => sum + e.total_cost, 0);
        const nonBillableCost = result.cost_entries.filter(e => !e.is_billable).reduce((sum, e) => sum + e.total_cost, 0);
        const committedCost = result.cost_entries.filter(e => e.is_committed).reduce((sum, e) => sum + e.total_cost, 0);
        
        // Group by cost category
        const byCostCategory = Object.entries(
          result.cost_entries.reduce((acc, entry) => {
            acc[entry.cost_category] = (acc[entry.cost_category] || 0) + entry.total_cost;
            return acc;
          }, {} as Record<string, number>)
        ).map(([cost_category, total_cost]) => ({ cost_category, total_cost }));

        // Group by payment status
        const byPaymentStatus = Object.entries(
          result.cost_entries.reduce((acc, entry) => {
            acc[entry.payment_status] = (acc[entry.payment_status] || 0) + entry.total_cost;
            return acc;
          }, {} as Record<string, number>)
        ).map(([payment_status, total_cost]) => ({ payment_status, total_cost }));

        setCostSummary({
          total_cost: totalCost,
          billable_cost: billableCost,
          non_billable_cost: nonBillableCost,
          committed_cost: committedCost,
          by_cost_category: byCostCategory,
          by_payment_status: byPaymentStatus,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cost data');
      setCostEntries([]);
      setCostSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate real metrics from loaded data
  const financials = {
    contractValue: 2500000, // This would come from project data
    approvedBudget: 2100000, // This would come from project budget
    totalCost: costSummary?.total_cost || 0,
    variance: costSummary && costSummary.total_cost > 0 
      ? ((costSummary.total_cost - 2100000) / 2100000) * 100 
      : 0,
    forecastAtCompletion: costSummary ? costSummary.total_cost * 1.15 : 0, // Simple forecast
    budgetUsed: costSummary && costSummary.total_cost > 0 
      ? (costSummary.total_cost / 2100000) * 100 
      : 0,
    budgetRemaining: 2100000 - (costSummary?.total_cost || 0),
    lastPeriodChange: 0, // Would need historical data
    billableCost: costSummary?.billable_cost || 0,
    nonBillableCost: costSummary?.non_billable_cost || 0,
    costEntries: costEntries.length,
    entriesTrend: 0, // Would need historical data
  };

  // Calculate cost by type from real data
  const costByType = costSummary?.by_cost_category.map(item => {
    const budget = 2100000 / (costSummary.by_cost_category.length || 1); // Simple budget split
    const variance = budget > 0 ? ((budget - item.total_cost) / budget) * 100 : 0;
    return {
      type: item.cost_category,
      budget,
      actual: item.total_cost,
      variance: Math.abs(variance),
      status: variance > 5 ? 'good' : variance > -5 ? 'warning' : 'over',
    };
  }) || [];

  // Generate alerts from real data
  const alerts = [];
  if (financials.variance > 5) {
    alerts.push({
      type: 'warning',
      message: `Total costs ${financials.variance.toFixed(1)}% over budget`,
      severity: 'high' as const,
    });
  }
  costByType.forEach(item => {
    if (item.status === 'over') {
      alerts.push({
        type: 'alert',
        message: `${item.type} costs over budget`,
        severity: 'medium' as const,
      });
    } else if (item.status === 'good' && item.variance > 10) {
      alerts.push({
        type: 'info',
        message: `${item.type} costs under budget by ${item.variance.toFixed(0)}%`,
        severity: 'low' as const,
      });
    }
  });

  const { formatCurrency } = useCurrency();

  const getVarianceColor = (variance: number) => {
    if (variance > 5) return 'text-red-400';
    if (variance > 0) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4" />;
    if (variance < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <p className="mt-4 text-gray-400">Loading cost data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
        <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
          <h1 className="text-3xl font-bold text-white">Financial Control Center</h1>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-2">Unable to Load Cost Data</h3>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <button 
                onClick={loadCostData} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] space-y-6 pb-8">
      {/* COST COMMAND HEADER */}
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">Financial Control Center</h1>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Date Range:</span>
                <span className="text-gray-300">{format(new Date(dateRange.from), 'MMM d')} - {format(new Date(dateRange.to), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Contract Value:</span>
                <span className="text-white font-semibold">{formatCurrency(financials.contractValue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Approved Budget:</span>
                <span className="text-white font-semibold">{formatCurrency(financials.approvedBudget)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Cost Entries:</span>
                <span className="text-gray-300">{financials.costEntries} entries</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - EXECUTIVE METRICS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">Total Cost</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(financials.totalCost)}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-gray-400">This period</span>
              </div>
            </div>

            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-yellow-400" />
                <span className="text-xs text-gray-400">Budget Used</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{financials.budgetUsed.toFixed(1)}%</p>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-yellow-400 h-1.5 rounded-full transition-all" 
                  style={{ width: `${Math.min(financials.budgetUsed, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="text-xs text-gray-400">Variance</span>
              </div>
              <p className={`text-2xl font-bold ${getVarianceColor(Math.abs(financials.variance))}`}>
                {financials.variance.toFixed(1)}%
              </p>
              <span className="text-xs text-gray-400">{financials.variance > 0 ? 'Over budget' : 'Under budget'}</span>
            </div>

            <div className="bg-[#111111] rounded-lg p-4 border border-gray-800 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-gray-400">Forecast</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(financials.forecastAtCompletion)}</p>
              <span className="text-xs text-green-400">{financials.variance < 5 ? 'On Track' : 'Monitor'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FINANCIAL KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Cost */}
        <InteractiveCard
          icon={DollarSign}
          iconColor="text-green-400"
          title="Total Cost"
          value={formatCurrency(financials.totalCost)}
          progress={{ value: financials.budgetUsed, color: "bg-green-400" }}
          to="/cost-tracking/ledger"
        />

        {/* Billable */}
        <InteractiveCard
          icon={CheckCircle}
          iconColor="text-blue-400"
          title="Billable"
          value={formatCurrency(financials.billableCost)}
          subtitle={`${financials.totalCost > 0 ? ((financials.billableCost / financials.totalCost) * 100).toFixed(0) : 0}% of total`}
          badge={{ text: `${financials.totalCost > 0 ? ((financials.billableCost / financials.totalCost) * 100).toFixed(0) : 0}%`, color: "text-blue-400" }}
          onClick={() => setFilterType('billable')}
        />

        {/* Non-Billable */}
        <InteractiveCard
          icon={AlertTriangle}
          iconColor="text-orange-400"
          title="Non-Billable"
          value={formatCurrency(financials.nonBillableCost)}
          subtitle="Monitor closely"
          badge={{ text: `${financials.totalCost > 0 ? ((financials.nonBillableCost / financials.totalCost) * 100).toFixed(0) : 0}%`, color: "text-orange-400" }}
          onClick={() => setFilterType('non-billable')}
        />

        {/* Cost Entries */}
        <InteractiveCard
          icon={BarChart3}
          iconColor="text-purple-400"
          title="Cost Entries"
          value={financials.costEntries}
          subtitle="This period"
          to="/cost-tracking/entries"
        />

        {/* Budget Remaining */}
        <InteractiveCard
          icon={Target}
          iconColor="text-cyan-400"
          title="Budget Remaining"
          value={formatCurrency(financials.budgetRemaining)}
          badge={{ text: `${(100 - financials.budgetUsed).toFixed(1)}%`, color: "text-cyan-400" }}
          progress={{ value: 100 - financials.budgetUsed, color: "bg-cyan-400" }}
          to="/cost-tracking/budget"
        />

        {/* Cost Variance */}
        <InteractiveCard
          icon={financials.variance > 0 ? TrendingUp : TrendingDown}
          iconColor={financials.variance > 0 ? "text-red-400" : "text-green-400"}
          title="Cost Variance"
          value={`${financials.variance.toFixed(1)}%`}
          subtitle={financials.variance > 0 ? "Over budget" : "Under budget"}
          to="/cost-tracking/variance"
        />
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (70%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cost Trend Chart */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Cost Over Time
              </h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                  Monthly
                </button>
                <button className="px-3 py-1 text-xs text-gray-400 hover:bg-[#111111] rounded-lg">
                  Weekly
                </button>
                <button className="px-3 py-1 text-xs text-gray-400 hover:bg-[#111111] rounded-lg">
                  Daily
                </button>
              </div>
            </div>
            
            {/* Placeholder for chart - replace with actual chart library */}
            <div className="h-64 bg-[#111111] rounded-lg border border-gray-800 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Cost trend chart will be displayed here</p>
                <p className="text-xs text-gray-600 mt-1">Actual vs Budget vs Forecast</p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-400">Actual Cost</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-400">Budget</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-400">Forecast</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown by Type */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Cost Breakdown by Type
              </h2>
              <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Donut Chart Placeholder */}
              <div className="h-48 bg-[#111111] rounded-lg border border-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Donut chart</p>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {costByType.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No cost data available</p>
                ) : (
                  costByType.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          idx === 0 ? 'bg-blue-500' :
                          idx === 1 ? 'bg-orange-500' :
                          idx === 2 ? 'bg-green-500' :
                          idx === 3 ? 'bg-amber-500' : 'bg-purple-500'
                        }`}></div>
                        <span className="text-sm text-gray-300">{item.type}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{formatCurrency(item.actual)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Budget Control Table */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Budget Control</h2>
              <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Category</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">Budget</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">Actual</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">Variance</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {costByType.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                        No cost data available for this period
                      </td>
                    </tr>
                  ) : (
                    costByType.map((item, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => navigate(`/cost-tracking/category/${item.type.toLowerCase()}`)}
                        className="border-b border-gray-800 hover:bg-[#111111] transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              idx === 0 ? 'bg-blue-500' :
                              idx === 1 ? 'bg-orange-500' :
                              idx === 2 ? 'bg-green-500' :
                              idx === 3 ? 'bg-amber-500' : 'bg-purple-500'
                            }`}></div>
                            <span className="text-sm text-white font-medium">{item.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-300">{formatCurrency(item.budget)}</td>
                        <td className="py-3 px-4 text-right text-sm text-white font-semibold">{formatCurrency(item.actual)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-sm font-semibold ${getVarianceColor(item.variance)}`}>
                            {item.variance > 0 ? '+' : ''}{item.variance.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                            item.status === 'good' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            item.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {item.status === 'good' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {item.status === 'good' ? 'On Track' : item.status === 'warning' ? 'Warning' : 'Over'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost Report View */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Detailed Cost Report</h2>
            <CostReportView projectId="default" />
          </div>
        </div>

        {/* RIGHT COLUMN (30%) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Budget Status */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Budget Status
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Budget Utilization</span>
                  <span className="text-sm font-bold text-yellow-400">{financials.budgetUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(financials.budgetUsed, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Approved Budget</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency(financials.approvedBudget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Spent to Date</span>
                  <span className="text-sm font-semibold text-yellow-400">{formatCurrency(financials.totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Remaining</span>
                  <span className="text-sm font-semibold text-green-400">{formatCurrency(financials.budgetRemaining)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-800">
                  <span className="text-sm font-medium text-gray-300">Forecast at Completion</span>
                  <span className="text-sm font-bold text-white">{formatCurrency(financials.forecastAtCompletion)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Variance Alerts */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Variance Alerts
            </h2>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-3 rounded-lg border bg-green-500/10 border-green-500/30">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-400">
                      All costs are within acceptable ranges
                    </p>
                  </div>
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                      alert.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {alert.severity === 'high' ? <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /> :
                       alert.severity === 'medium' ? <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" /> :
                       <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />}
                      <p className={`text-xs ${
                        alert.severity === 'high' ? 'text-red-400' :
                        alert.severity === 'medium' ? 'text-yellow-400' :
                        'text-blue-400'
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Currency Settings */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Currency Settings
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Primary Currency</label>
                <select className="w-full px-3 py-2 bg-[#111111] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
                  <option>USD - US Dollar</option>
                  <option>EUR - Euro</option>
                  <option>GBP - British Pound</option>
                  <option>CAD - Canadian Dollar</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Exchange Rate</label>
                <input 
                  type="text" 
                  value="1.00" 
                  className="w-full px-3 py-2 bg-[#111111] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  readOnly
                />
              </div>
              <div className="pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-500">Last updated: Feb 23, 2026</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export Financial Report
              </button>
              <button className="w-full px-4 py-2 bg-[#111111] hover:bg-[#1A1A1A] text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Report
              </button>
              <button className="w-full px-4 py-2 bg-[#111111] hover:bg-[#1A1A1A] text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                Configure Alerts
              </button>
            </div>
          </div>

          {/* Cost Types Legend */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Cost Categories</h2>
            <div className="space-y-2">
              {costByType.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No categories yet</p>
              ) : (
                costByType.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      idx === 0 ? 'bg-blue-500' :
                      idx === 1 ? 'bg-orange-500' :
                      idx === 2 ? 'bg-green-500' :
                      idx === 3 ? 'bg-amber-500' : 'bg-purple-500'
                    }`}></div>
                    <span className="text-sm text-gray-300">{item.type}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostTrackingPage;
