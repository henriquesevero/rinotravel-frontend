import type { components } from './schema';

export type ErrorCode = components['schemas']['ErrorCode'];

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  /** Stable machine-readable code; `unknown` when the body is not a problem document. */
  readonly code: ErrorCode | 'unknown';
  readonly detail: string;
  readonly requestId: string | undefined;
  readonly fieldErrors: FieldError[];
  readonly retryAfterSeconds: number | undefined;

  constructor(init: {
    status: number;
    code: ErrorCode | 'unknown';
    detail: string;
    requestId?: string | undefined;
    fieldErrors?: FieldError[];
    retryAfterSeconds?: number | undefined;
  }) {
    super(`${init.code}: ${init.detail}`);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.detail = init.detail;
    this.requestId = init.requestId;
    this.fieldErrors = init.fieldErrors ?? [];
    this.retryAfterSeconds = init.retryAfterSeconds;
  }
}

export class NetworkError extends Error {
  constructor(options?: { cause?: unknown }) {
    super('Network request failed', options);
    this.name = 'NetworkError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function hasCode(error: unknown, code: ErrorCode): boolean {
  return isApiError(error) && error.code === code;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseFieldErrors(value: unknown): FieldError[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    isRecord(item) && typeof item.field === 'string' && typeof item.message === 'string'
      ? [{ field: item.field, message: item.message }]
      : [],
  );
}

export function toApiError(response: Response, body: unknown): ApiError {
  const retryAfter = Number(response.headers.get('Retry-After'));
  const retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined;

  if (isRecord(body) && typeof body.code === 'string') {
    return new ApiError({
      status: response.status,
      code: body.code as ErrorCode,
      detail: typeof body.detail === 'string' ? body.detail : response.statusText,
      requestId: typeof body.requestId === 'string' ? body.requestId : undefined,
      fieldErrors: parseFieldErrors(body.errors),
      retryAfterSeconds,
    });
  }
  return new ApiError({
    status: response.status,
    code: 'unknown',
    detail: response.statusText || `HTTP ${response.status}`,
    retryAfterSeconds,
  });
}
