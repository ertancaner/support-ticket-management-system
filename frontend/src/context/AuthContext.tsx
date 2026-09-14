import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';
import { registerSessionExpiredHandler } from '@/api/client';
import type { User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const checkAuth = useCallback(async () => {
    try {
      // First try to fetch current user using existing access_token cookie
      const authUser = await authApi.getCurrentUser();
      setUser({
        id: authUser.id,
        username: authUser.username,
        role: authUser.role,
        isActive: true,
        mustChangePassword: authUser.mustChangePassword
      });
    } catch {
      // If access_token is expired or absent, attempt silent refresh
      try {
        const refreshed = await authApi.refresh();
        setUser({
          id: refreshed.id,
          username: refreshed.username,
          role: refreshed.role,
          isActive: true,
          mustChangePassword: refreshed.mustChangePassword
        });
      } catch {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Register global 401 unrecoverable session expiry callback
    registerSessionExpiredHandler(() => {
      setUser(null);
      queryClient.clear();
    });

    checkAuth();
  }, [checkAuth, queryClient]);

  const login = async (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const authUser = await authApi.login(credentials);
      setUser({
        id: authUser.id,
        username: authUser.username,
        role: authUser.role,
        isActive: true,
        mustChangePassword: authUser.mustChangePassword
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Even if network fails, proceed with local logout
    } finally {
      setUser(null);
      queryClient.clear();
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isLoading,
    login,
    logout,
    refreshAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
