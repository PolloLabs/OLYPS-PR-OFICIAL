import type { UUID, ISODateString, SortDirection } from './common.types.js';
import type { PlatformRole, CompanyStatus, CompanyRole, MembershipStatus, CompanyRecord, CompanyId, CommercialLocation } from './tenant.types.js';
import type { PaginationParams, PaginationMeta } from './pagination.types.js';

/**
 * Represents a registered Platform Administrator record in PostgreSQL.
 */
export interface PlatformAdminRecord {
  id: UUID;
  userId: UUID;
  role: PlatformRole;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  createdBy?: UUID | null;
}

/**
 * Status response for platform admin authorization checks.
 */
export interface PlatformAdminStatus {
  authorized: boolean;
  userId?: UUID;
  role?: PlatformRole;
}

/**
 * Aggregated summary metrics for the global Platform Admin Dashboard.
 */
export interface PlatformDashboardSummary {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  pendingCompanies: number;
  inactiveCompanies: number;
  totalMemberships: number;
  totalPlatformAdmins: number;
  serverTimestamp: ISODateString;
}

/**
 * Administrative view of a company member without sensitive credentials.
 */
export interface PlatformCompanyMemberSummary {
  id: UUID;
  userId: UUID;
  role: CompanyRole;
  status: MembershipStatus;
  joinedAt: ISODateString;
  lastAccessedAt?: ISODateString | null;
}

/**
 * Comprehensive company details retrieved by Platform Super Admin.
 */
export interface PlatformCompanyDetails extends CompanyRecord {
  memberCount: number;
  members: PlatformCompanyMemberSummary[];
  locationCount?: number;
  locations?: CommercialLocation[];
}

/**
 * Query parameters for filtering and paginating global company list.
 */
export interface PlatformCompanyQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CompanyStatus | 'all';
  sortBy?: 'name' | 'created_at' | 'status' | 'slug';
  sortDirection?: SortDirection;
}

/**
 * Paginated list response data for global company list.
 */
export interface PlatformCompanyListResult {
  companies: CompanyRecord[];
  pagination: PaginationMeta;
}

/**
 * Payload required for administrative company status mutation.
 */
export interface UpdateCompanyStatusPayload {
  status: CompanyStatus;
}

