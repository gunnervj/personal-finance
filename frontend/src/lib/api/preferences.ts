import { apiClient } from '../api-client';

export interface UserPreferences {
  id: string;
  email: string;
  currency: string;
  emergencyFundMonths: number;
  monthlySalary: number;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isFirstTime: boolean;
}

export interface PreferencesRequest {
  currency: string;
  emergencyFundMonths: number;
  monthlySalary: number;
}

export const preferencesApi = {
  async getPreferences(): Promise<UserPreferences> {
    return apiClient.get<UserPreferences>('user', '/api/v1/users/preferences');
  },

  async savePreferences(data: PreferencesRequest): Promise<UserPreferences> {
    return apiClient.post<UserPreferences>('user', '/api/v1/users/preferences', data);
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/avatar/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Failed to upload avatar');
    }

    return res.json();
  },
};
