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

interface RetryQueueItem {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
  config: InternalAxiosRequestConfig;
}

let isRefreshing = false;
let failedQueue: RetryQueueItem[] = [];
let sessionExpiredHandler: (() => void) | null = null;

export function registerSessionExpiredHandler(handler: () => void) {
  sessionExpiredHandler = handler;
}

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(apiClient(prom.config));
    }
  });
  failedQueue = [];
};

// Response interceptor: handle 401 silent refresh & extract user-friendly ProblemDetails messages
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiProblemDetails>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Check if error is 401 and request can be retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/csrf-token')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent refresh
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (sessionExpiredHandler) {
          sessionExpiredHandler();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

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
