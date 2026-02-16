'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  canClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  canClose = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex-shrink-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {canClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">{children}</div>
      </div>
    </div>
  );
};
