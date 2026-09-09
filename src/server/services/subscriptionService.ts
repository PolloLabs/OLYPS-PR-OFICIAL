import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import { SubscriptionPlanService } from './subscriptionPlanService.js';
import { CouponService } from './couponService.js';
import type {
  UUID,
  SubscriptionRecord,
  SubscriptionStatus,
  CompanySubscriptionSummary,
  PlanLimits,
  CreateSubscriptionPayload,
  SubscriptionQueryParams,
} from '../../types/index.js';

interface DatabaseSubscriptionRow {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  activated_at: string | null;
  cancelled_at: string | null;
  suspended_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  coupon_id?: string | null;
  coupon_code?: string | null;
  original_price_cents?: number | null;
  discount_cents?: number | null;
  final_price_cents?: number | null;
  company?: { name: string } | null;
  companies?: { name: string } | null;
}

function mapSubscriptionRow(
  row: DatabaseSubscriptionRow,
  companyName?: string
): SubscriptionRecord {
  const resolvedCompanyName =
    companyName || row.company?.name || row.companies?.name || undefined;

  return {
    id: row.id,
    companyId: row.company_id,
    planId: row.plan_id,
    status: (row.status as SubscriptionStatus) || 'pending',
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    activatedAt: row.activated_at,
    cancelledAt: row.cancelled_at,
    suspendedAt: row.suspended_at,
    cancellationReason: row.cancellation_reason,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    couponId: row.coupon_id,
    couponCode: row.coupon_code,
    originalPriceCents: row.original_price_cents,
    discountCents: row.discount_cents,
    finalPriceCents: row.final_price_cents,
    companyName: resolvedCompanyName,
  };
}

// In-memory fallback subscriptions for development/preview when database is not configured
const FALLBACK_SUBSCRIPTIONS: SubscriptionRecord[] = [];

/**
 * Service managing company subscriptions, server-authoritative vigência calculation,
 * expiration evaluation, and operational limits resolution.
 */
export class SubscriptionService {
  /**
   * Creates a new company subscription.
   * - If Free plan: status='active', started_at=NOW(), expires_at=NULL
   * - If Paid plan: status='pending', started_at=NULL, expires_at=NULL (vigência only starts upon Super Admin activation)
   */
  public static async createSubscription(
    payload: CreateSubscriptionPayload
  ): Promise<{ success: boolean; data?: SubscriptionRecord; error?: string }> {
    if (!payload.companyId) {
      return { success: false, error: 'O ID da empresa é obrigatório.' };
    }

    if (!payload.planId) {
      return { success: false, error: 'O ID do plano é obrigatório.' };
    }

    const plan = await SubscriptionPlanService.getPlanById(payload.planId);
    if (!plan) {
      return { success: false, error: 'Plano especificado não foi encontrado.' };
    }

    if (plan.status !== 'active') {
      return { success: false, error: 'O plano selecionado não está ativo para novas assinaturas.' };
    }

    const now = new Date().toISOString();
    const isFree = plan.isFree;

    // Optional Coupon Validation and Discount calculation (Phase 05.3)
    let couponId: UUID | null = null;
    let couponCode: string | null = null;
    let originalPriceCents: number = plan.priceCents;
    let discountCents: number = 0;
    let finalPriceCents: number = plan.priceCents;

    if (payload.couponCode && payload.couponCode.trim().length > 0) {
      const validation = await CouponService.validateCoupon(
        payload.couponCode,
        plan.id,
        payload.companyId
      );

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errorReason || 'Cupom inválido para esta assinatura.',
        };
      }

