'use client';

import { useEffect, useState, useCallback } from 'react';
import { PreferencesModal } from '@/components/PreferencesModal';
import { preferencesApi, UserPreferences } from '@/lib/api/preferences';
import { budgetApi, Budget, expenseTypeApi, ExpenseType } from '@/lib/api/budget';
import { transactionApi } from '@/lib/api/transaction';
import { ExpenseSummaryWidget } from '@/components/dashboard/ExpenseSummaryWidget';
import { EmergencyFundWidget } from '@/components/dashboard/EmergencyFundWidget';
import { ExpenseDistributionChart } from '@/components/dashboard/ExpenseDistributionChart';
import { MonthlyComparisonChart } from '@/components/dashboard/MonthlyComparisonChart';
import { RecentTransactionsPanel } from '@/components/dashboard/RecentTransactionsPanel';
import { BurnRateWidget, BurnRateItem } from '@/components/dashboard/BurnRateWidget';
import { AccumulationWidget, AccumulationItem } from '@/components/dashboard/AccumulationWidget';

interface DashboardClientProps {
  userEmail: string;
}

interface DashboardData {
  preferences: UserPreferences | null;
  budget: Budget | null;
  expenseTypes: ExpenseType[];
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
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Expense Distribution state
  const [distributionMonth, setDistributionMonth] = useState(currentMonth);
  const [distributionYear, setDistributionYear] = useState(currentYear);
  const [distributionData, setDistributionData] = useState<Array<{ name: string; amount: number; color: string }>>([]);

  // Burn Rate state
  const [burnRateMonth, setBurnRateMonth] = useState(currentMonth);
  const [burnRateYear, setBurnRateYear] = useState(currentYear);
  const [burnRateItems, setBurnRateItems] = useState<BurnRateItem[]>([]);

  // Accumulation state
  const [accumulationMonth, setAccumulationMonth] = useState(currentMonth);
  const [accumulationYear, setAccumulationYear] = useState(currentYear);
  const [accumulationItems, setAccumulationItems] = useState<AccumulationItem[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const prefs = await preferencesApi.getPreferences();
      if (prefs.isFirstTime) {
        setShowPreferencesModal(true);
        setLoading(false);
        return;
      }

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
          color: '',
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

      const data: DashboardData = {
        preferences: prefs,
        budget,
        expenseTypes,
        monthlyExpenses: monthlySummary.totalExpenses,
        budgetTotal,
        expenseTypeData,
        monthlyComparison,
        recentTransactions: formattedTransactions,
      };

      setDashboardData(data);
      setDistributionData(expenseTypeData);

      // Compute initial burn rate and accumulation for current month
      if (budget) {
        computeBurnRateItems(budget, expenseTypes, expenseTypeSummary, currentMonth);
        computeAccumulationItems(budget, expenseTypes, currentYear, currentMonth);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setShowPreferencesModal(true);
    } finally {
      setLoading(false);
    }
  };

  // ---- Expense Distribution Navigation ----
  const fetchDistributionData = useCallback(async (year: number, month: number) => {
    try {
      const [expenseTypes, summary] = await Promise.all([
        expenseTypeApi.list().catch(() => []),
        transactionApi.getExpenseTypeSummary(year, month).catch(() => []),
      ]);
      const data = summary.map((item: any) => {
        const et = expenseTypes.find((e: ExpenseType) => e.id === item.expenseTypeId);
        return { name: et?.name || 'Unknown', amount: item.totalAmount, color: '' };
      });
      setDistributionData(data);
    } catch (err) {
      console.error('Failed to fetch distribution data:', err);
    }
  }, []);

  useEffect(() => {
    if (dashboardData) {
      fetchDistributionData(distributionYear, distributionMonth);
    }
  }, [distributionMonth, distributionYear, dashboardData, fetchDistributionData]);

  const handleDistributionPrevMonth = () => {
    if (distributionMonth === 1) {
      setDistributionMonth(12);
      setDistributionYear(y => y - 1);
    } else {
      setDistributionMonth(m => m - 1);
    }
  };

  const handleDistributionNextMonth = () => {
    if (distributionYear === currentYear && distributionMonth === currentMonth) return;
    if (distributionMonth === 12) {
      setDistributionMonth(1);
      setDistributionYear(y => y + 1);
    } else {
      setDistributionMonth(m => m + 1);
    }
  };

  // ---- Burn Rate ----
  const computeBurnRateItems = (
    budget: Budget,
    expenseTypes: ExpenseType[],
    spendingByType: any[],
    month: number
  ) => {
    const applicable = budget.items.filter(
      item => !item.isOneTime || item.applicableMonth === month
    );
    const items: BurnRateItem[] = applicable.map(item => {
      const spent = spendingByType.find((s: any) => s.expenseTypeId === item.expenseType.id)?.totalAmount || 0;
      const pct = item.amount > 0 ? (spent / item.amount) * 100 : 0;
      return {
        expenseTypeId: item.expenseType.id,
        name: item.expenseType.name,
        icon: item.expenseType.icon,
        budgetAmount: item.amount,
        spentAmount: spent,
        burnPercentage: pct,
      };
    }).sort((a, b) => b.burnPercentage - a.burnPercentage);
    setBurnRateItems(items);
  };

  const fetchBurnRateData = useCallback(async (year: number, month: number) => {
    if (!dashboardData?.budget) return;
    try {
      const spendingByType = await transactionApi.getExpenseTypeSummary(year, month).catch(() => []);
      computeBurnRateItems(dashboardData.budget, dashboardData.expenseTypes, spendingByType, month);
    } catch (err) {
      console.error('Failed to fetch burn rate data:', err);
    }
  }, [dashboardData]);

