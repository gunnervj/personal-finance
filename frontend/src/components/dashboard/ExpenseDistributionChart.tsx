'use client';

import { PieChart } from 'lucide-react';
import { useMemo } from 'react';

interface ExpenseTypeData {
  name: string;
  amount: number;
  color: string;
  icon?: string;
}

interface ExpenseDistributionChartProps {
  data: ExpenseTypeData[];
  currency: string;
}

// Predefined colors for consistency
const CHART_COLORS = [
  '#0ea5e9', // sky-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#6366f1', // indigo-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
];

export function ExpenseDistributionChart({ data, currency }: ExpenseDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const chartData = useMemo(() => {
    let cumulativePercentage = 0;
    return data.map((item, index) => {
      const percentage = total > 0 ? (item.amount / total) * 100 : 0;
      const startPercentage = cumulativePercentage;
      cumulativePercentage += percentage;
      return {
        ...item,
        percentage,
        startPercentage,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
  }, [data, total]);

  // Calculate donut segments
  const createDonutSegment = (startPercentage: number, percentage: number) => {
    const radius = 80;
    const innerRadius = 50;
    const centerX = 100;
    const centerY = 100;

    // Convert percentages to angles (0-360 degrees)
    const startAngle = (startPercentage / 100) * 360 - 90; // -90 to start from top
    const endAngle = ((startPercentage + percentage) / 100) * 360 - 90;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate outer arc points
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    // Calculate inner arc points
    const x3 = centerX + innerRadius * Math.cos(endRad);
    const y3 = centerY + innerRadius * Math.sin(endRad);
    const x4 = centerX + innerRadius * Math.cos(startRad);
    const y4 = centerY + innerRadius * Math.sin(startRad);

    const largeArcFlag = percentage > 50 ? 1 : 0;

    return `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;
  };

  if (data.length === 0 || total === 0) {
    return (
      <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <PieChart className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Expense Distribution</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-foreground-muted">
          <p className="text-sm">No expense data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <PieChart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Expense Distribution</h3>
          <p className="text-xs text-foreground-muted">Breakdown by category</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center flex-1">
        {/* Donut Chart */}
        <div className="flex justify-center items-center">
          <svg width="280" height="280" viewBox="0 0 200 200" className="transform hover:scale-105 transition-transform">
            {chartData.map((item, index) => (
              <g key={index}>
                <path
                  d={createDonutSegment(item.startPercentage, item.percentage)}
                  fill={item.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  opacity="0.9"
                />
              </g>
            ))}
            {/* Center text */}
            <text x="100" y="95" textAnchor="middle" className="fill-foreground-muted text-xs font-medium">
              Total
            </text>
            <text x="100" y="110" textAnchor="middle" className="fill-foreground text-lg font-bold">
              {currency} {total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {chartData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-foreground truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                <span className="text-xs text-foreground-muted">
                  {item.percentage.toFixed(1)}%
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {currency} {item.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
