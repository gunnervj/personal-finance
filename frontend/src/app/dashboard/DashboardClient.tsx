'use client';

import { useEffect, useState } from 'react';
import { PreferencesModal } from '@/components/PreferencesModal';
import { preferencesApi, UserPreferences } from '@/lib/api/preferences';
import { budgetApi, Budget, expenseTypeApi, ExpenseType } from '@/lib/api/budget';
import { transactionApi } from '@/lib/api/transaction';
import { ExpenseSummaryWidget } from '@/components/dashboard/ExpenseSummaryWidget';
import { EmergencyFundWidget } from '@/components/dashboard/EmergencyFundWidget';
import { ExpenseDistributionChart } from '@/components/dashboard/ExpenseDistributionChart';
import { MonthlyComparisonChart } from '@/components/dashboard/MonthlyComparisonChart';
import { RecentTransactionsPanel } from '@/components/dashboard/RecentTransactionsPanel';

interface DashboardClientProps {
  userEmail: string;
}

interface DashboardData {
  preferences: UserPreferences | null;
  budget: Budget | null;
  monthlyExpenses: number;
  budgetTotal: number;
  expenseTypeData: Array<{ name: string; amount: number; color: string }>;
  monthlyComparison: Array<{ month: number; currentYear: number; previousYear: number }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    expenseTypeName: string;
    description?: string;
    amount: number;
  }>;
}

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Check preferences first
      const prefs = await preferencesApi.getPreferences();
      if (prefs.isFirstTime) {
        setShowPreferencesModal(true);
        setLoading(false);
        return;
      }

      // Load all dashboard data in parallel
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const previousYear = currentYear - 1;

      const [
        budget,
        expenseTypes,
        monthlySummary,
        expenseTypeSummary,
        currentYearSummary,
        previousYearSummary,
        recentTransactions,
      ] = await Promise.all([
        budgetApi.getByYear(currentYear).catch(() => null),
        expenseTypeApi.list().catch(() => []),
        transactionApi.getMonthlySummary(currentYear, currentMonth).catch(() => ({ totalExpenses: 0, transactionCount: 0, year: currentYear, month: currentMonth })),
        transactionApi.getExpenseTypeSummary(currentYear, currentMonth).catch(() => []),
        transactionApi.getYearlySummary(currentYear).catch(() => ({ year: currentYear, monthlyTotals: {}, yearlyTotal: 0 })),
        transactionApi.getYearlySummary(previousYear).catch(() => ({ year: previousYear, monthlyTotals: {}, yearlyTotal: 0 })),
        transactionApi.list({ page: 1, pageSize: 5 }).catch(() => ({ content: [], page: 1, pageSize: 5, totalElements: 0, totalPages: 0 })),
      ]);

      // Calculate budget total for current month
      let budgetTotal = 0;
      if (budget && budget.items) {
        budgetTotal = budget.items
          .filter((item: any) => !item.applicableMonth || item.applicableMonth === currentMonth)
          .reduce((sum: number, item: any) => sum + item.amount, 0);
      }

      // Format expense type data for donut chart
      const expenseTypeData = expenseTypeSummary.map((item: any) => {
        const expenseType = expenseTypes.find((et: ExpenseType) => et.id === item.expenseTypeId);
        return {
          name: expenseType?.name || 'Unknown',
          amount: item.totalAmount,
          color: '', // Will be set by the chart component
        };
      });

      // Format monthly comparison data
      const monthlyComparison = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const currentTotals = currentYearSummary.monthlyTotals as Record<number, number> | undefined;
        const previousTotals = previousYearSummary.monthlyTotals as Record<number, number> | undefined;
        const currentMonthValue = currentTotals?.[month];
        const previousMonthValue = previousTotals?.[month];

        return {
          month,
          currentYear: currentMonthValue ? Number(currentMonthValue) : 0,
          previousYear: previousMonthValue ? Number(previousMonthValue) : 0,
        };
      });

      // Format recent transactions
      const formattedTransactions = recentTransactions.content.map((t: any) => {
        const expenseType = expenseTypes.find((et: ExpenseType) => et.id === t.expenseTypeId);
        return {
          id: t.id,
          date: t.transactionDate,
          expenseTypeName: expenseType?.name || 'Unknown',
          description: t.description,
          amount: t.amount,
        };
      });

      setDashboardData({
        preferences: prefs,
        budget,
        monthlyExpenses: monthlySummary.totalExpenses,
        budgetTotal,
        expenseTypeData,
        monthlyComparison,
        recentTransactions: formattedTransactions,
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Show modal on error (first-time user might not have preferences yet)
      setShowPreferencesModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (
    data: { currency: string; emergencyFundMonths: number; monthlySalary: number },
    avatarFile?: File
  ) => {
    try {
      // Upload avatar first if provided
      if (avatarFile) {
        await preferencesApi.uploadAvatar(avatarFile);
      }

      // Save preferences
      await preferencesApi.savePreferences(data);

      setShowPreferencesModal(false);
      // Reload dashboard with new preferences
      loadDashboard();
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error; // Re-throw so PreferencesModal can handle it
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    // First-time user or preferences not yet set — show modal without dashboard content
    return (
      <PreferencesModal
        isOpen={showPreferencesModal}
        onSave={handleSavePreferences}
        userEmail={userEmail}
      />
    );
  }

  const currency = dashboardData.preferences?.currency || 'USD';
  const monthlySalary = dashboardData.preferences?.monthlySalary || 0;
  const emergencyFundMonths = dashboardData.preferences?.emergencyFundMonths || 3;
  const emergencyFundSaved = dashboardData.preferences?.emergencyFundSaved || 0;

  return (
    <>
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-foreground">
              Dashboard
            </h1>
            <p className="text-sm lg:text-base text-foreground-muted">
              Welcome back, {userEmail.split('@')[0]}!
            </p>
          </div>

          {/* Dashboard Grid Layout */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Row 1 Left: Stacked Summary Widgets */}
            <div className="space-y-5">
              <ExpenseSummaryWidget
                totalExpenses={dashboardData.monthlyExpenses}
                budgetTotal={dashboardData.budgetTotal}
                currency={currency}
              />
              <EmergencyFundWidget
                currentSavings={emergencyFundSaved}
                monthlySalary={monthlySalary}
                emergencyFundMonths={emergencyFundMonths}
                currency={currency}
              />
            </div>

            {/* Row 1 Right: Expense Distribution Chart (spans 2 columns) */}
            <div className="lg:col-span-2 flex">
              <div className="flex-1">
                <ExpenseDistributionChart
                  data={dashboardData.expenseTypeData}
                  currency={currency}
                />
              </div>
            </div>

            {/* Row 2 Left: Monthly Comparison Chart (spans 2 columns) */}
            <div className="lg:col-span-2">
              <MonthlyComparisonChart
                data={dashboardData.monthlyComparison}
                currentYear={new Date().getFullYear()}
                currency={currency}
              />
            </div>

            {/* Row 2 Right: Recent Transactions */}
            <div className="lg:col-span-1">
              <RecentTransactionsPanel
                transactions={dashboardData.recentTransactions}
                currency={currency}
              />
            </div>
          </div>
        </div>
      </div>

      <PreferencesModal
        isOpen={showPreferencesModal}
        onSave={handleSavePreferences}
        userEmail={userEmail}
      />
    </>
  );
}
