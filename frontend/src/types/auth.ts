export type UserRole = 'Admin' | 'User';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface AuthResponse {
  id: string;
  username: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export interface CsrfTokenResponse {
  csrfToken: string;
}

export interface ApiProblemDetails {
  status: number;
  title: string;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}
