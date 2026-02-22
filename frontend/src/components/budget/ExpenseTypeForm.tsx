'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconPicker } from './IconPicker';
import { ExpenseType, ExpenseTypeRequest, expenseTypeApi } from '@/lib/api/budget';
import { useToast } from '../ui/Toast';

interface ExpenseTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseType?: ExpenseType;
}

export const ExpenseTypeForm: React.FC<ExpenseTypeFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expenseType,
}) => {
  const [formData, setFormData] = useState<ExpenseTypeRequest>({
    name: expenseType?.name || '',
    icon: expenseType?.icon || 'sparkles',
    isMandatory: expenseType?.isMandatory ?? true,
    accumulate: expenseType?.accumulate ?? false,
  });
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (expenseType) {
        await expenseTypeApi.update(expenseType.id, formData);
        showSuccess('Expense type updated successfully!');
      } else {
        await expenseTypeApi.create(formData);
        showSuccess('Expense type created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to save expense type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseType ? 'Edit Expense Type' : 'Create Expense Type'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Rent, Groceries, Utilities"
          required
        />

        <IconPicker
          selectedIcon={formData.icon}
          onSelect={(icon) => setFormData({ ...formData, icon })}
        />

        <div className="flex items-center gap-3 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <input
            type="checkbox"
            id="isMandatory"
            checked={formData.isMandatory}
            onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="isMandatory" className="text-white">
            <span className="font-medium">Mandatory Expense</span>
            <p className="text-sm text-gray-400 mt-1">
              Used to calculate emergency fund requirements
            </p>
          </label>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <input
            type="checkbox"
            id="accumulate"
            checked={formData.accumulate ?? false}
            onChange={(e) => setFormData({ ...formData, accumulate: e.target.checked })}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="accumulate" className="text-white">
            <span className="font-medium">Accumulate Unspent Budget</span>
            <p className="text-sm text-gray-400 mt-1">
              Unspent monthly budget carries forward to future months
            </p>
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : expenseType ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
