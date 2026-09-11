import type { ApiErrorBody } from './api-types';

/**
 * Client half of the API contract in `./api`.
 *
 * A non-2xx response carries `{ error: { code, message } }`; this surfaces that
 * message so the UI can show what actually went wrong instead of a generic
 * "Failed to fetch". Only feature hook modules should call these.
 */
export class ApiClientError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    let code = 'INTERNAL_ERROR';
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as ApiErrorBody;
      if (body?.error?.message) {
        code = body.error.code;
        message = body.error.message;
      }
    } catch {
      // non-JSON error body (proxy, crash page) — keep the status-based message
    }
    throw new ApiClientError(res.status, code, message);
  }

  return res.json() as Promise<T>;
}

const withBody = <T>(method: string) => (url: string, body: unknown) =>
  apiFetch<T>(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const apiGet = <T>(url: string) => apiFetch<T>(url);
export const apiPost = <T>(url: string, body: unknown) => withBody<T>('POST')(url, body);
export const apiPut = <T>(url: string, body: unknown) => withBody<T>('PUT')(url, body);
export const apiDelete = <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' });
