import React, { useState, useEffect } from 'react';
import { X, DollarSign, Plus, Trash2, AlertCircle, Save, Calculator } from 'lucide-react';
import { getAuthToken } from '../utils/api';

interface CostCode {
  id: string;
  code: string;
  name: string;
  level: number;
}

interface BudgetLine {
  id: string;
  costCodeId: string;
  costCode?: CostCode;
  budgetedAmount: number;
}

interface BudgetSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSave: (budgetData: BudgetData) => Promise<void>;
}

export interface BudgetData {
  projectId: string;
  totalBudget: number;
  contingencyPercentage: number;
  contingencyAmount: number;
  budgetLines: BudgetLine[];
}

export const BudgetSetupModal: React.FC<BudgetSetupModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSave,
}) => {
  const [totalBudget, setTotalBudget] = useState<string>('');
  const [contingencyPercentage, setContingencyPercentage] = useState<string>('10');
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cost codes when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCostCodes();
    }
  }, [isOpen]);

  const loadCostCodes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const token = getAuthToken();
      
      console.log('[BudgetModal] Loading cost codes from:', `${API_URL}/cost-codes`);
      console.log('[BudgetModal] Token exists:', !!token);
      
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }
      
      const response = await fetch(`${API_URL}/cost-codes?level=2&is_active=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[BudgetModal] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BudgetModal] Error response:', errorText);
        throw new Error(`Failed to load cost codes: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[BudgetModal] Cost codes loaded:', data.cost_codes?.length || 0);
      
      setCostCodes(data.cost_codes || []);
      
      // Don't auto-initialize budget lines - let user add them
      // This prevents issues with empty cost codes
    } catch (err) {
      console.error('[BudgetModal] Error loading cost codes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cost codes');
    } finally {
      setIsLoading(false);
    }
  };

  const contingencyAmount = totalBudget && contingencyPercentage
    ? (parseFloat(totalBudget) * parseFloat(contingencyPercentage)) / 100
    : 0;

  const allocatedBudget = budgetLines.reduce((sum, line) => sum + line.budgetedAmount, 0);
  const remainingBudget = totalBudget ? parseFloat(totalBudget) - allocatedBudget : 0;
  const allocationPercentage = totalBudget ? (allocatedBudget / parseFloat(totalBudget)) * 100 : 0;

  const handleAddBudgetLine = () => {
    console.log('[BudgetModal] Add line clicked. Cost codes:', costCodes.length);
    
    const availableCostCodes = costCodes.filter(
      (cc) => !budgetLines.some((line) => line.costCodeId === cc.id)
    );

    console.log('[BudgetModal] Available cost codes:', availableCostCodes.length);

    if (availableCostCodes.length === 0) {
      setError('All cost codes have been allocated');
      return;
    }

    const newLine: BudgetLine = {
      id: `temp-${Date.now()}-${Math.random()}`,
      costCodeId: availableCostCodes[0].id,
      costCode: availableCostCodes[0],
      budgetedAmount: 0,
    };

    console.log('[BudgetModal] Adding new line:', newLine);
    setBudgetLines([...budgetLines, newLine]);
    setError(null); // Clear any previous errors
  };

  const handleRemoveBudgetLine = (id: string) => {
    setBudgetLines(budgetLines.filter((line) => line.id !== id));
  };

  const handleBudgetLineChange = (id: string, field: keyof BudgetLine, value: any) => {
    setBudgetLines(
      budgetLines.map((line) => {
        if (line.id === id) {
          if (field === 'costCodeId') {
            const costCode = costCodes.find((cc) => cc.id === value);
            return { ...line, costCodeId: value, costCode };
          }
          return { ...line, [field]: value };
        }
        return line;
      })
    );
  };

  const handleSave = async () => {
    console.log('[BudgetModal] Save clicked');
    
    // Validation
    if (!totalBudget || parseFloat(totalBudget) <= 0) {
      setError('Please enter a valid total budget');
      return;
    }

    if (budgetLines.length === 0) {
      setError('Please add at least one budget line');
      return;
    }

    if (budgetLines.some((line) => line.budgetedAmount <= 0)) {
      setError('All budget lines must have a positive amount');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const budgetData: BudgetData = {
        projectId,
        totalBudget: parseFloat(totalBudget),
        contingencyPercentage: parseFloat(contingencyPercentage),
        contingencyAmount,
        budgetLines: budgetLines.map((line) => ({
          id: line.id,
          costCodeId: line.costCodeId,
          budgetedAmount: line.budgetedAmount,
        })),
      };

      console.log('[BudgetModal] Saving budget:', budgetData);
      await onSave(budgetData);
      console.log('[BudgetModal] Budget saved successfully');
      onClose();
    } catch (err) {
      console.error('[BudgetModal] Error saving budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              Budget Setup
            </h2>
            <p className="text-sm text-gray-400 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sticky Header Section */}
        <div className="p-6 space-y-6 border-b border-gray-800">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Total Budget & Contingency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Total Project Budget *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contingency (%)
              </label>
              <input
                type="number"
                value={contingencyPercentage}
                onChange={(e) => setContingencyPercentage(e.target.value)}
                placeholder="10"
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-3 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {contingencyAmount > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Contingency Amount: {formatCurrency(contingencyAmount)}
                </p>
              )}
            </div>
          </div>

          {/* Budget Summary */}
          {totalBudget && parseFloat(totalBudget) > 0 && (
            <div className="bg-[#111111] rounded-lg border border-gray-800 p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Total Budget</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(parseFloat(totalBudget))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Allocated</p>
                  <p className="text-lg font-bold text-blue-400">{formatCurrency(allocatedBudget)}</p>
                  <p className="text-xs text-gray-500">{allocationPercentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Remaining</p>
                  <p className={`text-lg font-bold ${remainingBudget < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(remainingBudget)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      allocationPercentage > 100 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Budget Lines Section */}
        <div className="flex-1 overflow-y-auto p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Budget Allocation by Cost Code</h3>
              <button
                onClick={handleAddBudgetLine}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Line
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-400 mt-2">Loading cost codes...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {budgetLines.map((line, index) => (
                  <div
                    key={line.id}
                    className="bg-[#111111] rounded-lg border border-gray-800 p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Cost Code</label>
                        <select
                          value={line.costCodeId}
                          onChange={(e) => handleBudgetLineChange(line.id, 'costCodeId', e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          {costCodes.map((cc) => (
                            <option
                              key={cc.id}
                              value={cc.id}
                              disabled={budgetLines.some(
                                (l) => l.id !== line.id && l.costCodeId === cc.id
                              )}
                            >
                              {cc.code} - {cc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Budgeted Amount</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="number"
                            value={line.budgetedAmount || ''}
                            onChange={(e) =>
                              handleBudgetLineChange(line.id, 'budgetedAmount', parseFloat(e.target.value) || 0)
                            }
                            placeholder="0.00"
                            className="w-full pl-9 pr-3 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveBudgetLine(line.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                {budgetLines.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No budget lines added yet</p>
                    <p className="text-xs mt-1">Click "Add Line" to start allocating budget</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Budget
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetSetupModal;
