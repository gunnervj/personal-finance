'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  transactionAmount?: number;
  transactionDate?: string;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  transactionAmount,
  transactionDate,
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Transaction">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-300 mb-2">
              Are you sure you want to delete this transaction?
            </p>
            {transactionAmount !== undefined && transactionDate && (
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
                <div className="text-sm text-gray-400">
                  Amount:{' '}
                  <span className="text-white font-semibold">
                    ${transactionAmount.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Date:{' '}
                  <span className="text-white">{formatDate(transactionDate)}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-red-400 mt-3">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600"
          >
            {loading ? 'Deleting...' : 'Delete Transaction'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
