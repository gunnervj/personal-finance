import { apiClient } from '../api-client';

// Transaction interfaces
export interface Transaction {
  id: string;
  userEmail: string;
  budgetItemId: string;
  expenseTypeId: string;
  amount: number;
  description: string | null;
  transactionDate: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRequest {
  budgetItemId: string;
  expenseTypeId: string;
  amount: number;
  description?: string;
  transactionDate: string; // ISO date string (YYYY-MM-DD)
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  totalExpenses: number;
  transactionCount: number;
}

export interface ExpenseTypeSummary {
  expenseTypeId: string;
  totalAmount: number;
}

export interface YearlySummary {
  year: number;
  monthlyTotals: Record<number, number>; // month -> total
  yearlyTotal: number;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  expenseTypeId?: string;
  page?: number;
  pageSize?: number;
}

// Transaction API
export const transactionApi = {
  async list(filters?: TransactionFilters): Promise<PagedResponse<Transaction>> {
    const params = new URLSearchParams();

    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.expenseTypeId) params.append('expenseTypeId', filters.expenseTypeId);
    if (filters?.page !== undefined) params.append('page', filters.page.toString());
    if (filters?.pageSize !== undefined) params.append('pageSize', filters.pageSize.toString());

    const queryString = params.toString();
    const url = queryString ? `/api/v1/transactions?${queryString}` : '/api/v1/transactions';

    return apiClient.get<PagedResponse<Transaction>>('transaction', url);
  },

  async getById(id: string): Promise<Transaction> {
    return apiClient.get<Transaction>('transaction', `/api/v1/transactions/${id}`);
  },

  async create(data: TransactionRequest): Promise<Transaction> {
    return apiClient.post<Transaction>('transaction', '/api/v1/transactions', data);
  },

  async update(id: string, data: TransactionRequest): Promise<Transaction> {
    return apiClient.put<Transaction>('transaction', `/api/v1/transactions/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete('transaction', `/api/v1/transactions/${id}`);
  },

  async getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    const params = new URLSearchParams({
      year: year.toString(),
      month: month.toString(),
    });
    return apiClient.get<MonthlySummary>('transaction', `/api/v1/transactions/summary/monthly?${params}`);
  },

  async getExpenseTypeSummary(year: number, month: number): Promise<ExpenseTypeSummary[]> {
    const params = new URLSearchParams({
      year: year.toString(),
      month: month.toString(),
    });
    return apiClient.get<ExpenseTypeSummary[]>('transaction', `/api/v1/transactions/summary/by-type?${params}`);
  },

  async getYearlySummary(year: number): Promise<YearlySummary> {
    const params = new URLSearchParams({
      year: year.toString(),
    });
    return apiClient.get<YearlySummary>('transaction', `/api/v1/transactions/summary/yearly?${params}`);
  },

  async getSpentByExpenseType(expenseTypeId: string, year: number, month: number): Promise<number> {
    const params = new URLSearchParams({
      year: year.toString(),
      month: month.toString(),
    });
    return apiClient.get<number>('transaction', `/api/v1/transactions/spent/${expenseTypeId}?${params}`);
  },

  async hasBudgetItemTransactions(budgetItemId: string): Promise<boolean> {
    return apiClient.get<boolean>('transaction', `/api/v1/transactions/check-budget-item/${budgetItemId}`);
  },
};
