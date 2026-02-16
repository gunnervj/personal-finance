import { apiClient } from '../api-client';

// Expense Type interfaces
export interface ExpenseType {
  id: string;
  userEmail: string;
  name: string;
  icon: string;
  isMandatory: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseTypeRequest {
  name: string;
  icon: string;
  isMandatory: boolean;
}

// Budget interfaces
export interface Budget {
  id: string;
  userEmail: string;
  year: number;
  items: BudgetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  expenseType: ExpenseType;
  amount: number;
  isOneTime: boolean;
  applicableMonth: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRequest {
  year: number;
}

export interface BudgetItemRequest {
  expenseTypeId: string;
  amount: number;
  isOneTime: boolean;
  applicableMonth?: number | null;
}

export interface CreateBudgetRequest {
  budget: BudgetRequest;
  items: BudgetItemRequest[];
}

export interface CopyBudgetParams {
  fromYear: number;
  toYear: number;
}

// Expense Type API
export const expenseTypeApi = {
  async list(): Promise<ExpenseType[]> {
    return apiClient.get<ExpenseType[]>('budget', '/api/v1/expense-types');
  },

  async getById(id: string): Promise<ExpenseType> {
    return apiClient.get<ExpenseType>('budget', `/api/v1/expense-types/${id}`);
  },

  async create(data: ExpenseTypeRequest): Promise<ExpenseType> {
    return apiClient.post<ExpenseType>('budget', '/api/v1/expense-types', data);
  },

  async update(id: string, data: ExpenseTypeRequest): Promise<ExpenseType> {
    return apiClient.put<ExpenseType>('budget', `/api/v1/expense-types/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete('budget', `/api/v1/expense-types/${id}`);
  },
};

// Budget API
export const budgetApi = {
  async list(): Promise<Budget[]> {
    return apiClient.get<Budget[]>('budget', '/api/v1/budgets');
  },

  async getByYear(year: number): Promise<Budget> {
    return apiClient.get<Budget>('budget', `/api/v1/budgets/${year}`);
  },

  async create(data: CreateBudgetRequest): Promise<Budget> {
    return apiClient.post<Budget>('budget', '/api/v1/budgets', data);
  },

  async update(year: number, items: BudgetItemRequest[]): Promise<Budget> {
    return apiClient.put<Budget>('budget', `/api/v1/budgets/${year}`, items);
  },

  async delete(year: number): Promise<void> {
    return apiClient.delete('budget', `/api/v1/budgets/${year}`);
  },

  async copy(params: CopyBudgetParams): Promise<Budget> {
    const queryParams = new URLSearchParams({
      fromYear: params.fromYear.toString(),
      toYear: params.toYear.toString(),
    });
    return apiClient.post<Budget>('budget', `/api/v1/budgets/copy?${queryParams}`);
  },
};
