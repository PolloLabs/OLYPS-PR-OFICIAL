/**
 * Common primitive types, aliases, and interfaces for OLYPS PRO.
 */

/**
 * Universal Unique Identifier (UUID v4) representation for database entities.
 */
export type UUID = string;

/**
 * ISO 8601 formatted date-time string (e.g., '2026-08-30T17:00:00.000Z').
 */
export type ISODateString = string;

/**
 * Common entity status representation across the platform.
 */
export type EntityStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'archived' | 'deleted';

/**
 * Sort direction for queries and lists.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Standard timestamp tracking for persistent entities (PostgreSQL convention).
 */
export interface BaseTimestamps {
  created_at: ISODateString;
  updated_at?: ISODateString;
  deleted_at?: ISODateString | null;
}

/**
 * Standard audit trail action categories.
 */
export type AuditAction =
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PERMISSION_CHANGE'
  | 'STATUS_CHANGE'
  | 'EXPORT'
  | 'IMPORT';

/**
 * Contract for system audit logging events.
 */
export interface AuditContext {
  userId?: UUID;
  companyId?: UUID | null;
  action: AuditAction | string;
  entity: string;
  recordId?: UUID;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: ISODateString;
}
