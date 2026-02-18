'use client';

import { BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

interface MonthlyData {
  month: number;
  currentYear: number;
  previousYear: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlyData[];
  currentYear: number;
  currency: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthlyComparisonChart({ data, currentYear, currency }: MonthlyComparisonChartProps) {
  const CHART_HEIGHT = 280; // Available height in pixels for bars

  const maxValue = useMemo(() => {
    const allValues = data.flatMap((item) => [item.currentYear, item.previousYear]);
    return Math.max(...allValues, 1);
  }, [data]);

  const hasData = data.some((item) => item.currentYear > 0 || item.previousYear > 0);

  if (!hasData) {
    return (
      <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Monthly Comparison</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-foreground-muted">
          <p className="text-sm">No expense data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Monthly Comparison</h3>
          <p className="text-xs text-foreground-muted">
            {currentYear} vs {currentYear - 1}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-sky-500" />
          <span className="text-xs text-foreground-muted">{currentYear}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-violet-500" />
          <span className="text-xs text-foreground-muted">{currentYear - 1}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-80">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-foreground-muted w-16 pr-2 text-right">
          <span>{currency} {(maxValue).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          <span>{currency} {(maxValue * 0.75).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          <span>{currency} {(maxValue * 0.5).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          <span>{currency} {(maxValue * 0.25).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          <span>{currency} 0</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-16 right-0 top-0 bottom-0">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pb-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-gray-800" />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end pb-8 gap-2">
            {data.map((item, index) => {
              const currentHeightPx = Math.max((item.currentYear / maxValue) * CHART_HEIGHT, item.currentYear > 0 ? 8 : 0);
              const previousHeightPx = Math.max((item.previousYear / maxValue) * CHART_HEIGHT, item.previousYear > 0 ? 8 : 0);

              return (
                <div key={index} className="flex-1 flex gap-1.5 items-end group">
                  {/* Current year bar */}
                  <div className="flex-1 relative group/bar">
                    <div
                      className="w-full bg-sky-500 rounded-t transition-all duration-300 hover:bg-sky-400 cursor-pointer"
                      style={{ height: `${currentHeightPx}px` }}
                    >
                      {/* Tooltip on hover */}
                      {item.currentYear > 0 && (
                        <div className="opacity-0 group-hover/bar:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-xs text-white rounded whitespace-nowrap pointer-events-none transition-opacity z-20 shadow-lg">
                          {currency} {item.currentYear.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Previous year bar */}
                  <div className="flex-1 relative group/bar">
                    <div
                      className="w-full bg-violet-500 rounded-t transition-all duration-300 hover:bg-violet-400 cursor-pointer"
                      style={{ height: `${previousHeightPx}px` }}
                    >
                      {/* Tooltip on hover */}
                      {item.previousYear > 0 && (
                        <div className="opacity-0 group-hover/bar:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-xs text-white rounded whitespace-nowrap pointer-events-none transition-opacity z-20 shadow-lg">
                          {currency} {item.previousYear.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1">
            {MONTHS.map((month, index) => (
              <div key={index} className="flex-1 text-center text-xs text-foreground-muted">
                {month}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
