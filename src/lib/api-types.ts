/**
 * The error half of the API contract, shared by the server (`./api`) and the
 * browser (`./api-client`).
 *
 * It lives in its own dependency-free file so the client never transitively
 * imports Prisma.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string };
}
