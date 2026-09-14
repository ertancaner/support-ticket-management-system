import { apiClient } from './client';
import type { User } from '@/types/auth';

export interface CreateUserRequest {
  username: string;
  temporaryPassword: string;
  role: 'Admin' | 'User';
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface ResetPasswordRequest {
  newTemporaryPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  createUser: async (dto: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users', dto);
    return response.data;
  },

  updateStatus: async (id: string, dto: UpdateUserStatusRequest): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}/status`, dto);
    return response.data;
  },

  resetPassword: async (id: string, dto: ResetPasswordRequest): Promise<void> => {
    await apiClient.post(`/users/${id}/reset-password`, dto);
  },

  changePassword: async (dto: ChangePasswordRequest): Promise<void> => {
    await apiClient.post('/users/change-password', dto);
  }
};
