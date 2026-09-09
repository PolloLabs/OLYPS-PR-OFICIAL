import type { UUID, ISODateString } from './common.types.js';
import type { CompanyId, CompanyRole, PermissionKey } from './tenant.types.js';

/**
 * Standard granular permission definition entity from PostgreSQL.
 */
export interface PermissionRecord {
  id: UUID;
  key: PermissionKey;
  name: string;
  description?: string | null;
  module: string;
  action: string;
  createdAt: ISODateString;
}

/**
 * Role definition entity from PostgreSQL.
 */
export interface RoleRecord {
  id: UUID;
  key: CompanyRole;
  name: string;
  description?: string | null;
  scope: 'platform' | 'company';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Association mapping between a Role and a Permission.
 */
export interface RolePermissionRecord {
  id: UUID;
  roleId: UUID;
  permissionId: UUID;
  createdAt: ISODateString;
}

/**
 * Payload returned for user company permissions query.
 */
export interface UserPermissionsPayload {
  companyId: CompanyId;
  companyName?: string;
  role: CompanyRole;
  permissions: PermissionKey[];
}

/**
 * Response format for single permission evaluation check.
 */
export interface PermissionCheckResult {
  authorized: boolean;
  permission: PermissionKey;
  companyId: CompanyId;
  role: CompanyRole;
}
