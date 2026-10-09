/**
 * TerraTrust-AI — Typed Axios API Client with Contract Normalization
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { sessionManager } from '@/lib/auth/session';
import { normalizeApiError, NormalizedApiError } from '@/lib/errors/normalize-api-error';

export type { NormalizedApiError };

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth token, Scope, and Request ID
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const branchId = sessionManager.getScopeBranch();
    if (branchId) {
      config.headers['X-Branch-ID'] = branchId;
    }

    // Attach correlation Request ID
    if (!config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] = `req-${Math.random().toString(36).substring(2, 9)}`;
    }

    return config;
  },
  (error) => Promise.reject(normalizeApiError(error))
);

// Response Interceptor: Normalize envelopes between backend contracts and UI expectations
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const url = response.config.url || '';
    const data = response.data;

    if (data && typeof data === 'object') {
      // 1. Array responses
      if (Array.isArray(data)) {
        if (url.includes('/users')) {
          response.data = { users: data, total: data.length, items: data };
        } else if (url.includes('/branches')) {
          response.data = { branches: data, items: data };
        } else if (url.includes('/data-sources')) {
          response.data = { data_sources: data, items: data };
        } else if (url.includes('/scenarios')) {
          response.data = { scenarios: data, total: data.length, items: data };
        } else if (url.includes('/explanations')) {
          response.data = { explanations: data, items: data };
        }
      } else {
        // 2. Object responses with single-resource wrapping
        if (url.includes('/borrowers/') && !url.includes('/assessment-history')) {
          if (!data.borrower) {
            response.data = {
              borrower: data,
              ...data,
              farms: data.farms || [],
              loans: data.loans || [],
              crop_cycles: data.crop_cycles || [],
            };
          }
        } else if (url.includes('/farms/')) {
          if (!data.farm) {
            response.data = {
              farm: data,
              ...data,
              crop_cycles: data.crop_cycles || [],
            };
          }
        } else if (url.includes('/crop-cycles/') && !url.includes('/observations')) {
          if (!data.crop_cycle) {
            response.data = {
              crop_cycle: data,
              ...data,
              farm: data.farm || {},
              borrower: data.borrower || {},
              yield_prediction: data.yield_prediction || null,
              income_estimate: data.income_estimate || null,
            };
          }
        } else if (url.includes('/loan-applications/')) {
          if (!data.loan_application) {
            response.data = {
              loan_application: data,
              ...data,
            };
          }
        } else if (
          url.includes('/assessments/') &&
          !url.includes('/scenarios') &&
          !url.includes('/explanations') &&
          !url.includes('/reports') &&
          !url.includes('/dynamic-trigger')
        ) {
          if (!data.assessment) {
            response.data = {
              assessment: data,
              ...data,
            };
          }
        } else if (url.includes('/reports/')) {
          if (!data.report) {
            response.data = {
              report: data,
              ...data,
            };
          }
        } else if (url.includes('/institutions/current')) {
          if (!data.institution) {
            response.data = {
              institution: data,
              ...data,
            };
          }
        } else if (url.includes('/auth/me')) {
          if (!data.user) {
            response.data = {
              user: data,
              ...data,
            };
          }
        }
      }
    }

    return response;
  },
  (error) => {
    const normalized = normalizeApiError(error);
    return Promise.reject(normalized);
  }
);

export async function typedGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function typedPost<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function typedPatch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

export async function typedDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}
