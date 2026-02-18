'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useToast } from '../ui/Toast';
import {
  Transaction,
  TransactionRequest,
  transactionApi,
} from '@/lib/api/transaction';
import { Budget, budgetApi } from '@/lib/api/budget';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction; // For edit mode
}

interface BudgetItemOption {
  budgetItemId: string;
  expenseTypeId: string;
  expenseTypeName: string;
  icon: string;
  budgetAmount: number;
  isOneTime: boolean;
  applicableMonth: number | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}) => {
  const isEditMode = !!transaction;
  const currentDate = new Date();

  const [formData, setFormData] = useState<TransactionRequest>({
    budgetItemId: '',
    expenseTypeId: '',
    amount: 0,
    description: '',
    transactionDate: currentDate.toISOString().split('T')[0], // YYYY-MM-DD
  });

  const [budgetItems, setBudgetItems] = useState<BudgetItemOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBudget, setLoadingBudget] = useState(false);

  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadBudgetItems();
      if (transaction) {
        setFormData({
          budgetItemId: transaction.budgetItemId,
          expenseTypeId: transaction.expenseTypeId,
          amount: transaction.amount,
          description: transaction.description || '',
          transactionDate: transaction.transactionDate,
        });
      } else {
        // Reset form for new transaction
        setFormData({
          budgetItemId: '',
          expenseTypeId: '',
          amount: 0,
          description: '',
          transactionDate: currentDate.toISOString().split('T')[0],
        });
      }
    }
  }, [isOpen, transaction]);

  const loadBudgetItems = async () => {
    setLoadingBudget(true);
    try {
      const currentYear = new Date().getFullYear();
      const budget: Budget = await budgetApi.getByYear(currentYear);

      const items: BudgetItemOption[] = budget.items.map(item => ({
        budgetItemId: item.id,
        expenseTypeId: item.expenseType.id,
        expenseTypeName: item.expenseType.name,
        icon: item.expenseType.icon,
        budgetAmount: item.amount,
        isOneTime: item.isOneTime,
        applicableMonth: item.applicableMonth,
      }));

      setBudgetItems(items);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load budget items');
      setBudgetItems([]);
    } finally {
      setLoadingBudget(false);
    }
  };

  const handleExpenseTypeChange = (expenseTypeId: string) => {
    // Find the budget item for this expense type
    const currentMonth = new Date(formData.transactionDate).getMonth() + 1;

    // Find matching budget item (prefer recurring, or one-time for current month)
    const budgetItem = budgetItems.find(
      item =>
        item.expenseTypeId === expenseTypeId &&
        (!item.isOneTime || item.applicableMonth === currentMonth)
    );

    if (budgetItem) {
      setFormData({
        ...formData,
        expenseTypeId,
        budgetItemId: budgetItem.budgetItemId,
      });
    } else {
      showError('No budget item found for this expense type in the current month');
    }
  };

  const handleDateChange = (date: string) => {
    setFormData({ ...formData, transactionDate: date });

    // Re-validate budget item based on new date
    if (formData.expenseTypeId) {
      const currentMonth = new Date(date).getMonth() + 1;
      const budgetItem = budgetItems.find(
        item =>
          item.expenseTypeId === formData.expenseTypeId &&
          (!item.isOneTime || item.applicableMonth === currentMonth)
      );

      if (budgetItem) {
        setFormData(prev => ({ ...prev, budgetItemId: budgetItem.budgetItemId }));
      }
    }
  };

  const validateForm = (): string | null => {
    if (!formData.expenseTypeId) {
      return 'Please select an expense type';
    }
    if (!formData.budgetItemId) {
      return 'No budget item available for this expense type';
    }
    if (formData.amount <= 0) {
      return 'Amount must be greater than 0';
    }
    if (!formData.transactionDate) {
      return 'Please select a transaction date';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      showError(error);
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && transaction) {
        await transactionApi.update(transaction.id, formData);
        showSuccess('Transaction updated successfully');
      } else {
        await transactionApi.create(formData);
        showSuccess('Transaction created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  // Get available expense types (unique)
  const availableExpenseTypes = budgetItems.reduce((acc, item) => {
    if (!acc.find(x => x.value === item.expenseTypeId)) {
      acc.push({
        value: item.expenseTypeId,
        label: item.expenseTypeName,
      });
    }
    return acc;
  }, [] as { value: string; label: string }[]);

  const selectedBudgetItem = budgetItems.find(
    item => item.budgetItemId === formData.budgetItemId
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Transaction' : 'Record Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {loadingBudget ? (
          <div className="text-center text-gray-400 py-8">Loading budget items...</div>
        ) : budgetItems.length === 0 ? (
          <div className="text-center text-amber-400 py-8">
            No budget found for current year. Please create a budget first.
          </div>
        ) : (
          <>
            <Select
              label="Expense Type"
              value={formData.expenseTypeId}
              onChange={(e) => handleExpenseTypeChange(e.target.value)}
              options={[
                { value: '', label: 'Select expense type' },
                ...availableExpenseTypes,
              ]}
              required
            />

            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
            />

            {selectedBudgetItem && (
              <div className="text-sm text-gray-400">
                Budget allocated: ${selectedBudgetItem.budgetAmount.toFixed(2)}
                {selectedBudgetItem.isOneTime && (
                  <span className="ml-2 text-amber-400">
                    (One-time - {selectedBudgetItem.applicableMonth ?
                      new Date(2024, selectedBudgetItem.applicableMonth - 1).toLocaleString('default', { month: 'long' })
                      : 'N/A'})
                  </span>
                )}
              </div>
            )}

            <Input
              label="Description (Optional)"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Grocery shopping at Walmart"
              maxLength={500}
            />

            <Input
              label="Transaction Date"
              type="date"
              value={formData.transactionDate}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingBudget || budgetItems.length === 0}
              >
                {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
