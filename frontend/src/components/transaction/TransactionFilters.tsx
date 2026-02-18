'use client';

import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button, Input, Select } from '../ui';
import { ExpenseType } from '@/lib/api/budget';

export interface TransactionFilterValues {
  startDate?: string;
  endDate?: string;
  expenseTypeId?: string;
  description?: string;
}

interface TransactionFiltersProps {
  expenseTypes: ExpenseType[];
  onApplyFilters: (filters: TransactionFilterValues) => void;
  onResetFilters: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  expenseTypes,
  onApplyFilters,
  onResetFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<TransactionFilterValues>({});

  const handleApply = () => {
    onApplyFilters(filters);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setFilters({});
    onResetFilters();
    setIsExpanded(false);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ''
  );

  return (
    <div className="mb-6">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {Object.values(filters).filter((v) => v).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && !isExpanded && (
          <Button
            variant="secondary"
            onClick={handleReset}
            size="sm"
            className="flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 bg-gray-800/50 rounded-lg p-6 border border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                From Date
              </label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                To Date
              </label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Expense Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expense Type
              </label>
              <Select
                value={filters.expenseTypeId || ''}
                onChange={(e) =>
                  setFilters({ ...filters, expenseTypeId: e.target.value })
                }
                className="w-full"
              >
                <option value="">All Types</option>
                {expenseTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Description Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search description..."
                  value={filters.description || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, description: e.target.value })
                  }
                  className="w-full pl-10"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleApply} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Apply Filters
            </Button>
            <Button
              variant="secondary"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
