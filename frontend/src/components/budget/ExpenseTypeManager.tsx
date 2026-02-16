'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ExpenseTypeForm } from './ExpenseTypeForm';
import { ExpenseType, expenseTypeApi } from '@/lib/api/budget';
import { getIconComponent } from './IconPicker';
import { useToast } from '../ui/Toast';

export const ExpenseTypeManager: React.FC = () => {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<ExpenseType | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { showError, showSuccess } = useToast();

  useEffect(() => {
    loadExpenseTypes();
  }, []);

  const loadExpenseTypes = async () => {
    try {
      setLoading(true);
      const data = await expenseTypeApi.list();
      setExpenseTypes(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load expense types');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expenseType: ExpenseType) => {
    setEditingType(expenseType);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await expenseTypeApi.delete(id);
      showSuccess('Expense type deleted successfully!');
      await loadExpenseTypes();
      setDeleteConfirm(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete expense type');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingType(undefined);
  };

  const handleFormSuccess = async () => {
    await loadExpenseTypes();
    handleFormClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading expense types...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Expense Types</h2>
          <p className="text-gray-400 mt-1">
            Manage your budget categories
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Expense Type
        </Button>
      </div>

      {expenseTypes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <Plus className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No expense types yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first expense type to start budgeting
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Add Expense Type
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseTypes.map((expenseType) => {
            const IconComponent = getIconComponent(expenseType.icon);
            return (
              <Card key={expenseType.id} className="relative group">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <IconComponent className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {expenseType.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      {expenseType.isMandatory ? (
                        <span className="text-xs px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded">
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-700/50 border border-gray-600 text-gray-400 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(expenseType)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {expenseType.canDelete ? (
                    deleteConfirm === expenseType.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(expenseType.id)}
                          className="flex-1"
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
                        onClick={() => setDeleteConfirm(expenseType.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      title="Cannot delete - used in budgets"
                      className="opacity-50 cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ExpenseTypeForm
        isOpen={showForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        expenseType={editingType}
      />
    </div>
  );
};
