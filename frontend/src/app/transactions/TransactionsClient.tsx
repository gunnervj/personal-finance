'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button, MonthYearSelector } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { TransactionTable } from '@/components/transaction/TransactionTable';
import { TransactionFilters, TransactionFilterValues } from '@/components/transaction/TransactionFilters';
import { DeleteConfirmationDialog } from '@/components/transaction/DeleteConfirmationDialog';
import { MonthlySummaryWidgets } from '@/components/transaction/MonthlySummaryWidgets';
import {
  Transaction,
  transactionApi,
  PagedResponse,
  MonthlySummary,
} from '@/lib/api/transaction';
import { ExpenseType, expenseTypeApi, budgetApi, Budget } from '@/lib/api/budget';

export default function TransactionsClient() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filters, setFilters] = useState<TransactionFilterValues>({});

  const { showError, showSuccess } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload summary and budget when month changes
  useEffect(() => {
    if (!initialLoading) {
      loadMonthlySummary();
      loadBudget();
    }
  }, [selectedYear, selectedMonth]);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      await Promise.all([
        loadTransactions(0),
        loadExpenseTypes(),
        loadMonthlySummary(),
        loadBudget(),
      ]);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const loadTransactions = async (page: number, filterOverride?: TransactionFilterValues) => {
    setLoading(true);
    try {
      const activeFilters = filterOverride !== undefined ? filterOverride : filters;
      const response: PagedResponse<Transaction> = await transactionApi.list({
        page,
        pageSize: 10,
        ...activeFilters, // Include filters in the API call
      });

      if (page === 0) {
        setTransactions(response.content);
      } else {
        setTransactions((prev) => [...prev, ...response.content]);
      }

      setCurrentPage(page);
      setTotalPages(response.totalPages);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (newFilters: TransactionFilterValues) => {
    setFilters(newFilters);
    loadTransactions(0, newFilters); // Pass filters directly to avoid state timing issue
  };

  const handleResetFilters = () => {
    setFilters({});
    loadTransactions(0, {}); // Pass empty filters directly
  };

  const loadExpenseTypes = async () => {
    try {
      const types = await expenseTypeApi.list();
      setExpenseTypes(types);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load expense types');
    }
  };

  const loadMonthlySummary = async () => {
    try {
      const summary = await transactionApi.getMonthlySummary(selectedYear, selectedMonth);
      setMonthlySummary(summary);
    } catch (err) {
      console.error('Failed to load monthly summary:', err);
      setMonthlySummary({
        year: selectedYear,
        month: selectedMonth,
        totalExpenses: 0,
        transactionCount: 0,
      });
    }
  };

  const loadBudget = async () => {
    try {
      const budgetData = await budgetApi.getByYear(selectedYear);
      setBudget(budgetData);
    } catch (err) {
      console.error('Failed to load budget:', err);
      setBudget(null);
    }
  };

  const handleLoadMore = () => {
    if (currentPage + 1 < totalPages) {
      loadTransactions(currentPage + 1);
    }
  };

  const handleFormSuccess = () => {
    setSelectedTransaction(null);
    loadTransactions(0);
    loadMonthlySummary();
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransaction) return;

    setDeleteLoading(true);
    try {
      await transactionApi.delete(selectedTransaction.id);
      showSuccess('Transaction deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
      loadTransactions(0);
      loadMonthlySummary();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getCurrentMonthName = (): string => {
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const calculateBudgetTotal = (): number => {
    if (!budget) return 0;

    // Sum recurring items + applicable one-time items for selected month
    return budget.items.reduce((total, item) => {
      if (!item.isOneTime) {
        return total + item.amount;
      }
      if (item.applicableMonth === selectedMonth) {
        return total + item.amount;
      }
      return total;
    }, 0);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-400 py-12">Loading...</div>
        </div>
      </div>
    );
  }

  const budgetTotal = calculateBudgetTotal();

  return (
    <div className="min-h-screen bg-[#0a0e27] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
            <p className="text-gray-400">Track and manage your expenses</p>
          </div>
          <Button
            onClick={() => {
              setSelectedTransaction(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Record Transaction
          </Button>
        </div>

        {/* Month Selector */}
        <div className="mb-6 flex justify-center">
          <MonthYearSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Monthly Summary Widgets */}
        <MonthlySummaryWidgets
          totalExpenses={monthlySummary?.totalExpenses || 0}
          transactionCount={monthlySummary?.transactionCount || 0}
          budgetTotal={budgetTotal}
          currentMonth={getCurrentMonthName()}
        />

        {/* Transaction Filters */}
        <TransactionFilters
          expenseTypes={expenseTypes}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />

        {/* Transactions Table */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
          <TransactionTable
            transactions={transactions}
            expenseTypes={expenseTypes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLoadMore={handleLoadMore}
            hasMore={currentPage + 1 < totalPages}
            loading={loading}
          />
        </div>

        {/* Transaction Form Modal */}
        <TransactionForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedTransaction(null);
          }}
          onSuccess={handleFormSuccess}
          transaction={selectedTransaction || undefined}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedTransaction(null);
          }}
          onConfirm={confirmDelete}
          loading={deleteLoading}
          transactionAmount={selectedTransaction?.amount}
          transactionDate={selectedTransaction?.transactionDate}
        />
      </div>
    </div>
  );
}
