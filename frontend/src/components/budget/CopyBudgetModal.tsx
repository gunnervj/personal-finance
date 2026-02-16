'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Copy, ArrowRight } from 'lucide-react';
import { Budget, budgetApi, CopyBudgetParams } from '@/lib/api/budget';
import { useToast } from '../ui/Toast';

interface CopyBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBudgets: Budget[];
}

export const CopyBudgetModal: React.FC<CopyBudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  availableBudgets,
}) => {
  const currentYear = new Date().getFullYear();

  const [fromYear, setFromYear] = useState(
    availableBudgets.length > 0 ? availableBudgets[0].year : currentYear
  );
  const [toYear, setToYear] = useState(currentYear + 1);
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess } = useToast();

  const sourceBudget = availableBudgets.find(b => b.year === fromYear);

  const handleCopy = async () => {
    setLoading(true);

    try {
      const params: CopyBudgetParams = {
        fromYear,
        toYear,
      };

      await budgetApi.copy(params);
      showSuccess(`Budget copied from ${fromYear} to ${toYear} successfully!`);
      onSuccess();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to copy budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Copy Budget">
      <div className="space-y-6">
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
          <p className="font-medium mb-2">About copying budgets:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Copies all recurring monthly expenses</li>
            <li>Copies all one-time expenses with their months</li>
            <li>Creates a new budget for the selected year</li>
          </ul>
        </div>

        {/* Source Selection */}
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-3">From (Source Year)</h3>
          <Select
            value={fromYear}
            onChange={(e) => setFromYear(Number(e.target.value))}
          >
            {availableBudgets.map(budget => (
              <option key={budget.year} value={budget.year}>
                {budget.year}
              </option>
            ))}
          </Select>

          {sourceBudget && (
            <div className="mt-3 p-3 bg-gray-900 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Recurring expenses:</span>
                <span className="text-white font-semibold whitespace-nowrap">
                  {sourceBudget.items.filter(i => !i.isOneTime).length} items
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">One-time expenses:</span>
                <span className="text-white font-semibold whitespace-nowrap">
                  {sourceBudget.items.filter(i => i.isOneTime).length} items
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total items:</span>
                <span className="text-white font-semibold whitespace-nowrap">
                  {sourceBudget.items.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <ArrowRight className="w-6 h-6 text-blue-400" />
        </div>

        {/* Destination */}
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-3">To (Target Year)</h3>
          <Select
            value={toYear}
            onChange={(e) => setToYear(Number(e.target.value))}
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="whitespace-nowrap"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            disabled={loading || !sourceBudget}
            className="whitespace-nowrap"
          >
            <Copy className="w-4 h-4 mr-2" />
            {loading ? 'Copying...' : 'Copy Budget'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
