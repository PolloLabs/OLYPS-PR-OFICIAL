import type { ISODateString } from './common.types.js';
import type { PaginationMeta } from './pagination.types.js';

/**
 * Standard API error structure.
 * Never includes secrets, raw tokens, or service credentials.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Standard API metadata structure accompanying responses.
 */
export interface ApiMeta {
  timestamp: ISODateString;
  pagination?: PaginationMeta;
  version?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Universal standard API response contract for all OLYPS PRO endpoints.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}
