import type { UUID, ISODateString } from './common.types.js';

export type CouponDiscountType = 'percentage' | 'fixed_amount';
export type CouponStatus = 'active' | 'inactive';

export interface Coupon {
  id: UUID;
  code: string;
  name?: string | null;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number; // percentage (0-100) or cents (BRL)
  validFrom: ISODateString | null;
  validUntil: ISODateString | null;
  maxUses: number | null; // null for unlimited
  usesCount: number;
  applicablePlanIds: UUID[] | null; // null or empty means all plans
  status: CouponStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt?: ISODateString | null;
}

export interface CreateCouponPayload {
  code: string;
  name?: string | null;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  validFrom?: ISODateString | null;
  validUntil?: ISODateString | null;
  maxUses?: number | null;
  applicablePlanIds?: UUID[] | null;
  status?: CouponStatus;
}

export interface UpdateCouponPayload {
  code?: string;
  name?: string | null;
  description?: string | null;
  discountType?: CouponDiscountType;
  discountValue?: number;
  validFrom?: ISODateString | null;
  validUntil?: ISODateString | null;
  maxUses?: number | null;
  applicablePlanIds?: UUID[] | null;
  status?: CouponStatus;
}

export interface CouponQueryParams {
  search?: string;
  status?: CouponStatus | 'all';
  discountType?: CouponDiscountType | 'all';
  planId?: string;
  page?: number;
  pageSize?: number;
}

export interface ValidateCouponPayload {
  code: string;
  planId: UUID;
  companyId?: UUID;
}

export interface CouponValidationResult {
  isValid: boolean;
  errorReason?: string | null;
  coupon?: {
    id: UUID;
    code: string;
    name?: string | null;
    discountType: CouponDiscountType;
    discountValue: number;
    description?: string | null;
  } | null;
  planName?: string;
  originalPriceCents: number;
  discountCents: number;
  finalPriceCents: number;
  formattedOriginalPrice: string;
  formattedDiscount: string;
  formattedFinalPrice: string;
}

export interface CouponUsageRecord {
  id: UUID;
  couponId: UUID;
  subscriptionId?: UUID | null;
  companyId: UUID;
  userId?: UUID | null;
  originalPriceCents: number;
  discountCents: number;
  finalPriceCents: number;
  appliedAt: ISODateString;
  createdAt: ISODateString;
  couponCode?: string;
  companyName?: string;
}
