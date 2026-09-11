import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import type { ApiErrorBody, ErrorCode } from './api-types';

/**
 * The API response contract. Every route handler in `src/app/api` follows it.
 *
 *   success  →  the resource itself, no envelope        200 / 201
 *   failure  →  { error: { code, message } }            4xx / 5xx
 *
 * The status code already says which shape you got, so successful responses are
 * not wrapped — clients read the resource directly instead of unwrapping `.data`.
 *
 * Server-only. The browser half is `./api-client`.
 */

/** Throw one of these from a handler; `route()` turns it into the response. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 400 — the caller sent something wrong. The message is shown to the user. */
export const badRequest = (message: string) => new ApiError(400, 'VALIDATION_ERROR', message);
/** 404 — the row does not exist. */
export const notFound = (message: string) => new ApiError(404, 'NOT_FOUND', message);
/** 401 — not signed in, or not allowed to touch this row. */
export const unauthorized = (message = 'Not authenticated') =>
  new ApiError(401, 'UNAUTHORIZED', message);
/** 409 — the write conflicts with a row that already exists. */
export const conflict = (message: string) => new ApiError(409, 'CONFLICT', message);

/**
 * Prisma returns `Decimal` for NUMERIC columns, which JSON-stringifies to a
 * string and drops trailing zeros ("84.20" -> "84.2"). Convert to a number so
 * the wire shape matches the `Bill` / `CreditCard` types the client declares.
 * Dates are left alone — JSON.stringify already renders them as ISO strings.
 */
function jsonSafe(value: unknown): unknown {
  if (Prisma.Decimal.isDecimal(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value === null || value instanceof Date || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, jsonSafe(v)]),
  );
}

/** Success. Use 201 for a resource this request created. */
export function ok<T>(data: T, status: 200 | 201 = 200) {
  return NextResponse.json(jsonSafe(data), { status });
}

/** Read a required query-string parameter or fail with a 400. */
export function requireParam(request: Request, name: string): string {
  const value = new URL(request.url).searchParams.get(name);
  if (!value) throw badRequest(`${name} is required`);
  return value;
}

/** Read a required field from a parsed body or fail with a 400. */
export function requireField<T>(body: Record<string, unknown>, name: string): T {
  const value = body[name];
  if (value === undefined || value === null || value === '') {
    throw badRequest(`${name} is required`);
  }
  return value as T;
}

/**
 * Wraps a route handler so no handler needs its own try/catch.
 *
 * An `ApiError` becomes its declared status and message. A Prisma "record not
 * found" (P2025) becomes a 404. Anything else is a bug: it is logged in full
 * server-side and the client gets a generic 500, so stack traces, SQL, and
 * connection strings never leave the server.
 *
 *   export const GET = route('bills.GET', async (request) => { … })
 */
export function route<A extends unknown[]>(
  name: string,
  handler: (...args: A) => Promise<Response>,
) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) return errorResponse(err.status, err.code, err.message);

      // Prisma's constraint errors are caller mistakes, not server bugs.
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': // row to update/delete does not exist
            return errorResponse(404, 'NOT_FOUND', 'Not found');
          case 'P2003': // foreign key violation — e.g. a userId with no users row
            return errorResponse(400, 'VALIDATION_ERROR', 'Referenced record does not exist');
          case 'P2002': // unique violation
            return errorResponse(409, 'CONFLICT', 'That record already exists');
        }
      }

      console.error(`[api:${name}]`, err);
      return errorResponse(500, 'INTERNAL_ERROR', 'Something went wrong');
    }
  };
}

function errorResponse(status: number, code: ErrorCode, message: string) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status });
}

/**
 * Normalise a date field coming off a JSON body for a Prisma update.
 *
 *   undefined -> undefined  (field omitted: leave the column alone)
 *   null      -> null       (explicitly clear the column)
 *   string    -> Date
 */
export function optionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value as string);
}
