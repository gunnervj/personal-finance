'use client';

import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';

export interface BurnRateItem {
  expenseTypeId: string;
  name: string;
  icon: string;
  budgetAmount: number;
  spentAmount: number;
  burnPercentage: number;
}

interface BurnRateWidgetProps {
  items: BurnRateItem[];
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

const getBurnColors = (pct: number) => {
  if (pct >= 80) return { bar: 'bg-red-500', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400' };
  if (pct >= 50) return { bar: 'bg-orange-500', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400' };
  return { bar: 'bg-green-500', text: 'text-green-400', badge: 'bg-green-500/20 text-green-400' };
};

export function BurnRateWidget({
  items,
  month,
  year,
  currency,
  onPrevMonth,
  onNextMonth,
}: BurnRateWidgetProps) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Burn Rate</h3>
            <p className="text-xs text-foreground-muted">Spending vs budget per category</p>
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
          <p className="text-sm">No budget data for {monthLabel}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => {
            const colors = getBurnColors(item.burnPercentage);
            const barWidth = Math.min(item.burnPercentage, 100);
            const isOverBudget = item.burnPercentage > 100;

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
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${colors.badge}`}>
                    {isOverBudget ? `+${(item.burnPercentage - 100).toFixed(0)}%` : `${item.burnPercentage.toFixed(0)}%`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-800 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-foreground-muted">
                  <span>
                    {currency} {item.spentAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} spent
                  </span>
                  <span>
                    {currency} {item.budgetAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} budget
                  </span>
                </div>

                {isOverBudget && (
                  <p className="text-xs text-red-400 mt-1">
                    Over by {currency} {(item.spentAmount - item.budgetAmount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
