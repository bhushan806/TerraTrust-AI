/**
 * TerraTrust-AI — Error Normalization Unit Tests
 *
 * Tests for the normalizeApiError function which maps
 * Axios errors, network failures, and unknown errors into
 * a standardized NormalizedApiError envelope.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeApiError, NormalizedApiError } from '@/lib/errors/normalize-api-error';
import axios from 'axios';

/* ── Helper to create a mock AxiosError ─────────────────── */
function makeAxiosError(
  status?: number,
  data?: object,
  code?: string,
  headers?: Record<string, string>
): ReturnType<typeof axios.isAxiosError> extends never ? never : unknown {
  const error: Record<string, unknown> = {
    isAxiosError: true,
    name: 'AxiosError',
    message: code === 'ECONNABORTED' ? 'timeout of 30000ms exceeded' : `Request failed with status code ${status}`,
    code,
    response: status != null
      ? {
          status,
          data: data ?? {},
          headers: headers ?? {},
        }
      : undefined,
    config: {},
    request: {},
  };
  return error;
}

/* ─────────────────────────────────────────────
   Null / Undefined errors
───────────────────────────────────────────── */
describe('normalizeApiError — null/undefined', () => {
  it('handles null error gracefully', () => {
    const result = normalizeApiError(null);
    expect(result.message).toBeTruthy();
    expect(result.retryable).toBe(false);
  });

  it('handles undefined error gracefully', () => {
    const result = normalizeApiError(undefined);
    expect(result.message).toBeTruthy();
    expect(result.retryable).toBe(false);
  });
});

/* ─────────────────────────────────────────────
   Native Error objects
───────────────────────────────────────────── */
describe('normalizeApiError — native Error', () => {
  it('extracts message from Error instance', () => {
    const err = new Error('Something broke internally');
    const result = normalizeApiError(err);
    expect(result.message).toContain('Something broke internally');
    expect(result.retryable).toBe(false);
  });

  it('handles Error with empty message', () => {
    const err = new Error('');
    const result = normalizeApiError(err);
    expect(result.message).toBeTruthy();
  });
});

/* ─────────────────────────────────────────────
   String errors
───────────────────────────────────────────── */
describe('normalizeApiError — string errors', () => {
  it('converts plain string to message', () => {
    const result = normalizeApiError('Custom error string');
    expect(result.message).toBe('Custom error string');
    expect(result.retryable).toBe(false);
  });
});

