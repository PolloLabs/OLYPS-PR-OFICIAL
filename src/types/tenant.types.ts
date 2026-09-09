import type { UUID, ISODateString } from './common.types.js';

/**
 * Company unique identifier type alias.
 */
export type CompanyId = UUID;

/**
 * Platform-level roles for multi-tenant governance.
 */
export type PlatformRole = 'super_admin' | 'support_admin';

/**
 * Standard company-level operational roles.
 */
export type CompanyRole =
  | 'company_admin'
  | 'manager'
  | 'seller'
  | 'cashier'
  | 'technician'
  | 'stock_manager'
  | string;

/**
 * Status of a company entity.
 */
export type CompanyStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/**
 * Status of a user's membership in a specific company.
 */
export type MembershipStatus = 'active' | 'suspended' | 'pending';

/**
 * Basic summary of a company returned in user company listings.
 */
export interface CompanySummary {
  id: CompanyId;
  name: string;
  legalName?: string | null;
  slug: string;
  status: CompanyStatus;
  userRole: CompanyRole;
  membershipStatus: MembershipStatus;
  membershipId: UUID;
}

/**
 * Full company entity representation with enterprise data.
 */
export interface CompanyRecord {
  id: CompanyId;
  name: string;
  legalName?: string | null;
  document?: string | null;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  stateRegistration?: string | null;
  taxRegime?: string | null;
  currency?: string | null;
  timezone?: string | null;
  status: CompanyStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Payload for creating a new company
 */
export interface CreateCompanyPayload {
  name: string;
  legalName?: string;
  document?: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  stateRegistration?: string;
  taxRegime?: string;
  currency?: string;
  timezone?: string;
  status?: CompanyStatus;
}

/**
 * Payload for updating company details
 */
export interface UpdateCompanyPayload {
  name?: string;
  legalName?: string | null;
  document?: string | null;
  slug?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  stateRegistration?: string | null;
  taxRegime?: string | null;
  currency?: string | null;
  timezone?: string | null;
  status?: CompanyStatus;
}

/**
 * Commercial location / branch / POS point representation
 */
export interface CommercialLocation {
  id: UUID;
  companyId: CompanyId;
  name: string;
  code?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isMain: boolean;
  status: 'active' | 'inactive';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Payload for creating a commercial location
 */
export interface CreateLocationPayload {
  name: string;
  code?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isMain?: boolean;
  status?: 'active' | 'inactive';
}

/**
 * Payload for updating a commercial location
 */
export interface UpdateLocationPayload {
  name?: string;
  code?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isMain?: boolean;
  status?: 'active' | 'inactive';
}

/**
 * User membership association within a company (N:N relationship).
 */
export interface CompanyMembership {
  id: UUID;
  userId: UUID;
  companyId: CompanyId;
  companyName?: string;
  role: CompanyRole;
  status: MembershipStatus;
  joinedAt: ISODateString;
  lastAccessedAt?: ISODateString | null;
}

/**
 * Active company work context selected for a session or request.
 */
export interface ActiveCompanyContext {
  companyId: CompanyId;
  role: CompanyRole;
  membershipId: UUID;
  companyName?: string;
}

/**
 * Granular permission key format (e.g. 'products.read', 'sales.create', 'stock.adjust').
 */
export type PermissionKey =
  | `${string}.${string}`
  | string;

/**
 * Role to permission mapping definition.
 */
export interface RolePermissionDefinition {
  role: CompanyRole;
  permissions: PermissionKey[];
}

/**
 * Detailed representation of a company user member with profile and membership info.
 */
export interface CompanyUserMember {
  id: UUID;
  userId: UUID;
  companyId: CompanyId;
  name: string;
  email: string;
  role: CompanyRole;
  roleName?: string;
  status: MembershipStatus;
  joinedAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  avatarUrl?: string | null;
  phone?: string | null;
}

/**
 * Payload to invite/add a user to a company
 */
export interface InviteCompanyUserPayload {
  email: string;
  name?: string;
  role: CompanyRole;
  phone?: string;
}

/**
 * Payload to update a company user's role
 */
export interface UpdateCompanyUserRolePayload {
  role: CompanyRole;
}

/**
 * Payload to update a company user's status
 */
export interface UpdateCompanyUserStatusPayload {
  status: MembershipStatus;
}

/**
 * Operational quota and limits for company users based on active subscription
 */
export interface CompanyUsersQuota {
  activeCount: number;
  maxLimit: number;
  isLimitReached: boolean;
  remainingSlots: number;
  planName: string;
  planCode?: string;
}

/**
 * Response payload for listing company users with limits metadata
 */
export interface CompanyUsersListResponse {
  users: CompanyUserMember[];
  quota: CompanyUsersQuota;
}
