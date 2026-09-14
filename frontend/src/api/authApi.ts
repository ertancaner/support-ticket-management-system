import { apiClient, setCsrfToken } from './client';
import type { AuthResponse, CsrfTokenResponse } from '@/types/auth';

export const authApi = {
  getCsrfToken: async (): Promise<string> => {
    const response = await apiClient.get<CsrfTokenResponse>('/auth/csrf-token');
    setCsrfToken(response.data.csrfToken);
    return response.data.csrfToken;
  },

  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    // Fetch CSRF token before login request
    await authApi.getCsrfToken();
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  refresh: async (): Promise<AuthResponse> => {
    await authApi.getCsrfToken();
    const response = await apiClient.post<AuthResponse>('/auth/refresh');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await authApi.getCsrfToken();
    await apiClient.post('/auth/logout');
    setCsrfToken(null);
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiClient.get<AuthResponse>('/auth/me');
    return response.data;
  }
};
