'use client';

import { PieChart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ExpenseTypeData {
  name: string;
  amount: number;
  color: string;
  icon?: string;
}

interface ExpenseDistributionChartProps {
  data: ExpenseTypeData[];
  currency: string;
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function ExpenseDistributionChart({
  data,
  currency,
  month,
  year,
  onPrevMonth,
  onNextMonth,
}: ExpenseDistributionChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

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

    const startAngle = (startPercentage / 100) * 360 - 90;
    const endAngle = ((startPercentage + percentage) / 100) * 360 - 90;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

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

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const NavigationHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <PieChart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Expense Distribution</h3>
          <p className="text-xs text-foreground-muted">Breakdown by category</p>
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
  );

  if (data.length === 0 || total === 0) {
    return (
      <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all h-full flex flex-col">
        <NavigationHeader />
        <div className="flex items-center justify-center flex-1 text-foreground-muted">
          <p className="text-sm">No expense data for {monthLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all h-full flex flex-col">
      <NavigationHeader />

      <div className="grid md:grid-cols-2 gap-6 items-center flex-1">
        {/* Donut Chart */}
        <div className="flex justify-center items-center relative">
          <svg
            width="280"
            height="280"
            viewBox="0 0 200 200"
            className="transition-transform"
          >
            {chartData.map((item, index) => (
              <g
                key={index}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <path
                  d={createDonutSegment(item.startPercentage, item.percentage)}
                  fill={item.color}
                  opacity={hoveredSegment === null || hoveredSegment === index ? 0.9 : 0.4}
                  className="cursor-pointer transition-opacity duration-150"
                  style={{
                    transform: hoveredSegment === index ? 'scale(1.03)' : 'scale(1)',
                    transformOrigin: '100px 100px',
                    transition: 'opacity 0.15s, transform 0.15s',
                  }}
                />
              </g>
            ))}
            {/* Center text - shows hovered segment or total */}
            {hoveredSegment !== null ? (
              <>
                <text x="100" y="90" textAnchor="middle" className="fill-foreground-muted" style={{ fontSize: '8px' }}>
                  {chartData[hoveredSegment].name.length > 14
                    ? chartData[hoveredSegment].name.slice(0, 13) + '…'
                    : chartData[hoveredSegment].name}
                </text>
                <text x="100" y="105" textAnchor="middle" className="fill-foreground" style={{ fontSize: '10px', fontWeight: 'bold' }}>
                  {currency} {chartData[hoveredSegment].amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </text>
                <text x="100" y="118" textAnchor="middle" style={{ fontSize: '8px', fill: chartData[hoveredSegment].color }}>
                  {chartData[hoveredSegment].percentage.toFixed(1)}%
                </text>
              </>
            ) : (
              <>
                <text x="100" y="95" textAnchor="middle" className="fill-foreground-muted" style={{ fontSize: '8px' }}>
                  Total
                </text>
                <text x="100" y="110" textAnchor="middle" className="fill-foreground" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {currency} {total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {chartData.map((item, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                hoveredSegment === index ? 'bg-gray-700/70' : 'hover:bg-gray-800/50'
              }`}
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
