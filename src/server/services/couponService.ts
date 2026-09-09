import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import { SubscriptionPlanService } from './subscriptionPlanService.js';
import type {
  UUID,
  Coupon,
  CouponStatus,
  CouponDiscountType,
  CreateCouponPayload,
  UpdateCouponPayload,
  CouponQueryParams,
  CouponValidationResult,
  CouponUsageRecord,
  PaginationMeta,
} from '../../types/index.js';

interface DatabaseCouponRow {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number | string;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  uses_count: number;
  applicable_plan_ids: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface DatabaseCouponUsageRow {
  id: string;
  coupon_id: string;
  subscription_id: string | null;
  company_id: string;
  user_id: string | null;
  original_price_cents: number;
  discount_cents: number;
  final_price_cents: number;
  applied_at: string;
  created_at: string;
  coupons?: { code: string } | null;
  companies?: { name: string } | null;
}

function mapCouponRow(row: DatabaseCouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    discountType: (row.discount_type as CouponDiscountType) || 'percentage',
    discountValue: Number(row.discount_value),
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    maxUses: row.max_uses,
    usesCount: Number(row.uses_count || 0),
    applicablePlanIds: Array.isArray(row.applicable_plan_ids) ? row.applicable_plan_ids : null,
    status: (row.status as CouponStatus) || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// In-memory fallback seeds for preview and development
const FALLBACK_COUPONS: Coupon[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440091',
    code: 'LANCA20',
    name: 'Lançamento Oficial 20% OFF',
    description: 'Desconto especial de 20% para novas empresas em qualquer plano comercial pago.',
    discountType: 'percentage',
    discountValue: 20,
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: 500,
    usesCount: 14,
    applicablePlanIds: null,
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440092',
    code: 'PROMO50',
    name: 'Campanha Acelera 50% OFF',
    description: 'Super desconto promocional de 50% aplicável em planos profissionais.',
    discountType: 'percentage',
    discountValue: 50,
    validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: 100,
    usesCount: 38,
    applicablePlanIds: null,
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440093',
    code: 'BEMVINDO100',
    name: 'Cupom Fixo Boas-Vindas R$ 100',
    description: 'Desconto fixo de R$ 100,00 na primeira mensalidade para novos clientes OLYPS.',
    discountType: 'fixed_amount',
    discountValue: 10000, // 10000 cents = R$ 100,00
    validFrom: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: 200,
    usesCount: 72,
    applicablePlanIds: null,
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440094',
    code: 'OLYPS10',
    name: 'Cupom Parceiro 10% OFF',
    description: 'Desconto de 10% contínuo para empresas indicadas por parceiros comerciais.',
    discountType: 'percentage',
    discountValue: 10,
    validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: null,
    usesCount: 5,
    applicablePlanIds: null,
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const FALLBACK_COUPON_USAGES: CouponUsageRecord[] = [
  {
    id: 'usage-1',
    couponId: '550e8400-e29b-41d4-a716-446655440091',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    originalPriceCents: 9900,
    discountCents: 1980,
    finalPriceCents: 7920,
    appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    couponCode: 'LANCA20',
    companyName: 'Matriz Principal - Olyps Corp',
  },
];

export class CouponService {
  /**
   * Lists coupons with filtering, search, and pagination.
   */
  public static async listCoupons(
    params: CouponQueryParams = {}
  ): Promise<{ coupons: Coupon[]; pagination: PaginationMeta }> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 20));
    const search = params.search?.trim().toLowerCase();
    const status = params.status && params.status !== 'all' ? params.status : undefined;
    const discountType = params.discountType && params.discountType !== 'all' ? params.discountType : undefined;

    if (!isSupabaseAdminConfigured()) {
      let filtered = FALLBACK_COUPONS.filter((c) => !c.deletedAt);

      if (status) {
        filtered = filtered.filter((c) => c.status === status);
      }
      if (discountType) {
        filtered = filtered.filter((c) => c.discountType === discountType);
      }
      if (search) {
        filtered = filtered.filter(
          (c) =>
            c.code.toLowerCase().includes(search) ||
            (c.name && c.name.toLowerCase().includes(search)) ||
            (c.description && c.description.toLowerCase().includes(search))
        );
      }

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + pageSize);

      return {
        coupons: paginated,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin
        .from('coupons')
        .select('*', { count: 'exact' })
        .is('deleted_at', null);

      if (status) {
        query = query.eq('status', status);
      }
      if (discountType) {
        query = query.eq('discount_type', discountType);
      }
      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Erro ao consultar cupons: ${error.message}`);
      }

      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const coupons = (data || []).map((row) => mapCouponRow(row as unknown as DatabaseCouponRow));

      return {
        coupons,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (err: unknown) {
      console.error('[CouponService.listCoupons] Error:', err);
      return {
        coupons: FALLBACK_COUPONS.filter((c) => !c.deletedAt),
        pagination: {
          page: 1,
          pageSize: 20,
          total: FALLBACK_COUPONS.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  }

  /**
   * Retrieves a single coupon by its UUID.
   */
  public static async getCouponById(id: UUID): Promise<Coupon | null> {
    if (!id) return null;

    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_COUPONS.find((c) => c.id === id && !c.deletedAt) || null;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error || !data) return null;
      return mapCouponRow(data as unknown as DatabaseCouponRow);
    } catch {
      return null;
    }
  }

  /**
   * Retrieves a coupon by its unique code (case-insensitive, trimmed).
   */
  public static async getCouponByCode(rawCode: string): Promise<Coupon | null> {
    const code = rawCode.trim().toUpperCase();
    if (!code) return null;

    if (!isSupabaseAdminConfigured()) {
      return (
        FALLBACK_COUPONS.find(
          (c) => c.code.toUpperCase() === code && !c.deletedAt
        ) || null
      );
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .ilike('code', code)
        .is('deleted_at', null)
        .single();

      if (error || !data) return null;
      return mapCouponRow(data as unknown as DatabaseCouponRow);
    } catch {
      return null;
    }
  }

  /**
   * Creates a new coupon.
   */
  public static async createCoupon(
    payload: CreateCouponPayload
  ): Promise<{ success: boolean; data?: Coupon; error?: string }> {
    const code = payload.code?.trim().toUpperCase();
    if (!code || code.length < 2) {
      return { success: false, error: 'O código do cupom deve ter pelo menos 2 caracteres.' };
    }

    if (!payload.discountType || !['percentage', 'fixed_amount'].includes(payload.discountType)) {
      return { success: false, error: 'Tipo de desconto inválido (percentual ou valor fixo).' };
    }

    if (payload.discountValue === undefined || payload.discountValue <= 0) {
      return { success: false, error: 'O valor do desconto deve ser maior que zero.' };
    }

    if (payload.discountType === 'percentage' && payload.discountValue > 100) {
      return { success: false, error: 'O desconto percentual não pode ser maior que 100%.' };
    }

    // Check code uniqueness
    const existing = await this.getCouponByCode(code);
    if (existing) {
      return { success: false, error: `Já existe um cupom cadastrado com o código "${code}".` };
    }

    const now = new Date().toISOString();
    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}`,
      code,
      name: payload.name?.trim() || null,
      description: payload.description?.trim() || null,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      validFrom: payload.validFrom || null,
      validUntil: payload.validUntil || null,
      maxUses: payload.maxUses && payload.maxUses > 0 ? payload.maxUses : null,
      usesCount: 0,
      applicablePlanIds: Array.isArray(payload.applicablePlanIds) && payload.applicablePlanIds.length > 0 ? payload.applicablePlanIds : null,
      status: payload.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    if (!isSupabaseAdminConfigured()) {
      FALLBACK_COUPONS.unshift(newCoupon);
      return { success: true, data: newCoupon };
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const insertData = {
        code,
        name: newCoupon.name,
        description: newCoupon.description,
        discount_type: newCoupon.discountType,
        discount_value: newCoupon.discountValue,
        valid_from: newCoupon.validFrom,
        valid_until: newCoupon.validUntil,
        max_uses: newCoupon.maxUses,
        uses_count: 0,
        applicable_plan_ids: newCoupon.applicablePlanIds || [],
        status: newCoupon.status,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabaseAdmin
        .from('coupons')
        .insert(insertData)
        .select('*')
        .single();

      if (error || !data) {
        return { success: false, error: `Falha ao salvar cupom: ${error?.message || 'Erro no banco'}` };
      }

      return { success: true, data: mapCouponRow(data as unknown as DatabaseCouponRow) };
    } catch (err: unknown) {
      return {
        success: false,
        error: `Exceção ao cadastrar cupom: ${err instanceof Error ? err.message : 'Erro interno'}`,
      };
    }
  }

  /**
   * Updates an existing coupon.
   */
  public static async updateCoupon(
    id: UUID,
    payload: UpdateCouponPayload
  ): Promise<{ success: boolean; data?: Coupon; error?: string }> {
    const existing = await this.getCouponById(id);
    if (!existing) {
      return { success: false, error: 'Cupom não encontrado.' };
    }

    if (payload.code) {
      const newCode = payload.code.trim().toUpperCase();
      if (newCode !== existing.code) {
        const codeCheck = await this.getCouponByCode(newCode);
        if (codeCheck && codeCheck.id !== id) {
          return { success: false, error: `O código "${newCode}" já está em uso por outro cupom.` };
        }
      }
    }

    if (payload.discountType && !['percentage', 'fixed_amount'].includes(payload.discountType)) {
      return { success: false, error: 'Tipo de desconto inválido.' };
    }

    if (payload.discountValue !== undefined && payload.discountValue <= 0) {
      return { success: false, error: 'O valor do desconto deve ser maior que zero.' };
    }

    if (payload.discountType === 'percentage' && payload.discountValue !== undefined && payload.discountValue > 100) {
      return { success: false, error: 'Desconto percentual não pode ser maior que 100%.' };
    }

    const now = new Date().toISOString();

    if (!isSupabaseAdminConfigured()) {
      const idx = FALLBACK_COUPONS.findIndex((c) => c.id === id);
      if (idx !== -1) {
        const updated: Coupon = {
          ...FALLBACK_COUPONS[idx],
          code: payload.code ? payload.code.trim().toUpperCase() : FALLBACK_COUPONS[idx].code,
          name: payload.name !== undefined ? payload.name?.trim() || null : FALLBACK_COUPONS[idx].name,
          description: payload.description !== undefined ? payload.description?.trim() || null : FALLBACK_COUPONS[idx].description,
          discountType: payload.discountType || FALLBACK_COUPONS[idx].discountType,
          discountValue: payload.discountValue !== undefined ? payload.discountValue : FALLBACK_COUPONS[idx].discountValue,
          validFrom: payload.validFrom !== undefined ? payload.validFrom : FALLBACK_COUPONS[idx].validFrom,
          validUntil: payload.validUntil !== undefined ? payload.validUntil : FALLBACK_COUPONS[idx].validUntil,
          maxUses: payload.maxUses !== undefined ? payload.maxUses : FALLBACK_COUPONS[idx].maxUses,
          applicablePlanIds: payload.applicablePlanIds !== undefined ? payload.applicablePlanIds : FALLBACK_COUPONS[idx].applicablePlanIds,
          status: payload.status || FALLBACK_COUPONS[idx].status,
          updatedAt: now,
        };
        FALLBACK_COUPONS[idx] = updated;
        return { success: true, data: updated };
      }
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const updateData: Record<string, any> = {
        updated_at: now,
      };

      if (payload.code) updateData.code = payload.code.trim().toUpperCase();
      if (payload.name !== undefined) updateData.name = payload.name?.trim() || null;
      if (payload.description !== undefined) updateData.description = payload.description?.trim() || null;
      if (payload.discountType) updateData.discount_type = payload.discountType;
      if (payload.discountValue !== undefined) updateData.discount_value = payload.discountValue;
      if (payload.validFrom !== undefined) updateData.valid_from = payload.validFrom;
      if (payload.validUntil !== undefined) updateData.valid_until = payload.validUntil;
      if (payload.maxUses !== undefined) updateData.max_uses = payload.maxUses;
      if (payload.applicablePlanIds !== undefined) updateData.applicable_plan_ids = payload.applicablePlanIds || [];
      if (payload.status) updateData.status = payload.status;

      const { data, error } = await supabaseAdmin
        .from('coupons')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        return { success: false, error: `Falha ao atualizar cupom: ${error?.message || 'Erro no banco'}` };
      }

      return { success: true, data: mapCouponRow(data as unknown as DatabaseCouponRow) };
    } catch (err: unknown) {
      return {
        success: false,
        error: `Exceção ao atualizar cupom: ${err instanceof Error ? err.message : 'Erro interno'}`,
      };
    }
  }

  /**
   * Activates or deactivates a coupon.
   */
  public static async updateCouponStatus(
    id: UUID,
    status: CouponStatus
  ): Promise<{ success: boolean; data?: Coupon; error?: string }> {
    return this.updateCoupon(id, { status });
  }

  /**
   * Soft deletes a coupon.
   */
  public static async deleteCoupon(
    id: UUID
  ): Promise<{ success: boolean; error?: string }> {
    const existing = await this.getCouponById(id);
    if (!existing) {
      return { success: false, error: 'Cupom não encontrado.' };
    }

    const now = new Date().toISOString();

    if (!isSupabaseAdminConfigured()) {
      const idx = FALLBACK_COUPONS.findIndex((c) => c.id === id);
      if (idx !== -1) {
        FALLBACK_COUPONS[idx].deletedAt = now;
        FALLBACK_COUPONS[idx].status = 'inactive';
        return { success: true };
      }
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('coupons')
        .update({ deleted_at: now, status: 'inactive' })
        .eq('id', id);

      if (error) {
        return { success: false, error: `Erro ao excluir cupom: ${error.message}` };
      }

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: `Exceção ao excluir cupom: ${err instanceof Error ? err.message : 'Erro interno'}`,
      };
    }
  }

