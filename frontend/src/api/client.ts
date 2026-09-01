import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Fallback default strictly points to local backend
export const DEFAULT_API_URL = 'http://localhost:8000';
export const STORAGE_KEY_TOKEN = 'itsm_access_token';
export const STORAGE_KEY_API_URL = 'itsm_api_url';
export const STORAGE_KEY_USER = 'itsm_user';

export function getStoredApiUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_API_URL;

  // 1. Read Environment Variable first
  const envUrl =
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? ((import.meta as any).env.VITE_API_BASE_URL || (import.meta as any).env.VITE_API_URL)
      : undefined;

  if (envUrl) return envUrl.trim().replace(/\/+$/, '');

  const currentHostname = window.location.hostname;

  // 2. Only append port 8000 if running on local IP / LAN development
  if (
    currentHostname !== 'localhost' &&
    currentHostname !== '127.0.0.1' &&
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(currentHostname)
  ) {
    return `http://${currentHostname}:8000`;
  }

  // 3. Check local storage
  const storedUrl = localStorage.getItem(STORAGE_KEY_API_URL);

  return storedUrl || DEFAULT_API_URL;
}

export function setStoredApiUrl(url: string): void {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY_API_URL, cleanUrl || DEFAULT_API_URL);
  apiClient.defaults.baseURL = cleanUrl || DEFAULT_API_URL;
}

export const apiClient = axios.create({
  baseURL: getStoredApiUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic Request Interceptor: Ensures current API URL and Bearer token are attached
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getStoredApiUrl();
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unified Error Handling Types & Helper
export interface ApiErrorDetail {
  message: string;
  statusCode?: number;
  validationErrors?: Array<{ loc?: string[]; msg?: string; type?: string }>;
  isNetworkError?: boolean;
}

export function parseApiError(error: unknown): ApiErrorDetail {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    if (!axiosError.response) {
      return {
        message:
          'Cannot connect to FastAPI backend at ' +
          (axiosError.config?.baseURL || getStoredApiUrl()) +
          '. Make sure the backend server is running and CORS is enabled.',
        isNetworkError: true,
      };
    }

    const status = axiosError.response.status;
    const data = axiosError.response.data;
    const isLoginEndpoint = axiosError.config?.url?.includes('/auth/login');

    if (status === 401) {
      const defaultMsg = isLoginEndpoint
        ? 'Invalid email or password.'
        : 'Session expired or invalid credentials. Please log in again.';

      return {
        message: typeof data?.detail === 'string' ? data.detail : defaultMsg,
        statusCode: 401,
      };
    }

    if (status === 403) {
      return {
        message: data?.detail || 'You do not have permission to perform this action.',
        statusCode: 403,
      };
    }

    if (status === 404) {
      return {
        message: data?.detail || 'Requested resource was not found.',
        statusCode: 404,
      };
    }

    if (status === 422) {
      let validationMsg = 'Validation error.';
      if (Array.isArray(data?.detail)) {
        validationMsg = data.detail.map((d: any) => `${d.loc?.join('.') || 'Field'}: ${d.msg}`).join(', ');
      } else if (typeof data?.detail === 'string') {
        validationMsg = data.detail;
      }
      return {
        message: validationMsg,
        statusCode: 422,
        validationErrors: Array.isArray(data?.detail) ? data.detail : undefined,
      };
    }

    if (status >= 500) {
      return {
        message: data?.detail || 'Internal server error occurred on the backend.',
        statusCode: status,
      };
    }

    if (data?.detail) {
      return {
        message: typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail),
        statusCode: status,
      };
    }

    return {
      message: axiosError.message || `Request failed with status code ${status}`,
      statusCode: status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'An unexpected error occurred.' };
}

// Response Interceptor: Prevents unwanted global logout redirects during notification polling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    
    // Matched across all /notifications routes (e.g., /notifications/ and /notifications/count)
    const isBackgroundPoll = url.includes('/notifications');

    if (axios.isAxiosError(error) && error.response?.status === 401 && !isAuthEndpoint && !isBackgroundPoll) {
      window.dispatchEvent(new CustomEvent('itsm:unauthorized'));
    }
    return Promise.reject(error);
  }
);