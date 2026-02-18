'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Eye, Edit2, Trash2, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { BudgetForm } from './BudgetForm';
import { BudgetDetailModal } from './BudgetDetailModal';
import { CopyBudgetModal } from './CopyBudgetModal';
import { Budget, budgetApi } from '@/lib/api/budget';
import { useToast } from '../ui/Toast';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const BudgetYearView: React.FC = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const isDecember = currentMonth === 12;

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { showError, showSuccess } = useToast();

  // Check if user can create a budget
  const hasCurrentYearBudget = budgets.some(b => b.year === currentYear);
  const hasNextYearBudget = budgets.some(b => b.year === currentYear + 1);

  // Show create button if:
  // - No budget for current year exists, OR
  // - It's December and no budget for next year exists
  const canCreateBudget = !hasCurrentYearBudget || (isDecember && !hasNextYearBudget);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await budgetApi.list();
      setBudgets(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (year: number) => {
    try {
      await budgetApi.delete(year);
      showSuccess(`Budget for ${year} deleted successfully!`);
      await loadBudgets();
      setDeleteConfirm(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete budget');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading budgets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">Your Budgets</h2>
        </div>

        <div className="flex gap-3">
          {budgets.length > 0 && (
            <Button variant="secondary" onClick={() => setShowCopyModal(true)}>
              <Copy className="w-5 h-5 mr-2" />
              Copy
            </Button>
          )}
          {canCreateBudget && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Budget
            </Button>
          )}
        </div>
      </div>

      {/* Budget List */}
      {budgets.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <Calendar className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No budgets yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first yearly budget to start managing your finances
            </p>
            {canCreateBudget && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Create Budget
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {budgets.map((budget) => {
            const recurringItems = budget.items.filter(item => !item.isOneTime);
            const oneTimeItems = budget.items.filter(item => item.isOneTime);
            const recurringTotal = recurringItems.reduce((sum, item) => sum + item.amount, 0);
            const isPastYear = budget.year < currentYear;

            // Get months that have one-time expenses
            const monthsWithOneTime = [...new Set(
              oneTimeItems.map(item => item.applicableMonth).filter(Boolean)
            )].sort((a, b) => a! - b!);

            return (
              <Card
                key={budget.id}
                className={`${
                  budget.year === currentYear
                    ? 'border-blue-500 bg-blue-500/5'
                    : isPastYear
                    ? 'border-gray-700 opacity-75'
                    : 'border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-white">{budget.year}</h3>
                      {budget.year === currentYear && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded whitespace-nowrap">
                          Current Year
                        </span>
                      )}
                      {isPastYear && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs font-semibold rounded whitespace-nowrap">
                          Past Year (Read-only)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-400">Recurring Monthly</div>
                        <div className="text-xl font-bold text-green-400 whitespace-nowrap">
                          ${recurringTotal.toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Recurring Items</div>
                        <div className="text-xl font-bold text-white whitespace-nowrap">
                          {recurringItems.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">One-Time Items</div>
                        <div className="text-xl font-bold text-purple-400 whitespace-nowrap">
                          {oneTimeItems.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Total Items</div>
                        <div className="text-xl font-bold text-white whitespace-nowrap">
                          {budget.items.length}
                        </div>
                      </div>
                    </div>

                    {/* Months with one-time expenses */}
                    {monthsWithOneTime.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2">One-time expenses in:</div>
                        <div className="flex flex-wrap gap-2">
                          {monthsWithOneTime.map(month => (
                            <span
                              key={month}
                              className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs rounded whitespace-nowrap"
                            >
                              {MONTHS[month! - 1]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedBudget(budget)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingBudget(budget)}
                        disabled={isPastYear}
                        title={isPastYear ? 'Cannot edit past year budgets' : ''}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      {deleteConfirm === budget.year ? (
                        <>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(budget.year)}
                            disabled={isPastYear}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={isPastYear}
                          title={isPastYear ? 'Cannot delete past year budgets' : ''}
                          onClick={() => setDeleteConfirm(budget.year)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <BudgetForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={loadBudgets}
      />

      <BudgetForm
        isOpen={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        onSuccess={() => {
          loadBudgets();
          setEditingBudget(null);
        }}
        budget={editingBudget || undefined}
      />

      <CopyBudgetModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onSuccess={loadBudgets}
        availableBudgets={budgets}
      />

      {selectedBudget && (
        <BudgetDetailModal
          isOpen={!!selectedBudget}
          onClose={() => setSelectedBudget(null)}
          budget={selectedBudget}
          onUpdate={loadBudgets}
          onEdit={() => {
            setEditingBudget(selectedBudget);
            setSelectedBudget(null);
          }}
        />
      )}
    </div>
  );
};