  useEffect(() => {
    if (dashboardData?.budget) {
      fetchBurnRateData(burnRateYear, burnRateMonth);
    }
  }, [burnRateMonth, burnRateYear, dashboardData, fetchBurnRateData]);

  const handleBurnRatePrevMonth = () => {
    if (burnRateMonth === 1) {
      setBurnRateMonth(12);
      setBurnRateYear(y => y - 1);
    } else {
      setBurnRateMonth(m => m - 1);
    }
  };

  const handleBurnRateNextMonth = () => {
    if (burnRateYear === currentYear && burnRateMonth === currentMonth) return;
    if (burnRateMonth === 12) {
      setBurnRateMonth(1);
      setBurnRateYear(y => y + 1);
    } else {
      setBurnRateMonth(m => m + 1);
    }
  };

  // ---- Accumulation ----
  const computeAccumulationItems = useCallback(async (
    budget: Budget,
    expenseTypes: ExpenseType[],
    year: number,
    targetMonth: number
  ) => {
    const accumulatingItems = budget.items.filter(
      item => item.expenseType.accumulate && !item.isOneTime
    );
    if (accumulatingItems.length === 0) {
      setAccumulationItems([]);
      return;
    }

    try {
      const monthsToFetch = Array.from({ length: targetMonth }, (_, i) => i + 1);
      const spendingByMonth = await Promise.all(
        monthsToFetch.map(m => transactionApi.getExpenseTypeSummary(year, m).catch(() => []))
      );

      const items: AccumulationItem[] = accumulatingItems.map(budgetItem => {
        let accumulated = 0;
        // Carry forward unspent from previous months
        for (let i = 0; i < targetMonth - 1; i++) {
          const monthSpending = spendingByMonth[i];
          const spent = monthSpending.find((s: any) => s.expenseTypeId === budgetItem.expenseType.id)?.totalAmount || 0;
          const unspent = budgetItem.amount - spent;
          if (unspent > 0) accumulated += unspent;
        }
        // Add current month's budget
        accumulated += budgetItem.amount;
        // Subtract current month's spending
        const currentSpending = spendingByMonth[targetMonth - 1];
        const spentThisMonth = currentSpending.find((s: any) => s.expenseTypeId === budgetItem.expenseType.id)?.totalAmount || 0;

        return {
          expenseTypeId: budgetItem.expenseType.id,
          name: budgetItem.expenseType.name,
          icon: budgetItem.expenseType.icon,
          monthlyBudget: budgetItem.amount,
          accumulatedAmount: accumulated,
          spentThisMonth,
          remaining: accumulated - spentThisMonth,
        };
      });

      setAccumulationItems(items);
    } catch (err) {
      console.error('Failed to compute accumulation:', err);
    }
  }, []);

  useEffect(() => {
    if (dashboardData?.budget) {
      computeAccumulationItems(
        dashboardData.budget,
        dashboardData.expenseTypes,
        accumulationYear,
        accumulationMonth
      );
    }
  }, [accumulationMonth, accumulationYear, dashboardData, computeAccumulationItems]);

  const handleAccumulationPrevMonth = () => {
    if (accumulationMonth === 1) {
      setAccumulationMonth(12);
      setAccumulationYear(y => y - 1);
    } else {
      setAccumulationMonth(m => m - 1);
    }
  };

  const handleAccumulationNextMonth = () => {
    if (accumulationYear === currentYear && accumulationMonth === currentMonth) return;
    if (accumulationMonth === 12) {
      setAccumulationMonth(1);
      setAccumulationYear(y => y + 1);
    } else {
      setAccumulationMonth(m => m + 1);
    }
  };

  // ---- Preferences Save ----
  const handleSavePreferences = async (
    data: { currency: string; emergencyFundMonths: number; monthlySalary: number; emergencyFundSaved: number },
    avatarFile?: File
  ) => {
    try {
      if (avatarFile) {
        await preferencesApi.uploadAvatar(avatarFile);
      }
      await preferencesApi.savePreferences(data);
      setShowPreferencesModal(false);
      loadDashboard();
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
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
                  data={distributionData}
                  currency={currency}
                  month={distributionMonth}
                  year={distributionYear}
                  onPrevMonth={handleDistributionPrevMonth}
                  onNextMonth={handleDistributionNextMonth}
                />
              </div>
            </div>

            {/* Row 2 Left: Monthly Comparison Chart (spans 2 columns) */}
            <div className="lg:col-span-2">
              <MonthlyComparisonChart
                data={dashboardData.monthlyComparison}
                currentYear={currentYear}
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

            {/* Row 3: Burn Rate Widget (full width) */}
            <div className="lg:col-span-3">
              <BurnRateWidget
                items={burnRateItems}
                month={burnRateMonth}
                year={burnRateYear}
                currency={currency}
                onPrevMonth={handleBurnRatePrevMonth}
                onNextMonth={handleBurnRateNextMonth}
              />
            </div>

            {/* Row 4: Accumulation Widget (full width) */}
            <div className="lg:col-span-3">
              <AccumulationWidget
                items={accumulationItems}
                month={accumulationMonth}
                year={accumulationYear}
                currency={currency}
                onPrevMonth={handleAccumulationPrevMonth}
                onNextMonth={handleAccumulationNextMonth}
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
