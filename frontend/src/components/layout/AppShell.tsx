"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { PreferencesModal } from "../PreferencesModal";
import { preferencesApi, UserPreferences } from "@/lib/api/preferences";
import { useToast } from "../ui/Toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [currentPreferences, setCurrentPreferences] = useState<UserPreferences | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const { showSuccess, showError } = useToast();

  // Load preferences when modal is opened
  useEffect(() => {
    if (showPreferencesModal && !loadingPreferences) {
      loadCurrentPreferences();
    }
  }, [showPreferencesModal]);

  const loadCurrentPreferences = async () => {
    setLoadingPreferences(true);
    try {
      const [prefs, avatar] = await Promise.all([
        preferencesApi.getPreferences(),
        preferencesApi.getAvatarUrl(),
      ]);
      setCurrentPreferences(prefs);
      setAvatarUrl(avatar);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  // Don't show app shell on login and home pages
  const isAuthPage = pathname === "/login" || pathname === "/";

  if (isAuthPage || !session) {
    return <>{children}</>;
  }

  const handleSavePreferences = async (
    data: { currency: string; emergencyFundMonths: number; monthlySalary: number; emergencyFundSaved: number },
    avatarFile?: File
  ) => {
    try {
      console.log('Saving preferences:', data);

      // Upload avatar first if provided
      if (avatarFile) {
        await preferencesApi.uploadAvatar(avatarFile);
      }

      // Save preferences
      const savedPrefs = await preferencesApi.savePreferences(data);
      console.log('Preferences saved successfully:', savedPrefs);

      showSuccess('Preferences updated successfully! Reloading...');
      setShowPreferencesModal(false);

      // Wait a moment for the toast to show and save to complete, then reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      showError(error instanceof Error ? error.message : 'Failed to save preferences');
      throw error; // Re-throw so PreferencesModal can handle it
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          onPreferencesClick={() => setShowPreferencesModal(true)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Preferences Modal */}
      {showPreferencesModal && !loadingPreferences && (
        <PreferencesModal
          isOpen={showPreferencesModal}
          onClose={() => setShowPreferencesModal(false)}
          onSave={handleSavePreferences}
          userEmail={session.user?.email || ''}
          initialValues={currentPreferences ? {
            currency: currentPreferences.currency,
            emergencyFundMonths: currentPreferences.emergencyFundMonths,
            monthlySalary: currentPreferences.monthlySalary,
            emergencyFundSaved: currentPreferences.emergencyFundSaved || 0,
          } : undefined}
          currentAvatarUrl={avatarUrl}
        />
      )}
    </div>
  );
}
