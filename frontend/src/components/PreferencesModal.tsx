'use client';

import React, { useState } from 'react';
import { Modal, Input, Select, Button, Avatar } from './ui';
import { Upload, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface PreferencesFormData {
  currency: string;
  emergencyFundMonths: number;
  monthlySalary: number;
}

interface PreferencesModalProps {
  isOpen: boolean;
  onSave: (data: PreferencesFormData, avatarFile?: File) => Promise<void>;
  userEmail: string;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onSave,
  userEmail
}) => {
  const userName = userEmail.split('@')[0];
  const [formData, setFormData] = useState<PreferencesFormData>({
    currency: 'USD',
    emergencyFundMonths: 3,
    monthlySalary: 0,
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<PreferencesFormData>>({});
  const [loading, setLoading] = useState(false);

  const emergencyFundOptions = [
    { value: '1', label: '1 month' },
    { value: '2', label: '2 months' },
    { value: '3', label: '3 months (Recommended)' },
    { value: '4', label: '4 months' },
    { value: '5', label: '5 months' },
    { value: '6', label: '6 months' },
    { value: '12', label: '12 months' },
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<PreferencesFormData> = {};

    if (formData.monthlySalary <= 0) {
      newErrors.monthlySalary = 0;
    }

    if (formData.emergencyFundMonths < 1 || formData.emergencyFundMonths > 24) {
      newErrors.emergencyFundMonths = 0;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData, avatarFile || undefined);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Welcome! Let's set up your account" canClose={false}>
      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-300 mb-2">
          👋 Welcome, {userName}!
        </h3>
        <p className="text-sm text-gray-300">
          Let's get your account set up with a few quick preferences. This will help us
          personalize your financial management experience.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar src={avatarPreview} name={userEmail} size="lg" />
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload Avatar</span>
            </div>
          </label>
        </div>

        <Select
          label="Currency"
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          options={[{ value: 'USD', label: 'USD ($)' }]}
        />

        <Select
          label="Emergency Fund Target"
          value={formData.emergencyFundMonths.toString()}
          onChange={(e) =>
            setFormData({ ...formData, emergencyFundMonths: parseInt(e.target.value) })
          }
          options={emergencyFundOptions}
        />

        <Input
          label="After-Tax Monthly Salary"
          type="number"
          step="0.01"
          min="0"
          value={formData.monthlySalary}
          onChange={(e) =>
            setFormData({ ...formData, monthlySalary: parseFloat(e.target.value) || 0 })
          }
          error={errors.monthlySalary !== undefined ? 'Monthly salary must be greater than 0' : undefined}
          required
        />

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            💡 You can update these preferences anytime from your profile settings.
          </p>
        </div>

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Saving...' : 'Get Started'}
        </Button>

        <button
          type="button"
          onClick={() => {
            // Clear local storage and session storage
            localStorage.clear();
            sessionStorage.clear();
            // Sign out from NextAuth and Keycloak
            signOut({ callbackUrl: '/login' });
          }}
          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out and start fresh
        </button>
      </form>
    </Modal>
  );
};
