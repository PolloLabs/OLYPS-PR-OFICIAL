import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import type {
  UUID,
  SubscriptionPlan,
  PublicPlanCard,
  PlanStatus,
  PlanBillingPeriod,
  CreatePlanPayload,
  UpdatePlanPayload,
} from '../../types/index.js';

interface DatabasePlanRow {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price_cents: number;
  billing_period: string;
  duration_days: number;
  is_free: boolean;
  is_public: boolean;
  is_featured: boolean;
  display_order: number;
  status: string;
  features: string[] | null;
  limits: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function mapPlanRow(row: DatabasePlanRow): SubscriptionPlan {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    priceCents: row.price_cents ?? 0,
    billingPeriod: (row.billing_period as PlanBillingPeriod) || 'monthly',
    durationDays: row.duration_days ?? (row.is_free ? 0 : 30),
    isFree: Boolean(row.is_free),
    isPublic: Boolean(row.is_public),
    isFeatured: Boolean(row.is_featured),
    displayOrder: row.display_order ?? 0,
    status: (row.status as PlanStatus) || 'active',
    features: Array.isArray(row.features) ? row.features : [],
    limits: typeof row.limits === 'object' && row.limits !== null ? row.limits : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapToPublicCard(plan: SubscriptionPlan): PublicPlanCard {
  return {
    id: plan.id,
    name: plan.name,
    code: plan.code,
    description: plan.description,
    priceCents: plan.priceCents,
    billingPeriod: plan.billingPeriod,
    durationDays: plan.durationDays,
    isFree: plan.isFree,
    isFeatured: plan.isFeatured,
    displayOrder: plan.displayOrder,
    features: plan.features,
    limits: plan.limits,
  };
}

// Fallback seed plans when database connection is unavailable in local dev testing
const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Gratuito',
    code: 'free',
    description: 'Plano de degustação essencial para começar o controle da sua empresa sem custo.',
    priceCents: 0,
    billingPeriod: 'monthly',
    durationDays: 0,
    isFree: true,
    isPublic: true,
    isFeatured: false,
    displayOrder: 1,
    status: 'active',
    features: [
      '1 Usuário incluído',
      '1 Local Comercial (Matriz)',
      'Até 50 Produtos cadastrados',
      'Gestão básica de clientes',
      'Sem prazo de expiração obrigatório',
    ],
    limits: {
      max_users: 1,
      max_locations: 1,
      max_products: 50,
      max_clients: 100,
      has_nfe: false,
      has_pdv: false,
      reparar: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Básico',
    code: 'basic',
    description: 'Ideal para profissionais autônomos, assistências técnicas e pequenas lojas.',
    priceCents: 4900,
    billingPeriod: 'monthly',
    durationDays: 30,
    isFree: false,
    isPublic: true,
    isFeatured: false,
    displayOrder: 2,
    status: 'active',
    features: [
      'Até 3 Usuários',
      '1 Local Comercial (Matriz)',
      'Até 500 Produtos cadastrados',
      'PDV Frente de Caixa Rápido',
      'Gestão Financeira e Contas',
    ],
    limits: {
      max_users: 3,
      max_locations: 1,
      max_products: 500,
      max_clients: 1000,
      has_nfe: false,
      has_pdv: true,
      reparar: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Profissional',
    code: 'pro',
    description: 'O plano mais completo para lojas, assistências e comércios em expansão acelerada.',
    priceCents: 9900,
    billingPeriod: 'monthly',
    durationDays: 30,
    isFree: false,
    isPublic: true,
    isFeatured: true,
    displayOrder: 3,
    status: 'active',
    features: [
      'Até 10 Usuários com controle de permissões',
      'Até 3 Locais Comerciais (Matriz + 2 Filiais)',
      'Produtos e Clientes ilimitados',
      'Emissão Fiscal (NFC-e / NF-e)',
      'PDV Frente de Caixa Multi-operador',
      'Módulo de Reparos & Garantias Completo',
      'Suporte Prioritário via WhatsApp',
    ],
    limits: {
      max_users: 10,
      max_locations: 3,
      max_products: 10000,
      max_clients: 10000,
      has_nfe: true,
      has_pdv: true,
      reparar: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Premium Enterprise',
    code: 'premium',
    description: 'Potência máxima para grandes redes, franquias e operações corporativas de alto volume.',
    priceCents: 19900,
    billingPeriod: 'monthly',
    durationDays: 30,
    isFree: false,
    isPublic: true,
    isFeatured: false,
    displayOrder: 4,
    status: 'active',
    features: [
      'Usuários Ilimitados',
      'Locais Comerciais e Filiais Ilimitados',
      'Estoque Multi-filial com Transferências em Tempo Real',
      'Emissão Fiscal Ilimitada',
      'Auditoria de Logs e Governança Corporativa',
      'Gerente de Contas Dedicado VIP',
    ],
    limits: {
      max_users: 9999,
      max_locations: 999,
      max_products: 999999,
      max_clients: 999999,
      has_nfe: true,
      has_pdv: true,
      reparar: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Service managing subscription plans lifecycle, public landing page cards,
 * and Super Admin configuration.
 */
export class SubscriptionPlanService {
  /**
   * Retrieves sanitized public commercial plans for the Landing Page.
   * Only returns plans with status = 'active' and is_public = true,
   * sorted by display_order ASC.
   */
  public static async getPublicPlans(): Promise<PublicPlanCard[]> {
    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_PLANS
        .filter((p) => p.status === 'active' && p.isPublic)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(mapToPublicCard);
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('status', 'active')
        .eq('is_public', true)
        .order('display_order', { ascending: true });

      if (error || !data) {
        console.warn(`[WARN] Erro ao consultar planos públicos: ${error?.message}`);
        return FALLBACK_PLANS
          .filter((p) => p.status === 'active' && p.isPublic)
          .map(mapToPublicCard);
      }

      const rows = data as unknown as DatabasePlanRow[];
      return rows.map((row) => mapToPublicCard(mapPlanRow(row)));
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao consultar planos públicos: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return FALLBACK_PLANS
        .filter((p) => p.status === 'active' && p.isPublic)
        .map(mapToPublicCard);
    }
  }

  /**
   * Lists all plans for the Super Admin management console.
   * Includes active, inactive, and archived plans.
   */
  public static async listPlans(params?: {
    status?: PlanStatus | 'all';
    search?: string;
  }): Promise<SubscriptionPlan[]> {
    if (!isSupabaseAdminConfigured()) {
      let result = [...FALLBACK_PLANS];
      if (params?.status && params.status !== 'all') {
        result = result.filter((p) => p.status === params.status);
      }
      if (params?.search && params.search.trim().length > 0) {
        const term = params.search.trim().toLowerCase();
        result = result.filter((p) => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term));
      }
      return result.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      if (params?.search && params.search.trim().length > 0) {
        const sanitized = params.search.trim().replace(/[%_]/g, '');
        if (sanitized.length > 0) {
          query = query.or(`name.ilike.%${sanitized}%,code.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
        }
      }

      const { data, error } = await query;

      if (error || !data) {
        console.warn(`[WARN] Erro ao listar planos administrativos: ${error?.message}`);
        return FALLBACK_PLANS;
      }

      const rows = data as unknown as DatabasePlanRow[];
      return rows.map(mapPlanRow);
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao listar planos administrativos: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return FALLBACK_PLANS;
    }
  }

  /**
   * Fetches single plan by its unique ID.
   */
  public static async getPlanById(planId: UUID): Promise<SubscriptionPlan | null> {
    if (!planId) return null;

    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_PLANS.find((p) => p.id === planId) || null;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();

      if (error || !data) return null;
      return mapPlanRow(data as unknown as DatabasePlanRow);
    } catch {
      return null;
    }
  }

  /**
   * Fetches single plan by its unique code (e.g. 'free', 'basic', 'pro', 'premium').
   */
  public static async getPlanByCode(code: string): Promise<SubscriptionPlan | null> {
    if (!code) return null;

    const normalizedCode = code.trim().toLowerCase();

    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_PLANS.find((p) => p.code.toLowerCase() === normalizedCode) || null;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('code', normalizedCode)
        .maybeSingle();

      if (error || !data) return null;
      return mapPlanRow(data as unknown as DatabasePlanRow);
    } catch {
      return null;
    }
  }

  /**
   * Creates a new subscription plan with full validation.
   */
  public static async createPlan(payload: CreatePlanPayload): Promise<{
    success: boolean;
    data?: SubscriptionPlan;
    error?: string;
  }> {
    if (!payload.name || payload.name.trim().length === 0) {
      return { success: false, error: 'O nome do plano é obrigatório.' };
    }

    if (!payload.code || payload.code.trim().length === 0) {
      return { success: false, error: 'O código único do plano é obrigatório.' };
    }

    const normalizedCode = payload.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    if (payload.priceCents !== undefined && payload.priceCents < 0) {
      return { success: false, error: 'O preço do plano não pode ser negativo.' };
    }

    const durationDays = payload.isFree
      ? 0
      : (typeof payload.durationDays === 'number' && payload.durationDays >= 0 ? payload.durationDays : 30);

    if (!isSupabaseAdminConfigured()) {
      // Check existing in fallback
      const exists = FALLBACK_PLANS.some((p) => p.code.toLowerCase() === normalizedCode);
      if (exists) {
        return { success: false, error: `Já existe um plano com o código "${normalizedCode}".` };
      }

      const fallbackId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `550e8400-e29b-41d4-a716-${Math.random().toString(16).substring(2, 14).padEnd(12, '0')}`;

      const newPlan: SubscriptionPlan = {
        id: fallbackId,
        name: payload.name.trim(),
        code: normalizedCode,
        description: payload.description?.trim() || null,
        priceCents: payload.isFree ? 0 : (payload.priceCents ?? 0),
        billingPeriod: payload.billingPeriod || 'monthly',
        durationDays,
        isFree: Boolean(payload.isFree),
        isPublic: payload.isPublic !== undefined ? Boolean(payload.isPublic) : true,
        isFeatured: Boolean(payload.isFeatured),
        displayOrder: payload.displayOrder ?? (FALLBACK_PLANS.length + 1),
        status: payload.status || 'active',
        features: Array.isArray(payload.features) ? payload.features : [],
        limits: typeof payload.limits === 'object' && payload.limits !== null ? payload.limits : {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      FALLBACK_PLANS.push(newPlan);
      return { success: true, data: newPlan };
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Check unique code
      const existing = await this.getPlanByCode(normalizedCode);
      if (existing) {
        return { success: false, error: `Já existe um plano cadastrado com o código "${normalizedCode}".` };
      }

      const insertData = {
        name: payload.name.trim(),
        code: normalizedCode,
        description: payload.description?.trim() || null,
        price_cents: payload.isFree ? 0 : Math.max(0, payload.priceCents ?? 0),
        billing_period: payload.billingPeriod || 'monthly',
        duration_days: durationDays,
        is_free: Boolean(payload.isFree),
        is_public: payload.isPublic !== undefined ? Boolean(payload.isPublic) : true,
        is_featured: Boolean(payload.isFeatured),
        display_order: payload.displayOrder ?? 10,
        status: payload.status || 'active',
        features: Array.isArray(payload.features) ? payload.features : [],
        limits: typeof payload.limits === 'object' && payload.limits !== null ? payload.limits : {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .insert(insertData)
        .select('*')
        .single();

      if (error || !data) {
        return { success: false, error: `Falha ao criar plano: ${error?.message || 'Erro desconhecido'}` };
      }

      return { success: true, data: mapPlanRow(data as unknown as DatabasePlanRow) };
    } catch (err: unknown) {
      return { success: false, error: `Exceção ao cadastrar plano: ${err instanceof Error ? err.message : 'Erro interno'}` };
    }
  }

  /**
   * Updates an existing subscription plan.
   */
  public static async updatePlan(
    planId: UUID,
    payload: UpdatePlanPayload
  ): Promise<{ success: boolean; data?: SubscriptionPlan; error?: string }> {
    if (!planId) {
      return { success: false, error: 'ID do plano não fornecido.' };
    }

    if (!isSupabaseAdminConfigured()) {
      const index = FALLBACK_PLANS.findIndex((p) => p.id === planId);
      if (index === -1) {
        return { success: false, error: 'Plano não encontrado.' };
      }

      const current = FALLBACK_PLANS[index];
      const updated: SubscriptionPlan = {
        ...current,
        name: payload.name !== undefined ? payload.name.trim() : current.name,
        description: payload.description !== undefined ? payload.description?.trim() || null : current.description,
        priceCents: payload.priceCents !== undefined ? Math.max(0, payload.priceCents) : current.priceCents,
        billingPeriod: payload.billingPeriod || current.billingPeriod,
        durationDays: payload.durationDays !== undefined ? Math.max(0, payload.durationDays) : current.durationDays,
        isFree: payload.isFree !== undefined ? Boolean(payload.isFree) : current.isFree,
        isPublic: payload.isPublic !== undefined ? Boolean(payload.isPublic) : current.isPublic,
        isFeatured: payload.isFeatured !== undefined ? Boolean(payload.isFeatured) : current.isFeatured,
        displayOrder: payload.displayOrder !== undefined ? payload.displayOrder : current.displayOrder,
        status: payload.status || current.status,
        features: payload.features !== undefined ? payload.features : current.features,
        limits: payload.limits !== undefined ? payload.limits : current.limits,
        updatedAt: new Date().toISOString(),
      };
      FALLBACK_PLANS[index] = updated;
      return { success: true, data: updated };
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const existing = await this.getPlanById(planId);
      if (!existing) {
        return { success: false, error: 'Plano não encontrado.' };
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.name !== undefined) updateData.name = payload.name.trim();
      if (payload.description !== undefined) updateData.description = payload.description?.trim() || null;
      if (payload.priceCents !== undefined) updateData.price_cents = Math.max(0, payload.priceCents);
      if (payload.billingPeriod !== undefined) updateData.billing_period = payload.billingPeriod;
      if (payload.durationDays !== undefined) updateData.duration_days = Math.max(0, payload.durationDays);
      if (payload.isFree !== undefined) updateData.is_free = Boolean(payload.isFree);
      if (payload.isPublic !== undefined) updateData.is_public = Boolean(payload.isPublic);
      if (payload.isFeatured !== undefined) updateData.is_featured = Boolean(payload.isFeatured);
      if (payload.displayOrder !== undefined) updateData.display_order = payload.displayOrder;
      if (payload.status !== undefined) updateData.status = payload.status;
      if (payload.features !== undefined) updateData.features = payload.features;
      if (payload.limits !== undefined) updateData.limits = payload.limits;

      // Handle code change check
      if (payload.code && payload.code.trim().toLowerCase() !== existing.code.toLowerCase()) {
        const newCode = payload.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const conflict = await this.getPlanByCode(newCode);
        if (conflict && conflict.id !== planId) {
          return { success: false, error: `Já existe outro plano com o código "${newCode}".` };
        }
        updateData.code = newCode;
      }

      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .update(updateData)
        .eq('id', planId)
        .select('*')
        .single();

      if (error || !data) {
        return { success: false, error: `Falha ao atualizar plano: ${error?.message || 'Erro desconhecido'}` };
      }

      return { success: true, data: mapPlanRow(data as unknown as DatabasePlanRow) };
    } catch (err: unknown) {
      return { success: false, error: `Exceção ao atualizar plano: ${err instanceof Error ? err.message : 'Erro interno'}` };
    }
  }

  /**
   * Updates operational status of a plan ('active', 'inactive', 'archived').
   */
  public static async updatePlanStatus(
    planId: UUID,
    status: PlanStatus
  ): Promise<{ success: boolean; data?: SubscriptionPlan; error?: string }> {
    const validStatuses: PlanStatus[] = ['active', 'inactive', 'archived'];
    if (!validStatuses.includes(status)) {
      return { success: false, error: `Status inválido. Permitidos: ${validStatuses.join(', ')}` };
    }

    return this.updatePlan(planId, { status });
  }
}