      if (validation.coupon) {
        couponId = validation.coupon.id;
        couponCode = validation.coupon.code;
        originalPriceCents = validation.originalPriceCents;
        discountCents = validation.discountCents;
        finalPriceCents = validation.finalPriceCents;
      }
    }

    const initialStatus: SubscriptionStatus = isFree ? 'active' : 'pending';
    const startedAt = isFree ? now : null;
    const activatedAt = isFree ? now : null;
    const expiresAt = null; // Free plans never expire; paid plans calculate expires_at only upon activation

    if (!isSupabaseAdminConfigured()) {
      const newSub: SubscriptionRecord = {
        id: `sub-${Date.now()}`,
        companyId: payload.companyId,
        planId: payload.planId,
        status: initialStatus,
        startedAt,
        expiresAt,
        activatedAt,
        cancelledAt: null,
        suspendedAt: null,
        cancellationReason: null,
        notes: payload.notes || null,
        createdAt: now,
        updatedAt: now,
        couponId,
        couponCode,
        originalPriceCents,
        discountCents,
        finalPriceCents,
        plan,
      };
      FALLBACK_SUBSCRIPTIONS.push(newSub);

      if (couponId) {
        await CouponService.recordCouponUsage(couponId, {
          companyId: payload.companyId,
          subscriptionId: newSub.id,
          originalPriceCents,
          discountCents,
          finalPriceCents,
        });
      }

      return { success: true, data: newSub };
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const insertData = {
        company_id: payload.companyId,
        plan_id: payload.planId,
        status: initialStatus,
        started_at: startedAt,
        expires_at: expiresAt,
        activated_at: activatedAt,
        notes: payload.notes?.trim() || null,
        coupon_id: couponId,
        coupon_code: couponCode,
        original_price_cents: originalPriceCents,
        discount_cents: discountCents,
        final_price_cents: finalPriceCents,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert(insertData)
        .select('*')
        .single();

      if (error || !data) {
        return { success: false, error: `Falha ao registrar assinatura: ${error?.message || 'Erro de banco'}` };
      }

      const record = mapSubscriptionRow(data as unknown as DatabaseSubscriptionRow);
      record.plan = plan;

      if (couponId) {
        await CouponService.recordCouponUsage(couponId, {
          companyId: payload.companyId,
          subscriptionId: record.id,
          originalPriceCents,
          discountCents,
          finalPriceCents,
        });
      }

      return { success: true, data: record };
    } catch (err: unknown) {
      return {
        success: false,
        error: `Exceção ao criar assinatura: ${err instanceof Error ? err.message : 'Erro interno'}`,
      };
    }
  }

  /**
   * Activates a pending subscription (Exclusive to Super Admin).
   * Calculates vigência atomically on the backend:
   * started_at = NOW()
   * expires_at = NOW() + plan.duration_days (defaults to 30 days for paid plans; NULL for free)
   */
  public static async activateSubscription(
    subscriptionId: UUID,
    notes?: string
  ): Promise<{ success: boolean; data?: SubscriptionRecord; error?: string }> {
    if (!subscriptionId) {
      return { success: false, error: 'ID da assinatura não fornecido.' };
    }

    const sub = await this.getSubscriptionById(subscriptionId);
    if (!sub) {
      return { success: false, error: 'Assinatura não encontrada.' };
    }

    // Security check: Only pending subscriptions or controlled renewals can transition to active
    if (sub.status === 'active') {
      return {
        success: true,
        data: sub,
        error: 'Esta assinatura já está ativa. A vigência não foi reiniciada.',
      };
    }

    if (sub.status === 'cancelled') {
      return {
        success: false,
        error: 'Assinaturas canceladas não podem ser reativadas diretamente. Crie uma nova assinatura.',
      };
    }

    const plan = await SubscriptionPlanService.getPlanById(sub.planId);
    if (!plan) {
      return { success: false, error: 'Plano associado à assinatura não encontrado.' };
    }

    const nowDate = new Date();
    const nowIso = nowDate.toISOString();

    let startedAtIso: string = nowIso;
    let expiresAtIso: string | null = null;

    if (plan.isFree) {
      expiresAtIso = null;
    } else {
      const durationDays = plan.durationDays > 0 ? plan.durationDays : 30;
      const expireDate = new Date(nowDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      expiresAtIso = expireDate.toISOString();
    }

    if (!isSupabaseAdminConfigured()) {
      const index = FALLBACK_SUBSCRIPTIONS.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        const updated: SubscriptionRecord = {
          ...FALLBACK_SUBSCRIPTIONS[index],
          status: 'active',
          startedAt: startedAtIso,
          expiresAt: expiresAtIso,
          activatedAt: nowIso,
          notes: notes ? `${FALLBACK_SUBSCRIPTIONS[index].notes || ''}\n${notes}`.trim() : FALLBACK_SUBSCRIPTIONS[index].notes,
          updatedAt: nowIso,
          plan,
        };
        FALLBACK_SUBSCRIPTIONS[index] = updated;
        return { success: true, data: updated };
      }
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const updateData: Record<string, unknown> = {
        status: 'active',
        started_at: startedAtIso,
        expires_at: expiresAtIso,
        activated_at: nowIso,
        updated_at: nowIso,
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select('*')
        .single();

      if (error || !data) {
        return { success: false, error: `Falha ao ativar assinatura: ${error?.message || 'Erro de banco'}` };
      }

      const updated = mapSubscriptionRow(data as unknown as DatabaseSubscriptionRow);
      updated.plan = plan;
      return { success: true, data: updated };
    } catch (err: unknown) {
      return {
        success: false,
        error: `Exceção ao ativar assinatura: ${err instanceof Error ? err.message : 'Erro interno'}`,
      };
    }
  }

  /**
   * Suspends a company subscription administratively.
   */
  public static async suspendSubscription(
    subscriptionId: UUID,
    reason?: string,
    notes?: string
  ): Promise<{ success: boolean; data?: SubscriptionRecord; error?: string }> {
    if (!subscriptionId) {
      return { success: false, error: 'ID da assinatura não fornecido.' };
    }

    const nowIso = new Date().toISOString();

    if (!isSupabaseAdminConfigured()) {
      const index = FALLBACK_SUBSCRIPTIONS.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        const updated: SubscriptionRecord = {
          ...FALLBACK_SUBSCRIPTIONS[index],
          status: 'suspended',
          suspendedAt: nowIso,
          cancellationReason: reason || 'Suspensão administrativa',
          notes: notes || FALLBACK_SUBSCRIPTIONS[index].notes,
          updatedAt: nowIso,
        };
        FALLBACK_SUBSCRIPTIONS[index] = updated;
        return { success: true, data: updated };
      }
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'suspended',
          suspended_at: nowIso,
          cancellation_reason: reason?.trim() || null,
          notes: notes?.trim() || null,
          updated_at: nowIso,
        })
        .eq('id', subscriptionId)
        .select('*')
        .single();

      if (error || !data) {
        return { success: false, error: `Falha ao suspender assinatura: ${error?.message || 'Erro de banco'}` };
      }

      return { success: true, data: mapSubscriptionRow(data as unknown as DatabaseSubscriptionRow) };
    } catch (err: unknown) {
      return {
        success: false,
        error: `Exceção ao suspender assinatura: ${err instanceof Error ? err.message : 'Erro interno'}`,
      };
    }
  }

  /**
   * Cancels a company subscription. Preserves audit history.
   */
  public static async cancelSubscription(
    subscriptionId: UUID,
    reason?: string,
    notes?: string
  ): Promise<{ success: boolean; data?: SubscriptionRecord; error?: string }> {
    if (!subscriptionId) {
      return { success: false, error: 'ID da assinatura não fornecido.' };
    }

    const nowIso = new Date().toISOString();

    if (!isSupabaseAdminConfigured()) {
      const index = FALLBACK_SUBSCRIPTIONS.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        const updated: SubscriptionRecord = {
          ...FALLBACK_SUBSCRIPTIONS[index],
          status: 'cancelled',
          cancelledAt: nowIso,
          cancellationReason: reason || 'Cancelamento solicitado',
          notes: notes || FALLBACK_SUBSCRIPTIONS[index].notes,
          updatedAt: nowIso,
        };
        FALLBACK_SUBSCRIPTIONS[index] = updated;
        return { success: true, data: updated };
      }
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: nowIso,
          cancellation_reason: reason?.trim() || null,
          notes: notes?.trim() || null,
          updated_at: nowIso,
        })
        .eq('id', subscriptionId)
        .select('*')
        .single();

      if (error || !data) {
        return { success: false, error: `Falha ao cancelar assinatura: ${error?.message || 'Erro de banco'}` };
      }

      return { success: true, data: mapSubscriptionRow(data as unknown as DatabaseSubscriptionRow) };
    } catch (err: unknown) {
      return {
        success: false,
        error: `Exceção ao cancelar assinatura: ${err instanceof Error ? err.message : 'Erro interno'}`,
      };
    }
  }

  /**
   * Retrieves single subscription record by ID.
   */
  public static async getSubscriptionById(subscriptionId: UUID): Promise<SubscriptionRecord | null> {
    if (!subscriptionId) return null;

    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_SUBSCRIPTIONS.find((s) => s.id === subscriptionId) || null;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*, companies(name)')
        .eq('id', subscriptionId)
        .maybeSingle();

      if (error || !data) return null;

      const sub = mapSubscriptionRow(data as unknown as DatabaseSubscriptionRow);
      sub.plan = (await SubscriptionPlanService.getPlanById(sub.planId)) || undefined;
      return sub;
    } catch {
      return null;
    }
  }

  /**
   * Consults current active/latest subscription for a company, calculates backend vigência,
   * remaining days, and resolves operational limits.
   */
  public static async getCompanySubscription(
    companyId: UUID
  ): Promise<CompanySubscriptionSummary> {
    const defaultFreePlan = await SubscriptionPlanService.getPlanByCode('free');
    const defaultLimits: PlanLimits = defaultFreePlan?.limits || {
      max_users: 1,
      max_locations: 1,
      max_products: 50,
      max_clients: 100,
      has_nfe: false,
      has_pdv: false,
      reparar: true,
    };

    const emptySummary: CompanySubscriptionSummary = {
      subscription: null,
      plan: defaultFreePlan || null,
      status: 'no_subscription',
      startedAt: null,
      expiresAt: null,
      activatedAt: null,
      remainingDays: null,
      isFree: true,
      limits: defaultLimits,
      features: defaultFreePlan?.features || [],
    };

    if (!companyId) return emptySummary;

    let subRecord: SubscriptionRecord | null = null;

    if (!isSupabaseAdminConfigured()) {
      subRecord =
        FALLBACK_SUBSCRIPTIONS.filter((s) => s.companyId === companyId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
    } else {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .select('*, companies(name)')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          subRecord = mapSubscriptionRow(data as unknown as DatabaseSubscriptionRow);
        }
      } catch (err: unknown) {
        console.warn(`[WARN] Erro ao consultar assinatura da empresa ${companyId}: ${err instanceof Error ? err.message : 'Erro'}`);
      }
    }

    if (!subRecord) {
      return emptySummary;
    }

    const plan = (await SubscriptionPlanService.getPlanById(subRecord.planId)) || defaultFreePlan;
    subRecord.plan = plan || undefined;

    // Evaluate expiration in backend
    let currentStatus = subRecord.status;
    let remainingDays: number | null = null;

    if (currentStatus === 'active' && subRecord.expiresAt) {
      const nowTime = Date.now();
      const expiresTime = new Date(subRecord.expiresAt).getTime();

      if (nowTime > expiresTime) {
        currentStatus = 'expired';
        remainingDays = 0;
      } else {
        remainingDays = Math.max(0, Math.ceil((expiresTime - nowTime) / (1000 * 60 * 60 * 24)));
      }
    } else if (currentStatus === 'active' && !subRecord.expiresAt) {
      // Free plan active
      remainingDays = null; // No expiration
    }

    return {
      subscription: subRecord,
      plan: plan || null,
      status: currentStatus,
      startedAt: subRecord.startedAt,
      expiresAt: subRecord.expiresAt,
      activatedAt: subRecord.activatedAt,
      remainingDays,
      isFree: Boolean(plan?.isFree),
      limits: plan?.limits || defaultLimits,
      features: plan?.features || [],
    };
  }

  /**
   * Retrieves operational limits for a company based on their active subscription.
   */
  public static async getSubscriptionLimits(companyId: UUID): Promise<PlanLimits> {
    const summary = await this.getCompanySubscription(companyId);
    return summary.limits;
  }

  /**
   * Paginated list of subscriptions across all companies for Platform Super Admins.
   */
  public static async listSubscriptions(params?: SubscriptionQueryParams): Promise<{
    subscriptions: SubscriptionRecord[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const page = Math.max(1, Number(params?.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize) || 20));
    const offset = (page - 1) * pageSize;

    const defaultPagination = {
      page,
      pageSize,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: page > 1,
    };

    if (!isSupabaseAdminConfigured()) {
      let filtered = [...FALLBACK_SUBSCRIPTIONS];

      if (params?.companyId) {
        filtered = filtered.filter((s) => s.companyId === params.companyId);
      }
      if (params?.planId) {
        filtered = filtered.filter((s) => s.planId === params.planId);
      }
      if (params?.status && params.status !== 'all') {
        filtered = filtered.filter((s) => s.status === params.status);
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const slice = filtered.slice(offset, offset + pageSize);

      return {
        subscriptions: slice,
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
        .from('subscriptions')
        .select('*, companies(name)', { count: 'exact' });

      if (params?.companyId) {
        query = query.eq('company_id', params.companyId);
      }
      if (params?.planId) {
        query = query.eq('plan_id', params.planId);
      }
      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      query = query.order('created_at', { ascending: false });
      query = query.range(offset, offset + pageSize - 1);

      const { data, count, error } = await query;

      if (error || !data) {
        console.warn(`[WARN] Erro ao listar assinaturas: ${error?.message}`);
        return { subscriptions: [], pagination: defaultPagination };
      }

      const rows = data as unknown as DatabaseSubscriptionRow[];
      const total = count ?? rows.length;
      const totalPages = Math.ceil(total / pageSize);

      // Attach plans
      const allPlans = await SubscriptionPlanService.listPlans();
      const planMap = new Map(allPlans.map((p) => [p.id, p]));

      const subscriptions = rows.map((row) => {
        const record = mapSubscriptionRow(row);
        record.plan = planMap.get(record.planId);
        return record;
      });

      return {
        subscriptions,
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
      console.warn(`[WARN] Exceção ao listar assinaturas: ${err instanceof Error ? err.message : 'Erro'}`);
      return { subscriptions: [], pagination: defaultPagination };
    }
  }
}
