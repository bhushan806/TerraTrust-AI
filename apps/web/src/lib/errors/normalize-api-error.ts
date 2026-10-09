/**
 * TerraTrust-AI — API Error Normalizer
 *
 * Normalizes Axios errors, network failures, and generic JS errors
 * into a standard NormalizedApiError envelope.
 */

import axios from 'axios';

export interface NormalizedApiError {
  status?: number;
  code: string;
  message: string;
  requestId?: string;
  retryable: boolean;
  providerFailure?: boolean;
  fieldErrors?: Record<string, string>;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      retryable: false,
    };
  }

  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      retryable: false,
    };
  }

  // Handle Axios errors
  if (axios.isAxiosError(error) || (typeof error === 'object' && (error as Record<string, unknown>).isAxiosError)) {
    const axiosErr = error as any;
    const response = axiosErr.response;
    const status = response?.status;
    const data = response?.data;
    const headers = response?.headers || {};

    const requestId =
      data?.error?.request_id ||
      data?.request_id ||
      headers['x-request-id'] ||
      undefined;

    // Timeout
    if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout')) {
      return {
        status,
        code: 'REQUEST_TIMEOUT',
        message: 'The request timed out. Please try again.',
        requestId,
        retryable: true,
      };
    }

    // Network / Disconnected (no response object)
    if (!response || axiosErr.code === 'ERR_NETWORK') {
      return {
        code: 'NETWORK_DISCONNECTED',
        message: 'Unable to connect to server. Please check your network connection.',
        retryable: true,
      };
    }

    // Extract message from standard envelope: { error: { message, code, details } }
    const envelopeError = data?.error;
    let message = envelopeError?.message || data?.message || data?.detail;
    let code = envelopeError?.code || data?.code;
    let fieldErrors: Record<string, string> | undefined;

    if (Array.isArray(envelopeError?.details)) {
      fieldErrors = {};
      envelopeError.details.forEach((d: any) => {
        if (d.field && d.message) {
          fieldErrors![d.field] = d.message;
        }
      });
    }

    switch (status) {
      case 400:
        return {
          status: 400,
          code: code || 'BAD_REQUEST',
          message: message || 'Invalid request parameters.',
          requestId,
          retryable: false,
          fieldErrors,
        };
      case 401:
        return {
          status: 401,
          code: 'UNAUTHENTICATED',
          message: message || 'Your session has expired. Please sign in again.',
          requestId,
          retryable: false,
        };
      case 403:
        return {
          status: 403,
          code: 'PERMISSION_DENIED',
          message: message || 'You do not have permission to perform this action.',
          requestId,
          retryable: false,
        };
      case 404:
        return {
          status: 404,
          code: 'NOT_FOUND',
          message: message || 'The requested resource could not be found.',
          requestId,
          retryable: false,
        };
      case 409:
        return {
          status: 409,
          code: code || 'CONFLICT',
          message: message || 'A conflict occurred with an existing resource.',
          requestId,
          retryable: false,
        };
      case 422:
        return {
          status: 422,
          code: code || 'VALIDATION_ERROR',
          message: message || 'Validation failed for submitted data.',
          requestId,
          retryable: false,
          fieldErrors,
        };
      case 429:
        return {
          status: 429,
          code: 'RATE_LIMITED',
          message: message || 'Rate limit exceeded. Please slow down and try again later.',
          requestId,
          retryable: true,
        };
      case 502:
        return {
          status: 502,
          code: 'PROVIDER_UNAVAILABLE',
          message: message || 'An upstream external data provider is unavailable.',
          requestId,
          retryable: true,
          providerFailure: true,
        };
      case 503:
        return {
          status: 503,
          code: code || 'SERVICE_UNAVAILABLE',
          message: message || 'Service temporarily unavailable. Please try again later.',
          requestId,
          retryable: true,
          providerFailure: true,
        };
      case 504:
        return {
          status: 504,
          code: code || 'GATEWAY_TIMEOUT',
          message: message || 'Upstream provider gateway timed out.',
          requestId,
          retryable: true,
          providerFailure: true,
        };
      case 500:
      default:
        return {
          status: status || 500,
          code: code || 'INTERNAL_SERVER_ERROR',
          message: message || 'An internal server error occurred.',
          requestId,
          retryable: true,
        };
    }
  }

  // Generic Native Error
  if (error instanceof Error) {
    return {
      code: 'GENERIC_ERROR',
      message: error.message || 'An unexpected error occurred.',
      retryable: false,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred.',
    retryable: false,
  };
}
