'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthYearSelectorProps {
  selectedMonth: number; // 1-12
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
  maxDate?: Date; // Optional: prevent selecting future dates
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  maxDate = new Date(),
}) => {
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(12, selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;

    // Check if next month is in the future
    const nextDate = new Date(nextYear, nextMonth - 1, 1);
    if (nextDate > maxDate) {
      return; // Don't allow going to future months
    }

    onMonthChange(nextMonth, nextYear);
  };

  const isNextDisabled = () => {
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    const nextDate = new Date(nextYear, nextMonth - 1, 1);
    return nextDate > maxDate;
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    onMonthChange(now.getMonth() + 1, now.getFullYear());
  };

  return (
    <div className="flex items-center gap-4 bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700">
      <button
        onClick={handlePrevMonth}
        className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
        title="Previous month"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 min-w-[200px] justify-center">
        <span className="text-lg font-semibold text-white">
          {MONTHS[selectedMonth - 1]} {selectedYear}
        </span>
        {!isCurrentMonth() && (
          <button
            onClick={goToCurrentMonth}
            className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
          >
            Current
          </button>
        )}
      </div>

      <button
        onClick={handleNextMonth}
        disabled={isNextDisabled()}
        className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        title="Next month"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