  /**
   * Core Discount Engine: Validates a coupon against a plan and calculates exact discount values.
   * CRITICAL: Never alters subscription_plans.price_cents!
   */
  public static async validateCoupon(
    rawCode: string,
    planId: UUID,
    companyId?: UUID
  ): Promise<CouponValidationResult> {
    const code = rawCode.trim().toUpperCase();

    // 1. Fetch the target commercial plan
    const plan = await SubscriptionPlanService.getPlanById(planId);
    if (!plan) {
      return {
        isValid: false,
        errorReason: 'Plano comercial selecionado não foi encontrado.',
        originalPriceCents: 0,
        discountCents: 0,
        finalPriceCents: 0,
        formattedOriginalPrice: 'R$ 0,00',
        formattedDiscount: 'R$ 0,00',
        formattedFinalPrice: 'R$ 0,00',
      };
    }

    const originalPriceCents = plan.priceCents;
    const formattedOriginalPrice = formatCentsToBRL(originalPriceCents);

    // 2. Fetch coupon
    const coupon = await this.getCouponByCode(code);
    if (!coupon) {
      return {
        isValid: false,
        errorReason: `Cupom "${code}" não encontrado ou inexistente.`,
        planName: plan.name,
        originalPriceCents,
        discountCents: 0,
        finalPriceCents: originalPriceCents,
        formattedOriginalPrice,
        formattedDiscount: 'R$ 0,00',
        formattedFinalPrice: formattedOriginalPrice,
      };
    }

    // 3. Check status
    if (coupon.status !== 'active') {
      return {
        isValid: false,
        errorReason: `O cupom "${code}" está inativo no momento.`,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          description: coupon.description,
        },
        planName: plan.name,
        originalPriceCents,
        discountCents: 0,
        finalPriceCents: originalPriceCents,
        formattedOriginalPrice,
        formattedDiscount: 'R$ 0,00',
        formattedFinalPrice: formattedOriginalPrice,
      };
    }

