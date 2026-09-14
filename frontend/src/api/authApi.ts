import { apiClient, setCsrfToken } from './client';
import type { AuthResponse, CsrfTokenResponse } from '@/types/auth';

export const authApi = {
  getCsrfToken: async (): Promise<string> => {
    const response = await apiClient.get<CsrfTokenResponse>('/auth/csrf-token');
    setCsrfToken(response.data.csrfToken);
    return response.data.csrfToken;
  },

  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    try {
      await authApi.getCsrfToken();
    } catch {
      // ignore
    }
    return response.data;
  },

  refresh: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh');
    try {
      await authApi.getCsrfToken();
    } catch {
      // ignore
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setCsrfToken(null);
      if (typeof document !== 'undefined') {
        document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/;';
      }
    }
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiClient.get<AuthResponse>('/auth/me');
    return response.data;
  }
};
