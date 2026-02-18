'use client';

import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface ExpenseSummaryWidgetProps {
  totalExpenses: number;
  budgetTotal: number;
  currency: string;
}

export function ExpenseSummaryWidget({ totalExpenses, budgetTotal, currency }: ExpenseSummaryWidgetProps) {
  const burnPercentage = budgetTotal > 0 ? (totalExpenses / budgetTotal) * 100 : 0;

  // Color coding: green < 50%, orange 50-80%, red > 80%
  const getColorClasses = () => {
    if (burnPercentage < 50) {
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/30',
        progress: 'bg-green-500',
      };
    } else if (burnPercentage < 80) {
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        progress: 'bg-orange-500',
      };
    } else {
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
        progress: 'bg-red-500',
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <DollarSign className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground-muted">Total Expenses</h3>
            <p className="text-2xl font-bold text-foreground">
              {currency} {totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        {burnPercentage >= 80 && (
          <AlertCircle className="w-5 h-5 text-red-400" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground-muted">Budget Burn</span>
          <span className={`font-semibold ${colors.text}`}>
            {burnPercentage.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full ${colors.progress} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${Math.min(burnPercentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-foreground-muted pt-1">
          <span>{currency} 0</span>
          <span>{currency} {budgetTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className={`mt-4 pt-4 border-t ${colors.border} flex items-center gap-2`}>
        <TrendingUp className={`w-4 h-4 ${colors.text}`} />
        <span className="text-xs text-foreground-muted">
          {budgetTotal > totalExpenses ? (
            <>Remaining: {currency} {(budgetTotal - totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}</>
          ) : (
            <>Over budget by: {currency} {(totalExpenses - budgetTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</>
          )}
        </span>
      </div>
    </div>
  );
}
