'use client';

import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

export interface AccumulationItem {
  expenseTypeId: string;
  name: string;
  icon: string;
  monthlyBudget: number;
  accumulatedAmount: number;
  spentThisMonth: number;
  remaining: number;
}

interface AccumulationWidgetProps {
  items: AccumulationItem[];
  month: number;
  year: number;
  currency: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function AccumulationWidget({
  items,
  month,
  year,
  currency,
  onPrevMonth,
  onNextMonth,
}: AccumulationWidgetProps) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Accumulated Budget</h3>
            <p className="text-xs text-foreground-muted">Carry-forward from unspent months</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-1.5 rounded-lg hover:bg-card-hover text-foreground-muted hover:text-foreground transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-foreground min-w-[120px] text-center">{monthLabel}</span>
          <button
            onClick={onNextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg hover:bg-card-hover text-foreground-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-foreground-muted">
          <p className="text-sm">No accumulating expense types configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => {
            const usePct = item.accumulatedAmount > 0
              ? Math.min((item.spentThisMonth / item.accumulatedAmount) * 100, 100)
              : 0;
            const isPositive = item.remaining >= 0;

            return (
              <div
                key={item.expenseTypeId}
                className="p-4 bg-background/50 border border-border/30 rounded-xl hover:border-border/60 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                    isPositive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isPositive ? '+' : ''}{currency} {Math.abs(item.remaining).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Accumulated vs spent bar */}
                <div className="w-full bg-gray-800 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${usePct}%` }}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span>Accumulated pool</span>
                    <span className="text-foreground font-medium">
                      {currency} {item.accumulatedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span>Spent this month</span>
                    <span>
                      {currency} {item.spentThisMonth.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span>Monthly budget</span>
                    <span>
                      {currency} {item.monthlyBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
