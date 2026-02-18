'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Calendar, Repeat, Sparkles, Edit2 } from 'lucide-react';
import { Budget } from '@/lib/api/budget';
import { getIconComponent } from './IconPicker';

interface BudgetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget;
  onUpdate: () => void;
  onEdit?: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
  isOpen,
  onClose,
  budget,
  onEdit,
}) => {
  const currentYear = new Date().getFullYear();
  const isPastYear = budget.year < currentYear;

  const recurringItems = budget.items.filter(item => !item.isOneTime);
  const oneTimeItems = budget.items.filter(item => item.isOneTime);

  const recurringTotal = recurringItems.reduce((sum, item) => sum + item.amount, 0);
  const oneTimeTotal = oneTimeItems.reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = recurringTotal + oneTimeTotal;

  const calculatePercentage = (amount: number): number => {
    if (grandTotal === 0) return 0;
    return (amount / grandTotal) * 100;
  };

  // Group one-time items by month
  const oneTimeByMonth = oneTimeItems.reduce((acc, item) => {
    const month = item.applicableMonth!;
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {} as Record<number, typeof oneTimeItems>);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Budget ${budget.year}`}
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-400 mb-2" />
            <div className="text-sm text-gray-400">Year</div>
            <div className="text-2xl font-bold text-white whitespace-nowrap">{budget.year}</div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <Repeat className="w-6 h-6 text-green-400 mb-2" />
            <div className="text-sm text-gray-400">Recurring Monthly</div>
            <div className="text-2xl font-bold text-green-400 whitespace-nowrap">
              ${recurringTotal.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Recurring Expenses */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-green-400" />
            Recurring Monthly Expenses
          </h3>

          {recurringItems.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No recurring expenses
            </div>
          ) : (
            <div className="space-y-2">
              {recurringItems.map((item) => {
                const IconComponent = getIconComponent(item.expenseType.icon);
                const percentage = calculatePercentage(item.amount);
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <IconComponent className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{item.expenseType.name}</div>
                          <div className="text-sm text-gray-400">Every month</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white whitespace-nowrap">
                          ${item.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-blue-400 whitespace-nowrap">
                          {percentage.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* One-Time Expenses */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            One-Time Expenses
            {oneTimeItems.length > 0 && (
              <span className="text-sm text-gray-400">
                (Total: ${oneTimeTotal.toFixed(0)})
              </span>
            )}
          </h3>

          {oneTimeItems.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No one-time expenses
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(oneTimeByMonth)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([month, items]) => (
                  <div key={month} className="space-y-2">
                    <div className="text-sm font-medium text-purple-300">
                      {MONTHS[Number(month) - 1]}
                    </div>
                    {items.map((item) => {
                      const IconComponent = getIconComponent(item.expenseType.icon);
                      const percentage = calculatePercentage(item.amount);
                      return (
                        <div
                          key={item.id}
                          className="p-4 bg-gray-800 border border-purple-500/30 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                <IconComponent className="w-5 h-5 text-purple-400" />
                              </div>
                              <div className="text-white font-medium">
                                {item.expenseType.name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-white whitespace-nowrap">
                                ${item.amount.toFixed(2)}
                              </div>
                              <div className="text-sm text-purple-400 whitespace-nowrap">
                                {percentage.toFixed(1)}% of total
                              </div>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
          <Button variant="secondary" onClick={onClose} className="whitespace-nowrap">
            Close
          </Button>
          {onEdit && (
            <Button
              onClick={onEdit}
              disabled={isPastYear}
              title={isPastYear ? 'Cannot edit past year budgets' : ''}
              className="whitespace-nowrap"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Budget
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
