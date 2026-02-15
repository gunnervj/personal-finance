'use client';

import { useEffect, useState } from 'react';
import { PreferencesModal } from '@/components/PreferencesModal';
import { preferencesApi, UserPreferences } from '@/lib/api/preferences';

interface DashboardClientProps {
  userEmail: string;
}

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPreferences();
  }, []);

  const checkPreferences = async () => {
    try {
      const prefs = await preferencesApi.getPreferences();
      if (prefs.isFirstTime) {
        setShowPreferencesModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (
    data: { currency: string; emergencyFundMonths: number; monthlySalary: number },
    avatarFile?: File
  ) => {
    // Upload avatar first if provided
    if (avatarFile) {
      await preferencesApi.uploadAvatar(avatarFile);
    }

    // Save preferences
    await preferencesApi.savePreferences(data);

    setShowPreferencesModal(false);
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

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Getting Started</h2>
              </div>
              <p className="text-sm text-foreground-muted leading-relaxed">
                Your dashboard is ready. Start by setting up your preferences and
                creating your first budget.
              </p>
            </div>

            <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Quick Stats</h2>
              </div>
              <p className="text-sm text-foreground-muted leading-relaxed">
                Track your financial progress at a glance with real-time statistics.
              </p>
            </div>

            <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              </div>
              <p className="text-sm text-foreground-muted leading-relaxed">
                View your latest transactions and budget updates.
              </p>
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
