'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor?: string;
    }[];
  };
  title?: string;
  yAxisLabel?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  yAxisLabel = 'Amount ($)',
}) => {
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
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
      title: title
        ? {
            display: true,
            text: title,
            color: '#F3F4F6', // gray-100
            font: {
              size: 16,
              weight: 'bold',
              family: 'Roboto, sans-serif',
            },
            padding: { bottom: 20 },
          }
        : undefined,
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
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#374151', // gray-700
          display: false,
        },
        ticks: {
          color: '#D1D5DB', // gray-300
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: '#374151', // gray-700
        },
        ticks: {
          color: '#D1D5DB', // gray-300
          font: {
            size: 11,
          },
          callback: function (value) {
            return '$' + value;
          },
        },
        title: {
          display: true,
          text: yAxisLabel,
          color: '#D1D5DB', // gray-300
          font: {
            size: 12,
          },
        },
      },
    },
  };

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    })),
  };

  return (
    <div className="w-full h-full">
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};