    const nowTime = Date.now();

    // 4. Check start date
    if (coupon.validFrom) {
      const fromTime = new Date(coupon.validFrom).getTime();
      if (nowTime < fromTime) {
        return {
          isValid: false,
          errorReason: `O cupom "${code}" ainda não iniciou sua vigência promocional.`,
          coupon: {
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            description: coupon.description,
          },
          planName: plan.name,
          originalPriceCents,
          discountCents: 0,
          finalPriceCents: originalPriceCents,
          formattedOriginalPrice,
          formattedDiscount: 'R$ 0,00',
          formattedFinalPrice: formattedOriginalPrice,
        };
      }
    }

    // 5. Check expiration date (validUntil)
    if (coupon.validUntil) {
      const untilTime = new Date(coupon.validUntil).getTime();
      if (nowTime > untilTime) {
        return {
          isValid: false,
          errorReason: `O cupom "${code}" expirou e não é mais válido.`,
          coupon: {
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            description: coupon.description,
          },
          planName: plan.name,
          originalPriceCents,
          discountCents: 0,
          finalPriceCents: originalPriceCents,
          formattedOriginalPrice,
          formattedDiscount: 'R$ 0,00',
          formattedFinalPrice: formattedOriginalPrice,
        };
      }
    }

    // 6. Check max uses limit
    if (coupon.maxUses !== null && coupon.maxUses > 0 && coupon.usesCount >= coupon.maxUses) {
      return {
        isValid: false,
        errorReason: `O cupom "${code}" atingiu o limite máximo de ${coupon.maxUses} utilizações.`,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          description: coupon.description,
        },
        planName: plan.name,
        originalPriceCents,
        discountCents: 0,
        finalPriceCents: originalPriceCents,
        formattedOriginalPrice,
        formattedDiscount: 'R$ 0,00',
        formattedFinalPrice: formattedOriginalPrice,
      };
    }

    // 7. Check plan applicability
    if (
      coupon.applicablePlanIds &&
      coupon.applicablePlanIds.length > 0 &&
      !coupon.applicablePlanIds.includes(plan.id)
    ) {
      return {
        isValid: false,
        errorReason: `O cupom "${code}" não é aplicável ao plano "${plan.name}".`,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          description: coupon.description,
        },
        planName: plan.name,
        originalPriceCents,
        discountCents: 0,
        finalPriceCents: originalPriceCents,
        formattedOriginalPrice,
        formattedDiscount: 'R$ 0,00',
        formattedFinalPrice: formattedOriginalPrice,
      };
    }

    // 8. Calculate Discount and Final Price
    let discountCents = 0;

    if (plan.isFree || originalPriceCents === 0) {
      discountCents = 0;
    } else if (coupon.discountType === 'percentage') {
      // Percentage discount: e.g. R$ 99,00 (9900 cents) * 20% = 1980 cents
      discountCents = Math.round((originalPriceCents * coupon.discountValue) / 100);
      discountCents = Math.max(0, Math.min(originalPriceCents, discountCents));
    } else if (coupon.discountType === 'fixed_amount') {
      // Fixed amount discount in cents (or converted if < 1000 and assumed BRL)
      const fixedValueCents = coupon.discountValue > 500 ? Math.round(coupon.discountValue) : Math.round(coupon.discountValue * 100);
      discountCents = Math.max(0, Math.min(originalPriceCents, fixedValueCents));
    }

    const finalPriceCents = Math.max(0, originalPriceCents - discountCents);

    return {
      isValid: true,
      errorReason: null,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
      },
      planName: plan.name,
      originalPriceCents,
      discountCents,
      finalPriceCents,
      formattedOriginalPrice,
      formattedDiscount: formatCentsToBRL(discountCents),
      formattedFinalPrice: formatCentsToBRL(finalPriceCents),
    };
  }

  /**
   * Records coupon redemption usage in the database and increments the usage counter.
   */
  public static async recordCouponUsage(
    couponId: UUID,
    data: {
      companyId: UUID;
      subscriptionId?: UUID;
      userId?: UUID;
      originalPriceCents: number;
      discountCents: number;
      finalPriceCents: number;
    }
  ): Promise<CouponUsageRecord> {
    const now = new Date().toISOString();
    const coupon = await this.getCouponById(couponId);
    const code = coupon?.code || 'CUPOM';

    if (!isSupabaseAdminConfigured()) {
      const usageRecord: CouponUsageRecord = {
        id: `usage-${Date.now()}`,
        couponId,
        subscriptionId: data.subscriptionId || null,
        companyId: data.companyId,
        userId: data.userId || null,
        originalPriceCents: data.originalPriceCents,
        discountCents: data.discountCents,
        finalPriceCents: data.finalPriceCents,
        appliedAt: now,
        createdAt: now,
        couponCode: code,
      };

      FALLBACK_COUPON_USAGES.unshift(usageRecord);

      // Increment counter
      const cIdx = FALLBACK_COUPONS.findIndex((c) => c.id === couponId);
      if (cIdx !== -1) {
        FALLBACK_COUPONS[cIdx].usesCount += 1;
        FALLBACK_COUPONS[cIdx].updatedAt = now;
      }

      return usageRecord;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      // 1. Insert into coupon_usages
      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('coupon_usages')
        .insert({
          coupon_id: couponId,
          subscription_id: data.subscriptionId || null,
          company_id: data.companyId,
          user_id: data.userId || null,
          original_price_cents: data.originalPriceCents,
          discount_cents: data.discountCents,
          final_price_cents: data.finalPriceCents,
          applied_at: now,
          created_at: now,
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('[CouponService.recordCouponUsage] Insert error:', insertError);
      }

      // 2. Increment coupon uses_count
      try {
        await supabaseAdmin.rpc('increment_coupon_uses', { p_coupon_id: couponId });
      } catch {
        if (coupon) {
          await supabaseAdmin
            .from('coupons')
            .update({ uses_count: (coupon.usesCount || 0) + 1, updated_at: now })
            .eq('id', couponId);
        }
      }

      return {
        id: insertedData?.id || `usage-${Date.now()}`,
        couponId,
        subscriptionId: data.subscriptionId || null,
        companyId: data.companyId,
        userId: data.userId || null,
        originalPriceCents: data.originalPriceCents,
        discountCents: data.discountCents,
        finalPriceCents: data.finalPriceCents,
        appliedAt: now,
        createdAt: now,
        couponCode: code,
      };
    } catch (err) {
      console.error('[CouponService.recordCouponUsage] Exception:', err);
      return {
        id: `usage-${Date.now()}`,
        couponId,
        subscriptionId: data.subscriptionId || null,
        companyId: data.companyId,
        userId: data.userId || null,
        originalPriceCents: data.originalPriceCents,
        discountCents: data.discountCents,
        finalPriceCents: data.finalPriceCents,
        appliedAt: now,
        createdAt: now,
        couponCode: code,
      };
    }
  }

  /**
   * Lists usage history for a coupon or for the entire platform.
   */
  public static async listCouponUsages(
    couponId?: UUID
  ): Promise<CouponUsageRecord[]> {
    if (!isSupabaseAdminConfigured()) {
      if (couponId) {
        return FALLBACK_COUPON_USAGES.filter((u) => u.couponId === couponId);
      }
      return FALLBACK_COUPON_USAGES;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin
        .from('coupon_usages')
        .select('*, coupons(code), companies(name)')
        .order('applied_at', { ascending: false });

      if (couponId) {
        query = query.eq('coupon_id', couponId);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        couponId: row.coupon_id,
        subscriptionId: row.subscription_id,
        companyId: row.company_id,
        userId: row.user_id,
        originalPriceCents: row.original_price_cents,
        discountCents: row.discount_cents,
        finalPriceCents: row.final_price_cents,
        appliedAt: row.applied_at,
        createdAt: row.created_at,
        couponCode: row.coupons?.code,
        companyName: row.companies?.name,
      }));
    } catch {
      return [];
    }
  }
}
