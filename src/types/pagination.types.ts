import type { SortDirection } from './common.types.js';

/**
 * Pagination input parameters for list queries.
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Pagination metadata returned in standardized API list responses.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Standard parameters for filtering, sorting, and paginating entity queries.
 */
export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  filters?: Record<string, unknown>;
}
