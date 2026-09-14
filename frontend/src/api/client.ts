import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiProblemDetails } from '@/types/auth';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let csrfTokenCache: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfTokenCache = token;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Request interceptor: inject CSRF token header on state-changing methods
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = csrfTokenCache || getCookie('XSRF-TOKEN');
    if (token) {
      config.headers['X-XSRF-TOKEN'] = token;
    }
  }
  return config;
});

// Response interceptor: extract user-friendly ProblemDetails messages
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiProblemDetails>) => {
    if (error.response?.data) {
      const problem = error.response.data;
      if (problem.errors && Object.keys(problem.errors).length > 0) {
        const validationMessages = Object.values(problem.errors).flat().join(' ');
        error.message = validationMessages || problem.detail || problem.title || error.message;
      } else if (problem.detail) {
        error.message = problem.detail;
      } else if (problem.title) {
        error.message = problem.title;
      }
    }
    return Promise.reject(error);
  }
);
