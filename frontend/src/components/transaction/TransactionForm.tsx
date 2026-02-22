'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import {
  Transaction,
  TransactionRequest,
  transactionApi,
} from '@/lib/api/transaction';
import { Budget, budgetApi } from '@/lib/api/budget';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction; // For edit mode
}

interface BudgetItemOption {
  budgetItemId: string;
  expenseTypeId: string;
  expenseTypeName: string;
  icon: string;
  budgetAmount: number;
  isOneTime: boolean;
  applicableMonth: number | null;
}

interface BurnInfo {
  color: string;
  dotColor: string;
  label: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}) => {
  const isEditMode = !!transaction;
  const currentDate = new Date();

  const [formData, setFormData] = useState<TransactionRequest>({
    budgetItemId: '',
    expenseTypeId: '',
    amount: 0,
    description: '',
    transactionDate: currentDate.toISOString().split('T')[0],
  });

  const [budgetItems, setBudgetItems] = useState<BudgetItemOption[]>([]);
  const [spendingByType, setSpendingByType] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { showError, showSuccess } = useToast();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadBudgetItems();
      if (transaction) {
        setFormData({
          budgetItemId: transaction.budgetItemId,
          expenseTypeId: transaction.expenseTypeId,
          amount: transaction.amount,
          description: transaction.description || '',
          transactionDate: transaction.transactionDate,
        });
      } else {
        setFormData({
          budgetItemId: '',
          expenseTypeId: '',
          amount: 0,
          description: '',
          transactionDate: currentDate.toISOString().split('T')[0],
        });
      }
    }
  }, [isOpen, transaction]);

  const loadBudgetItems = async () => {
    setLoadingBudget(true);
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const [budget, summary]: [Budget, any[]] = await Promise.all([
        budgetApi.getByYear(currentYear),
        transactionApi.getExpenseTypeSummary(currentYear, currentMonth).catch(() => []),
      ]);

      const items: BudgetItemOption[] = budget.items.map(item => ({
        budgetItemId: item.id,
        expenseTypeId: item.expenseType.id,
        expenseTypeName: item.expenseType.name,
        icon: item.expenseType.icon,
        budgetAmount: item.amount,
        isOneTime: item.isOneTime,
        applicableMonth: item.applicableMonth,
      }));

      const spendingMap: Record<string, number> = {};
      summary.forEach((s: any) => { spendingMap[s.expenseTypeId] = s.totalAmount; });

      setBudgetItems(items);
      setSpendingByType(spendingMap);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load budget items');
      setBudgetItems([]);
    } finally {
      setLoadingBudget(false);
    }
  };

  // Unique expense types sorted alphabetically
  const availableExpenseTypes = budgetItems
    .reduce((acc, item) => {
      if (!acc.find(x => x.expenseTypeId === item.expenseTypeId)) {
        acc.push(item);
      }
      return acc;
    }, [] as BudgetItemOption[])
    .filter(item => {
      // For one-time items, only show if applicable month matches current month
      if (item.isOneTime) {
        const currentMonth = new Date(formData.transactionDate).getMonth() + 1;
        return item.applicableMonth === currentMonth;
      }
      return true;
    })
    .sort((a, b) => a.expenseTypeName.localeCompare(b.expenseTypeName));

  const getBurnInfo = (expenseTypeId: string, budgetAmount: number): BurnInfo => {
    const spent = spendingByType[expenseTypeId] || 0;
    const pct = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    const remainingPct = Math.max(0, 100 - pct);
    const overBy = spent - budgetAmount;

    if (pct > 100) {
      return {
        color: 'text-red-400',
        dotColor: 'bg-red-500',
        label: `overspent by ${Math.abs(overBy).toFixed(0)}`,
      };
    } else if (pct >= 80) {
      return {
        color: 'text-yellow-400',
        dotColor: 'bg-yellow-400',
        label: `${remainingPct.toFixed(0)}% left`,
      };
    } else {
      return {
        color: 'text-green-400',
        dotColor: 'bg-green-500',
        label: `${remainingPct.toFixed(0)}% left`,
      };
    }
  };

  const handleExpenseTypeChange = (expenseTypeId: string) => {
    const currentMonth = new Date(formData.transactionDate).getMonth() + 1;
    const budgetItem = budgetItems.find(
      item =>
        item.expenseTypeId === expenseTypeId &&
        (!item.isOneTime || item.applicableMonth === currentMonth)
    );

    if (budgetItem) {
      setFormData({ ...formData, expenseTypeId, budgetItemId: budgetItem.budgetItemId });
    } else {
      showError('No budget item found for this expense type in the current month');
    }
    setIsDropdownOpen(false);
  };

  const handleDateChange = (date: string) => {
    setFormData({ ...formData, transactionDate: date });
    if (formData.expenseTypeId) {
      const currentMonth = new Date(date).getMonth() + 1;
      const budgetItem = budgetItems.find(
        item =>
          item.expenseTypeId === formData.expenseTypeId &&
          (!item.isOneTime || item.applicableMonth === currentMonth)
      );
      if (budgetItem) {
        setFormData(prev => ({ ...prev, budgetItemId: budgetItem.budgetItemId }));
      }
    }
  };

  const validateForm = (): string | null => {
    if (!formData.expenseTypeId) return 'Please select an expense type';
    if (!formData.budgetItemId) return 'No budget item available for this expense type';
    if (formData.amount <= 0) return 'Amount must be greater than 0';
    if (!formData.transactionDate) return 'Please select a transaction date';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) { showError(error); return; }

    setLoading(true);
    try {
      if (isEditMode && transaction) {
        await transactionApi.update(transaction.id, formData);
        showSuccess('Transaction updated successfully');
      } else {
        await transactionApi.create(formData);
        showSuccess('Transaction created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = availableExpenseTypes.find(t => t.expenseTypeId === formData.expenseTypeId);
  const selectedBudgetItem = budgetItems.find(item => item.budgetItemId === formData.budgetItemId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Transaction' : 'Record Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {loadingBudget ? (
          <div className="text-center text-gray-400 py-8">Loading budget items...</div>
        ) : budgetItems.length === 0 ? (
          <div className="text-center text-amber-400 py-8">
            No budget found for current year. Please create a budget first.
          </div>
        ) : (
          <>
            {/* Custom colored expense type dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expense Type
              </label>
              <div className="relative" ref={dropdownRef}>
                {/* Trigger button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {selectedItem ? (() => {
                    const info = getBurnInfo(selectedItem.expenseTypeId, selectedItem.budgetAmount);
                    return (
                      <span className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${info.dotColor}`} />
                        <span className="text-white truncate">{selectedItem.expenseTypeName}</span>
                        <span className={`text-xs flex-shrink-0 ${info.color}`}>({info.label})</span>
                      </span>
                    );
                  })() : (
                    <span className="text-gray-500">Select expense type</span>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown list */}
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                    <div className="max-h-56 overflow-y-auto">
                      {availableExpenseTypes.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">No expense types available</div>
                      ) : (
                        availableExpenseTypes.map(item => {
                          const info = getBurnInfo(item.expenseTypeId, item.budgetAmount);
                          const isSelected = item.expenseTypeId === formData.expenseTypeId;
                          return (
                            <button
                              key={item.expenseTypeId}
                              type="button"
                              onClick={() => handleExpenseTypeChange(item.expenseTypeId)}
                              className={`w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-700 transition-colors ${
                                isSelected ? 'bg-gray-700' : ''
                              }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${info.dotColor}`} />
                                <span className="text-white text-sm truncate">{item.expenseTypeName}</span>
                              </span>
                              <span className={`text-xs flex-shrink-0 ml-3 font-medium ${info.color}`}>
                                {info.label}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                    {/* Legend */}
                    <div className="px-4 py-2 border-t border-gray-700 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Under budget</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" />Near limit</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Overspent</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
            />

            {selectedBudgetItem && (
              <div className="text-sm text-gray-400">
                Budget allocated: ${selectedBudgetItem.budgetAmount.toFixed(2)}
                {selectedBudgetItem.isOneTime && (
                  <span className="ml-2 text-amber-400">
                    (One-time - {selectedBudgetItem.applicableMonth
                      ? new Date(2024, selectedBudgetItem.applicableMonth - 1).toLocaleString('default', { month: 'long' })
                      : 'N/A'})
                  </span>
                )}
              </div>
            )}

            <Input
              label="Description (Optional)"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Grocery shopping at Walmart"
              maxLength={500}
            />

            <Input
              label="Transaction Date"
              type="date"
              value={formData.transactionDate}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingBudget || budgetItems.length === 0}
              >
                {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