/* ─────────────────────────────────────────────
   Axios Errors — HTTP Status Codes
───────────────────────────────────────────── */
describe('normalizeApiError — AxiosError HTTP status codes', () => {
  beforeEach(() => {
    // Mock axios.isAxiosError to return true for our fake errors
    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (err: unknown) => !!(err as Record<string, unknown>)?.isAxiosError
    );
  });

  it('handles 400 Bad Request', () => {
    const err = makeAxiosError(400, {
      error: { message: 'Loan amount is required', code: 'VALIDATION_FAILED' },
    });
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(400);
    expect(result.retryable).toBe(false);
    expect(result.message).toContain('Loan amount is required');
  });

  it('handles 400 with field errors', () => {
    const err = makeAxiosError(400, {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_FAILED',
        details: [
          { field: 'loan_amount_inr', message: 'Must be a positive number' },
          { field: 'tenor_months', message: 'Must be between 1 and 360' },
        ],
      },
    });
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(400);
    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors?.['loan_amount_inr']).toContain('Must be a positive number');
    expect(result.fieldErrors?.['tenor_months']).toContain('Must be between 1 and 360');
  });

  it('handles 401 Unauthorized', () => {
    const err = makeAxiosError(401, {});
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(401);
    expect(result.code).toBe('UNAUTHENTICATED');
    expect(result.retryable).toBe(false);
    expect(result.message).toMatch(/session has expired|sign in/i);
  });

  it('handles 403 Forbidden', () => {
    const err = makeAxiosError(403, {});
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(403);
    expect(result.code).toBe('PERMISSION_DENIED');
    expect(result.retryable).toBe(false);
    expect(result.message).toMatch(/permission/i);
  });

  it('handles 404 Not Found', () => {
    const err = makeAxiosError(404, {
      error: { message: 'Borrower brw-999 not found' },
    });
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(404);
    expect(result.code).toBe('NOT_FOUND');
    expect(result.retryable).toBe(false);
    expect(result.message).toContain('brw-999 not found');
  });

  it('handles 404 with default message when envelope is empty', () => {
    const err = makeAxiosError(404, {});
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(404);
    expect(result.message).toMatch(/could not be found/i);
  });

  it('handles 409 Conflict', () => {
    const err = makeAxiosError(409, {
      error: { message: 'Assessment already exists for this loan application' },
    });
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(409);
    expect(result.code).toBe('CONFLICT');
    expect(result.retryable).toBe(false);
  });

  it('handles 422 Unprocessable Entity', () => {
    const err = makeAxiosError(422, {
      error: {
        message: 'Crop cycle does not belong to this borrower',
        code: 'VALIDATION_ERROR',
      },
    });
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(422);
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.retryable).toBe(false);
  });

  it('handles 429 Rate Limited', () => {
    const err = makeAxiosError(429, {});
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(429);
    expect(result.code).toBe('RATE_LIMITED');
    expect(result.retryable).toBe(true);
  });

  it('handles 500 Internal Server Error', () => {
    const err = makeAxiosError(500, {});
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(500);
    expect(result.retryable).toBe(true);
  });

  it('handles 502 Bad Gateway (provider failure)', () => {
    const err = makeAxiosError(502, {});
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(502);
    expect(result.code).toBe('PROVIDER_UNAVAILABLE');
    expect(result.retryable).toBe(true);
    expect(result.providerFailure).toBe(true);
  });

  it('handles 503 Service Unavailable (provider failure)', () => {
    const err = makeAxiosError(503, {});
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(503);
    expect(result.providerFailure).toBe(true);
    expect(result.retryable).toBe(true);
  });

  it('handles 504 Gateway Timeout (provider failure)', () => {
    const err = makeAxiosError(504, {});
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.status).toBe(504);
    expect(result.providerFailure).toBe(true);
    expect(result.retryable).toBe(true);
  });
});

/* ─────────────────────────────────────────────
   Axios Network Errors
───────────────────────────────────────────── */
describe('normalizeApiError — network/timeout', () => {
  beforeEach(() => {
    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (err: unknown) => !!(err as Record<string, unknown>)?.isAxiosError
    );
  });

  it('handles ECONNABORTED (timeout)', () => {
    const err = makeAxiosError(undefined, undefined, 'ECONNABORTED');
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.code).toBe('REQUEST_TIMEOUT');
    expect(result.retryable).toBe(true);
    expect(result.message).toMatch(/timed out/i);
  });

  it('handles network disconnected (no response)', () => {
    const errNoResponse: Record<string, unknown> = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Network Error',
      code: 'ERR_NETWORK',
      response: undefined, // no response = no internet
      config: {},
    };
    const result = normalizeApiError(errNoResponse) as NormalizedApiError;
    expect(result.code).toBe('NETWORK_DISCONNECTED');
    expect(result.retryable).toBe(true);
    expect(result.message).toMatch(/connect/i);
  });
});

/* ─────────────────────────────────────────────
   requestId extraction
───────────────────────────────────────────── */
describe('normalizeApiError — requestId extraction', () => {
  beforeEach(() => {
    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (err: unknown) => !!(err as Record<string, unknown>)?.isAxiosError
    );
  });

  it('extracts requestId from response envelope', () => {
    const err = makeAxiosError(400, {
      error: { message: 'Bad request', code: 'VALIDATION_FAILED', request_id: 'req-abc-123' },
    });
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.requestId).toBe('req-abc-123');
  });

  it('extracts requestId from x-request-id header when not in envelope', () => {
    const err = makeAxiosError(404, {}, undefined, { 'x-request-id': 'hdr-req-456' });
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.requestId).toBe('hdr-req-456');
  });

  it('requestId is undefined when not present in envelope or headers', () => {
    const err = makeAxiosError(400, { error: { message: 'Oops' } });
    const result = normalizeApiError(err) as NormalizedApiError;
    expect(result.requestId).toBeUndefined();
  });
});
