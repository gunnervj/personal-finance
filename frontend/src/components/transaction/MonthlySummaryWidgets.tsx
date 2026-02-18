'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { DollarSign, Receipt, TrendingDown, AlertCircle } from 'lucide-react';

interface MonthlySummaryWidgetsProps {
  totalExpenses: number;
  transactionCount: number;
  budgetTotal: number;
  currentMonth: string;
}

export const MonthlySummaryWidgets: React.FC<MonthlySummaryWidgetsProps> = ({
  totalExpenses,
  transactionCount,
  budgetTotal,
  currentMonth,
}) => {
  const burnPercentage = budgetTotal > 0 ? (totalExpenses / budgetTotal) * 100 : 0;
  const remainingBudget = budgetTotal - totalExpenses;

  const getBurnColor = (percentage: number): string => {
    if (percentage < 50) return 'text-green-400';
    if (percentage < 80) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBurnBgColor = (percentage: number): string => {
    if (percentage < 50) return 'bg-green-500/10';
    if (percentage < 80) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  const getBurnBorderColor = (percentage: number): string => {
    if (percentage < 50) return 'border-green-500/20';
    if (percentage < 80) return 'border-amber-500/20';
    return 'border-red-500/20';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Expenses */}
      <Card className="group hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Expenses</p>
            <p className="text-xs text-gray-500 mb-2">{currentMonth}</p>
            <p className="text-2xl font-bold text-white">
              ${totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
            <DollarSign className="w-6 h-6 text-sky-400" />
          </div>
        </div>
      </Card>

      {/* Transaction Count */}
      <Card className="group hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Transactions</p>
            <p className="text-xs text-gray-500 mb-2">{currentMonth}</p>
            <p className="text-2xl font-bold text-white">{transactionCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Receipt className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </Card>

      {/* Remaining Budget */}
      <Card className="group hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Remaining Budget</p>
            <p className="text-xs text-gray-500 mb-2">{currentMonth}</p>
            <p className="text-2xl font-bold text-white">
              ${remainingBudget.toFixed(2)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <TrendingDown className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </Card>

      {/* Budget Burn Percentage */}
      <Card
        className={`group hover:shadow-xl transition-all duration-300 ${getBurnBgColor(
          burnPercentage
        )} border ${getBurnBorderColor(burnPercentage)}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">Budget Burned</p>
            <p className="text-xs text-gray-500 mb-2">{currentMonth}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold ${getBurnColor(burnPercentage)}`}>
                {burnPercentage.toFixed(1)}%
              </p>
              {burnPercentage >= 80 && (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            {budgetTotal > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      burnPercentage < 50
                        ? 'bg-green-400'
                        : burnPercentage < 80
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(burnPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-12 h-12 rounded-xl ${getBurnBgColor(
              burnPercentage
            )} border ${getBurnBorderColor(
              burnPercentage
            )} flex items-center justify-center`}
          >
            {burnPercentage < 50 ? (
              <DollarSign className="w-6 h-6 text-green-400" />
            ) : burnPercentage < 80 ? (
              <AlertCircle className="w-6 h-6 text-amber-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400" />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
