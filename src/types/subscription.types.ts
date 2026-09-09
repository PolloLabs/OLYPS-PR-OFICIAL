import type { UUID, ISODateString } from './common.types.js';

/**
 * Supported billing periods for subscription plans.
 */
export type PlanBillingPeriod = 'monthly' | 'yearly' | 'quarterly' | 'semiannual' | 'lifetime';

/**
 * Operational status of a commercial plan.
 */
export type PlanStatus = 'active' | 'inactive' | 'archived';

/**
 * State machine status for company subscriptions.
 * 
 * - 'pending': Paid plan awaiting Super Admin confirmation/payment. Vigência does not start.
 * - 'active': Active plan. For paid plans, expires_at = started_at + 30 days. For free plans, expires_at is null.
 * - 'expired': 30 days period elapsed without renewal. Access blocked by backend.
 * - 'suspended': Administratively blocked by Super Admin.
 * - 'cancelled': Terminated subscription.
 */
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'suspended' | 'cancelled';

/**
 * Structured operational limits configured on a plan.
 */
export interface PlanLimits {
  max_users?: number;
  max_locations?: number;
  max_products?: number;
  max_clients?: number;
  has_nfe?: boolean;
  has_pdv?: boolean;
  reparar?: boolean;
  [key: string]: unknown;
}

/**
 * Full entity definition of a subscription plan in PostgreSQL.
 */
export interface SubscriptionPlan {
  id: UUID;
  name: string;
  code: string;
  description?: string | null;
  priceCents: number;
  billingPeriod: PlanBillingPeriod;
  durationDays: number;
  isFree: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  displayOrder: number;
  status: PlanStatus;
  features: string[];
  limits: PlanLimits;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Sanitized public DTO for the Landing Page commercial cards.
 */
export interface PublicPlanCard {
  id: UUID;
  name: string;
  code: string;
  description?: string | null;
  priceCents: number;
  billingPeriod: PlanBillingPeriod;
  durationDays: number;
  isFree: boolean;
  isFeatured: boolean;
  displayOrder: number;
  features: string[];
  limits: PlanLimits;
}

/**
 * Full entity definition of a company subscription in PostgreSQL.
 */
export interface SubscriptionRecord {
  id: UUID;
  companyId: UUID;
  planId: UUID;
  status: SubscriptionStatus;
  startedAt?: ISODateString | null;
  expiresAt?: ISODateString | null;
  activatedAt?: ISODateString | null;
  cancelledAt?: ISODateString | null;
  suspendedAt?: ISODateString | null;
  cancellationReason?: string | null;
  notes?: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  
  // Coupon and pricing metadata (Phase 05.3)
  couponId?: UUID | null;
  couponCode?: string | null;
  originalPriceCents?: number | null;
  discountCents?: number | null;
  finalPriceCents?: number | null;

  // Joined relation metadata
  plan?: SubscriptionPlan;
  companyName?: string;
}

/**
 * Payload for Super Admin creating a new subscription plan.
 */
export interface CreatePlanPayload {
  name: string;
  code: string;
  description?: string;
  priceCents: number;
  billingPeriod?: PlanBillingPeriod;
  durationDays?: number;
  isFree?: boolean;
  isPublic?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  status?: PlanStatus;
  features?: string[];
  limits?: PlanLimits;
}

/**
 * Payload for Super Admin updating an existing subscription plan.
 */
export interface UpdatePlanPayload {
  name?: string;
  code?: string;
  description?: string;
  priceCents?: number;
  billingPeriod?: PlanBillingPeriod;
  durationDays?: number;
  isFree?: boolean;
  isPublic?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  status?: PlanStatus;
  features?: string[];
  limits?: PlanLimits;
}

/**
 * Payload for creating a company subscription.
 */
export interface CreateSubscriptionPayload {
  companyId: UUID;
  planId: UUID;
  couponCode?: string;
  notes?: string;
}

/**
 * Payload for Super Admin changing subscription status or activating.
 */
export interface UpdateSubscriptionStatusPayload {
  status: SubscriptionStatus;
  reason?: string;
  notes?: string;
}

/**
 * Detailed subscription summary returned for tenant and administrative consultation.
 */
export interface CompanySubscriptionSummary {
  subscription: SubscriptionRecord | null;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | 'no_subscription';
  startedAt?: ISODateString | null;
  expiresAt?: ISODateString | null;
  activatedAt?: ISODateString | null;
  remainingDays?: number | null;
  isFree: boolean;
  limits: PlanLimits;
  features: string[];
}

/**
 * Filter parameters for querying platform subscriptions.
 */
export interface SubscriptionQueryParams {
  companyId?: UUID;
  planId?: UUID;
  status?: SubscriptionStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

