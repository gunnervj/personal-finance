'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DonutChart } from '../charts/DonutChart';
import { Plus, Trash2 } from 'lucide-react';
import {
  ExpenseType,
  BudgetItemRequest,
  CreateBudgetRequest,
  budgetApi,
  expenseTypeApi,
} from '@/lib/api/budget';
import { preferencesApi } from '@/lib/api/preferences';
import { getIconComponent } from './IconPicker';
import { useToast } from '../ui/Toast';

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BudgetItemForm extends BudgetItemRequest {
  tempId: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BudgetForm: React.FC<BudgetFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const [year, setYear] = useState(currentYear);
  const [items, setItems] = useState<BudgetItemForm[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [types, prefs] = await Promise.all([
        expenseTypeApi.list(),
        preferencesApi.getPreferences(),
      ]);
      setExpenseTypes(types);
      setMonthlySalary(prefs.monthlySalary);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load data');
    }
  };

  const recurringItems = items.filter(item => !item.isOneTime);
  const oneTimeItems = items.filter(item => item.isOneTime);

  const recurringTotal = useMemo(() => {
    return recurringItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [recurringItems]);

  const percentageOfSalary = useMemo(() => {
    if (monthlySalary === 0) return 0;
    return (recurringTotal / monthlySalary) * 100;
  }, [recurringTotal, monthlySalary]);

  const remainingAmount = useMemo(() => {
    return monthlySalary - recurringTotal;
  }, [monthlySalary, recurringTotal]);

  const chartData = useMemo(() => {
    const allItems = [...recurringItems, ...oneTimeItems];
    if (allItems.length === 0) {
      return {
        labels: ['No items'],
        values: [1],
        colors: ['#374151'],
      };
    }

    return {
      labels: allItems.map(item => {
        const type = expenseTypes.find(t => t.id === item.expenseTypeId);
        return type?.name || 'Unknown';
      }),
      values: allItems.map(item => Number(item.amount || 0)),
    };
  }, [recurringItems, oneTimeItems, expenseTypes]);

  const addRecurring = () => {
    if (expenseTypes.length === 0) {
      showError('Please create expense types first before adding budget items.');
      return;
    }
    setItems([
      ...items,
      {
        tempId: Date.now().toString(),
        expenseTypeId: '',
        amount: 0,
        isOneTime: false,
        applicableMonth: null,
      },
    ]);
  };

  const addOneTime = () => {
    setItems([
      ...items,
      {
        tempId: Date.now().toString(),
        expenseTypeId: '',
        amount: 0,
        isOneTime: true,
        applicableMonth: currentDate.getMonth() + 1,
      },
    ]);
  };

  const removeItem = (tempId: string) => {
    setItems(items.filter(item => item.tempId !== tempId));
  };

  const updateItem = (tempId: string, updates: Partial<BudgetItemForm>) => {
    setItems(items.map(item =>
      item.tempId === tempId ? { ...item, ...updates } : item
    ));
  };

  const validateForm = (): string | null => {
    if (items.length === 0) {
      return 'Add at least one budget item';
    }

    for (const item of items) {
      if (!item.expenseTypeId) {
        return 'Select an expense type for all items';
      }
      if (Number(item.amount) <= 0) {
        return 'All amounts must be greater than 0';
      }
      if (item.isOneTime && !item.applicableMonth) {
        return 'One-time expenses must have a month selected';
      }
    }

    const currentMonth = currentDate.getMonth() + 1;
    if (year < currentYear) {
      return 'Cannot create budgets for past years';
    }
    if (year > currentYear && currentMonth !== 12) {
      return 'Can only create next year budgets in December';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }

    setLoading(true);

    try {
      const request: CreateBudgetRequest = {
        budget: { year },
        items: items.map(({ tempId, ...item }) => item),
      };

      await budgetApi.create(request);
      showSuccess(`Budget for ${year} created successfully!`);
      onSuccess();
      onClose();
      setItems([]);
      setYear(currentYear);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (percentageOfSalary < 50) return 'text-green-400';
    if (percentageOfSalary < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Yearly Budget">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Select
          label="Year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          <option value={currentYear}>{currentYear}</option>
          {currentDate.getMonth() === 11 && (
            <option value={currentYear + 1}>{currentYear + 1}</option>
          )}
        </Select>

        {/* Budget Summary */}
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Monthly Salary:</span>
            <span className="text-white font-semibold whitespace-nowrap">${monthlySalary.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Recurring Budget:</span>
            <span className={`font-semibold whitespace-nowrap ${getStatusColor()}`}>
              ${recurringTotal.toFixed(2)} ({percentageOfSalary.toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Potential Savings:</span>
            <span className={`font-semibold whitespace-nowrap ${remainingAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${remainingAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Recurring Expenses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recurring Monthly Expenses</h3>
            <Button type="button" size="sm" onClick={addRecurring} className="whitespace-nowrap">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {recurringItems.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No recurring expenses yet
            </div>
          ) : (
            <div className="space-y-3">
              {recurringItems.map((item) => {
                const selectedType = expenseTypes.find(t => t.id === item.expenseTypeId);
                const IconComponent = selectedType ? getIconComponent(selectedType.icon) : null;

                return (
                  <div key={item.tempId} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Select
                        label="Expense Type"
                        value={item.expenseTypeId}
                        onChange={(e) => updateItem(item.tempId, { expenseTypeId: e.target.value })}
                        required
                      >
                        <option value="">Select...</option>
                        {expenseTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="w-32">
                      <Input
                        label="Amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.amount}
                        onChange={(e) => updateItem(item.tempId, { amount: Number(e.target.value) })}
                        required
                      />
                    </div>

                    {IconComponent && (
                      <div className="pb-2">
                        <IconComponent className="w-6 h-6 text-blue-400" />
                      </div>
                    )}

                    <div className="pb-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => removeItem(item.tempId)}
                        className="whitespace-nowrap"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* One-Time Expenses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">One-Time Expenses</h3>
            <Button type="button" size="sm" variant="secondary" onClick={addOneTime} className="whitespace-nowrap">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {oneTimeItems.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No one-time expenses yet
            </div>
          ) : (
            <div className="space-y-3">
              {oneTimeItems.map((item) => {
                const selectedType = expenseTypes.find(t => t.id === item.expenseTypeId);
                const IconComponent = selectedType ? getIconComponent(selectedType.icon) : null;

                return (
                  <div key={item.tempId} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Select
                        label="Expense Type"
                        value={item.expenseTypeId}
                        onChange={(e) => updateItem(item.tempId, { expenseTypeId: e.target.value })}
                        required
                      >
                        <option value="">Select...</option>
                        {expenseTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="w-24">
                      <Select
                        label="Month"
                        value={item.applicableMonth || ''}
                        onChange={(e) => updateItem(item.tempId, { applicableMonth: Number(e.target.value) })}
                        required
                      >
                        {MONTHS.map((month, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {month}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="w-28">
                      <Input
                        label="Amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.amount}
                        onChange={(e) => updateItem(item.tempId, { amount: Number(e.target.value) })}
                        required
                      />
                    </div>

                    {IconComponent && (
                      <div className="pb-2">
                        <IconComponent className="w-6 h-6 text-purple-400" />
                      </div>
                    )}

                    <div className="pb-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => removeItem(item.tempId)}
                        className="whitespace-nowrap"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart */}
        {items.length > 0 && (
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <DonutChart
              data={chartData}
              title="Budget Distribution"
            />
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="whitespace-nowrap"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="whitespace-nowrap">
            {loading ? 'Creating...' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
