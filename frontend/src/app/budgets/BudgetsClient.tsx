'use client';

import React, { useState } from 'react';
import { Wallet, List } from 'lucide-react';
import { BudgetYearView } from '@/components/budget/BudgetYearView';
import { ExpenseTypeManager } from '@/components/budget/ExpenseTypeManager';

type TabType = 'budgets' | 'expense-types';

export function BudgetsClient() {
  const [activeTab, setActiveTab] = useState<TabType>('budgets');

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-white">
            Budget Management
          </h1>
          <p className="text-gray-400">
            Plan your monthly expenses and manage expense categories
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('budgets')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                activeTab === 'budgets'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Wallet className="w-5 h-5" />
              Budgets
            </button>
            <button
              onClick={() => setActiveTab('expense-types')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                activeTab === 'expense-types'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <List className="w-5 h-5" />
              Expense Types
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'budgets' && <BudgetYearView />}
          {activeTab === 'expense-types' && <ExpenseTypeManager />}
        </div>
      </div>
    </div>
  );
}
