'use client';

import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  date: string;
  expenseTypeName: string;
  description?: string;
  amount: number;
}

interface RecentTransactionsPanelProps {
  transactions: Transaction[];
  currency: string;
}

export function RecentTransactionsPanel({ transactions, currency }: RecentTransactionsPanelProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (transactions.length === 0) {
    return (
      <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
          <p className="text-sm mb-4">No transactions recorded yet</p>
          <Link
            href="/transactions"
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            Record your first transaction
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium transition-colors group"
        >
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {transaction.expenseTypeName}
                </p>
                <span className="text-xs text-foreground-muted flex-shrink-0">
                  {formatDate(transaction.date)}
                </span>
              </div>
              {transaction.description && (
                <p className="text-xs text-foreground-muted truncate">
                  {transaction.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 ml-4">
              <p className="text-sm font-semibold text-foreground">
                {currency} {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {transactions.length >= 5 && (
        <Link
          href="/transactions"
          className="mt-4 block text-center text-sm text-primary hover:text-primary/80 transition-colors"
        >
          View all transactions
        </Link>
      )}
    </div>
  );
}
