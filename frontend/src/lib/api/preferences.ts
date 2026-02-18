import { apiClient } from '../api-client';

export interface UserPreferences {
  id: string;
  email: string;
  currency: string;
  emergencyFundMonths: number;
  monthlySalary: number;
  emergencyFundSaved: number;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isFirstTime: boolean;
}

export interface PreferencesRequest {
  currency: string;
  emergencyFundMonths: number;
  monthlySalary: number;
  emergencyFundSaved?: number;
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

  async getAvatarUrl(): Promise<string | null> {
    try {
      const response = await fetch('/api/avatar', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch avatar:', error);
      return null;
    }
  },
};
