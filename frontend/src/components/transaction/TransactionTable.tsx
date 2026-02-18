'use client';

import React, { useState } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Transaction } from '@/lib/api/transaction';
import { ExpenseType } from '@/lib/api/budget';
import { getIconComponent } from '../budget/IconPicker';

interface TransactionTableProps {
  transactions: Transaction[];
  expenseTypes: ExpenseType[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onLoadMore?: () => void;
  hasMore: boolean;
  loading?: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  expenseTypes,
  onEdit,
  onDelete,
  onLoadMore,
  hasMore,
  loading = false,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getExpenseTypeName = (expenseTypeId: string): string => {
    const expenseType = expenseTypes.find(et => et.id === expenseTypeId);
    return expenseType?.name || 'Unknown';
  };

  const getExpenseTypeIcon = (expenseTypeId: string): string => {
    const expenseType = expenseTypes.find(et => et.id === expenseTypeId);
    return expenseType?.icon || 'circle';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const handleMenuToggle = (transactionId: string) => {
    setOpenMenuId(openMenuId === transactionId ? null : transactionId);
  };

  const handleEdit = (transaction: Transaction) => {
    setOpenMenuId(null);
    onEdit(transaction);
  };

  const handleDelete = (transaction: Transaction) => {
    setOpenMenuId(null);
    onDelete(transaction);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  if (transactions.length === 0) {
    return (
      <div className="bg-[#111936] rounded-xl shadow-lg border border-gray-800 p-12 text-center">
        <div className="text-gray-400 text-lg mb-2">No transactions yet</div>
        <div className="text-gray-500 text-sm">
          Click &quot;Record Transaction&quot; to add your first expense
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#111936] rounded-xl shadow-lg border border-gray-800 overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Date
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Expense Type
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Description
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-300">
                  Amount
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-300 w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                    index === transactions.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="py-4 px-6 text-sm text-gray-300">
                    {formatDate(transaction.transactionDate)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComponent = getIconComponent(getExpenseTypeIcon(transaction.expenseTypeId));
                        return <IconComponent className="w-5 h-5 text-sky-400 flex-shrink-0" />;
                      })()}
                      <span className="text-white">
                        {getExpenseTypeName(transaction.expenseTypeId)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-400">
                    {transaction.description || '-'}
                  </td>
                  <td className="py-4 px-6 text-right font-semibold text-white">
                    {formatAmount(transaction.amount)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuToggle(transaction.id);
                        }}
                        className="p-1 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {openMenuId === transaction.id && (
                        <div className={`absolute right-0 w-48 bg-[#0a0e27] border border-gray-700 rounded-lg shadow-xl z-50 ${
                          index === transactions.length - 1 && transactions.length > 3 ? 'bottom-full mb-2' : 'mt-2'
                        }`}>
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors rounded-t-lg"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Transaction
                          </button>
                          <button
                            onClick={() => handleDelete(transaction)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition-colors rounded-b-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Transaction
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};
