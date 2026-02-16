'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
  data: {
    labels: string[];
    values: number[];
    colors?: string[];
  };
  title?: string;
  centerText?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#06B6D4', // cyan-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
];

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  centerText,
}) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: data.colors || DEFAULT_COLORS,
        borderColor: '#1F2937', // gray-800
        borderWidth: 2,
        hoverBorderColor: '#374151', // gray-700
        hoverBorderWidth: 3,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#D1D5DB', // gray-300
          padding: 15,
          font: {
            size: 12,
            family: 'Roboto, sans-serif',
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#1F2937', // gray-800
        titleColor: '#F3F4F6', // gray-100
        bodyColor: '#D1D5DB', // gray-300
        borderColor: '#374151', // gray-700
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '70%',
  };

  return (
    <div className="relative w-full h-full">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          {title}
        </h3>
      )}
      <div className="relative" style={{ height: '300px' }}>
        <Doughnut data={chartData} options={options} />
        {centerText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{centerText}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
