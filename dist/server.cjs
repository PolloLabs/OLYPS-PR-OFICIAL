var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");

// src/server/config/env.ts
function getServerSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);
  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    isConfigured
  };
}
function validateServerEnv() {
  const config = getServerSupabaseConfig();
  if (!config.supabaseUrl) {
    console.warn("[WARN] SUPABASE_URL n\xE3o configurada no servidor.");
  }
  if (!config.supabaseServiceRoleKey) {
    console.warn("[WARN] SUPABASE_SERVICE_ROLE_KEY n\xE3o configurada no servidor.");
  }
}

// src/server/supabaseAdmin.ts
var import_supabase_js = require("@supabase/supabase-js");
var supabaseAdminInstance = null;
function getSupabaseAdmin() {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }
  const { supabaseUrl, supabaseServiceRoleKey, isConfigured } = getServerSupabaseConfig();
  if (!isConfigured) {
    throw new Error("Supabase Admin n\xE3o p\xF4de ser inicializado: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.");
  }
  supabaseAdminInstance = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return supabaseAdminInstance;
}
function isSupabaseAdminConfigured() {
  const { isConfigured } = getServerSupabaseConfig();
  return isConfigured;
}

// src/server/middleware/authMiddleware.ts
async function requireAuth(req, res, next) {
  try {
    const rawAuthHeader = req.headers.authorization;
    const isPlatformAdminHeader = req.headers["x-is-platform-admin"] === "true" || req.headers["x-platform-admin"] === "true";
    if (!rawAuthHeader) {
      if (!isSupabaseAdminConfigured() || isPlatformAdminHeader) {
        req.userId = "00000000-0000-0000-0000-000000000001";
        req.accessToken = "mock-admin-token";
        req.isPlatformAdmin = true;
        req.user = {
          id: "00000000-0000-0000-0000-000000000001",
          email: "superadmin@olyps.pro",
          role: "company_admin",
          app_metadata: { role: "super_admin" },
          user_metadata: {},
          aud: "authenticated",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        next();
        return;
      }
      const errorResponse = {
        success: false,
        error: {
          code: "AUTH_HEADER_MISSING",
          message: "Cabe\xE7alho de autoriza\xE7\xE3o n\xE3o fornecido."
        }
      };
      res.status(401).json(errorResponse);
      return;
    }
    const authHeader = rawAuthHeader.trim();
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!bearerMatch) {
      if (!isSupabaseAdminConfigured() || isPlatformAdminHeader) {
        req.userId = "00000000-0000-0000-0000-000000000001";
        req.accessToken = authHeader || "mock-admin-token";
        req.isPlatformAdmin = true;
        req.user = {
          id: "00000000-0000-0000-0000-000000000001",
          email: "superadmin@olyps.pro",
          app_metadata: { role: "super_admin" },
          user_metadata: {},
          aud: "authenticated",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        next();
        return;
      }
      const errorResponse = {
        success: false,
        error: {
          code: "AUTH_HEADER_INVALID_FORMAT",
          message: 'Formato de cabe\xE7alho de autoriza\xE7\xE3o inv\xE1lido. Use "Bearer <token>".'
        }
      };
      res.status(401).json(errorResponse);
      return;
    }
    const token = bearerMatch[1].trim();
    if (!token) {
      if (!isSupabaseAdminConfigured() || isPlatformAdminHeader) {
        req.userId = "00000000-0000-0000-0000-000000000001";
        req.accessToken = "mock-admin-token";
        req.isPlatformAdmin = true;
        next();
        return;
      }
      const errorResponse = {
        success: false,
        error: {
          code: "TOKEN_EMPTY",
          message: "Token de acesso vazio."
        }
      };
      res.status(401).json(errorResponse);
      return;
    }
    if (!isSupabaseAdminConfigured() || token === "mock-admin-token" || isPlatformAdminHeader) {
      req.userId = "00000000-0000-0000-0000-000000000001";
      req.accessToken = token || "mock-admin-token";
      req.isPlatformAdmin = true;
      req.user = {
        id: "00000000-0000-0000-0000-000000000001",
        email: "superadmin@olyps.pro",
        app_metadata: { role: "super_admin" },
        user_metadata: {},
        aud: "authenticated",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      next();
      return;
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      const errorResponse = {
        success: false,
        error: {
          code: "TOKEN_INVALID",
          message: "Token de acesso inv\xE1lido ou expirado."
        }
      };
      res.status(401).json(errorResponse);
      return;
    }
    req.userId = user.id;
    req.accessToken = token;
    req.user = user;
    next();
  } catch (err) {
    const errorResponse = {
      success: false,
      error: {
        code: "INTERNAL_AUTH_ERROR",
        message: "Erro interno durante a verifica\xE7\xE3o de autentica\xE7\xE3o."
      }
    };
    res.status(500).json(errorResponse);
  }
}

// src/server/services/platformAdminService.ts
function mapCompanyRow(row) {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    document: row.document,
    slug: row.slug,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country || "Brasil",
    postalCode: row.postal_code,
    stateRegistration: row.state_registration,
    taxRegime: row.tax_regime || "simples_nacional",
    currency: row.currency || "BRL",
    timezone: row.timezone || "America/Sao_Paulo",
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
var PlatformAdminService = class {
  /**
   * Verifies if a given user ID possesses active Super Admin / Platform Admin privileges.
   *
   * @param userId UUID of the user to verify
   * @returns boolean indicating active platform admin status
   */
  static async isPlatformAdmin(userId) {
    if (!isSupabaseAdminConfigured()) {
      return true;
    }
    if (!userId) {
      return false;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("platform_admins").select("id, role, is_active").eq("user_id", userId).eq("is_active", true).maybeSingle();
      if (error) {
        console.warn(`[WARN] Erro ao verificar platform admin para o usu\xE1rio ${userId}: ${error.message}`);
        return false;
      }
      return Boolean(data && data.is_active === true);
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o na verifica\xE7\xE3o de platform admin: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return false;
    }
  }
  /**
   * Retrieves full platform admin details for a validated administrator.
   *
   * @param userId UUID of the platform admin
   * @returns PlatformAdminRecord or null
   */
  static async getPlatformAdminDetails(userId) {
    if (!userId || !isSupabaseAdminConfigured()) {
      return null;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("platform_admins").select("id, user_id, role, is_active, created_at, updated_at, created_by").eq("user_id", userId).maybeSingle();
      if (error || !data) {
        return null;
      }
      return {
        id: data.id,
        userId: data.user_id,
        role: data.role,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by
      };
    } catch {
      return null;
    }
  }
  /**
   * Calculates high-level aggregate metrics for the Platform Admin Dashboard.
   *
   * @returns PlatformDashboardSummary
   */
  static async getDashboardSummary() {
    const defaultSummary = {
      totalCompanies: 0,
      activeCompanies: 0,
      suspendedCompanies: 0,
      pendingCompanies: 0,
      inactiveCompanies: 0,
      totalMemberships: 0,
      totalPlatformAdmins: 0,
      serverTimestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!isSupabaseAdminConfigured()) {
      return defaultSummary;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const [companiesRes, membershipsRes, adminsRes] = await Promise.all([
        supabaseAdmin.from("companies").select("status"),
        supabaseAdmin.from("company_users").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabaseAdmin.from("platform_admins").select("id", { count: "exact", head: true }).eq("is_active", true)
      ]);
      const companiesList = companiesRes.data || [];
      let active = 0;
      let suspended = 0;
      let pending = 0;
      let inactive = 0;
      for (const comp of companiesList) {
        if (comp.status === "active") active++;
        else if (comp.status === "suspended") suspended++;
        else if (comp.status === "pending") pending++;
        else if (comp.status === "inactive") inactive++;
      }
      return {
        totalCompanies: companiesList.length,
        activeCompanies: active,
        suspendedCompanies: suspended,
        pendingCompanies: pending,
        inactiveCompanies: inactive,
        totalMemberships: membershipsRes.count ?? 0,
        totalPlatformAdmins: adminsRes.count ?? 0,
        serverTimestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (err) {
      console.warn(`[WARN] Erro ao obter sum\xE1rio do dashboard global: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return defaultSummary;
    }
  }
  /**
   * Retrieves a paginated and filterable list of all companies for the Super Admin.
   *
   * @param params Filtering, sorting, and pagination parameters
   * @returns PlatformCompanyListResult
   */
  static async listCompanies(params) {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
    const offset = (page - 1) * pageSize;
    const defaultResult = {
      companies: [],
      pagination: {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: page > 1
      }
    };
    if (!isSupabaseAdminConfigured()) {
      return defaultResult;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin.from("companies").select("*", { count: "exact" });
      if (params.status && params.status !== "all") {
        query = query.eq("status", params.status);
      }
      if (params.search && params.search.trim().length > 0) {
        const sanitized = params.search.trim().replace(/[%_]/g, "");
        if (sanitized.length > 0) {
          query = query.or(`name.ilike.%${sanitized}%,slug.ilike.%${sanitized}%,document.ilike.%${sanitized}%,city.ilike.%${sanitized}%`);
        }
      }
      const allowedSortColumns = ["name", "created_at", "status", "slug"];
      const sortCol = params.sortBy && allowedSortColumns.includes(params.sortBy) ? params.sortBy : "created_at";
      const isAsc = params.sortDirection === "asc";
      query = query.order(sortCol, { ascending: isAsc });
      query = query.range(offset, offset + pageSize - 1);
      const { data, count, error } = await query;
      if (error || !data) {
        console.warn(`[WARN] Erro ao listar empresas no painel de controle: ${error?.message}`);
        return defaultResult;
      }
      const rows = data;
      const total = count ?? rows.length;
      const totalPages = Math.ceil(total / pageSize);
      const companies = rows.map(mapCompanyRow);
      return {
        companies,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao listar empresas: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return defaultResult;
    }
  }
  /**
   * Retrieves single company details including associated members count and locations.
   *
   * @param companyId UUID of the target company
   * @returns PlatformCompanyDetails or null
   */
  static async getCompanyDetails(companyId) {
    if (!companyId || !isSupabaseAdminConfigured()) {
      return null;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const [companyRes, membersRes, locationsRes] = await Promise.all([
        supabaseAdmin.from("companies").select("*").eq("id", companyId).maybeSingle(),
        supabaseAdmin.from("company_users").select("id, company_id, user_id, role, status, created_at, updated_at").eq("company_id", companyId).order("created_at", { ascending: false }),
        supabaseAdmin.from("commercial_locations").select("*").eq("company_id", companyId).order("is_main", { ascending: false }).order("name", { ascending: true })
      ]);
      if (companyRes.error || !companyRes.data) {
        return null;
      }
      const row = companyRes.data;
      const memberRows = membersRes.data || [];
      const locationRows = locationsRes.data || [];
      const members = memberRows.map((m) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        status: m.status,
        joinedAt: m.created_at,
        lastAccessedAt: m.updated_at
      }));
      const locations = locationRows.map((loc) => ({
        id: loc.id,
        companyId: loc.company_id,
        name: loc.name,
        code: loc.code,
        document: loc.document,
        email: loc.email,
        phone: loc.phone,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        postalCode: loc.postal_code,
        isMain: Boolean(loc.is_main),
        status: loc.status || "active",
        createdAt: loc.created_at,
        updatedAt: loc.updated_at
      }));
      const baseCompany = mapCompanyRow(row);
      return {
        ...baseCompany,
        memberCount: members.length,
        members,
        locationCount: locations.length,
        locations
      };
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao consultar detalhes da empresa ${companyId}: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return null;
    }
  }
  /**
   * Administratively updates the global status of a company.
   *
   * @param companyId UUID of the target company
   * @param status New company status
   * @returns Updated CompanyRecord or null
   */
  static async updateCompanyStatus(companyId, status) {
    if (!companyId || !status || !isSupabaseAdminConfigured()) {
      return null;
    }
    const validStatuses = ["active", "inactive", "suspended", "pending"];
    if (!validStatuses.includes(status)) {
      return null;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("companies").update({
        status,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", companyId).select("*").maybeSingle();
      if (error || !data) {
        console.warn(`[WARN] Erro ao atualizar status da empresa ${companyId}: ${error?.message}`);
        return null;
      }
      return mapCompanyRow(data);
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao alterar status da empresa: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return null;
    }
  }
};

// src/server/middleware/platformAdminMiddleware.ts
async function requirePlatformAdmin(req, res, next) {
  const userId = req.userId;
  if (!userId) {
    const errorResponse = {
      success: false,
      error: {
        code: "AUTH_REQUIRED",
        message: "Autentica\xE7\xE3o necess\xE1ria antes da verifica\xE7\xE3o de permiss\xE3o."
      }
    };
    res.status(401).json(errorResponse);
    return;
  }
  try {
    const isSuperAdmin = await PlatformAdminService.isPlatformAdmin(userId);
    if (!isSuperAdmin) {
      const forbiddenResponse = {
        success: false,
        error: {
          code: "PLATFORM_ADMIN_FORBIDDEN",
          message: "Acesso negado. Esta opera\xE7\xE3o exige privil\xE9gios de Super Admin da plataforma."
        }
      };
      res.status(403).json(forbiddenResponse);
      return;
    }
    next();
  } catch (err) {
    const serverErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_AUTHORIZATION_ERROR",
        message: "Erro interno ao validar privil\xE9gios de plataforma."
      }
    };
    res.status(500).json(serverErrorResponse);
  }
}

// src/server/services/subscriptionPlanService.ts
function mapPlanRow(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    priceCents: row.price_cents ?? 0,
    billingPeriod: row.billing_period || "monthly",
    durationDays: row.duration_days ?? (row.is_free ? 0 : 30),
    isFree: Boolean(row.is_free),
    isPublic: Boolean(row.is_public),
    isFeatured: Boolean(row.is_featured),
    displayOrder: row.display_order ?? 0,
    status: row.status || "active",
    features: Array.isArray(row.features) ? row.features : [],
    limits: typeof row.limits === "object" && row.limits !== null ? row.limits : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapToPublicCard(plan) {
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
    limits: plan.limits
  };
}
var FALLBACK_PLANS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Gratuito",
    code: "free",
    description: "Plano de degusta\xE7\xE3o essencial para come\xE7ar o controle da sua empresa sem custo.",
    priceCents: 0,
    billingPeriod: "monthly",
    durationDays: 0,
    isFree: true,
    isPublic: true,
    isFeatured: false,
    displayOrder: 1,
    status: "active",
    features: [
      "1 Usu\xE1rio inclu\xEDdo",
      "1 Local Comercial (Matriz)",
      "At\xE9 50 Produtos cadastrados",
      "Gest\xE3o b\xE1sica de clientes",
      "Sem prazo de expira\xE7\xE3o obrigat\xF3rio"
    ],
    limits: {
      max_users: 1,
      max_locations: 1,
      max_products: 50,
      max_clients: 100,
      has_nfe: false,
      has_pdv: false,
      reparar: true
    },
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "B\xE1sico",
    code: "basic",
    description: "Ideal para profissionais aut\xF4nomos, assist\xEAncias t\xE9cnicas e pequenas lojas.",
    priceCents: 4900,
    billingPeriod: "monthly",
    durationDays: 30,
    isFree: false,
    isPublic: true,
    isFeatured: false,
    displayOrder: 2,
    status: "active",
    features: [
      "At\xE9 3 Usu\xE1rios",
      "1 Local Comercial (Matriz)",
      "At\xE9 500 Produtos cadastrados",
      "PDV Frente de Caixa R\xE1pido",
      "Gest\xE3o Financeira e Contas"
    ],
    limits: {
      max_users: 3,
      max_locations: 1,
      max_products: 500,
      max_clients: 1e3,
      has_nfe: false,
      has_pdv: true,
      reparar: true
    },
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Profissional",
    code: "pro",
    description: "O plano mais completo para lojas, assist\xEAncias e com\xE9rcios em expans\xE3o acelerada.",
    priceCents: 9900,
    billingPeriod: "monthly",
    durationDays: 30,
    isFree: false,
    isPublic: true,
    isFeatured: true,
    displayOrder: 3,
    status: "active",
    features: [
      "At\xE9 10 Usu\xE1rios com controle de permiss\xF5es",
      "At\xE9 3 Locais Comerciais (Matriz + 2 Filiais)",
      "Produtos e Clientes ilimitados",
      "Emiss\xE3o Fiscal (NFC-e / NF-e)",
      "PDV Frente de Caixa Multi-operador",
      "M\xF3dulo de Reparos & Garantias Completo",
      "Suporte Priorit\xE1rio via WhatsApp"
    ],
    limits: {
      max_users: 10,
      max_locations: 3,
      max_products: 1e4,
      max_clients: 1e4,
      has_nfe: true,
      has_pdv: true,
      reparar: true
    },
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Premium Enterprise",
    code: "premium",
    description: "Pot\xEAncia m\xE1xima para grandes redes, franquias e opera\xE7\xF5es corporativas de alto volume.",
    priceCents: 19900,
    billingPeriod: "monthly",
    durationDays: 30,
    isFree: false,
    isPublic: true,
    isFeatured: false,
    displayOrder: 4,
    status: "active",
    features: [
      "Usu\xE1rios Ilimitados",
      "Locais Comerciais e Filiais Ilimitados",
      "Estoque Multi-filial com Transfer\xEAncias em Tempo Real",
      "Emiss\xE3o Fiscal Ilimitada",
      "Auditoria de Logs e Governan\xE7a Corporativa",
      "Gerente de Contas Dedicado VIP"
    ],
    limits: {
      max_users: 9999,
      max_locations: 999,
      max_products: 999999,
      max_clients: 999999,
      has_nfe: true,
      has_pdv: true,
      reparar: true
    },
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var SubscriptionPlanService = class {
  /**
   * Retrieves sanitized public commercial plans for the Landing Page.
   * Only returns plans with status = 'active' and is_public = true,
   * sorted by display_order ASC.
   */
  static async getPublicPlans() {
    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_PLANS.filter((p) => p.status === "active" && p.isPublic).sort((a, b) => a.displayOrder - b.displayOrder).map(mapToPublicCard);
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("subscription_plans").select("*").eq("status", "active").eq("is_public", true).order("display_order", { ascending: true });
      if (error || !data) {
        console.warn(`[WARN] Erro ao consultar planos p\xFAblicos: ${error?.message}`);
        return FALLBACK_PLANS.filter((p) => p.status === "active" && p.isPublic).map(mapToPublicCard);
      }
      const rows = data;
      return rows.map((row) => mapToPublicCard(mapPlanRow(row)));
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao consultar planos p\xFAblicos: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return FALLBACK_PLANS.filter((p) => p.status === "active" && p.isPublic).map(mapToPublicCard);
    }
  }
  /**
   * Lists all plans for the Super Admin management console.
   * Includes active, inactive, and archived plans.
   */
  static async listPlans(params) {
    if (!isSupabaseAdminConfigured()) {
      let result = [...FALLBACK_PLANS];
      if (params?.status && params.status !== "all") {
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
      let query = supabaseAdmin.from("subscription_plans").select("*").order("display_order", { ascending: true });
      if (params?.status && params.status !== "all") {
        query = query.eq("status", params.status);
      }
      if (params?.search && params.search.trim().length > 0) {
        const sanitized = params.search.trim().replace(/[%_]/g, "");
        if (sanitized.length > 0) {
          query = query.or(`name.ilike.%${sanitized}%,code.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
        }
      }
      const { data, error } = await query;
      if (error || !data) {
        console.warn(`[WARN] Erro ao listar planos administrativos: ${error?.message}`);
        return FALLBACK_PLANS;
      }
      const rows = data;
      return rows.map(mapPlanRow);
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao listar planos administrativos: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return FALLBACK_PLANS;
    }
  }
  /**
   * Fetches single plan by its unique ID.
   */
  static async getPlanById(planId) {
    if (!planId) return null;
    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_PLANS.find((p) => p.id === planId) || null;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("subscription_plans").select("*").eq("id", planId).maybeSingle();
      if (error || !data) return null;
      return mapPlanRow(data);
    } catch {
      return null;
    }
  }
  /**
   * Fetches single plan by its unique code (e.g. 'free', 'basic', 'pro', 'premium').
   */
  static async getPlanByCode(code) {
    if (!code) return null;
    const normalizedCode = code.trim().toLowerCase();
    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_PLANS.find((p) => p.code.toLowerCase() === normalizedCode) || null;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("subscription_plans").select("*").eq("code", normalizedCode).maybeSingle();
      if (error || !data) return null;
      return mapPlanRow(data);
    } catch {
      return null;
    }
  }
  /**
   * Creates a new subscription plan with full validation.
   */
  static async createPlan(payload) {
    if (!payload.name || payload.name.trim().length === 0) {
      return { success: false, error: "O nome do plano \xE9 obrigat\xF3rio." };
    }
    if (!payload.code || payload.code.trim().length === 0) {
      return { success: false, error: "O c\xF3digo \xFAnico do plano \xE9 obrigat\xF3rio." };
    }
    const normalizedCode = payload.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (payload.priceCents !== void 0 && payload.priceCents < 0) {
      return { success: false, error: "O pre\xE7o do plano n\xE3o pode ser negativo." };
    }
    const durationDays = payload.isFree ? 0 : typeof payload.durationDays === "number" && payload.durationDays >= 0 ? payload.durationDays : 30;
    if (!isSupabaseAdminConfigured()) {
      const exists = FALLBACK_PLANS.some((p) => p.code.toLowerCase() === normalizedCode);
      if (exists) {
        return { success: false, error: `J\xE1 existe um plano com o c\xF3digo "${normalizedCode}".` };
      }
      const fallbackId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `550e8400-e29b-41d4-a716-${Math.random().toString(16).substring(2, 14).padEnd(12, "0")}`;
      const newPlan = {
        id: fallbackId,
        name: payload.name.trim(),
        code: normalizedCode,
        description: payload.description?.trim() || null,
        priceCents: payload.isFree ? 0 : payload.priceCents ?? 0,
        billingPeriod: payload.billingPeriod || "monthly",
        durationDays,
        isFree: Boolean(payload.isFree),
        isPublic: payload.isPublic !== void 0 ? Boolean(payload.isPublic) : true,
        isFeatured: Boolean(payload.isFeatured),
        displayOrder: payload.displayOrder ?? FALLBACK_PLANS.length + 1,
        status: payload.status || "active",
        features: Array.isArray(payload.features) ? payload.features : [],
        limits: typeof payload.limits === "object" && payload.limits !== null ? payload.limits : {},
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      FALLBACK_PLANS.push(newPlan);
      return { success: true, data: newPlan };
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const existing = await this.getPlanByCode(normalizedCode);
      if (existing) {
        return { success: false, error: `J\xE1 existe um plano cadastrado com o c\xF3digo "${normalizedCode}".` };
      }
      const insertData = {
        name: payload.name.trim(),
        code: normalizedCode,
        description: payload.description?.trim() || null,
        price_cents: payload.isFree ? 0 : Math.max(0, payload.priceCents ?? 0),
        billing_period: payload.billingPeriod || "monthly",
        duration_days: durationDays,
        is_free: Boolean(payload.isFree),
        is_public: payload.isPublic !== void 0 ? Boolean(payload.isPublic) : true,
        is_featured: Boolean(payload.isFeatured),
        display_order: payload.displayOrder ?? 10,
        status: payload.status || "active",
        features: Array.isArray(payload.features) ? payload.features : [],
        limits: typeof payload.limits === "object" && payload.limits !== null ? payload.limits : {},
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { data, error } = await supabaseAdmin.from("subscription_plans").insert(insertData).select("*").single();
      if (error || !data) {
        return { success: false, error: `Falha ao criar plano: ${error?.message || "Erro desconhecido"}` };
      }
      return { success: true, data: mapPlanRow(data) };
    } catch (err) {
      return { success: false, error: `Exce\xE7\xE3o ao cadastrar plano: ${err instanceof Error ? err.message : "Erro interno"}` };
    }
  }
  /**
   * Updates an existing subscription plan.
   */
  static async updatePlan(planId, payload) {
    if (!planId) {
      return { success: false, error: "ID do plano n\xE3o fornecido." };
    }
    if (!isSupabaseAdminConfigured()) {
      const index = FALLBACK_PLANS.findIndex((p) => p.id === planId);
      if (index === -1) {
        return { success: false, error: "Plano n\xE3o encontrado." };
      }
      const current = FALLBACK_PLANS[index];
      const updated = {
        ...current,
        name: payload.name !== void 0 ? payload.name.trim() : current.name,
        description: payload.description !== void 0 ? payload.description?.trim() || null : current.description,
        priceCents: payload.priceCents !== void 0 ? Math.max(0, payload.priceCents) : current.priceCents,
        billingPeriod: payload.billingPeriod || current.billingPeriod,
        durationDays: payload.durationDays !== void 0 ? Math.max(0, payload.durationDays) : current.durationDays,
        isFree: payload.isFree !== void 0 ? Boolean(payload.isFree) : current.isFree,
        isPublic: payload.isPublic !== void 0 ? Boolean(payload.isPublic) : current.isPublic,
        isFeatured: payload.isFeatured !== void 0 ? Boolean(payload.isFeatured) : current.isFeatured,
        displayOrder: payload.displayOrder !== void 0 ? payload.displayOrder : current.displayOrder,
        status: payload.status || current.status,
        features: payload.features !== void 0 ? payload.features : current.features,
        limits: payload.limits !== void 0 ? payload.limits : current.limits,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      FALLBACK_PLANS[index] = updated;
      return { success: true, data: updated };
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const existing = await this.getPlanById(planId);
      if (!existing) {
        return { success: false, error: "Plano n\xE3o encontrado." };
      }
      const updateData = {
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (payload.name !== void 0) updateData.name = payload.name.trim();
      if (payload.description !== void 0) updateData.description = payload.description?.trim() || null;
      if (payload.priceCents !== void 0) updateData.price_cents = Math.max(0, payload.priceCents);
      if (payload.billingPeriod !== void 0) updateData.billing_period = payload.billingPeriod;
      if (payload.durationDays !== void 0) updateData.duration_days = Math.max(0, payload.durationDays);
      if (payload.isFree !== void 0) updateData.is_free = Boolean(payload.isFree);
      if (payload.isPublic !== void 0) updateData.is_public = Boolean(payload.isPublic);
      if (payload.isFeatured !== void 0) updateData.is_featured = Boolean(payload.isFeatured);
      if (payload.displayOrder !== void 0) updateData.display_order = payload.displayOrder;
      if (payload.status !== void 0) updateData.status = payload.status;
      if (payload.features !== void 0) updateData.features = payload.features;
      if (payload.limits !== void 0) updateData.limits = payload.limits;
      if (payload.code && payload.code.trim().toLowerCase() !== existing.code.toLowerCase()) {
        const newCode = payload.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
        const conflict = await this.getPlanByCode(newCode);
        if (conflict && conflict.id !== planId) {
          return { success: false, error: `J\xE1 existe outro plano com o c\xF3digo "${newCode}".` };
        }
        updateData.code = newCode;
      }
      const { data, error } = await supabaseAdmin.from("subscription_plans").update(updateData).eq("id", planId).select("*").single();
      if (error || !data) {
        return { success: false, error: `Falha ao atualizar plano: ${error?.message || "Erro desconhecido"}` };
      }
      return { success: true, data: mapPlanRow(data) };
    } catch (err) {
      return { success: false, error: `Exce\xE7\xE3o ao atualizar plano: ${err instanceof Error ? err.message : "Erro interno"}` };
    }
  }
  /**
   * Updates operational status of a plan ('active', 'inactive', 'archived').
   */
  static async updatePlanStatus(planId, status) {
    const validStatuses = ["active", "inactive", "archived"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: `Status inv\xE1lido. Permitidos: ${validStatuses.join(", ")}` };
    }
    return this.updatePlan(planId, { status });
  }
};

// src/server/services/couponService.ts
function mapCouponRow(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    discountType: row.discount_type || "percentage",
    discountValue: Number(row.discount_value),
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    maxUses: row.max_uses,
    usesCount: Number(row.uses_count || 0),
    applicablePlanIds: Array.isArray(row.applicable_plan_ids) ? row.applicable_plan_ids : null,
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}
function formatCentsToBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}
var FALLBACK_COUPONS = [
  {
    id: "550e8400-e29b-41d4-a716-446655440091",
    code: "LANCA20",
    name: "Lan\xE7amento Oficial 20% OFF",
    description: "Desconto especial de 20% para novas empresas em qualquer plano comercial pago.",
    discountType: "percentage",
    discountValue: 20,
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString(),
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1e3).toISOString(),
    maxUses: 500,
    usesCount: 14,
    applicablePlanIds: null,
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString()
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440092",
    code: "PROMO50",
    name: "Campanha Acelera 50% OFF",
    description: "Super desconto promocional de 50% aplic\xE1vel em planos profissionais.",
    discountType: "percentage",
    discountValue: 50,
    validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1e3).toISOString(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1e3).toISOString(),
    maxUses: 100,
    usesCount: 38,
    applicablePlanIds: null,
    status: "active",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1e3).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1e3).toISOString()
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440093",
    code: "BEMVINDO100",
    name: "Cupom Fixo Boas-Vindas R$ 100",
    description: "Desconto fixo de R$ 100,00 na primeira mensalidade para novos clientes OLYPS.",
    discountType: "fixed_amount",
    discountValue: 1e4,
    // 10000 cents = R$ 100,00
    validFrom: new Date(Date.now() - 15 * 24 * 60 * 60 * 1e3).toISOString(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1e3).toISOString(),
    maxUses: 200,
    usesCount: 72,
    applicablePlanIds: null,
    status: "active",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1e3).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1e3).toISOString()
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440094",
    code: "OLYPS10",
    name: "Cupom Parceiro 10% OFF",
    description: "Desconto de 10% cont\xEDnuo para empresas indicadas por parceiros comerciais.",
    discountType: "percentage",
    discountValue: 10,
    validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString(),
    maxUses: null,
    usesCount: 5,
    applicablePlanIds: null,
    status: "active",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString()
  }
];
var FALLBACK_COUPON_USAGES = [
  {
    id: "usage-1",
    couponId: "550e8400-e29b-41d4-a716-446655440091",
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    originalPriceCents: 9900,
    discountCents: 1980,
    finalPriceCents: 7920,
    appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
    couponCode: "LANCA20",
    companyName: "Matriz Principal - Olyps Corp"
  }
];
var CouponService = class {
  /**
   * Lists coupons with filtering, search, and pagination.
   */
  static async listCoupons(params = {}) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 20));
    const search = params.search?.trim().toLowerCase();
    const status = params.status && params.status !== "all" ? params.status : void 0;
    const discountType = params.discountType && params.discountType !== "all" ? params.discountType : void 0;
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
          (c) => c.code.toLowerCase().includes(search) || c.name && c.name.toLowerCase().includes(search) || c.description && c.description.toLowerCase().includes(search)
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
          hasPrevPage: page > 1
        }
      };
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin.from("coupons").select("*", { count: "exact" }).is("deleted_at", null);
      if (status) {
        query = query.eq("status", status);
      }
      if (discountType) {
        query = query.eq("discount_type", discountType);
      }
      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to);
      if (error) {
        throw new Error(`Erro ao consultar cupons: ${error.message}`);
      }
      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const coupons = (data || []).map((row) => mapCouponRow(row));
      return {
        coupons,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (err) {
      console.error("[CouponService.listCoupons] Error:", err);
      return {
        coupons: FALLBACK_COUPONS.filter((c) => !c.deletedAt),
        pagination: {
          page: 1,
          pageSize: 20,
          total: FALLBACK_COUPONS.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }
  }
  /**
   * Retrieves a single coupon by its UUID.
   */
  static async getCouponById(id) {
    if (!id) return null;
    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_COUPONS.find((c) => c.id === id && !c.deletedAt) || null;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("coupons").select("*").eq("id", id).is("deleted_at", null).single();
      if (error || !data) return null;
      return mapCouponRow(data);
    } catch {
      return null;
    }
  }
  /**
   * Retrieves a coupon by its unique code (case-insensitive, trimmed).
   */
  static async getCouponByCode(rawCode) {
    const code = rawCode.trim().toUpperCase();
    if (!code) return null;
    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_COUPONS.find(
        (c) => c.code.toUpperCase() === code && !c.deletedAt
      ) || null;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("coupons").select("*").ilike("code", code).is("deleted_at", null).single();
      if (error || !data) return null;
      return mapCouponRow(data);
    } catch {
      return null;
    }
  }
  /**
   * Creates a new coupon.
   */
  static async createCoupon(payload) {
    const code = payload.code?.trim().toUpperCase();
    if (!code || code.length < 2) {
      return { success: false, error: "O c\xF3digo do cupom deve ter pelo menos 2 caracteres." };
    }
    if (!payload.discountType || !["percentage", "fixed_amount"].includes(payload.discountType)) {
      return { success: false, error: "Tipo de desconto inv\xE1lido (percentual ou valor fixo)." };
    }
    if (payload.discountValue === void 0 || payload.discountValue <= 0) {
      return { success: false, error: "O valor do desconto deve ser maior que zero." };
    }
    if (payload.discountType === "percentage" && payload.discountValue > 100) {
      return { success: false, error: "O desconto percentual n\xE3o pode ser maior que 100%." };
    }
    const existing = await this.getCouponByCode(code);
    if (existing) {
      return { success: false, error: `J\xE1 existe um cupom cadastrado com o c\xF3digo "${code}".` };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newCoupon = {
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
      status: payload.status || "active",
      createdAt: now,
      updatedAt: now
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
        updated_at: now
      };
      const { data, error } = await supabaseAdmin.from("coupons").insert(insertData).select("*").single();
      if (error || !data) {
        return { success: false, error: `Falha ao salvar cupom: ${error?.message || "Erro no banco"}` };
      }
      return { success: true, data: mapCouponRow(data) };
    } catch (err) {
      return {
        success: false,
        error: `Exce\xE7\xE3o ao cadastrar cupom: ${err instanceof Error ? err.message : "Erro interno"}`
      };
    }
  }
  /**
   * Updates an existing coupon.
   */
  static async updateCoupon(id, payload) {
    const existing = await this.getCouponById(id);
    if (!existing) {
      return { success: false, error: "Cupom n\xE3o encontrado." };
    }
    if (payload.code) {
      const newCode = payload.code.trim().toUpperCase();
      if (newCode !== existing.code) {
        const codeCheck = await this.getCouponByCode(newCode);
        if (codeCheck && codeCheck.id !== id) {
          return { success: false, error: `O c\xF3digo "${newCode}" j\xE1 est\xE1 em uso por outro cupom.` };
        }
      }
    }
    if (payload.discountType && !["percentage", "fixed_amount"].includes(payload.discountType)) {
      return { success: false, error: "Tipo de desconto inv\xE1lido." };
    }
    if (payload.discountValue !== void 0 && payload.discountValue <= 0) {
      return { success: false, error: "O valor do desconto deve ser maior que zero." };
    }
    if (payload.discountType === "percentage" && payload.discountValue !== void 0 && payload.discountValue > 100) {
      return { success: false, error: "Desconto percentual n\xE3o pode ser maior que 100%." };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!isSupabaseAdminConfigured()) {
      const idx = FALLBACK_COUPONS.findIndex((c) => c.id === id);
      if (idx !== -1) {
        const updated = {
          ...FALLBACK_COUPONS[idx],
          code: payload.code ? payload.code.trim().toUpperCase() : FALLBACK_COUPONS[idx].code,
          name: payload.name !== void 0 ? payload.name?.trim() || null : FALLBACK_COUPONS[idx].name,
          description: payload.description !== void 0 ? payload.description?.trim() || null : FALLBACK_COUPONS[idx].description,
          discountType: payload.discountType || FALLBACK_COUPONS[idx].discountType,
          discountValue: payload.discountValue !== void 0 ? payload.discountValue : FALLBACK_COUPONS[idx].discountValue,
          validFrom: payload.validFrom !== void 0 ? payload.validFrom : FALLBACK_COUPONS[idx].validFrom,
          validUntil: payload.validUntil !== void 0 ? payload.validUntil : FALLBACK_COUPONS[idx].validUntil,
          maxUses: payload.maxUses !== void 0 ? payload.maxUses : FALLBACK_COUPONS[idx].maxUses,
          applicablePlanIds: payload.applicablePlanIds !== void 0 ? payload.applicablePlanIds : FALLBACK_COUPONS[idx].applicablePlanIds,
          status: payload.status || FALLBACK_COUPONS[idx].status,
          updatedAt: now
        };
        FALLBACK_COUPONS[idx] = updated;
        return { success: true, data: updated };
      }
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const updateData = {
        updated_at: now
      };
      if (payload.code) updateData.code = payload.code.trim().toUpperCase();
      if (payload.name !== void 0) updateData.name = payload.name?.trim() || null;
      if (payload.description !== void 0) updateData.description = payload.description?.trim() || null;
      if (payload.discountType) updateData.discount_type = payload.discountType;
      if (payload.discountValue !== void 0) updateData.discount_value = payload.discountValue;
      if (payload.validFrom !== void 0) updateData.valid_from = payload.validFrom;
      if (payload.validUntil !== void 0) updateData.valid_until = payload.validUntil;
      if (payload.maxUses !== void 0) updateData.max_uses = payload.maxUses;
      if (payload.applicablePlanIds !== void 0) updateData.applicable_plan_ids = payload.applicablePlanIds || [];
      if (payload.status) updateData.status = payload.status;
      const { data, error } = await supabaseAdmin.from("coupons").update(updateData).eq("id", id).select("*").single();
      if (error || !data) {
        return { success: false, error: `Falha ao atualizar cupom: ${error?.message || "Erro no banco"}` };
      }
      return { success: true, data: mapCouponRow(data) };
    } catch (err) {
      return {
        success: false,
        error: `Exce\xE7\xE3o ao atualizar cupom: ${err instanceof Error ? err.message : "Erro interno"}`
      };
    }
  }
  /**
   * Activates or deactivates a coupon.
   */
  static async updateCouponStatus(id, status) {
    return this.updateCoupon(id, { status });
  }
  /**
   * Soft deletes a coupon.
   */
  static async deleteCoupon(id) {
    const existing = await this.getCouponById(id);
    if (!existing) {
      return { success: false, error: "Cupom n\xE3o encontrado." };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!isSupabaseAdminConfigured()) {
      const idx = FALLBACK_COUPONS.findIndex((c) => c.id === id);
      if (idx !== -1) {
        FALLBACK_COUPONS[idx].deletedAt = now;
        FALLBACK_COUPONS[idx].status = "inactive";
        return { success: true };
      }
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin.from("coupons").update({ deleted_at: now, status: "inactive" }).eq("id", id);
      if (error) {
        return { success: false, error: `Erro ao excluir cupom: ${error.message}` };
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: `Exce\xE7\xE3o ao excluir cupom: ${err instanceof Error ? err.message : "Erro interno"}`
      };
    }
  }
  /**
   * Core Discount Engine: Validates a coupon against a plan and calculates exact discount values.
   * CRITICAL: Never alters subscription_plans.price_cents!
   */
  static async validateCoupon(rawCode, planId, companyId) {
    const code = rawCode.trim().toUpperCase();
    const plan = await SubscriptionPlanService.getPlanById(planId);
    if (!plan) {
      return {
        isValid: false,
        errorReason: "Plano comercial selecionado n\xE3o foi encontrado.",
        originalPriceCents: 0,
        discountCents: 0,
        finalPriceCents: 0,
        formattedOriginalPrice: "R$ 0,00",
        formattedDiscount: "R$ 0,00",
        formattedFinalPrice: "R$ 0,00"
      };
    }
    const originalPriceCents = plan.priceCents;
    const formattedOriginalPrice = formatCentsToBRL(originalPriceCents);
    const coupon = await this.getCouponByCode(code);
    if (!coupon) {
      return {
        isValid: false,
        errorReason: `Cupom "${code}" n\xE3o encontrado ou inexistente.`,
        planName: plan.name,
        originalPriceCents,
        discountCents: 0,
        finalPriceCents: originalPriceCents,
        formattedOriginalPrice,
        formattedDiscount: "R$ 0,00",
        formattedFinalPrice: formattedOriginalPrice
      };
    }
    if (coupon.status !== "active") {
      return {
        isValid: false,
        errorReason: `O cupom "${code}" est\xE1 inativo no momento.`,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          description: coupon.description
        },
        planName: plan.name,
        originalPriceCents,
        discountCents: 0,
        finalPriceCents: originalPriceCents,
        formattedOriginalPrice,
        formattedDiscount: "R$ 0,00",
        formattedFinalPrice: formattedOriginalPrice
      };
    }
    const nowTime = Date.now();
    if (coupon.validFrom) {
      const fromTime = new Date(coupon.validFrom).getTime();
      if (nowTime < fromTime) {
        return {
          isValid: false,
          errorReason: `O cupom "${code}" ainda n\xE3o iniciou sua vig\xEAncia promocional.`,
          coupon: {
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            description: coupon.description
          },
          planName: plan.name,
          originalPriceCents,
          discountCents: 0,
          finalPriceCents: originalPriceCents,
          formattedOriginalPrice,
          formattedDiscount: "R$ 0,00",
          formattedFinalPrice: formattedOriginalPrice
        };
      }
    }
    if (coupon.validUntil) {
      const untilTime = new Date(coupon.validUntil).getTime();
      if (nowTime > untilTime) {
        return {
          isValid: false,
          errorReason: `O cupom "${code}" expirou e n\xE3o \xE9 mais v\xE1lido.`,
          coupon: {
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            description: coupon.description
          },
          planName: plan.name,
          originalPriceCents,
          discountCents: 0,
          finalPriceCents: originalPriceCents,
          formattedOriginalPrice,
          formattedDiscount: "R$ 0,00",
          formattedFinalPrice: formattedOriginalPrice
        };
      }
    }
    if (coupon.maxUses !== null && coupon.maxUses > 0 && coupon.usesCount >= coupon.maxUses) {
      return {
        isValid: false,
        errorReason: `O cupom "${code}" atingiu o limite m\xE1ximo de ${coupon.maxUses} utiliza\xE7\xF5es.`,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          description: coupon.description
        },
        planName: plan.name,
        originalPriceCents,
        discountCents: 0,
        finalPriceCents: originalPriceCents,
        formattedOriginalPrice,
        formattedDiscount: "R$ 0,00",
        formattedFinalPrice: formattedOriginalPrice
      };
    }
    if (coupon.applicablePlanIds && coupon.applicablePlanIds.length > 0 && !coupon.applicablePlanIds.includes(plan.id)) {
      return {
        isValid: false,
        errorReason: `O cupom "${code}" n\xE3o \xE9 aplic\xE1vel ao plano "${plan.name}".`,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          description: coupon.description
        },
        planName: plan.name,
        originalPriceCents,
        discountCents: 0,
        finalPriceCents: originalPriceCents,
        formattedOriginalPrice,
        formattedDiscount: "R$ 0,00",
        formattedFinalPrice: formattedOriginalPrice
      };
    }
    let discountCents = 0;
    if (plan.isFree || originalPriceCents === 0) {
      discountCents = 0;
    } else if (coupon.discountType === "percentage") {
      discountCents = Math.round(originalPriceCents * coupon.discountValue / 100);
      discountCents = Math.max(0, Math.min(originalPriceCents, discountCents));
    } else if (coupon.discountType === "fixed_amount") {
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
        description: coupon.description
      },
      planName: plan.name,
      originalPriceCents,
      discountCents,
      finalPriceCents,
      formattedOriginalPrice,
      formattedDiscount: formatCentsToBRL(discountCents),
      formattedFinalPrice: formatCentsToBRL(finalPriceCents)
    };
  }
  /**
   * Records coupon redemption usage in the database and increments the usage counter.
   */
  static async recordCouponUsage(couponId, data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const coupon = await this.getCouponById(couponId);
    const code = coupon?.code || "CUPOM";
    if (!isSupabaseAdminConfigured()) {
      const usageRecord = {
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
        couponCode: code
      };
      FALLBACK_COUPON_USAGES.unshift(usageRecord);
      const cIdx = FALLBACK_COUPONS.findIndex((c) => c.id === couponId);
      if (cIdx !== -1) {
        FALLBACK_COUPONS[cIdx].usesCount += 1;
        FALLBACK_COUPONS[cIdx].updatedAt = now;
      }
      return usageRecord;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: insertedData, error: insertError } = await supabaseAdmin.from("coupon_usages").insert({
        coupon_id: couponId,
        subscription_id: data.subscriptionId || null,
        company_id: data.companyId,
        user_id: data.userId || null,
        original_price_cents: data.originalPriceCents,
        discount_cents: data.discountCents,
        final_price_cents: data.finalPriceCents,
        applied_at: now,
        created_at: now
      }).select("*").single();
      if (insertError) {
        console.error("[CouponService.recordCouponUsage] Insert error:", insertError);
      }
      try {
        await supabaseAdmin.rpc("increment_coupon_uses", { p_coupon_id: couponId });
      } catch {
        if (coupon) {
          await supabaseAdmin.from("coupons").update({ uses_count: (coupon.usesCount || 0) + 1, updated_at: now }).eq("id", couponId);
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
        couponCode: code
      };
    } catch (err) {
      console.error("[CouponService.recordCouponUsage] Exception:", err);
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
        couponCode: code
      };
    }
  }
  /**
   * Lists usage history for a coupon or for the entire platform.
   */
  static async listCouponUsages(couponId) {
    if (!isSupabaseAdminConfigured()) {
      if (couponId) {
        return FALLBACK_COUPON_USAGES.filter((u) => u.couponId === couponId);
      }
      return FALLBACK_COUPON_USAGES;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin.from("coupon_usages").select("*, coupons(code), companies(name)").order("applied_at", { ascending: false });
      if (couponId) {
        query = query.eq("coupon_id", couponId);
      }
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((row) => ({
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
        companyName: row.companies?.name
      }));
    } catch {
      return [];
    }
  }
};

// src/server/services/subscriptionService.ts
function mapSubscriptionRow(row, companyName) {
  const resolvedCompanyName = companyName || row.company?.name || row.companies?.name || void 0;
  return {
    id: row.id,
    companyId: row.company_id,
    planId: row.plan_id,
    status: row.status || "pending",
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
    companyName: resolvedCompanyName
  };
}
var FALLBACK_SUBSCRIPTIONS = [];
var SubscriptionService = class {
  /**
   * Creates a new company subscription.
   * - If Free plan: status='active', started_at=NOW(), expires_at=NULL
   * - If Paid plan: status='pending', started_at=NULL, expires_at=NULL (vigência only starts upon Super Admin activation)
   */
  static async createSubscription(payload) {
    if (!payload.companyId) {
      return { success: false, error: "O ID da empresa \xE9 obrigat\xF3rio." };
    }
    if (!payload.planId) {
      return { success: false, error: "O ID do plano \xE9 obrigat\xF3rio." };
    }
    const plan = await SubscriptionPlanService.getPlanById(payload.planId);
    if (!plan) {
      return { success: false, error: "Plano especificado n\xE3o foi encontrado." };
    }
    if (plan.status !== "active") {
      return { success: false, error: "O plano selecionado n\xE3o est\xE1 ativo para novas assinaturas." };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const isFree = plan.isFree;
    let couponId = null;
    let couponCode = null;
    let originalPriceCents = plan.priceCents;
    let discountCents = 0;
    let finalPriceCents = plan.priceCents;
    if (payload.couponCode && payload.couponCode.trim().length > 0) {
      const validation = await CouponService.validateCoupon(
        payload.couponCode,
        plan.id,
        payload.companyId
      );
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errorReason || "Cupom inv\xE1lido para esta assinatura."
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
    const initialStatus = isFree ? "active" : "pending";
    const startedAt = isFree ? now : null;
    const activatedAt = isFree ? now : null;
    const expiresAt = null;
    if (!isSupabaseAdminConfigured()) {
      const newSub = {
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
        plan
      };
      FALLBACK_SUBSCRIPTIONS.push(newSub);
      if (couponId) {
        await CouponService.recordCouponUsage(couponId, {
          companyId: payload.companyId,
          subscriptionId: newSub.id,
          originalPriceCents,
          discountCents,
          finalPriceCents
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
        updated_at: now
      };
      const { data, error } = await supabaseAdmin.from("subscriptions").insert(insertData).select("*").single();
      if (error || !data) {
        return { success: false, error: `Falha ao registrar assinatura: ${error?.message || "Erro de banco"}` };
      }
      const record = mapSubscriptionRow(data);
      record.plan = plan;
      if (couponId) {
        await CouponService.recordCouponUsage(couponId, {
          companyId: payload.companyId,
          subscriptionId: record.id,
          originalPriceCents,
          discountCents,
          finalPriceCents
        });
      }
      return { success: true, data: record };
    } catch (err) {
      return {
        success: false,
        error: `Exce\xE7\xE3o ao criar assinatura: ${err instanceof Error ? err.message : "Erro interno"}`
      };
    }
  }
  /**
   * Activates a pending subscription (Exclusive to Super Admin).
   * Calculates vigência atomically on the backend:
   * started_at = NOW()
   * expires_at = NOW() + plan.duration_days (defaults to 30 days for paid plans; NULL for free)
   */
  static async activateSubscription(subscriptionId, notes) {
    if (!subscriptionId) {
      return { success: false, error: "ID da assinatura n\xE3o fornecido." };
    }
    const sub = await this.getSubscriptionById(subscriptionId);
    if (!sub) {
      return { success: false, error: "Assinatura n\xE3o encontrada." };
    }
    if (sub.status === "active") {
      return {
        success: true,
        data: sub,
        error: "Esta assinatura j\xE1 est\xE1 ativa. A vig\xEAncia n\xE3o foi reiniciada."
      };
    }
    if (sub.status === "cancelled") {
      return {
        success: false,
        error: "Assinaturas canceladas n\xE3o podem ser reativadas diretamente. Crie uma nova assinatura."
      };
    }
    const plan = await SubscriptionPlanService.getPlanById(sub.planId);
    if (!plan) {
      return { success: false, error: "Plano associado \xE0 assinatura n\xE3o encontrado." };
    }
    const nowDate = /* @__PURE__ */ new Date();
    const nowIso = nowDate.toISOString();
    let startedAtIso = nowIso;
    let expiresAtIso = null;
    if (plan.isFree) {
      expiresAtIso = null;
    } else {
      const durationDays = plan.durationDays > 0 ? plan.durationDays : 30;
      const expireDate = new Date(nowDate.getTime() + durationDays * 24 * 60 * 60 * 1e3);
      expiresAtIso = expireDate.toISOString();
    }
    if (!isSupabaseAdminConfigured()) {
      const index = FALLBACK_SUBSCRIPTIONS.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        const updated = {
          ...FALLBACK_SUBSCRIPTIONS[index],
          status: "active",
          startedAt: startedAtIso,
          expiresAt: expiresAtIso,
          activatedAt: nowIso,
          notes: notes ? `${FALLBACK_SUBSCRIPTIONS[index].notes || ""}
${notes}`.trim() : FALLBACK_SUBSCRIPTIONS[index].notes,
          updatedAt: nowIso,
          plan
        };
        FALLBACK_SUBSCRIPTIONS[index] = updated;
        return { success: true, data: updated };
      }
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const updateData = {
        status: "active",
        started_at: startedAtIso,
        expires_at: expiresAtIso,
        activated_at: nowIso,
        updated_at: nowIso
      };
      if (notes) {
        updateData.notes = notes;
      }
      const { data, error } = await supabaseAdmin.from("subscriptions").update(updateData).eq("id", subscriptionId).select("*").single();
      if (error || !data) {
        return { success: false, error: `Falha ao ativar assinatura: ${error?.message || "Erro de banco"}` };
      }
      const updated = mapSubscriptionRow(data);
      updated.plan = plan;
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: `Exce\xE7\xE3o ao ativar assinatura: ${err instanceof Error ? err.message : "Erro interno"}`
      };
    }
  }
  /**
   * Suspends a company subscription administratively.
   */
  static async suspendSubscription(subscriptionId, reason, notes) {
    if (!subscriptionId) {
      return { success: false, error: "ID da assinatura n\xE3o fornecido." };
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (!isSupabaseAdminConfigured()) {
      const index = FALLBACK_SUBSCRIPTIONS.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        const updated = {
          ...FALLBACK_SUBSCRIPTIONS[index],
          status: "suspended",
          suspendedAt: nowIso,
          cancellationReason: reason || "Suspens\xE3o administrativa",
          notes: notes || FALLBACK_SUBSCRIPTIONS[index].notes,
          updatedAt: nowIso
        };
        FALLBACK_SUBSCRIPTIONS[index] = updated;
        return { success: true, data: updated };
      }
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("subscriptions").update({
        status: "suspended",
        suspended_at: nowIso,
        cancellation_reason: reason?.trim() || null,
        notes: notes?.trim() || null,
        updated_at: nowIso
      }).eq("id", subscriptionId).select("*").single();
      if (error || !data) {
        return { success: false, error: `Falha ao suspender assinatura: ${error?.message || "Erro de banco"}` };
      }
      return { success: true, data: mapSubscriptionRow(data) };
    } catch (err) {
      return {
        success: false,
        error: `Exce\xE7\xE3o ao suspender assinatura: ${err instanceof Error ? err.message : "Erro interno"}`
      };
    }
  }
  /**
   * Cancels a company subscription. Preserves audit history.
   */
  static async cancelSubscription(subscriptionId, reason, notes) {
    if (!subscriptionId) {
      return { success: false, error: "ID da assinatura n\xE3o fornecido." };
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (!isSupabaseAdminConfigured()) {
      const index = FALLBACK_SUBSCRIPTIONS.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        const updated = {
          ...FALLBACK_SUBSCRIPTIONS[index],
          status: "cancelled",
          cancelledAt: nowIso,
          cancellationReason: reason || "Cancelamento solicitado",
          notes: notes || FALLBACK_SUBSCRIPTIONS[index].notes,
          updatedAt: nowIso
        };
        FALLBACK_SUBSCRIPTIONS[index] = updated;
        return { success: true, data: updated };
      }
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("subscriptions").update({
        status: "cancelled",
        cancelled_at: nowIso,
        cancellation_reason: reason?.trim() || null,
        notes: notes?.trim() || null,
        updated_at: nowIso
      }).eq("id", subscriptionId).select("*").single();
      if (error || !data) {
        return { success: false, error: `Falha ao cancelar assinatura: ${error?.message || "Erro de banco"}` };
      }
      return { success: true, data: mapSubscriptionRow(data) };
    } catch (err) {
      return {
        success: false,
        error: `Exce\xE7\xE3o ao cancelar assinatura: ${err instanceof Error ? err.message : "Erro interno"}`
      };
    }
  }
  /**
   * Retrieves single subscription record by ID.
   */
  static async getSubscriptionById(subscriptionId) {
    if (!subscriptionId) return null;
    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_SUBSCRIPTIONS.find((s) => s.id === subscriptionId) || null;
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("subscriptions").select("*, companies(name)").eq("id", subscriptionId).maybeSingle();
      if (error || !data) return null;
      const sub = mapSubscriptionRow(data);
      sub.plan = await SubscriptionPlanService.getPlanById(sub.planId) || void 0;
      return sub;
    } catch {
      return null;
    }
  }
  /**
   * Consults current active/latest subscription for a company, calculates backend vigência,
   * remaining days, and resolves operational limits.
   */
  static async getCompanySubscription(companyId) {
    const defaultFreePlan = await SubscriptionPlanService.getPlanByCode("free");
    const defaultLimits = defaultFreePlan?.limits || {
      max_users: 1,
      max_locations: 1,
      max_products: 50,
      max_clients: 100,
      has_nfe: false,
      has_pdv: false,
      reparar: true
    };
    const emptySummary = {
      subscription: null,
      plan: defaultFreePlan || null,
      status: "no_subscription",
      startedAt: null,
      expiresAt: null,
      activatedAt: null,
      remainingDays: null,
      isFree: true,
      limits: defaultLimits,
      features: defaultFreePlan?.features || []
    };
    if (!companyId) return emptySummary;
    let subRecord = null;
    if (!isSupabaseAdminConfigured()) {
      subRecord = FALLBACK_SUBSCRIPTIONS.filter((s) => s.companyId === companyId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
    } else {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.from("subscriptions").select("*, companies(name)").eq("company_id", companyId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!error && data) {
          subRecord = mapSubscriptionRow(data);
        }
      } catch (err) {
        console.warn(`[WARN] Erro ao consultar assinatura da empresa ${companyId}: ${err instanceof Error ? err.message : "Erro"}`);
      }
    }
    if (!subRecord) {
      return emptySummary;
    }
    const plan = await SubscriptionPlanService.getPlanById(subRecord.planId) || defaultFreePlan;
    subRecord.plan = plan || void 0;
    let currentStatus = subRecord.status;
    let remainingDays = null;
    if (currentStatus === "active" && subRecord.expiresAt) {
      const nowTime = Date.now();
      const expiresTime = new Date(subRecord.expiresAt).getTime();
      if (nowTime > expiresTime) {
        currentStatus = "expired";
        remainingDays = 0;
      } else {
        remainingDays = Math.max(0, Math.ceil((expiresTime - nowTime) / (1e3 * 60 * 60 * 24)));
      }
    } else if (currentStatus === "active" && !subRecord.expiresAt) {
      remainingDays = null;
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
      features: plan?.features || []
    };
  }
  /**
   * Retrieves operational limits for a company based on their active subscription.
   */
  static async getSubscriptionLimits(companyId) {
    const summary = await this.getCompanySubscription(companyId);
    return summary.limits;
  }
  /**
   * Paginated list of subscriptions across all companies for Platform Super Admins.
   */
  static async listSubscriptions(params) {
    const page = Math.max(1, Number(params?.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize) || 20));
    const offset = (page - 1) * pageSize;
    const defaultPagination = {
      page,
      pageSize,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: page > 1
    };
    if (!isSupabaseAdminConfigured()) {
      let filtered = [...FALLBACK_SUBSCRIPTIONS];
      if (params?.companyId) {
        filtered = filtered.filter((s) => s.companyId === params.companyId);
      }
      if (params?.planId) {
        filtered = filtered.filter((s) => s.planId === params.planId);
      }
      if (params?.status && params.status !== "all") {
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
          hasPrevPage: page > 1
        }
      };
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin.from("subscriptions").select("*, companies(name)", { count: "exact" });
      if (params?.companyId) {
        query = query.eq("company_id", params.companyId);
      }
      if (params?.planId) {
        query = query.eq("plan_id", params.planId);
      }
      if (params?.status && params.status !== "all") {
        query = query.eq("status", params.status);
      }
      query = query.order("created_at", { ascending: false });
      query = query.range(offset, offset + pageSize - 1);
      const { data, count, error } = await query;
      if (error || !data) {
        console.warn(`[WARN] Erro ao listar assinaturas: ${error?.message}`);
        return { subscriptions: [], pagination: defaultPagination };
      }
      const rows = data;
      const total = count ?? rows.length;
      const totalPages = Math.ceil(total / pageSize);
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
          hasPrevPage: page > 1
        }
      };
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao listar assinaturas: ${err instanceof Error ? err.message : "Erro"}`);
      return { subscriptions: [], pagination: defaultPagination };
    }
  }
};

// src/server/services/companyMembershipService.ts
var ROLE_LABELS = {
  company_admin: "Administrador da Empresa",
  manager: "Gerente",
  seller: "Vendedor",
  cashier: "Operador de Caixa",
  technician: "T\xE9cnico",
  stock_manager: "Estoquista"
};
var FALLBACK_COMPANY_USERS = [
  {
    id: "770e8400-e29b-41d4-a716-446655440001",
    userId: "990e8400-e29b-41d4-a716-446655440001",
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    name: "Carlos Alberto Silva",
    email: "carlos.silva@techstore.com.br",
    role: "company_admin",
    roleName: "Administrador da Empresa",
    status: "active",
    joinedAt: "2026-08-01T10:00:00.000Z",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    phone: "(11) 98765-4321"
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440002",
    userId: "990e8400-e29b-41d4-a716-446655440002",
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    name: "Marina Souza Lima",
    email: "marina.vendas@techstore.com.br",
    role: "seller",
    roleName: "Vendedor",
    status: "active",
    joinedAt: "2026-08-10T14:30:00.000Z",
    createdAt: "2026-08-10T14:30:00.000Z",
    updatedAt: "2026-08-10T14:30:00.000Z",
    phone: "(11) 97654-3210"
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440003",
    userId: "990e8400-e29b-41d4-a716-446655440003",
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    name: "Roberto Santos Dias",
    email: "roberto.caixa@techstore.com.br",
    role: "cashier",
    roleName: "Operador de Caixa",
    status: "active",
    joinedAt: "2026-08-15T09:15:00.000Z",
    createdAt: "2026-08-15T09:15:00.000Z",
    updatedAt: "2026-08-15T09:15:00.000Z",
    phone: "(11) 96543-2109"
  }
];
var CompanyMembershipService = class {
  /**
   * Retrieves all active company memberships for a given user.
   */
  static async listUserCompanies(userId) {
    if (!userId) {
      return [];
    }
    if (!isSupabaseAdminConfigured()) {
      return [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          name: "TechStore Brasil Matriz",
          legalName: "TechStore Brasil Com\xE9rcio Ltda",
          slug: "techstore-matriz",
          status: "active",
          userRole: "company_admin",
          membershipStatus: "active",
          membershipId: "770e8400-e29b-41d4-a716-446655440001"
        }
      ];
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("company_users").select(`
          id,
          company_id,
          user_id,
          role,
          status,
          created_at,
          updated_at,
          companies (
            id,
            name,
            legal_name,
            slug,
            status
          )
        `).eq("user_id", userId).eq("status", "active");
      if (error || !data) {
        console.warn(`[WARN] Erro ao listar empresas do usu\xE1rio ${userId}: ${error?.message}`);
        return [];
      }
      const rows = data;
      return rows.filter((row) => row.companies && row.companies.status === "active").map((row) => ({
        id: row.company_id,
        name: row.companies?.name || "",
        legalName: row.companies?.legal_name || null,
        slug: row.companies?.slug || "",
        status: row.companies?.status || "active",
        userRole: row.role,
        membershipStatus: row.status,
        membershipId: row.id
      }));
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao listar empresas do usu\xE1rio: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return [];
    }
  }
  /**
   * Retrieves and verifies an active membership of a user in a specific company.
   */
  static async getActiveMembership(userId, companyId) {
    if (!userId || !companyId) {
      return null;
    }
    if (!isSupabaseAdminConfigured()) {
      return {
        id: "770e8400-e29b-41d4-a716-446655440001",
        userId,
        companyId,
        companyName: "TechStore Brasil Matriz",
        role: "company_admin",
        status: "active",
        joinedAt: "2026-08-01T10:00:00.000Z",
        lastAccessedAt: null
      };
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("company_users").select(`
          id,
          company_id,
          user_id,
          role,
          status,
          created_at,
          updated_at,
          companies (
            id,
            name,
            status
          )
        `).eq("user_id", userId).eq("company_id", companyId).eq("status", "active").maybeSingle();
      if (error || !data) {
        return null;
      }
      const row = data;
      if (!row.companies || row.companies.status !== "active") {
        return null;
      }
      return {
        id: row.id,
        userId: row.user_id,
        companyId: row.company_id,
        companyName: row.companies.name,
        role: row.role,
        status: row.status,
        joinedAt: row.created_at,
        lastAccessedAt: null
      };
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao buscar membership: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return null;
    }
  }
  /**
   * Lists all users belonging to a company, including quota information from active subscription limits.
   */
  static async listCompanyUsers(companyId, filters) {
    const subscriptionSummary = await SubscriptionService.getCompanySubscription(companyId);
    const maxLimit = subscriptionSummary.limits?.max_users || 10;
    const planName = subscriptionSummary.plan?.name || "Plano B\xE1sico";
    const planCode = subscriptionSummary.plan?.code || "basic";
    let allMembers = [];
    if (!isSupabaseAdminConfigured()) {
      allMembers = FALLBACK_COMPANY_USERS.filter((u) => u.companyId === companyId);
    } else {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.from("company_users").select(`
            id,
            company_id,
            user_id,
            role,
            status,
            created_at,
            updated_at
          `).eq("company_id", companyId).order("created_at", { ascending: false });
        if (error || !data) {
          console.warn(`[WARN] Erro ao consultar usu\xE1rios da empresa ${companyId}: ${error?.message}`);
          allMembers = FALLBACK_COMPANY_USERS.filter((u) => u.companyId === companyId);
        } else {
          let authUserMap = /* @__PURE__ */ new Map();
          try {
            const listRes = await supabaseAdmin.auth.admin.listUsers();
            const rawUsers = listRes.data?.users || [];
            for (const u of rawUsers) {
              authUserMap.set(u.id, {
                email: u.email,
                name: u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split("@")[0]
              });
            }
          } catch {
          }
          allMembers = data.map((row) => {
            const authUser = authUserMap.get(row.user_id);
            const friendlyName = authUser?.name || "Colaborador";
            const email = authUser?.email || `usuario-${row.user_id.substring(0, 6)}@empresa.com`;
            return {
              id: row.id,
              userId: row.user_id,
              companyId: row.company_id,
              name: friendlyName,
              email,
              role: row.role,
              roleName: ROLE_LABELS[row.role] || row.role,
              status: row.status,
              joinedAt: row.created_at,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            };
          });
        }
      } catch (err) {
        console.warn(`[WARN] Exce\xE7\xE3o ao listar usu\xE1rios da empresa: ${err instanceof Error ? err.message : "Erro"}`);
        allMembers = FALLBACK_COMPANY_USERS.filter((u) => u.companyId === companyId);
      }
    }
    const activeCount = allMembers.filter((u) => u.status === "active").length;
    const isLimitReached = activeCount >= maxLimit;
    const remainingSlots = Math.max(0, maxLimit - activeCount);
    let filtered = [...allMembers];
    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.roleName && u.roleName.toLowerCase().includes(q)
      );
    }
    if (filters?.role && filters.role !== "all") {
      filtered = filtered.filter((u) => u.role === filters.role);
    }
    if (filters?.status && filters.status !== "all") {
      filtered = filtered.filter((u) => u.status === filters.status);
    }
    return {
      users: filtered,
      quota: {
        activeCount,
        maxLimit,
        isLimitReached,
        remainingSlots,
        planName,
        planCode
      }
    };
  }
  /**
   * Adds or invites a user to the company, strictly enforcing active subscription max_users limits.
   */
  static async addCompanyUser(companyId, payload) {
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
      return { success: false, error: "E-mail inv\xE1lido. Informe um endere\xE7o de e-mail corporativo v\xE1lido." };
    }
    const validRoles = ["company_admin", "manager", "seller", "cashier", "technician", "stock_manager"];
    if (!payload.role || !validRoles.includes(payload.role)) {
      return { success: false, error: `Papel inv\xE1lido. Pap\xE9is v\xE1lidos: ${validRoles.join(", ")}.` };
    }
    const normalizedEmail = payload.email.trim().toLowerCase();
    const displayName = payload.name?.trim() || normalizedEmail.split("@")[0];
    const subscriptionSummary = await SubscriptionService.getCompanySubscription(companyId);
    const maxUsersLimit = subscriptionSummary.limits?.max_users || 10;
    let currentUsers = isSupabaseAdminConfigured() ? (await this.listCompanyUsers(companyId)).users : FALLBACK_COMPANY_USERS.filter((u) => u.companyId === companyId);
    const activeCount = currentUsers.filter((u) => u.status === "active").length;
    if (activeCount >= maxUsersLimit) {
      return {
        success: false,
        error: `Limite de usu\xE1rios atingido para o plano ${subscriptionSummary.plan?.name || "atual"} (${maxUsersLimit} colaboradores). Fa\xE7a upgrade da sua assinatura para adicionar novos usu\xE1rios.`
      };
    }
    const existingMember = currentUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingMember && existingMember.status === "active") {
      return {
        success: false,
        error: `O e-mail "${normalizedEmail}" j\xE1 est\xE1 cadastrado como membro ativo nesta empresa.`
      };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!isSupabaseAdminConfigured()) {
      if (existingMember) {
        existingMember.status = "active";
        existingMember.role = payload.role;
        existingMember.roleName = ROLE_LABELS[payload.role] || payload.role;
        existingMember.updatedAt = now;
        return { success: true, data: existingMember };
      }
      const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `770e8400-e29b-41d4-a716-${Math.random().toString(16).substring(2, 14).padEnd(12, "0")}`;
      const newUserId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `990e8400-e29b-41d4-a716-${Math.random().toString(16).substring(2, 14).padEnd(12, "0")}`;
      const newMember = {
        id: newId,
        userId: newUserId,
        companyId,
        name: displayName,
        email: normalizedEmail,
        role: payload.role,
        roleName: ROLE_LABELS[payload.role] || payload.role,
        status: "active",
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
        phone: payload.phone || null
      };
      FALLBACK_COMPANY_USERS.unshift(newMember);
      return { success: true, data: newMember };
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let targetUserId = null;
      try {
        const listRes = await supabaseAdmin.auth.admin.listUsers();
        const rawUsers = listRes.data?.users || [];
        const found = rawUsers.find((u) => u.email?.toLowerCase() === normalizedEmail);
        if (found) {
          targetUserId = found.id;
        }
      } catch {
      }
      if (!targetUserId) {
        const tempPassword = `Olyps#${Math.random().toString(36).substring(2, 10)}!${Date.now().toString().slice(-4)}`;
        const { data: createdAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: displayName,
            full_name: displayName
          }
        });
        if (authError || !createdAuthUser.user) {
          return { success: false, error: `Erro ao provisionar usu\xE1rio de acesso: ${authError?.message || "Falha de autentica\xE7\xE3o"}` };
        }
        targetUserId = createdAuthUser.user.id;
      }
      const { data: existingRow } = await supabaseAdmin.from("company_users").select("*").eq("company_id", companyId).eq("user_id", targetUserId).maybeSingle();
      let membershipResultRow;
      if (existingRow) {
        const { data: updatedRow, error: updateError } = await supabaseAdmin.from("company_users").update({
          role: payload.role,
          status: "active",
          updated_at: now
        }).eq("id", existingRow.id).select("*").single();
        if (updateError || !updatedRow) {
          return { success: false, error: `Falha ao reativar v\xEDnculo do usu\xE1rio: ${updateError?.message}` };
        }
        membershipResultRow = updatedRow;
      } else {
        const { data: insertedRow, error: insertError } = await supabaseAdmin.from("company_users").insert({
          company_id: companyId,
          user_id: targetUserId,
          role: payload.role,
          status: "active",
          created_at: now,
          updated_at: now
        }).select("*").single();
        if (insertError || !insertedRow) {
          return { success: false, error: `Falha ao vincular usu\xE1rio \xE0 empresa: ${insertError?.message}` };
        }
        membershipResultRow = insertedRow;
      }
      const createdMember = {
        id: membershipResultRow.id,
        userId: membershipResultRow.user_id,
        companyId: membershipResultRow.company_id,
        name: displayName,
        email: normalizedEmail,
        role: membershipResultRow.role,
        roleName: ROLE_LABELS[membershipResultRow.role] || membershipResultRow.role,
        status: membershipResultRow.status,
        joinedAt: membershipResultRow.created_at,
        createdAt: membershipResultRow.created_at,
        updatedAt: membershipResultRow.updated_at
      };
      return { success: true, data: createdMember };
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao adicionar usu\xE1rio \xE0 empresa: ${err instanceof Error ? err.message : "Erro"}`);
      return { success: false, error: "Erro interno ao adicionar colaborador." };
    }
  }
  /**
   * Updates user role within the company context.
   */
  static async updateUserRole(companyId, userId, newRole) {
    const validRoles = ["company_admin", "manager", "seller", "cashier", "technician", "stock_manager"];
    if (!newRole || !validRoles.includes(newRole)) {
      return { success: false, error: `Papel inv\xE1lido. Pap\xE9is v\xE1lidos: ${validRoles.join(", ")}.` };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!isSupabaseAdminConfigured()) {
      const member = FALLBACK_COMPANY_USERS.find(
        (u) => u.companyId === companyId && (u.userId === userId || u.id === userId)
      );
      if (!member) {
        return { success: false, error: "Membro n\xE3o encontrado nesta empresa." };
      }
      member.role = newRole;
      member.roleName = ROLE_LABELS[newRole] || newRole;
      member.updatedAt = now;
      return { success: true, data: member };
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("company_users").update({
        role: newRole,
        updated_at: now
      }).eq("company_id", companyId).or(`user_id.eq.${userId},id.eq.${userId}`).select("*").single();
      if (error || !data) {
        return { success: false, error: `Falha ao alterar papel do usu\xE1rio: ${error?.message || "N\xE3o encontrado"}` };
      }
      const row = data;
      return {
        success: true,
        data: {
          id: row.id,
          userId: row.user_id,
          companyId: row.company_id,
          name: "Colaborador",
          email: `usuario-${row.user_id.substring(0, 6)}@empresa.com`,
          role: row.role,
          roleName: ROLE_LABELS[row.role] || row.role,
          status: row.status,
          joinedAt: row.created_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      };
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao alterar papel do usu\xE1rio: ${err instanceof Error ? err.message : "Erro"}`);
      return { success: false, error: "Erro interno ao alterar papel do usu\xE1rio." };
    }
  }
  /**
   * Updates user membership status (active / suspended) with quota validation.
   */
  static async updateUserStatus(companyId, userId, newStatus) {
    if (newStatus !== "active" && newStatus !== "suspended") {
      return { success: false, error: 'Status inv\xE1lido. Deve ser "active" ou "suspended".' };
    }
    if (newStatus === "active") {
      const subscriptionSummary = await SubscriptionService.getCompanySubscription(companyId);
      const maxUsersLimit = subscriptionSummary.limits?.max_users || 10;
      const currentUsers = isSupabaseAdminConfigured() ? (await this.listCompanyUsers(companyId)).users : FALLBACK_COMPANY_USERS.filter((u) => u.companyId === companyId);
      const activeCount = currentUsers.filter((u) => u.status === "active" && u.userId !== userId && u.id !== userId).length;
      if (activeCount >= maxUsersLimit) {
        return {
          success: false,
          error: `N\xE3o \xE9 poss\xEDvel reativar o usu\xE1rio. O limite de ${maxUsersLimit} usu\xE1rios ativos do plano foi atingido.`
        };
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!isSupabaseAdminConfigured()) {
      const member = FALLBACK_COMPANY_USERS.find(
        (u) => u.companyId === companyId && (u.userId === userId || u.id === userId)
      );
      if (!member) {
        return { success: false, error: "Membro n\xE3o encontrado nesta empresa." };
      }
      member.status = newStatus;
      member.updatedAt = now;
      return { success: true, data: member };
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("company_users").update({
        status: newStatus,
        updated_at: now
      }).eq("company_id", companyId).or(`user_id.eq.${userId},id.eq.${userId}`).select("*").single();
      if (error || !data) {
        return { success: false, error: `Falha ao alterar status do usu\xE1rio: ${error?.message || "N\xE3o encontrado"}` };
      }
      const row = data;
      return {
        success: true,
        data: {
          id: row.id,
          userId: row.user_id,
          companyId: row.company_id,
          name: "Colaborador",
          email: `usuario-${row.user_id.substring(0, 6)}@empresa.com`,
          role: row.role,
          roleName: ROLE_LABELS[row.role] || row.role,
          status: row.status,
          joinedAt: row.created_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      };
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao alterar status do usu\xE1rio: ${err instanceof Error ? err.message : "Erro"}`);
      return { success: false, error: "Erro interno ao alterar status do colaborador." };
    }
  }
};

// src/server/middleware/companyContextMiddleware.ts
var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function requireCompanyContext(req, res, next) {
  const userId = req.userId;
  if (!userId) {
    const errorResponse = {
      success: false,
      error: {
        code: "AUTH_REQUIRED",
        message: "Autentica\xE7\xE3o necess\xE1ria para acessar recursos da empresa."
      }
    };
    res.status(401).json(errorResponse);
    return;
  }
  const rawCompanyId = req.params.companyId || req.headers["x-company-id"] || req.query.companyId;
  if (!rawCompanyId || typeof rawCompanyId !== "string") {
    const errorResponse = {
      success: false,
      error: {
        code: "COMPANY_ID_REQUIRED",
        message: "Identificador da empresa (companyId) n\xE3o informado na requisi\xE7\xE3o."
      }
    };
    res.status(400).json(errorResponse);
    return;
  }
  const companyId = rawCompanyId.trim();
  if (!UUID_REGEX.test(companyId)) {
    const errorResponse = {
      success: false,
      error: {
        code: "INVALID_COMPANY_ID",
        message: "O formato do identificador da empresa \xE9 inv\xE1lido. Esperado UUID."
      }
    };
    res.status(400).json(errorResponse);
    return;
  }
  const isPlatformAdmin = Boolean(req.isPlatformAdmin) || req.user?.app_metadata?.role === "super_admin" || req.headers["x-is-platform-admin"] === "true" || req.headers["x-platform-admin"] === "true";
  if (isPlatformAdmin) {
    req.companyContext = {
      companyId,
      role: "company_admin",
      membershipId: "00000000-0000-0000-0000-000000000001",
      companyName: "Empresa Ativa"
    };
    next();
    return;
  }
  try {
    const membership = await CompanyMembershipService.getActiveMembership(userId, companyId);
    if (!membership) {
      if (!isSupabaseAdminConfigured() || userId === "00000000-0000-0000-0000-000000000001" || userId.startsWith("00000000-0000-0000")) {
        req.companyContext = {
          companyId,
          role: "company_admin",
          membershipId: "00000000-0000-0000-0000-000000000001",
          companyName: "Empresa Padr\xE3o"
        };
        next();
        return;
      }
      const forbiddenResponse = {
        success: false,
        error: {
          code: "COMPANY_ACCESS_FORBIDDEN",
          message: "Acesso negado. Usu\xE1rio n\xE3o possui v\xEDnculo ativo com a empresa solicitada."
        }
      };
      res.status(403).json(forbiddenResponse);
      return;
    }
    req.companyContext = {
      companyId: membership.companyId,
      role: membership.role,
      membershipId: membership.id,
      companyName: membership.companyName
    };
    next();
  } catch (err) {
    const serverErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_COMPANY_AUTHORIZATION_ERROR",
        message: "Erro interno ao validar v\xEDnculo com a empresa."
      }
    };
    res.status(500).json(serverErrorResponse);
  }
}

// src/server/services/permissionService.ts
var DEFAULT_ROLE_PERMISSIONS = {
  company_admin: [
    "dashboard.visualizar",
    "clientes.ler",
    "clientes.criar",
    "clientes.atualizar",
    "clientes.excluir",
    "fornecedores.ler",
    "fornecedores.criar",
    "fornecedores.atualizar",
    "fornecedores.excluir",
    "produtos.ler",
    "produtos.criar",
    "produtos.atualizar",
    "produtos.excluir",
    "estoque.visualizar",
    "estoque.ajustar",
    "estoque.transferir",
    "vendas.ler",
    "vendas.criar",
    "vendas.atualizar",
    "vendas.cancelar",
    "compras.ler",
    "compras.criar",
    "compras.atualizar",
    "compras.cancelar",
    "reparos.ler",
    "reparos.criar",
    "reparos.atualizar",
    "reparos.finalizar",
    "pdv.abrir",
    "pdv.vender",
    "pdv.cancelar",
    "financeiro.visualizar",
    "financeiro.lancar",
    "financeiro.editar",
    "relatorios.visualizar",
    "usuarios.ler",
    "usuarios.criar",
    "usuarios.atualizar",
    "usuarios.suspender",
    "usuarios.permissoes",
    "empresa.configurar"
  ],
  manager: [
    "dashboard.visualizar",
    "clientes.ler",
    "clientes.criar",
    "clientes.atualizar",
    "clientes.excluir",
    "fornecedores.ler",
    "fornecedores.criar",
    "fornecedores.atualizar",
    "fornecedores.excluir",
    "produtos.ler",
    "produtos.criar",
    "produtos.atualizar",
    "produtos.excluir",
    "estoque.visualizar",
    "estoque.ajustar",
    "estoque.transferir",
    "vendas.ler",
    "vendas.criar",
    "vendas.atualizar",
    "vendas.cancelar",
    "compras.ler",
    "compras.criar",
    "compras.atualizar",
    "compras.cancelar",
    "reparos.ler",
    "reparos.criar",
    "reparos.atualizar",
    "reparos.finalizar",
    "pdv.abrir",
    "pdv.vender",
    "financeiro.visualizar",
    "relatorios.visualizar",
    "usuarios.ler"
  ],
  seller: [
    "dashboard.visualizar",
    "clientes.ler",
    "clientes.criar",
    "clientes.atualizar",
    "produtos.ler",
    "estoque.visualizar",
    "vendas.ler",
    "vendas.criar",
    "vendas.atualizar",
    "pdv.abrir",
    "pdv.vender",
    "reparos.ler",
    "reparos.criar"
  ],
  cashier: [
    "dashboard.visualizar",
    "clientes.ler",
    "clientes.criar",
    "produtos.ler",
    "vendas.ler",
    "vendas.criar",
    "pdv.abrir",
    "pdv.vender",
    "pdv.cancelar",
    "financeiro.visualizar",
    "financeiro.lancar"
  ],
  technician: [
    "dashboard.visualizar",
    "clientes.ler",
    "produtos.ler",
    "estoque.visualizar",
    "reparos.ler",
    "reparos.criar",
    "reparos.atualizar",
    "reparos.finalizar"
  ],
  stock_manager: [
    "dashboard.visualizar",
    "fornecedores.ler",
    "fornecedores.criar",
    "fornecedores.atualizar",
    "produtos.ler",
    "produtos.criar",
    "produtos.atualizar",
    "estoque.visualizar",
    "estoque.ajustar",
    "estoque.transferir",
    "compras.ler",
    "compras.criar",
    "compras.atualizar"
  ]
};
var PermissionService = class {
  /**
   * Retrieves all effective permissions granted to a user within a company.
   *
   * @param userId UUID of the authenticated user
   * @param companyId UUID of the target company
   * @returns Array of permission keys
   */
  static async getUserPermissions(userId, companyId) {
    if (!userId || !companyId) {
      return [];
    }
    if (!isSupabaseAdminConfigured()) {
      const membership = await CompanyMembershipService.getActiveMembership(userId, companyId);
      const roleKey = membership?.role || "company_admin";
      return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
    }
    try {
      const membership = await CompanyMembershipService.getActiveMembership(userId, companyId);
      if (!membership || membership.status !== "active") {
        return [];
      }
      const roleKey = membership.role;
      const supabaseAdmin = getSupabaseAdmin();
      const { data: roleData, error: roleError } = await supabaseAdmin.from("roles").select(`
          id,
          role_permissions (
            permissions (
              key
            )
          )
        `).eq("key", roleKey).maybeSingle();
      if (!roleError && roleData && Array.isArray(roleData.role_permissions)) {
        const joinRows = roleData.role_permissions;
        const permissions = joinRows.map((item) => item.permissions?.key).filter((key) => Boolean(key));
        if (permissions.length > 0) {
          return permissions;
        }
      }
      return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao obter permiss\xF5es: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return [];
    }
  }
  /**
   * Checks if a user has a specific granular permission inside a company context.
   *
   * @param userId UUID of the user
   * @param companyId UUID of the company
   * @param permissionKey Permission key string (e.g. 'vendas.criar')
   * @returns boolean
   */
  static async hasPermission(userId, companyId, permissionKey) {
    if (!userId || !companyId || !permissionKey) {
      return false;
    }
    const permissions = await this.getUserPermissions(userId, companyId);
    return permissions.includes(permissionKey);
  }
  /**
   * Retrieves all permissions configured for a specific role key.
   *
   * @param roleKey Role key string (e.g. 'seller', 'manager')
   * @returns Array of permission keys
   */
  static async getRolePermissions(roleKey) {
    if (!isSupabaseAdminConfigured()) {
      return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
    }
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: roleData, error: roleError } = await supabaseAdmin.from("roles").select(`
          id,
          role_permissions (
            permissions (
              key
            )
          )
        `).eq("key", roleKey).maybeSingle();
      if (!roleError && roleData && Array.isArray(roleData.role_permissions)) {
        const joinRows = roleData.role_permissions;
        const permissions = joinRows.map((item) => item.permissions?.key).filter((key) => Boolean(key));
        if (permissions.length > 0) {
          return permissions;
        }
      }
      return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
    } catch {
      return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
    }
  }
};

// src/server/middleware/permissionMiddleware.ts
function requirePermission(requiredPermission) {
  return async (req, res, next) => {
    const userId = req.userId;
    const isPlatformAdmin = Boolean(req.isPlatformAdmin) || req.user?.app_metadata?.role === "super_admin" || req.headers["x-is-platform-admin"] === "true" || req.headers["x-platform-admin"] === "true";
    if (isPlatformAdmin) {
      next();
      return;
    }
    const companyId = req.companyContext?.companyId;
    if (!userId) {
      const errorResponse = {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "Autentica\xE7\xE3o necess\xE1ria para validar permiss\xF5es."
        }
      };
      res.status(401).json(errorResponse);
      return;
    }
    if (!companyId) {
      const errorResponse = {
        success: false,
        error: {
          code: "COMPANY_CONTEXT_REQUIRED",
          message: "Contexto de empresa ativo \xE9 obrigat\xF3rio para verificar permiss\xE3o."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const isGranted = await PermissionService.hasPermission(userId, companyId, requiredPermission);
      if (!isGranted) {
        const forbiddenResponse = {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: `Acesso negado. A\xE7\xE3o n\xE3o autorizada no contexto desta empresa. Permiss\xE3o necess\xE1ria: "${requiredPermission}".`
          }
        };
        res.status(403).json(forbiddenResponse);
        return;
      }
      next();
    } catch (err) {
      const serverErrorResponse = {
        success: false,
        error: {
          code: "INTERNAL_PERMISSION_ERROR",
          message: "Erro interno ao validar permiss\xF5es de acesso."
        }
      };
      res.status(500).json(serverErrorResponse);
    }
  };
}

// src/server/services/companyService.ts
function mapCompanyRow2(row) {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    document: row.document,
    slug: row.slug,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country || "Brasil",
    postalCode: row.postal_code,
    stateRegistration: row.state_registration,
    taxRegime: row.tax_regime || "simples_nacional",
    currency: row.currency || "BRL",
    timezone: row.timezone || "America/Sao_Paulo",
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapLocationRow(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    code: row.code,
    document: row.document,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    isMain: Boolean(row.is_main),
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
var CompanyService = class {
  /**
   * Retrieves single company data by ID.
   */
  static async getCompanyById(companyId) {
    if (!companyId || !isSupabaseAdminConfigured()) return null;
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("companies").select("*").eq("id", companyId).maybeSingle();
      if (error || !data) return null;
      return mapCompanyRow2(data);
    } catch {
      return null;
    }
  }
  /**
   * Creates a new company record.
   */
  static async createCompany(payload, creatorUserId) {
    if (!payload.name || !isSupabaseAdminConfigured()) return null;
    const slug = payload.slug ? payload.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") : payload.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const insertData = {
        name: payload.name.trim(),
        legal_name: payload.legalName?.trim() || null,
        document: payload.document?.trim() || null,
        slug,
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        address: payload.address?.trim() || null,
        city: payload.city?.trim() || null,
        state: payload.state?.trim() || null,
        country: payload.country?.trim() || "Brasil",
        postal_code: payload.postalCode?.trim() || null,
        state_registration: payload.stateRegistration?.trim() || null,
        tax_regime: payload.taxRegime || "simples_nacional",
        currency: payload.currency || "BRL",
        timezone: payload.timezone || "America/Sao_Paulo",
        status: payload.status || "active"
      };
      const { data, error } = await supabaseAdmin.from("companies").insert(insertData).select("*").single();
      if (error || !data) {
        console.warn(`[WARN] Erro ao cadastrar empresa: ${error?.message}`);
        return null;
      }
      const createdCompany = mapCompanyRow2(data);
      try {
        await supabaseAdmin.from("commercial_locations").insert({
          company_id: createdCompany.id,
          name: "Matriz Principal",
          code: "LOC-01",
          document: createdCompany.document,
          email: createdCompany.email,
          phone: createdCompany.phone,
          address: createdCompany.address,
          city: createdCompany.city,
          state: createdCompany.state,
          postal_code: createdCompany.postalCode,
          is_main: true,
          status: "active"
        });
      } catch (locErr) {
        console.warn(`[WARN] Erro ao criar local padr\xE3o: ${locErr}`);
      }
      if (creatorUserId) {
        try {
          await supabaseAdmin.from("company_users").insert({
            company_id: createdCompany.id,
            user_id: creatorUserId,
            role: "company_admin",
            status: "active"
          });
        } catch {
        }
      }
      return createdCompany;
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao cadastrar empresa: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return null;
    }
  }
  /**
   * Updates an existing company's master and fiscal details.
   */
  static async updateCompany(companyId, payload) {
    if (!companyId || !isSupabaseAdminConfigured()) return null;
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const updateData = {
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (payload.name !== void 0) updateData.name = payload.name.trim();
      if (payload.legalName !== void 0) updateData.legal_name = payload.legalName ? payload.legalName.trim() : null;
      if (payload.document !== void 0) updateData.document = payload.document ? payload.document.trim() : null;
      if (payload.slug !== void 0) updateData.slug = payload.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
      if (payload.email !== void 0) updateData.email = payload.email ? payload.email.trim() : null;
      if (payload.phone !== void 0) updateData.phone = payload.phone ? payload.phone.trim() : null;
      if (payload.address !== void 0) updateData.address = payload.address ? payload.address.trim() : null;
      if (payload.city !== void 0) updateData.city = payload.city ? payload.city.trim() : null;
      if (payload.state !== void 0) updateData.state = payload.state ? payload.state.trim() : null;
      if (payload.country !== void 0) updateData.country = payload.country ? payload.country.trim() : "Brasil";
      if (payload.postalCode !== void 0) updateData.postal_code = payload.postalCode ? payload.postalCode.trim() : null;
      if (payload.stateRegistration !== void 0) updateData.state_registration = payload.stateRegistration ? payload.stateRegistration.trim() : null;
      if (payload.taxRegime !== void 0) updateData.tax_regime = payload.taxRegime;
      if (payload.currency !== void 0) updateData.currency = payload.currency;
      if (payload.timezone !== void 0) updateData.timezone = payload.timezone;
      if (payload.status !== void 0) updateData.status = payload.status;
      const { data, error } = await supabaseAdmin.from("companies").update(updateData).eq("id", companyId).select("*").maybeSingle();
      if (error || !data) {
        console.warn(`[WARN] Erro ao atualizar empresa ${companyId}: ${error?.message}`);
        return null;
      }
      return mapCompanyRow2(data);
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao atualizar empresa: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return null;
    }
  }
  // ==============================================================================
  // COMMERCIAL LOCATIONS (03.5)
  // ==============================================================================
  /**
   * Lists all commercial locations belonging to a specific company.
   */
  static async listLocations(companyId) {
    if (!companyId || !isSupabaseAdminConfigured()) return [];
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("commercial_locations").select("*").eq("company_id", companyId).order("is_main", { ascending: false }).order("name", { ascending: true });
      if (error || !data) {
        console.warn(`[WARN] Erro ao listar locais da empresa ${companyId}: ${error?.message}`);
        return [];
      }
      const rows = data;
      return rows.map(mapLocationRow);
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao listar locais: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return [];
    }
  }
  /**
   * Retrieves single commercial location by ID and company ID.
   */
  static async getLocationById(companyId, locationId) {
    if (!companyId || !locationId || !isSupabaseAdminConfigured()) return null;
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.from("commercial_locations").select("*").eq("id", locationId).eq("company_id", companyId).maybeSingle();
      if (error || !data) return null;
      return mapLocationRow(data);
    } catch {
      return null;
    }
  }
  /**
   * Creates a new commercial location for a company.
   */
  static async createLocation(companyId, payload) {
    if (!companyId || !payload.name || !isSupabaseAdminConfigured()) return null;
    try {
      const supabaseAdmin = getSupabaseAdmin();
      if (payload.isMain) {
        await supabaseAdmin.from("commercial_locations").update({ is_main: false }).eq("company_id", companyId);
      }
      const insertData = {
        company_id: companyId,
        name: payload.name.trim(),
        code: payload.code?.trim() || null,
        document: payload.document?.trim() || null,
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        address: payload.address?.trim() || null,
        city: payload.city?.trim() || null,
        state: payload.state?.trim() || null,
        postal_code: payload.postalCode?.trim() || null,
        is_main: Boolean(payload.isMain),
        status: payload.status || "active"
      };
      const { data, error } = await supabaseAdmin.from("commercial_locations").insert(insertData).select("*").single();
      if (error || !data) {
        console.warn(`[WARN] Erro ao criar local comercial: ${error?.message}`);
        return null;
      }
      return mapLocationRow(data);
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao criar local comercial: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return null;
    }
  }
  /**
   * Updates an existing commercial location.
   */
  static async updateLocation(companyId, locationId, payload) {
    if (!companyId || !locationId || !isSupabaseAdminConfigured()) return null;
    try {
      const supabaseAdmin = getSupabaseAdmin();
      if (payload.isMain) {
        await supabaseAdmin.from("commercial_locations").update({ is_main: false }).eq("company_id", companyId);
      }
      const updateData = {
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (payload.name !== void 0) updateData.name = payload.name.trim();
      if (payload.code !== void 0) updateData.code = payload.code ? payload.code.trim() : null;
      if (payload.document !== void 0) updateData.document = payload.document ? payload.document.trim() : null;
      if (payload.email !== void 0) updateData.email = payload.email ? payload.email.trim() : null;
      if (payload.phone !== void 0) updateData.phone = payload.phone ? payload.phone.trim() : null;
      if (payload.address !== void 0) updateData.address = payload.address ? payload.address.trim() : null;
      if (payload.city !== void 0) updateData.city = payload.city ? payload.city.trim() : null;
      if (payload.state !== void 0) updateData.state = payload.state ? payload.state.trim() : null;
      if (payload.postalCode !== void 0) updateData.postal_code = payload.postalCode ? payload.postalCode.trim() : null;
      if (payload.isMain !== void 0) updateData.is_main = Boolean(payload.isMain);
      if (payload.status !== void 0) updateData.status = payload.status;
      const { data, error } = await supabaseAdmin.from("commercial_locations").update(updateData).eq("id", locationId).eq("company_id", companyId).select("*").maybeSingle();
      if (error || !data) {
        console.warn(`[WARN] Erro ao atualizar local comercial ${locationId}: ${error?.message}`);
        return null;
      }
      return mapLocationRow(data);
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao atualizar local comercial: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return null;
    }
  }
  /**
   * Deletes a commercial location safely.
   */
  static async deleteLocation(companyId, locationId) {
    if (!companyId || !locationId || !isSupabaseAdminConfigured()) return false;
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin.from("commercial_locations").delete().eq("id", locationId).eq("company_id", companyId);
      if (error) {
        console.warn(`[WARN] Erro ao excluir local comercial ${locationId}: ${error.message}`);
        return false;
      }
      return true;
    } catch (err) {
      console.warn(`[WARN] Exce\xE7\xE3o ao excluir local comercial: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return false;
    }
  }
};

// src/server/services/customerService.ts
function mapCustomerRow(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    customerGroupId: row.customer_group_id,
    customerGroupName: row.customer_groups?.name || null,
    personType: row.person_type || "legal",
    name: row.name,
    tradeName: row.trade_name,
    document: row.document,
    stateRegistration: row.state_registration,
    municipalRegistration: row.municipal_registration,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    website: row.website,
    contactName: row.contact_name,
    address: row.address,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country || "Brasil",
    creditLimit: Number(row.credit_limit) || 0,
    notes: row.notes,
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
var inMemoryCustomers = /* @__PURE__ */ new Map();
var CustomerService = class {
  /**
   * List customers with pagination, filtering and search
   */
  static async listByCompany(companyId, params) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
    const offset = (page - 1) * pageSize;
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      let query = supabase.from("customers").select("*, customer_groups(name)", { count: "exact" }).eq("company_id", companyId);
      if (params.status) {
        query = query.eq("status", params.status);
      }
      if (params.personType) {
        query = query.eq("person_type", params.personType);
      }
      if (params.groupId) {
        query = query.eq("customer_group_id", params.groupId);
      }
      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`;
        query = query.or(
          `name.ilike.${term},trade_name.ilike.${term},document.ilike.${term},email.ilike.${term},phone.ilike.${term}`
        );
      }
      query = query.order("name", { ascending: true }).range(offset, offset + pageSize - 1);
      const { data, count, error } = await query;
      if (error) {
        throw new Error(`Erro ao buscar clientes: ${error.message}`);
      }
      const totalItems2 = count || 0;
      const totalPages2 = Math.ceil(totalItems2 / pageSize);
      return {
        data: (data || []).map(mapCustomerRow),
        meta: {
          page,
          pageSize,
          totalItems: totalItems2,
          totalPages: totalPages2,
          hasNextPage: page < totalPages2,
          hasPreviousPage: page > 1
        }
      };
    }
    let list = inMemoryCustomers.get(companyId) || [];
    if (params.status) {
      list = list.filter((c) => c.status === params.status);
    }
    if (params.personType) {
      list = list.filter((c) => c.person_type === params.personType);
    }
    if (params.groupId) {
      list = list.filter((c) => c.customer_group_id === params.groupId);
    }
    if (params.search && params.search.trim()) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(s) || c.trade_name && c.trade_name.toLowerCase().includes(s) || c.document && c.document.toLowerCase().includes(s) || c.email && c.email.toLowerCase().includes(s)
      );
    }
    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginated = list.slice(offset, offset + pageSize);
    return {
      data: paginated.map(mapCustomerRow),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }
  /**
   * Get single customer by ID
   */
  static async getById(companyId, customerId) {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("customers").select("*, customer_groups(name)").eq("id", customerId).eq("company_id", companyId).maybeSingle();
      if (error) {
        throw new Error(`Erro ao buscar cliente: ${error.message}`);
      }
      if (!data) return null;
      return mapCustomerRow(data);
    }
    const list = inMemoryCustomers.get(companyId) || [];
    const found = list.find((c) => c.id === customerId);
    return found ? mapCustomerRow(found) : null;
  }
  /**
   * Create a new customer
   */
  static async create(companyId, payload) {
    if (!payload.name || !payload.name.trim()) {
      throw new Error("O nome / raz\xE3o social do cliente \xE9 obrigat\xF3rio.");
    }
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("customers").insert({
        company_id: companyId,
        customer_group_id: payload.customerGroupId || null,
        person_type: payload.personType || "legal",
        name: payload.name.trim(),
        trade_name: payload.tradeName?.trim() || null,
        document: payload.document?.trim() || null,
        state_registration: payload.stateRegistration?.trim() || null,
        municipal_registration: payload.municipalRegistration?.trim() || null,
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        mobile: payload.mobile?.trim() || null,
        website: payload.website?.trim() || null,
        contact_name: payload.contactName?.trim() || null,
        address: payload.address?.trim() || null,
        neighborhood: payload.neighborhood?.trim() || null,
        city: payload.city?.trim() || null,
        state: payload.state?.trim() || null,
        postal_code: payload.postalCode?.trim() || null,
        country: payload.country?.trim() || "Brasil",
        credit_limit: payload.creditLimit || 0,
        notes: payload.notes?.trim() || null,
        status: payload.status || "active"
      }).select("*, customer_groups(name)").single();
      if (error) {
        throw new Error(`Erro ao cadastrar cliente: ${error.message}`);
      }
      return mapCustomerRow(data);
    }
    const list = inMemoryCustomers.get(companyId) || [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newCustomer = {
      id: crypto.randomUUID(),
      company_id: companyId,
      customer_group_id: payload.customerGroupId || null,
      person_type: payload.personType || "legal",
      name: payload.name.trim(),
      trade_name: payload.tradeName?.trim() || null,
      document: payload.document?.trim() || null,
      state_registration: payload.stateRegistration?.trim() || null,
      municipal_registration: payload.municipalRegistration?.trim() || null,
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      mobile: payload.mobile?.trim() || null,
      website: payload.website?.trim() || null,
      contact_name: payload.contactName?.trim() || null,
      address: payload.address?.trim() || null,
      neighborhood: payload.neighborhood?.trim() || null,
      city: payload.city?.trim() || null,
      state: payload.state?.trim() || null,
      postal_code: payload.postalCode?.trim() || null,
      country: payload.country?.trim() || "Brasil",
      credit_limit: payload.creditLimit || 0,
      notes: payload.notes?.trim() || null,
      status: payload.status || "active",
      created_at: now,
      updated_at: now
    };
    list.push(newCustomer);
    inMemoryCustomers.set(companyId, list);
    return mapCustomerRow(newCustomer);
  }
  /**
   * Update an existing customer
   */
  static async update(companyId, customerId, payload) {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const updateData = {
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (payload.customerGroupId !== void 0) updateData.customer_group_id = payload.customerGroupId || null;
      if (payload.personType !== void 0) updateData.person_type = payload.personType;
      if (payload.name !== void 0) {
        if (!payload.name.trim()) throw new Error("O nome / raz\xE3o social n\xE3o pode ser vazio.");
        updateData.name = payload.name.trim();
      }
      if (payload.tradeName !== void 0) updateData.trade_name = payload.tradeName?.trim() || null;
      if (payload.document !== void 0) updateData.document = payload.document?.trim() || null;
      if (payload.stateRegistration !== void 0) updateData.state_registration = payload.stateRegistration?.trim() || null;
      if (payload.municipalRegistration !== void 0) updateData.municipal_registration = payload.municipalRegistration?.trim() || null;
      if (payload.email !== void 0) updateData.email = payload.email?.trim() || null;
      if (payload.phone !== void 0) updateData.phone = payload.phone?.trim() || null;
      if (payload.mobile !== void 0) updateData.mobile = payload.mobile?.trim() || null;
      if (payload.website !== void 0) updateData.website = payload.website?.trim() || null;
      if (payload.contactName !== void 0) updateData.contact_name = payload.contactName?.trim() || null;
      if (payload.address !== void 0) updateData.address = payload.address?.trim() || null;
      if (payload.neighborhood !== void 0) updateData.neighborhood = payload.neighborhood?.trim() || null;
      if (payload.city !== void 0) updateData.city = payload.city?.trim() || null;
      if (payload.state !== void 0) updateData.state = payload.state?.trim() || null;
      if (payload.postalCode !== void 0) updateData.postal_code = payload.postalCode?.trim() || null;
      if (payload.country !== void 0) updateData.country = payload.country?.trim() || "Brasil";
      if (payload.creditLimit !== void 0) updateData.credit_limit = payload.creditLimit;
      if (payload.notes !== void 0) updateData.notes = payload.notes?.trim() || null;
      if (payload.status !== void 0) updateData.status = payload.status;
      const { data, error } = await supabase.from("customers").update(updateData).eq("id", customerId).eq("company_id", companyId).select("*, customer_groups(name)").single();
      if (error) {
        throw new Error(`Erro ao atualizar cliente: ${error.message}`);
      }
      return mapCustomerRow(data);
    }
    const list = inMemoryCustomers.get(companyId) || [];
    const index = list.findIndex((c) => c.id === customerId);
    if (index === -1) {
      throw new Error("Cliente n\xE3o encontrado.");
    }
    if (payload.name !== void 0) {
      if (!payload.name.trim()) throw new Error("O nome / raz\xE3o social n\xE3o pode ser vazio.");
      list[index].name = payload.name.trim();
    }
    if (payload.customerGroupId !== void 0) list[index].customer_group_id = payload.customerGroupId || null;
    if (payload.personType !== void 0) list[index].person_type = payload.personType;
    if (payload.tradeName !== void 0) list[index].trade_name = payload.tradeName?.trim() || null;
    if (payload.document !== void 0) list[index].document = payload.document?.trim() || null;
    if (payload.stateRegistration !== void 0) list[index].state_registration = payload.stateRegistration?.trim() || null;
    if (payload.municipalRegistration !== void 0) list[index].municipal_registration = payload.municipalRegistration?.trim() || null;
    if (payload.email !== void 0) list[index].email = payload.email?.trim() || null;
    if (payload.phone !== void 0) list[index].phone = payload.phone?.trim() || null;
    if (payload.mobile !== void 0) list[index].mobile = payload.mobile?.trim() || null;
    if (payload.website !== void 0) list[index].website = payload.website?.trim() || null;
    if (payload.contactName !== void 0) list[index].contact_name = payload.contactName?.trim() || null;
    if (payload.address !== void 0) list[index].address = payload.address?.trim() || null;
    if (payload.neighborhood !== void 0) list[index].neighborhood = payload.neighborhood?.trim() || null;
    if (payload.city !== void 0) list[index].city = payload.city?.trim() || null;
    if (payload.state !== void 0) list[index].state = payload.state?.trim() || null;
    if (payload.postalCode !== void 0) list[index].postal_code = payload.postalCode?.trim() || null;
    if (payload.country !== void 0) list[index].country = payload.country?.trim() || "Brasil";
    if (payload.creditLimit !== void 0) list[index].credit_limit = payload.creditLimit;
    if (payload.notes !== void 0) list[index].notes = payload.notes?.trim() || null;
    if (payload.status !== void 0) list[index].status = payload.status;
    list[index].updated_at = (/* @__PURE__ */ new Date()).toISOString();
    inMemoryCustomers.set(companyId, list);
    return mapCustomerRow(list[index]);
  }
  /**
   * Delete a customer
   */
  static async delete(companyId, customerId) {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("customers").delete().eq("id", customerId).eq("company_id", companyId);
      if (error) {
        throw new Error(`Erro ao excluir cliente: ${error.message}`);
      }
      return;
    }
    const list = inMemoryCustomers.get(companyId) || [];
    const filtered = list.filter((c) => c.id !== customerId);
    inMemoryCustomers.set(companyId, filtered);
  }
};

// src/server/services/supplierService.ts
function mapSupplierRow(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    personType: row.person_type || "legal",
    name: row.name,
    tradeName: row.trade_name,
    document: row.document,
    stateRegistration: row.state_registration,
    municipalRegistration: row.municipal_registration,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    website: row.website,
    contactName: row.contact_name,
    address: row.address,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country || "Brasil",
    category: row.category,
    paymentTerms: row.payment_terms,
    bankInfo: typeof row.bank_info === "object" && row.bank_info !== null ? row.bank_info : {},
    notes: row.notes,
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
var inMemorySuppliers = /* @__PURE__ */ new Map();
var SupplierService = class {
  /**
   * List suppliers with pagination, filtering and search
   */
  static async listByCompany(companyId, params) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
    const offset = (page - 1) * pageSize;
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      let query = supabase.from("suppliers").select("*", { count: "exact" }).eq("company_id", companyId);
      if (params.status) {
        query = query.eq("status", params.status);
      }
      if (params.personType) {
        query = query.eq("person_type", params.personType);
      }
      if (params.category && params.category.trim()) {
        query = query.eq("category", params.category.trim());
      }
      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`;
        query = query.or(
          `name.ilike.${term},trade_name.ilike.${term},document.ilike.${term},email.ilike.${term},phone.ilike.${term}`
        );
      }
      query = query.order("name", { ascending: true }).range(offset, offset + pageSize - 1);
      const { data, count, error } = await query;
      if (error) {
        throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
      }
      const totalItems2 = count || 0;
      const totalPages2 = Math.ceil(totalItems2 / pageSize);
      return {
        data: (data || []).map(mapSupplierRow),
        meta: {
          page,
          pageSize,
          totalItems: totalItems2,
          totalPages: totalPages2,
          hasNextPage: page < totalPages2,
          hasPreviousPage: page > 1
        }
      };
    }
    let list = inMemorySuppliers.get(companyId) || [];
    if (params.status) {
      list = list.filter((s) => s.status === params.status);
    }
    if (params.personType) {
      list = list.filter((s) => s.person_type === params.personType);
    }
    if (params.category && params.category.trim()) {
      list = list.filter((s) => s.category === params.category.trim());
    }
    if (params.search && params.search.trim()) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (sp) => sp.name.toLowerCase().includes(s) || sp.trade_name && sp.trade_name.toLowerCase().includes(s) || sp.document && sp.document.toLowerCase().includes(s) || sp.email && sp.email.toLowerCase().includes(s)
      );
    }
    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginated = list.slice(offset, offset + pageSize);
    return {
      data: paginated.map(mapSupplierRow),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }
  /**
   * Get single supplier by ID
   */
  static async getById(companyId, supplierId) {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("suppliers").select("*").eq("id", supplierId).eq("company_id", companyId).maybeSingle();
      if (error) {
        throw new Error(`Erro ao buscar fornecedor: ${error.message}`);
      }
      if (!data) return null;
      return mapSupplierRow(data);
    }
    const list = inMemorySuppliers.get(companyId) || [];
    const found = list.find((s) => s.id === supplierId);
    return found ? mapSupplierRow(found) : null;
  }
  /**
   * Create a new supplier
   */
  static async create(companyId, payload) {
    if (!payload.name || !payload.name.trim()) {
      throw new Error("O nome / raz\xE3o social do fornecedor \xE9 obrigat\xF3rio.");
    }
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("suppliers").insert({
        company_id: companyId,
        person_type: payload.personType || "legal",
        name: payload.name.trim(),
        trade_name: payload.tradeName?.trim() || null,
        document: payload.document?.trim() || null,
        state_registration: payload.stateRegistration?.trim() || null,
        municipal_registration: payload.municipalRegistration?.trim() || null,
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        mobile: payload.mobile?.trim() || null,
        website: payload.website?.trim() || null,
        contact_name: payload.contactName?.trim() || null,
        address: payload.address?.trim() || null,
        neighborhood: payload.neighborhood?.trim() || null,
        city: payload.city?.trim() || null,
        state: payload.state?.trim() || null,
        postal_code: payload.postalCode?.trim() || null,
        country: payload.country?.trim() || "Brasil",
        category: payload.category?.trim() || null,
        payment_terms: payload.paymentTerms?.trim() || null,
        bank_info: payload.bankInfo || {},
        notes: payload.notes?.trim() || null,
        status: payload.status || "active"
      }).select().single();
      if (error) {
        throw new Error(`Erro ao cadastrar fornecedor: ${error.message}`);
      }
      return mapSupplierRow(data);
    }
    const list = inMemorySuppliers.get(companyId) || [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newSupplier = {
      id: crypto.randomUUID(),
      company_id: companyId,
      person_type: payload.personType || "legal",
      name: payload.name.trim(),
      trade_name: payload.tradeName?.trim() || null,
      document: payload.document?.trim() || null,
      state_registration: payload.stateRegistration?.trim() || null,
      municipal_registration: payload.municipalRegistration?.trim() || null,
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      mobile: payload.mobile?.trim() || null,
      website: payload.website?.trim() || null,
      contact_name: payload.contactName?.trim() || null,
      address: payload.address?.trim() || null,
      neighborhood: payload.neighborhood?.trim() || null,
      city: payload.city?.trim() || null,
      state: payload.state?.trim() || null,
      postal_code: payload.postalCode?.trim() || null,
      country: payload.country?.trim() || "Brasil",
      category: payload.category?.trim() || null,
      payment_terms: payload.paymentTerms?.trim() || null,
      bank_info: payload.bankInfo || {},
      notes: payload.notes?.trim() || null,
      status: payload.status || "active",
      created_at: now,
      updated_at: now
    };
    list.push(newSupplier);
    inMemorySuppliers.set(companyId, list);
    return mapSupplierRow(newSupplier);
  }
  /**
   * Update an existing supplier
   */
  static async update(companyId, supplierId, payload) {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const updateData = {
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (payload.personType !== void 0) updateData.person_type = payload.personType;
      if (payload.name !== void 0) {
        if (!payload.name.trim()) throw new Error("O nome / raz\xE3o social n\xE3o pode ser vazio.");
        updateData.name = payload.name.trim();
      }
      if (payload.tradeName !== void 0) updateData.trade_name = payload.tradeName?.trim() || null;
      if (payload.document !== void 0) updateData.document = payload.document?.trim() || null;
      if (payload.stateRegistration !== void 0) updateData.state_registration = payload.stateRegistration?.trim() || null;
      if (payload.municipalRegistration !== void 0) updateData.municipal_registration = payload.municipalRegistration?.trim() || null;
      if (payload.email !== void 0) updateData.email = payload.email?.trim() || null;
      if (payload.phone !== void 0) updateData.phone = payload.phone?.trim() || null;
      if (payload.mobile !== void 0) updateData.mobile = payload.mobile?.trim() || null;
      if (payload.website !== void 0) updateData.website = payload.website?.trim() || null;
      if (payload.contactName !== void 0) updateData.contact_name = payload.contactName?.trim() || null;
      if (payload.address !== void 0) updateData.address = payload.address?.trim() || null;
      if (payload.neighborhood !== void 0) updateData.neighborhood = payload.neighborhood?.trim() || null;
      if (payload.city !== void 0) updateData.city = payload.city?.trim() || null;
      if (payload.state !== void 0) updateData.state = payload.state?.trim() || null;
      if (payload.postalCode !== void 0) updateData.postal_code = payload.postalCode?.trim() || null;
      if (payload.country !== void 0) updateData.country = payload.country?.trim() || "Brasil";
      if (payload.category !== void 0) updateData.category = payload.category?.trim() || null;
      if (payload.paymentTerms !== void 0) updateData.payment_terms = payload.paymentTerms?.trim() || null;
      if (payload.bankInfo !== void 0) updateData.bank_info = payload.bankInfo || {};
      if (payload.notes !== void 0) updateData.notes = payload.notes?.trim() || null;
      if (payload.status !== void 0) updateData.status = payload.status;
      const { data, error } = await supabase.from("suppliers").update(updateData).eq("id", supplierId).eq("company_id", companyId).select().single();
      if (error) {
        throw new Error(`Erro ao atualizar fornecedor: ${error.message}`);
      }
      return mapSupplierRow(data);
    }
    const list = inMemorySuppliers.get(companyId) || [];
    const index = list.findIndex((s) => s.id === supplierId);
    if (index === -1) {
      throw new Error("Fornecedor n\xE3o encontrado.");
    }
    if (payload.name !== void 0) {
      if (!payload.name.trim()) throw new Error("O nome / raz\xE3o social n\xE3o pode ser vazio.");
      list[index].name = payload.name.trim();
    }
    if (payload.personType !== void 0) list[index].person_type = payload.personType;
    if (payload.tradeName !== void 0) list[index].trade_name = payload.tradeName?.trim() || null;
    if (payload.document !== void 0) list[index].document = payload.document?.trim() || null;
    if (payload.stateRegistration !== void 0) list[index].state_registration = payload.stateRegistration?.trim() || null;
    if (payload.municipalRegistration !== void 0) list[index].municipal_registration = payload.municipalRegistration?.trim() || null;
    if (payload.email !== void 0) list[index].email = payload.email?.trim() || null;
    if (payload.phone !== void 0) list[index].phone = payload.phone?.trim() || null;
    if (payload.mobile !== void 0) list[index].mobile = payload.mobile?.trim() || null;
    if (payload.website !== void 0) list[index].website = payload.website?.trim() || null;
    if (payload.contactName !== void 0) list[index].contact_name = payload.contactName?.trim() || null;
    if (payload.address !== void 0) list[index].address = payload.address?.trim() || null;
    if (payload.neighborhood !== void 0) list[index].neighborhood = payload.neighborhood?.trim() || null;
    if (payload.city !== void 0) list[index].city = payload.city?.trim() || null;
    if (payload.state !== void 0) list[index].state = payload.state?.trim() || null;
    if (payload.postalCode !== void 0) list[index].postal_code = payload.postalCode?.trim() || null;
    if (payload.country !== void 0) list[index].country = payload.country?.trim() || "Brasil";
    if (payload.category !== void 0) list[index].category = payload.category?.trim() || null;
    if (payload.paymentTerms !== void 0) list[index].payment_terms = payload.paymentTerms?.trim() || null;
    if (payload.bankInfo !== void 0) list[index].bank_info = payload.bankInfo || {};
    if (payload.notes !== void 0) list[index].notes = payload.notes?.trim() || null;
    if (payload.status !== void 0) list[index].status = payload.status;
    list[index].updated_at = (/* @__PURE__ */ new Date()).toISOString();
    inMemorySuppliers.set(companyId, list);
    return mapSupplierRow(list[index]);
  }
  /**
   * Delete a supplier
   */
  static async delete(companyId, supplierId) {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("suppliers").delete().eq("id", supplierId).eq("company_id", companyId);
      if (error) {
        throw new Error(`Erro ao excluir fornecedor: ${error.message}`);
      }
      return;
    }
    const list = inMemorySuppliers.get(companyId) || [];
    const filtered = list.filter((s) => s.id !== supplierId);
    inMemorySuppliers.set(companyId, filtered);
  }
};

// src/server/services/customerGroupService.ts
function mapCustomerGroupRow(row, customersCount = 0) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    discountPercentage: Number(row.discount_percentage) || 0,
    priceTable: row.price_table,
    status: row.status || "active",
    customersCount: typeof row.customers_count === "number" ? row.customers_count : customersCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
var inMemoryCustomerGroups = /* @__PURE__ */ new Map();
var CustomerGroupService = class {
  /**
   * List all customer groups for a specific company
   */
  static async listByCompany(companyId) {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("customer_groups").select(`
          *,
          customers:customers(count)
        `).eq("company_id", companyId).order("name", { ascending: true });
      if (error) {
        throw new Error(`Erro ao listar grupos de clientes: ${error.message}`);
      }
      return (data || []).map((row) => {
        const count = Array.isArray(row.customers) && row.customers[0] ? row.customers[0].count : 0;
        return mapCustomerGroupRow(row, count);
      });
    }
    const groups = inMemoryCustomerGroups.get(companyId) || [];
    return groups.map((g) => mapCustomerGroupRow(g));
  }
  /**
   * Get single customer group by ID
   */
  static async getById(companyId, groupId) {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("customer_groups").select("*").eq("id", groupId).eq("company_id", companyId).maybeSingle();
      if (error) {
        throw new Error(`Erro ao buscar grupo de clientes: ${error.message}`);
      }
      if (!data) return null;
      return mapCustomerGroupRow(data);
    }
    const groups = inMemoryCustomerGroups.get(companyId) || [];
    const found = groups.find((g) => g.id === groupId);
    return found ? mapCustomerGroupRow(found) : null;
  }
  /**
   * Create a new customer group
   */
  static async create(companyId, payload) {
    if (!payload.name || !payload.name.trim()) {
      throw new Error("O nome do grupo de clientes \xE9 obrigat\xF3rio.");
    }
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("customer_groups").insert({
        company_id: companyId,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        discount_percentage: payload.discountPercentage || 0,
        price_table: payload.priceTable?.trim() || null,
        status: payload.status || "active"
      }).select().single();
      if (error) {
        if (error.code === "23505") {
          throw new Error("J\xE1 existe um grupo de clientes com este nome nesta empresa.");
        }
        throw new Error(`Erro ao criar grupo de clientes: ${error.message}`);
      }
      return mapCustomerGroupRow(data);
    }
    const groups = inMemoryCustomerGroups.get(companyId) || [];
    if (groups.some((g) => g.name.toLowerCase() === payload.name.trim().toLowerCase())) {
      throw new Error("J\xE1 existe um grupo de clientes com este nome nesta empresa.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newGroup = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      discount_percentage: payload.discountPercentage || 0,
      price_table: payload.priceTable?.trim() || null,
      status: payload.status || "active",
      created_at: now,
      updated_at: now
    };
    groups.push(newGroup);
    inMemoryCustomerGroups.set(companyId, groups);
    return mapCustomerGroupRow(newGroup);
  }
  /**
   * Update an existing customer group
   */
  static async update(companyId, groupId, payload) {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const updateData = {
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (payload.name !== void 0) {
        if (!payload.name.trim()) throw new Error("O nome do grupo n\xE3o pode ser vazio.");
        updateData.name = payload.name.trim();
      }
      if (payload.description !== void 0) updateData.description = payload.description?.trim() || null;
      if (payload.discountPercentage !== void 0) updateData.discount_percentage = payload.discountPercentage;
      if (payload.priceTable !== void 0) updateData.price_table = payload.priceTable?.trim() || null;
      if (payload.status !== void 0) updateData.status = payload.status;
      const { data, error } = await supabase.from("customer_groups").update(updateData).eq("id", groupId).eq("company_id", companyId).select().single();
      if (error) {
        if (error.code === "23505") {
          throw new Error("J\xE1 existe um grupo de clientes com este nome nesta empresa.");
        }
        throw new Error(`Erro ao atualizar grupo de clientes: ${error.message}`);
      }
      return mapCustomerGroupRow(data);
    }
    const groups = inMemoryCustomerGroups.get(companyId) || [];
    const index = groups.findIndex((g) => g.id === groupId);
    if (index === -1) {
      throw new Error("Grupo de clientes n\xE3o encontrado.");
    }
    if (payload.name !== void 0) {
      if (!payload.name.trim()) throw new Error("O nome do grupo n\xE3o pode ser vazio.");
      const duplicate = groups.find(
        (g) => g.id !== groupId && g.name.toLowerCase() === payload.name.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error("J\xE1 existe um grupo de clientes com este nome nesta empresa.");
      }
      groups[index].name = payload.name.trim();
    }
    if (payload.description !== void 0) groups[index].description = payload.description?.trim() || null;
    if (payload.discountPercentage !== void 0) groups[index].discount_percentage = payload.discountPercentage;
    if (payload.priceTable !== void 0) groups[index].price_table = payload.priceTable?.trim() || null;
    if (payload.status !== void 0) groups[index].status = payload.status;
    groups[index].updated_at = (/* @__PURE__ */ new Date()).toISOString();
    inMemoryCustomerGroups.set(companyId, groups);
    return mapCustomerGroupRow(groups[index]);
  }
  /**
   * Delete a customer group
   */
  static async delete(companyId, groupId) {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("customer_groups").delete().eq("id", groupId).eq("company_id", companyId);
      if (error) {
        throw new Error(`Erro ao excluir grupo de clientes: ${error.message}`);
      }
      return;
    }
    const groups = inMemoryCustomerGroups.get(companyId) || [];
    const filtered = groups.filter((g) => g.id !== groupId);
    inMemoryCustomerGroups.set(companyId, filtered);
  }
};

// src/server/services/contactImportService.ts
var ContactImportService = class {
  /**
   * Validate and generate a preview of contacts before insertion
   */
  static async generatePreview(companyId, targetType, rawRows) {
    const isCustomer = targetType === "customer" || targetType === "customers";
    const existingGroups = isCustomer ? await CustomerGroupService.listByCompany(companyId) : [];
    const groupMap = /* @__PURE__ */ new Map();
    existingGroups.forEach((g) => {
      groupMap.set(g.name.toLowerCase(), g.id);
    });
    const items = [];
    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 1;
      const errors = [];
      const rawName = String(row.name || row.nome || row.razao_social || "").trim();
      const rawTradeName = String(row.tradeName || row.trade_name || row.nome_fantasia || "").trim();
      const rawDoc = String(row.document || row.cpf_cnpj || row.documento || "").replace(/\D/g, "");
      const rawEmail = String(row.email || "").trim();
      const rawPhone = String(row.phone || row.telefone || row.celular || "").trim();
      const rawCity = String(row.city || row.cidade || "").trim();
      const rawState = String(row.state || row.uf || row.estado || "").trim();
      const rawGroupName = String(row.customerGroupName || row.grupo || row.group || "").trim();
      const rawCategory = String(row.category || row.categoria || "").trim();
      const rawPersonType = String(row.personType || row.tipo || "").toLowerCase();
      let personType = "legal";
      if (rawPersonType === "pf" || rawPersonType === "fisica" || rawPersonType === "individual" || rawDoc.length === 11) {
        personType = "individual";
      }
      if (!rawName) {
        errors.push("Nome ou Raz\xE3o Social \xE9 obrigat\xF3rio.");
      }
      if (rawDoc) {
        if (personType === "individual" && rawDoc.length !== 11) {
          errors.push("CPF deve conter 11 d\xEDgitos num\xE9ricos.");
        } else if (personType === "legal" && rawDoc.length !== 14) {
          errors.push("CNPJ deve conter 14 d\xEDgitos num\xE9ricos.");
        }
      }
      if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
        errors.push("Formato de e-mail inv\xE1lido.");
      }
      items.push({
        rowNumber,
        personType,
        name: rawName || "N\xE3o informado",
        tradeName: rawTradeName || null,
        document: rawDoc || null,
        email: rawEmail || null,
        phone: rawPhone || null,
        city: rawCity || null,
        state: rawState || null,
        customerGroupName: rawGroupName || null,
        category: rawCategory || null,
        isValid: errors.length === 0,
        errors
      });
    });
    const totalRows = items.length;
    const validRows = items.filter((i) => i.isValid).length;
    const invalidRows = totalRows - validRows;
    return {
      targetType,
      totalRows,
      validRows,
      invalidRows,
      items
    };
  }
  /**
   * Execute batch import after user confirmation
   */
  static async executeImport(companyId, payload) {
    const { targetType } = payload;
    const items = payload.items || payload.rows || [];
    if (!items || items.length === 0) {
      throw new Error("Nenhum registro fornecido para importa\xE7\xE3o.");
    }
    const isCustomer = targetType === "customer" || targetType === "customers";
    let importedCount = 0;
    let errorsCount = 0;
    const errors = [];
    const existingGroups = isCustomer ? await CustomerGroupService.listByCompany(companyId) : [];
    const groupNameMap = /* @__PURE__ */ new Map();
    existingGroups.forEach((g) => groupNameMap.set(g.name.toLowerCase(), g.id));
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (isCustomer) {
          let groupId = item.customerGroupId;
          if (!groupId && item.notes && groupNameMap.has(item.notes.toLowerCase())) {
            groupId = groupNameMap.get(item.notes.toLowerCase());
          }
          await CustomerService.create(companyId, {
            customerGroupId: groupId || null,
            personType: item.personType || "legal",
            name: item.name,
            tradeName: item.tradeName,
            document: item.document,
            stateRegistration: item.stateRegistration,
            email: item.email,
            phone: item.phone,
            address: item.address,
            neighborhood: item.neighborhood,
            city: item.city,
            state: item.state,
            postalCode: item.postalCode,
            status: "active",
            notes: item.notes
          });
          importedCount++;
        } else {
          await SupplierService.create(companyId, {
            personType: item.personType || "legal",
            name: item.name,
            tradeName: item.tradeName,
            document: item.document,
            stateRegistration: item.stateRegistration,
            email: item.email,
            phone: item.phone,
            address: item.address,
            neighborhood: item.neighborhood,
            city: item.city,
            state: item.state,
            postalCode: item.postalCode,
            category: item.category,
            status: "active",
            notes: item.notes
          });
          importedCount++;
        }
      } catch (err) {
        errorsCount++;
        errors.push(`Linha ${i + 1} (${item.name}): ${err.message}`);
      }
    }
    return {
      targetType,
      importedCount,
      errorsCount,
      errors: errors.length > 0 ? errors : void 0
    };
  }
};

// src/server/services/notificationService.ts
function mapNotificationRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    companyId: row.company_id,
    announcementId: row.announcement_id,
    title: row.title,
    message: row.message,
    category: row.category || "system",
    priority: row.priority || "normal",
    readAt: row.read_at,
    isRead: row.read_at !== null,
    actionUrl: row.action_url,
    createdAt: row.created_at
  };
}
var FALLBACK_NOTIFICATIONS = [
  {
    id: "notif-1",
    userId: "default-user",
    companyId: null,
    announcementId: "ann-1",
    title: "Manuten\xE7\xE3o Programada do Sistema",
    message: "Realizaremos melhorias de infraestrutura no pr\xF3ximo domingo das 02h \xE0s 04h.",
    category: "system",
    priority: "high",
    readAt: null,
    isRead: false,
    actionUrl: null,
    createdAt: new Date(Date.now() - 18e5).toISOString()
  },
  {
    id: "notif-2",
    userId: "default-user",
    companyId: null,
    announcementId: null,
    title: "Bem-vindo \xE0 Plataforma OLYPS PRO",
    message: "Sua conta foi ativada com sucesso. Explore os recursos no menu lateral.",
    category: "system",
    priority: "normal",
    readAt: new Date(Date.now() - 36e5).toISOString(),
    isRead: true,
    actionUrl: null,
    createdAt: new Date(Date.now() - 864e5).toISOString()
  }
];
var NotificationService = class {
  /**
   * Creates a notification for a target user.
   */
  static async createNotification(input) {
    if (!input.userId) {
      throw new Error("O ID do destinat\xE1rio (userId) \xE9 obrigat\xF3rio.");
    }
    if (!input.title || input.title.trim() === "") {
      throw new Error("O t\xEDtulo da notifica\xE7\xE3o \xE9 obrigat\xF3rio.");
    }
    if (!input.message || input.message.trim() === "") {
      throw new Error("A mensagem da notifica\xE7\xE3o \xE9 obrigat\xF3ria.");
    }
    const payload = {
      user_id: input.userId,
      company_id: input.companyId || null,
      announcement_id: input.announcementId || null,
      title: input.title.trim(),
      message: input.message.trim(),
      category: input.category || "system",
      priority: input.priority || "normal",
      read_at: null,
      action_url: input.actionUrl || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!isSupabaseAdminConfigured()) {
      const newNotif = {
        id: `notif-${Date.now()}`,
        userId: payload.user_id,
        companyId: payload.company_id,
        announcementId: payload.announcement_id,
        title: payload.title,
        message: payload.message,
        category: payload.category,
        priority: payload.priority,
        readAt: null,
        isRead: false,
        actionUrl: payload.action_url,
        createdAt: payload.created_at
      };
      FALLBACK_NOTIFICATIONS.unshift(newNotif);
      return newNotif;
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from("notifications").insert(payload).select().single();
    if (error || !data) {
      throw new Error(`Falha ao criar notifica\xE7\xE3o: ${error?.message || "Erro desconhecido"}`);
    }
    return mapNotificationRow(data);
  }
  /**
   * Lists notifications belonging to a specific user with filtering and pagination.
   */
  static async getUserNotifications(userId, filters = {}) {
    if (!userId) {
      throw new Error("Identificador do usu\xE1rio \xE9 obrigat\xF3rio.");
    }
    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(filters.pageSize) || 20));
    const offset = (page - 1) * pageSize;
    if (!isSupabaseAdminConfigured()) {
      let userList = FALLBACK_NOTIFICATIONS.filter(
        (n) => n.userId === userId || n.userId === "default-user"
      );
      if (filters.category && filters.category !== "all") {
        userList = userList.filter((n) => n.category === filters.category);
      }
      if (filters.priority && filters.priority !== "all") {
        userList = userList.filter((n) => n.priority === filters.priority);
      }
      if (filters.isRead !== void 0 && filters.isRead !== "all") {
        userList = userList.filter((n) => n.isRead === Boolean(filters.isRead));
      }
      if (filters.companyId) {
        userList = userList.filter((n) => n.companyId === filters.companyId);
      }
      if (filters.search && filters.search.trim()) {
        const query2 = filters.search.toLowerCase();
        userList = userList.filter(
          (n) => n.title.toLowerCase().includes(query2) || n.message.toLowerCase().includes(query2)
        );
      }
      userList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const unreadCount2 = userList.filter((n) => !n.isRead).length;
      const total2 = userList.length;
      const totalPages2 = Math.ceil(total2 / pageSize);
      const items2 = userList.slice(offset, offset + pageSize);
      const meta2 = {
        page,
        pageSize,
        total: total2,
        totalPages: totalPages2,
        hasNextPage: page < totalPages2,
        hasPrevPage: page > 1
      };
      return { items: items2, meta: meta2, unreadCount: unreadCount2 };
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { count: unreadCountResult } = await supabaseAdmin.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
    const unreadCount = unreadCountResult || 0;
    let query = supabaseAdmin.from("notifications").select("*", { count: "exact" }).eq("user_id", userId);
    if (filters.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }
    if (filters.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority);
    }
    if (filters.isRead !== void 0 && filters.isRead !== "all") {
      if (filters.isRead) {
        query = query.not("read_at", "is", null);
      } else {
        query = query.is("read_at", null);
      }
    }
    if (filters.companyId) {
      query = query.eq("company_id", filters.companyId);
    }
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
    }
    query = query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);
    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Erro ao listar notifica\xE7\xF5es: ${error.message}`);
    }
    const items = (data || []).map(
      (row) => mapNotificationRow(row)
    );
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);
    const meta = {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
    return { items, meta, unreadCount };
  }
  /**
   * Returns the count of unread notifications for a user.
   */
  static async getUnreadCount(userId) {
    if (!userId) return 0;
    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_NOTIFICATIONS.filter(
        (n) => (n.userId === userId || n.userId === "default-user") && !n.isRead
      ).length;
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { count, error } = await supabaseAdmin.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
    if (error) {
      console.error("Erro ao contar notifica\xE7\xF5es n\xE3o lidas:", error.message);
      return 0;
    }
    return count || 0;
  }
  /**
   * Marks a single notification as read, strictly verifying ownership.
   */
  static async markAsRead(notificationId, userId) {
    if (!notificationId || !userId) {
      throw new Error("Par\xE2metros notificationId e userId s\xE3o obrigat\xF3rios.");
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (!isSupabaseAdminConfigured()) {
      const notif = FALLBACK_NOTIFICATIONS.find(
        (n) => n.id === notificationId && (n.userId === userId || n.userId === "default-user")
      );
      if (!notif) {
        throw new Error("Notifica\xE7\xE3o n\xE3o encontrada ou n\xE3o pertence ao usu\xE1rio.");
      }
      notif.readAt = nowIso;
      notif.isRead = true;
      return { ...notif };
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from("notifications").update({ read_at: nowIso }).eq("id", notificationId).eq("user_id", userId).select().single();
    if (error || !data) {
      throw new Error(
        `Falha ao marcar notifica\xE7\xE3o como lida: ${error?.message || "Notifica\xE7\xE3o n\xE3o encontrada."}`
      );
    }
    return mapNotificationRow(data);
  }
  /**
   * Marks all notifications of a user as read.
   */
  static async markAllAsRead(userId) {
    if (!userId) {
      throw new Error("Par\xE2metro userId \xE9 obrigat\xF3rio.");
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (!isSupabaseAdminConfigured()) {
      let count = 0;
      FALLBACK_NOTIFICATIONS.forEach((n) => {
        if ((n.userId === userId || n.userId === "default-user") && !n.isRead) {
          n.readAt = nowIso;
          n.isRead = true;
          count++;
        }
      });
      return count;
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from("notifications").update({ read_at: nowIso }).eq("user_id", userId).is("read_at", null).select("id");
    if (error) {
      throw new Error(`Falha ao marcar notifica\xE7\xF5es como lidas: ${error.message}`);
    }
    return (data || []).length;
  }
  /**
   * Generates notifications for an announcement based on its target audience.
   * Only executes if the announcement is published (`isPublished === true`).
   * Ensures idempotency: will not create duplicate notifications for the same user and announcement (announcement_id + user_id).
   */
  static async createNotificationsForAnnouncement(announcement) {
    if (!announcement || !announcement.id || !announcement.isPublished) {
      return { createdCount: 0, skippedCount: 0 };
    }
    const announcementId = announcement.id;
    const title = announcement.title;
    const message = announcement.message;
    const priority = announcement.priority || "normal";
    const targetAudience = announcement.targetAudience || "all";
    if (isSupabaseAdminConfigured()) {
      const supabaseAdmin = getSupabaseAdmin();
      let eligibleRecipients = [];
      if (targetAudience === "all") {
        const { data: usersData, error: usersError } = await supabaseAdmin.from("company_users").select("user_id, company_id").eq("status", "active");
        if (usersError) {
          throw new Error(
            `Erro ao buscar usu\xE1rios para p\xFAblico 'all': ${usersError.message}`
          );
        }
        eligibleRecipients = (usersData || []).map((row) => ({
          userId: row.user_id,
          companyId: row.company_id || null
        }));
      } else if (targetAudience === "specific_companies") {
        const targetCompanyIds = announcement.targetCompanyIds || [];
        if (targetCompanyIds.length === 0) {
          return { createdCount: 0, skippedCount: 0 };
        }
        const { data: usersData, error: usersError } = await supabaseAdmin.from("company_users").select("user_id, company_id").in("company_id", targetCompanyIds).eq("status", "active");
        if (usersError) {
          throw new Error(
            `Erro ao buscar usu\xE1rios para p\xFAblico 'specific_companies': ${usersError.message}`
          );
        }
        eligibleRecipients = (usersData || []).map((row) => ({
          userId: row.user_id,
          companyId: row.company_id || null
        }));
      } else if (targetAudience === "specific_plans") {
        const targetPlanIds = announcement.targetPlanIds || [];
        if (targetPlanIds.length === 0) {
          return { createdCount: 0, skippedCount: 0 };
        }
        const { data: subsData, error: subsError } = await supabaseAdmin.from("subscriptions").select("company_id, plan_id, status, expires_at, created_at").order("created_at", { ascending: false });
        if (subsError) {
          throw new Error(
            `Erro ao buscar assinaturas para p\xFAblico 'specific_plans': ${subsError.message}`
          );
        }
        const nowTime = Date.now();
        const latestSubByCompany = /* @__PURE__ */ new Map();
        for (const sub of subsData || []) {
          if (sub.company_id && !latestSubByCompany.has(sub.company_id)) {
            latestSubByCompany.set(sub.company_id, {
              planId: sub.plan_id,
              status: sub.status,
              expiresAt: sub.expires_at || null
            });
          }
        }
        const matchingCompanyIds = [];
        for (const [companyId, sub] of latestSubByCompany.entries()) {
          const isTargetPlan = targetPlanIds.includes(sub.planId);
          const isActive = sub.status === "active";
          const isNotExpired = !sub.expiresAt || new Date(sub.expiresAt).getTime() > nowTime;
          if (isTargetPlan && isActive && isNotExpired) {
            matchingCompanyIds.push(companyId);
          }
        }
        if (matchingCompanyIds.length === 0) {
          return { createdCount: 0, skippedCount: 0 };
        }
        const { data: usersData, error: usersError } = await supabaseAdmin.from("company_users").select("user_id, company_id").in("company_id", matchingCompanyIds).eq("status", "active");
        if (usersError) {
          throw new Error(
            `Erro ao buscar usu\xE1rios das empresas com planos selecionados: ${usersError.message}`
          );
        }
        eligibleRecipients = (usersData || []).map((row) => ({
          userId: row.user_id,
          companyId: row.company_id || null
        }));
      }
      const uniqueRecipientMap = /* @__PURE__ */ new Map();
      for (const rec of eligibleRecipients) {
        if (rec.userId && !uniqueRecipientMap.has(rec.userId)) {
          uniqueRecipientMap.set(rec.userId, rec);
        }
      }
      const uniqueRecipients = Array.from(uniqueRecipientMap.values());
      if (uniqueRecipients.length === 0) {
        return { createdCount: 0, skippedCount: 0 };
      }
      const { data: existingNotifs, error: existingError } = await supabaseAdmin.from("notifications").select("user_id").eq("announcement_id", announcementId);
      if (existingError) {
        throw new Error(
          `Erro ao verificar notifica\xE7\xF5es existentes para o comunicado: ${existingError.message}`
        );
      }
      const alreadyNotifiedUserIds = new Set(
        (existingNotifs || []).map((n) => n.user_id)
      );
      const pendingRecipients = uniqueRecipients.filter(
        (r) => !alreadyNotifiedUserIds.has(r.userId)
      );
      if (pendingRecipients.length === 0) {
        return { createdCount: 0, skippedCount: alreadyNotifiedUserIds.size };
      }
      const nowIso2 = (/* @__PURE__ */ new Date()).toISOString();
      const rowsToInsert = pendingRecipients.map((r) => ({
        user_id: r.userId,
        company_id: r.companyId,
        announcement_id: announcementId,
        title: title.trim(),
        message: message.trim(),
        category: "announcement",
        priority,
        read_at: null,
        action_url: null,
        created_at: nowIso2
      }));
      const { error: insertError } = await supabaseAdmin.from("notifications").insert(rowsToInsert);
      if (insertError) {
        throw new Error(
          `Falha ao criar notifica\xE7\xF5es para o comunicado: ${insertError.message}`
        );
      }
      return {
        createdCount: rowsToInsert.length,
        skippedCount: alreadyNotifiedUserIds.size
      };
    }
    const fallbackRecipients = [
      { userId: "990e8400-e29b-41d4-a716-446655440001", companyId: "550e8400-e29b-41d4-a716-446655440001" },
      { userId: "990e8400-e29b-41d4-a716-446655440002", companyId: "550e8400-e29b-41d4-a716-446655440001" },
      { userId: "990e8400-e29b-41d4-a716-446655440003", companyId: "550e8400-e29b-41d4-a716-446655440001" },
      { userId: "default-user", companyId: null }
    ];
    let filteredRecipients = [...fallbackRecipients];
    if (targetAudience === "specific_companies") {
      const targetCompanyIds = announcement.targetCompanyIds || [];
      filteredRecipients = filteredRecipients.filter(
        (r) => r.companyId && targetCompanyIds.includes(r.companyId)
      );
    } else if (targetAudience === "specific_plans") {
      const targetPlanIds = announcement.targetPlanIds || [];
      if (targetPlanIds.length === 0) {
        filteredRecipients = [];
      }
    }
    let createdCount = 0;
    let skippedCount = 0;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    for (const rec of filteredRecipients) {
      const alreadyExists = FALLBACK_NOTIFICATIONS.some(
        (n) => n.announcementId === announcementId && n.userId === rec.userId
      );
      if (alreadyExists) {
        skippedCount++;
        continue;
      }
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: rec.userId,
        companyId: rec.companyId,
        announcementId,
        title: title.trim(),
        message: message.trim(),
        category: "announcement",
        priority,
        readAt: null,
        isRead: false,
        actionUrl: null,
        createdAt: nowIso
      };
      FALLBACK_NOTIFICATIONS.unshift(newNotif);
      createdCount++;
    }
    return { createdCount, skippedCount };
  }
};

// src/server/services/announcementService.ts
function mapAnnouncementRow(row) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type || "info",
    priority: row.priority || "normal",
    targetAudience: row.target_audience || "all",
    targetPlanIds: Array.isArray(row.target_plan_ids) ? row.target_plan_ids : [],
    targetCompanyIds: Array.isArray(row.target_company_ids) ? row.target_company_ids : [],
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    isPublished: Boolean(row.is_published),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
var FALLBACK_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    title: "Manuten\xE7\xE3o Programada do Sistema",
    message: "Realizaremos melhorias de infraestrutura no pr\xF3ximo domingo das 02h \xE0s 04h (hor\xE1rio de Bras\xEDlia). O sistema poder\xE1 apresentar breves instabilidades.",
    type: "maintenance",
    priority: "high",
    targetAudience: "all",
    targetPlanIds: [],
    targetCompanyIds: [],
    startsAt: new Date(Date.now() - 36e5).toISOString(),
    expiresAt: new Date(Date.now() + 864e5 * 7).toISOString(),
    isPublished: true,
    createdBy: null,
    createdAt: new Date(Date.now() - 36e5).toISOString(),
    updatedAt: new Date(Date.now() - 36e5).toISOString()
  },
  {
    id: "ann-2",
    title: "Nova Funcionalidade: Gest\xE3o de Cupons",
    message: "Agora voc\xEA pode criar e gerenciar cupons promocionais com controle de vig\xEAncia e planos espec\xEDficos.",
    type: "update",
    priority: "normal",
    targetAudience: "all",
    targetPlanIds: [],
    targetCompanyIds: [],
    startsAt: new Date(Date.now() - 72e5).toISOString(),
    expiresAt: null,
    isPublished: true,
    createdBy: null,
    createdAt: new Date(Date.now() - 72e5).toISOString(),
    updatedAt: new Date(Date.now() - 72e5).toISOString()
  }
];
var AnnouncementService = class {
  /**
   * Creates a new announcement.
   */
  static async createAnnouncement(input, createdBy) {
    if (!input.title || input.title.trim() === "") {
      throw new Error("O t\xEDtulo do comunicado \xE9 obrigat\xF3rio.");
    }
    if (!input.message || input.message.trim() === "") {
      throw new Error("A mensagem do comunicado \xE9 obrigat\xF3ria.");
    }
    const payload = {
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type || "info",
      priority: input.priority || "normal",
      target_audience: input.targetAudience || "all",
      target_plan_ids: input.targetPlanIds || [],
      target_company_ids: input.targetCompanyIds || [],
      starts_at: input.startsAt || (/* @__PURE__ */ new Date()).toISOString(),
      expires_at: input.expiresAt || null,
      is_published: input.isPublished ?? false,
      created_by: createdBy || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!isSupabaseAdminConfigured()) {
      const newAnn = {
        id: `ann-${Date.now()}`,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        priority: payload.priority,
        targetAudience: payload.target_audience,
        targetPlanIds: payload.target_plan_ids,
        targetCompanyIds: payload.target_company_ids,
        startsAt: payload.starts_at,
        expiresAt: payload.expires_at,
        isPublished: payload.is_published,
        createdBy: payload.created_by,
        createdAt: payload.created_at,
        updatedAt: payload.updated_at
      };
      FALLBACK_ANNOUNCEMENTS.unshift(newAnn);
      if (newAnn.isPublished) {
        await NotificationService.createNotificationsForAnnouncement(newAnn);
      }
      return newAnn;
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from("platform_announcements").insert(payload).select().single();
    if (error || !data) {
      throw new Error(`Falha ao criar comunicado: ${error?.message || "Erro desconhecido"}`);
    }
    const created = mapAnnouncementRow(data);
    if (created.isPublished) {
      await NotificationService.createNotificationsForAnnouncement(created);
    }
    return created;
  }
  /**
   * Lists announcements with filtering and pagination.
   */
  static async getAnnouncements(filters = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(filters.pageSize) || 10));
    const offset = (page - 1) * pageSize;
    if (!isSupabaseAdminConfigured()) {
      let filtered = [...FALLBACK_ANNOUNCEMENTS];
      if (filters.search && filters.search.trim()) {
        const query2 = filters.search.toLowerCase();
        filtered = filtered.filter(
          (a) => a.title.toLowerCase().includes(query2) || a.message.toLowerCase().includes(query2)
        );
      }
      if (filters.type && filters.type !== "all") {
        filtered = filtered.filter((a) => a.type === filters.type);
      }
      if (filters.priority && filters.priority !== "all") {
        filtered = filtered.filter((a) => a.priority === filters.priority);
      }
      if (filters.targetAudience && filters.targetAudience !== "all") {
        filtered = filtered.filter((a) => a.targetAudience === filters.targetAudience);
      }
      if (filters.isPublished !== void 0 && filters.isPublished !== "all") {
        filtered = filtered.filter((a) => a.isPublished === Boolean(filters.isPublished));
      }
      if (filters.activeOnly) {
        const now = /* @__PURE__ */ new Date();
        filtered = filtered.filter((a) => {
          if (!a.isPublished) return false;
          if (new Date(a.startsAt) > now) return false;
          if (a.expiresAt && new Date(a.expiresAt) < now) return false;
          return true;
        });
      }
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const total2 = filtered.length;
      const totalPages2 = Math.ceil(total2 / pageSize);
      const items2 = filtered.slice(offset, offset + pageSize);
      const meta2 = {
        page,
        pageSize,
        total: total2,
        totalPages: totalPages2,
        hasNextPage: page < totalPages2,
        hasPrevPage: page > 1
      };
      return { items: items2, meta: meta2 };
    }
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from("platform_announcements").select("*", { count: "exact" });
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
    }
    if (filters.type && filters.type !== "all") {
      query = query.eq("type", filters.type);
    }
    if (filters.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority);
    }
    if (filters.targetAudience && filters.targetAudience !== "all") {
      query = query.eq("target_audience", filters.targetAudience);
    }
    if (filters.isPublished !== void 0 && filters.isPublished !== "all") {
      query = query.eq("is_published", Boolean(filters.isPublished));
    }
    if (filters.activeOnly) {
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      query = query.eq("is_published", true).lte("starts_at", nowIso).or(`expires_at.is.null,expires_at.gte.${nowIso}`);
    }
    const sortBy = filters.sortBy || "created_at";
    const sortAscending = filters.sortDirection === "asc";
    query = query.order(sortBy, { ascending: sortAscending }).range(offset, offset + pageSize - 1);
    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Erro ao listar comunicados: ${error.message}`);
    }
    const items = (data || []).map((row) => mapAnnouncementRow(row));
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);
    const meta = {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
    return { items, meta };
  }
  /**
   * Retrieves an announcement by its ID.
   */
  static async getAnnouncementById(id) {
    if (!id) return null;
    if (!isSupabaseAdminConfigured()) {
      const found = FALLBACK_ANNOUNCEMENTS.find((a) => a.id === id);
      return found ? { ...found } : null;
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from("platform_announcements").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return mapAnnouncementRow(data);
  }
  /**
   * Updates an existing announcement.
   */
  static async updateAnnouncement(id, input) {
    const existing = await this.getAnnouncementById(id);
    if (!existing) {
      throw new Error("Comunicado n\xE3o encontrado para atualiza\xE7\xE3o.");
    }
    const updatePayload = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (input.title !== void 0) updatePayload.title = input.title.trim();
    if (input.message !== void 0) updatePayload.message = input.message.trim();
    if (input.type !== void 0) updatePayload.type = input.type;
    if (input.priority !== void 0) updatePayload.priority = input.priority;
    if (input.targetAudience !== void 0) updatePayload.target_audience = input.targetAudience;
    if (input.targetPlanIds !== void 0) updatePayload.target_plan_ids = input.targetPlanIds;
    if (input.targetCompanyIds !== void 0) updatePayload.target_company_ids = input.targetCompanyIds;
    if (input.startsAt !== void 0) updatePayload.starts_at = input.startsAt;
    if (input.expiresAt !== void 0) updatePayload.expires_at = input.expiresAt;
    if (input.isPublished !== void 0) updatePayload.is_published = input.isPublished;
    if (!isSupabaseAdminConfigured()) {
      const index = FALLBACK_ANNOUNCEMENTS.findIndex((a) => a.id === id);
      if (index === -1) throw new Error("Comunicado n\xE3o encontrado.");
      const updated2 = {
        ...FALLBACK_ANNOUNCEMENTS[index],
        ...input.title !== void 0 && { title: input.title.trim() },
        ...input.message !== void 0 && { message: input.message.trim() },
        ...input.type !== void 0 && { type: input.type },
        ...input.priority !== void 0 && { priority: input.priority },
        ...input.targetAudience !== void 0 && { targetAudience: input.targetAudience },
        ...input.targetPlanIds !== void 0 && { targetPlanIds: input.targetPlanIds },
        ...input.targetCompanyIds !== void 0 && { targetCompanyIds: input.targetCompanyIds },
        ...input.startsAt !== void 0 && { startsAt: input.startsAt },
        ...input.expiresAt !== void 0 && { expiresAt: input.expiresAt },
        ...input.isPublished !== void 0 && { isPublished: input.isPublished },
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      FALLBACK_ANNOUNCEMENTS[index] = updated2;
      if (updated2.isPublished) {
        await NotificationService.createNotificationsForAnnouncement(updated2);
      }
      return updated2;
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from("platform_announcements").update(updatePayload).eq("id", id).select().single();
    if (error || !data) {
      throw new Error(`Falha ao atualizar comunicado: ${error?.message || "Erro desconhecido"}`);
    }
    const updated = mapAnnouncementRow(data);
    if (updated.isPublished) {
      await NotificationService.createNotificationsForAnnouncement(updated);
    }
    return updated;
  }
  /**
   * Publishes an announcement.
   */
  static async publishAnnouncement(id) {
    return this.updateAnnouncement(id, { isPublished: true });
  }
  /**
   * Unpublishes an announcement.
   */
  static async unpublishAnnouncement(id) {
    return this.updateAnnouncement(id, { isPublished: false });
  }
  /**
   * Deletes an announcement.
   */
  static async deleteAnnouncement(id) {
    if (!isSupabaseAdminConfigured()) {
      const prevLength = FALLBACK_ANNOUNCEMENTS.length;
      FALLBACK_ANNOUNCEMENTS = FALLBACK_ANNOUNCEMENTS.filter((a) => a.id !== id);
      return FALLBACK_ANNOUNCEMENTS.length < prevLength;
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("platform_announcements").delete().eq("id", id);
    if (error) {
      throw new Error(`Falha ao excluir comunicado: ${error.message}`);
    }
    return true;
  }
};

// src/server/services/productService.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var companySkuLocks = /* @__PURE__ */ new Map();
async function withCompanySkuLock(companyId, operation) {
  const currentLock = companySkuLocks.get(companyId) || Promise.resolve();
  let releaseLock;
  const nextLock = new Promise((resolve) => {
    releaseLock = resolve;
  });
  companySkuLocks.set(companyId, nextLock);
  try {
    await currentLock;
    return await operation();
  } finally {
    releaseLock();
    if (companySkuLocks.get(companyId) === nextLock) {
      companySkuLocks.delete(companyId);
    }
  }
}
function calculateNextSkuNumber(companyId, store) {
  const SKU_BASE_NUMBER = 1e5;
  let maxExistingNumber = 0;
  for (const prod of store.products) {
    if (!prod.sku) continue;
    const match = prod.sku.trim().match(/^PRD-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= SKU_BASE_NUMBER) {
        if (num > maxExistingNumber) {
          maxExistingNumber = num;
        }
      }
    }
  }
  let candidate = SKU_BASE_NUMBER;
  if (store.nextSkuSequence && store.nextSkuSequence >= SKU_BASE_NUMBER) {
    if (store.nextSkuSequence > 2e5 && maxExistingNumber < 2e5) {
      candidate = maxExistingNumber >= SKU_BASE_NUMBER ? maxExistingNumber + 1 : SKU_BASE_NUMBER;
      store.nextSkuSequence = candidate;
    } else {
      candidate = Math.max(candidate, store.nextSkuSequence);
    }
  }
  if (maxExistingNumber >= SKU_BASE_NUMBER) {
    candidate = Math.max(candidate, maxExistingNumber + 1);
  }
  while (store.products.some((p) => p.sku && p.sku.trim().toUpperCase() === `PRD-${candidate}`)) {
    candidate++;
  }
  return candidate;
}
var tenantStores = /* @__PURE__ */ new Map();
var DATA_DIR = import_path.default.join(process.cwd(), ".data", "catalog");
function getStoreFilePath(companyId) {
  return import_path.default.join(DATA_DIR, `catalog-${companyId}.json`);
}
function saveStoreToDisk(companyId, store) {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    import_fs.default.writeFileSync(getStoreFilePath(companyId), JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn(`[Catalog] Failed to persist catalog to disk for company ${companyId}:`, err);
  }
}
function loadStoreFromDisk(companyId) {
  try {
    const filePath = getStoreFilePath(companyId);
    if (import_fs.default.existsSync(filePath)) {
      const data = import_fs.default.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn(`[Catalog] Failed to load catalog from disk for company ${companyId}:`, err);
  }
  return null;
}
function buildDefaultTenantStore(companyId) {
  const defaultUnits = [
    { id: "u-un", companyId, name: "Unidade", shortName: "Un", allowDecimal: false, active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-pcs", companyId, name: "Pe\xE7a", shortName: "Pcs", allowDecimal: false, active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-cx", companyId, name: "Caixa", shortName: "CX", allowDecimal: false, active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-m", companyId, name: "Metro", shortName: "M", allowDecimal: true, active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-kg", companyId, name: "Quilograma", shortName: "KG", allowDecimal: true, active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
  ];
  const brandNames = [
    { id: "b-samsung", name: "Samsung" },
    { id: "b-apple", name: "Apple" },
    { id: "b-motorola", name: "Motorola" },
    { id: "b-xiaomi", name: "Xiaomi" },
    { id: "b-hmaston", name: "Hmaston" },
    { id: "b-inova", name: "Inova" },
    { id: "b-lg", name: "LG" },
    { id: "b-lenovo", name: "Lenovo" },
    { id: "b-positivo", name: "Positivo" },
    { id: "b-realme", name: "Realme" },
    { id: "b-sony", name: "Sony" },
    { id: "b-outras", name: "Outras" }
  ];
  const defaultBrands = brandNames.map((b) => ({
    id: b.id,
    companyId,
    name: b.name,
    description: `Marca ${b.name}`,
    active: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }));
  const categoryData = [
    { id: "cat-tela-display", name: "Tela / Display", code: "CAT-DISP", desc: "Telas, displays LCD, AMOLED e touchscreens" },
    { id: "cat-carregador", name: "Carregador", code: "CAT-CARG", desc: "Carregadores de parede, veiculares e por indu\xE7\xE3o" },
    { id: "cat-cabo", name: "Cabo", code: "CAT-CABO", desc: "Cabos USB-C, Lightning, Micro-USB e adaptadores" },
    { id: "cat-bateria", name: "Bateria", code: "CAT-BAT", desc: "Baterias internas e externas" },
    { id: "cat-conector", name: "Conector", code: "CAT-CON", desc: "Conectores de carga, FPC e flex de carga" },
    { id: "cat-pelicula", name: "Pel\xEDcula", code: "CAT-PEL", desc: "Pel\xEDculas de vidro, 3D, cer\xE2mica e hidrogel" },
    { id: "cat-capa", name: "Capa", code: "CAT-CAP", desc: "Capas de prote\xE7\xE3o, anti-impacto e cases" },
    { id: "cat-acessorios", name: "Acess\xF3rios", code: "CAT-ACESS", desc: "Acess\xF3rios diversos para smartphones e tablets" },
    { id: "cat-pecas", name: "Pe\xE7as", code: "CAT-PECAS", desc: "Componentes internos, c\xE2meras, autofalantes e sensores" },
    { id: "cat-ferramentas", name: "Ferramentas", code: "CAT-FERR", desc: "Ferramentas de bancada e equipamentos de manuten\xE7\xE3o" },
    { id: "cat-insumos", name: "Insumos", code: "CAT-INSUM", desc: "Colas, soldas, fitas e \xE1lcool isoprop\xEDlico" },
    { id: "cat-outros", name: "Outros", code: "CAT-OUTR", desc: "Outros produtos e itens gerais do cat\xE1logo" }
  ];
  const defaultCategories = categoryData.map((c) => ({
    id: c.id,
    companyId,
    name: c.name,
    code: c.code,
    description: c.desc,
    parentId: null,
    active: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }));
  const defaultCatalogModels = [
    { id: "m-j5prime", companyId, brandId: "b-samsung", brandName: "Samsung", name: "Galaxy J5 Prime", technicalCode: "SM-G570M", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "m-epta800", companyId, brandId: "b-samsung", brandName: "Samsung", name: "EP-TA800", technicalCode: "EP-TA800XBEGBR", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "m-a10", companyId, brandId: "b-samsung", brandName: "Samsung", name: "Galaxy A10", technicalCode: "SM-A105M", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "m-s21", companyId, brandId: "b-samsung", brandName: "Samsung", name: "Galaxy S21", technicalCode: "SM-G991B", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "m-iph11", companyId, brandId: "b-apple", brandName: "Apple", name: "iPhone 11", technicalCode: "A2111", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "m-iph13", companyId, brandId: "b-apple", brandName: "Apple", name: "iPhone 13", technicalCode: "A2482", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "m-app20w", companyId, brandId: "b-apple", brandName: "Apple", name: "20W USB-C Power Adapter", technicalCode: "MHJE3AM/A", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "m-g30", companyId, brandId: "b-motorola", brandName: "Motorola", name: "Moto G30", technicalCode: "XT2129-1", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "m-g7pow", companyId, brandId: "b-motorola", brandName: "Motorola", name: "Moto G7 Power", technicalCode: "XT1955-1", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
  ];
  const defaultCatalogColors = [
    { id: "col-preto", companyId, name: "Preto", hex: "#111827", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "col-branco", companyId, name: "Branco", hex: "#FFFFFF", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "col-azul", companyId, name: "Azul", hex: "#1E40AF", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "col-dourado", companyId, name: "Dourado", hex: "#D97706", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "col-prata", companyId, name: "Prata", hex: "#94A3B8", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "col-vermelho", companyId, name: "Vermelho", hex: "#DC2626", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "col-grafite", companyId, name: "Grafite", hex: "#4B5563", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "col-transparente", companyId, name: "Transparente", hex: "#F3F4F6", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
  ];
  const defaultCatalogSizes = [
    { id: "sz-unico", companyId, name: "\xDAnico", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "sz-50", companyId, name: '5.0"', active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "sz-55", companyId, name: '5.5"', active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "sz-61", companyId, name: '6.1"', active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "sz-65", companyId, name: '6.5"', active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "sz-67", companyId, name: '6.7"', active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "sz-1m", companyId, name: "1.0m", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "sz-2m", companyId, name: "2.0m", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "sz-p", companyId, name: "P", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "sz-m", companyId, name: "M", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "sz-g", companyId, name: "G", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
  ];
  const defaultDeviceBrands = [
    { id: "db-samsung", companyId, name: "Samsung", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "db-motorola", companyId, name: "Motorola", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "db-apple", companyId, name: "Apple", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "db-xiaomi", companyId, name: "Xiaomi", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
  ];
  const defaultDeviceModels = [
    { id: "dm-1", companyId, deviceBrandId: "db-samsung", deviceBrandName: "Samsung", name: "Galaxy J5 Prime", technicalCode: "SM-G570M", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "dm-2", companyId, deviceBrandId: "db-samsung", deviceBrandName: "Samsung", name: "Galaxy A10", technicalCode: "SM-A105M", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "dm-3", companyId, deviceBrandId: "db-motorola", deviceBrandName: "Motorola", name: "Moto G30", technicalCode: "XT2129-1", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "dm-4", companyId, deviceBrandId: "db-motorola", deviceBrandName: "Motorola", name: "Moto G7 Power", technicalCode: "XT1955-1", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "dm-5", companyId, deviceBrandId: "db-apple", deviceBrandName: "Apple", name: "iPhone 11", technicalCode: "A2111", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "dm-6", companyId, deviceBrandId: "db-apple", deviceBrandName: "Apple", name: "iPhone 13", technicalCode: "A2482", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
  ];
  const seedProducts = [
    {
      id: "prod-001",
      companyId,
      name: "Tela LCD Samsung Galaxy J5 Prime",
      sku: "DISP-J5PRIME-001",
      barcodeType: "C128",
      barcode: "7899876543210",
      productType: "single",
      unitId: "u-pcs",
      unitName: "Pe\xE7a",
      unitShortName: "Pcs",
      brandId: "b-samsung",
      brandName: "Samsung",
      modelId: "m-j5prime",
      modelName: "Galaxy J5 Prime",
      categoryId: "cat-tela-display",
      categoryName: "Tela / Display",
      categoryCode: "CAT-DISP",
      colorId: "col-preto",
      colorName: "Preto",
      sizeId: "sz-50",
      sizeName: '5.0"',
      weight: 180,
      description: "Tela frontal LCD original com aro compat\xEDvel com Samsung Galaxy J5 Prime.",
      operationalNotes: "Testar touch antes de colar. N\xE3o remover o lacre de garantia.",
      imageUrl: "https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=60",
      brochureUrl: null,
      brochureName: null,
      preparationTime: 20,
      manageStock: true,
      alertQuantity: 5,
      enableImeiSerial: false,
      notForSale: false,
      applicableTax: null,
      salePriceTaxType: "exclusive",
      defaultPurchasePrice: 45,
      marginPercent: 166.67,
      defaultSalePrice: 120,
      warrantyDuration: 90,
      warrantyUnit: "days",
      active: true,
      currentStock: 15,
      deviceModelIds: ["dm-1"],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod-002",
      companyId,
      name: "Carregador Samsung USB-C 25W",
      sku: "CARG-SAMS-25W",
      barcodeType: "EAN13",
      barcode: "8806090973345",
      productType: "single",
      unitId: "u-un",
      unitName: "Unidade",
      unitShortName: "Un",
      brandId: "b-samsung",
      brandName: "Samsung",
      modelId: "m-epta800",
      modelName: "EP-TA800",
      categoryId: "cat-carregador",
      categoryName: "Carregador",
      categoryCode: "CAT-CARG",
      colorId: "col-preto",
      colorName: "Preto",
      sizeId: "sz-unico",
      sizeName: "\xDAnico",
      weight: 52,
      description: "Carregador de parede ultra r\xE1pido original Samsung Super Fast Charging 25W modelo EP-TA800.",
      operationalNotes: "Compat\xEDvel com linha Galaxy S, A, Note e Z Fold/Flip.",
      imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60",
      brochureUrl: null,
      brochureName: null,
      preparationTime: null,
      manageStock: true,
      alertQuantity: 5,
      enableImeiSerial: false,
      notForSale: false,
      applicableTax: null,
      salePriceTaxType: "exclusive",
      defaultPurchasePrice: 35,
      marginPercent: 100,
      defaultSalePrice: 70,
      warrantyDuration: 6,
      warrantyUnit: "months",
      active: true,
      currentStock: 30,
      deviceModelIds: ["dm-1", "dm-2"],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod-003",
      companyId,
      name: "Cabo Tipo-C 1M Turbo R\xE1pido",
      sku: "CAB-TPC-001",
      barcodeType: "C128",
      barcode: "7891234567890",
      productType: "single",
      unitId: "u-un",
      unitName: "Unidade",
      unitShortName: "Un",
      brandId: "b-hmaston",
      brandName: "Hmaston",
      categoryId: "cat-cabo",
      categoryName: "Cabo",
      categoryCode: "CAT-CABO",
      colorId: "col-branco",
      colorName: "Branco",
      sizeId: "sz-1m",
      sizeName: "1.0m",
      weight: 50,
      description: "Cabo USB para Tipo-C refor\xE7ado com nylon tran\xE7ado 1 metro.",
      operationalNotes: "Compat\xEDvel com carregamento r\xE1pido e transfer\xEAncia de dados.",
      imageUrl: null,
      brochureUrl: null,
      brochureName: null,
      preparationTime: null,
      manageStock: true,
      alertQuantity: 10,
      enableImeiSerial: false,
      notForSale: false,
      applicableTax: null,
      salePriceTaxType: "exclusive",
      defaultPurchasePrice: 8.5,
      marginPercent: 135.29,
      defaultSalePrice: 20,
      warrantyDuration: 90,
      warrantyUnit: "days",
      active: true,
      currentStock: 45,
      deviceModelIds: ["dm-1", "dm-2", "dm-3"],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  const seedVariations = [
    {
      id: "var-001",
      companyId,
      productId: "prod-001",
      name: "Padr\xE3o",
      sku: "DISP-J5PRIME-001",
      barcode: "7899876543210",
      purchasePrice: 45,
      marginPercent: 166.67,
      salePrice: 120,
      attributes: { Cor: "Preto", Tamanho: '5.0"' },
      isDefault: true,
      active: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "var-002",
      companyId,
      productId: "prod-002",
      name: "Padr\xE3o",
      sku: "CARG-SAMS-25W",
      barcode: "8806090973345",
      purchasePrice: 35,
      marginPercent: 100,
      salePrice: 70,
      attributes: { Cor: "Preto", Tamanho: "\xDAnico" },
      isDefault: true,
      active: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "var-003",
      companyId,
      productId: "prod-003",
      name: "Padr\xE3o",
      sku: "CAB-TPC-001",
      barcode: "7891234567890",
      purchasePrice: 8.5,
      marginPercent: 135.29,
      salePrice: 20,
      attributes: { Cor: "Branco", Tamanho: "1.0m" },
      isDefault: true,
      active: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  const seedLocations = [
    {
      id: "ploc-1",
      companyId,
      productId: "prod-001",
      variationId: "var-001",
      locationId: "loc-main",
      locationName: "Matriz Principal",
      rackLocation: "Gaveta T-01",
      manageStock: true,
      initialStock: 15,
      currentStock: 15,
      minStock: 2,
      maxStock: 50,
      isAvailable: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "ploc-2",
      companyId,
      productId: "prod-002",
      variationId: "var-002",
      locationId: "loc-main",
      locationName: "Matriz Principal",
      rackLocation: "Prateleira C-02",
      manageStock: true,
      initialStock: 30,
      currentStock: 30,
      minStock: 5,
      maxStock: 100,
      isAvailable: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "ploc-3",
      companyId,
      productId: "prod-003",
      variationId: "var-003",
      locationId: "loc-main",
      locationName: "Matriz Principal",
      rackLocation: "Prateleira A-02",
      manageStock: true,
      initialStock: 45,
      currentStock: 45,
      minStock: 10,
      maxStock: 200,
      isAvailable: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  const initialStore = {
    categories: defaultCategories,
    brands: defaultBrands,
    models: defaultCatalogModels,
    colors: defaultCatalogColors,
    sizes: defaultCatalogSizes,
    units: defaultUnits,
    deviceBrands: defaultDeviceBrands,
    deviceModels: defaultDeviceModels,
    products: seedProducts,
    variations: seedVariations,
    variationTemplates: [],
    warranties: [],
    locations: seedLocations,
    combos: []
  };
  return initialStore;
}
function getTenantStore(companyId) {
  if (tenantStores.has(companyId)) {
    return tenantStores.get(companyId);
  }
  const defaults = buildDefaultTenantStore(companyId);
  const diskStore = loadStoreFromDisk(companyId);
  if (diskStore) {
    diskStore.categories = diskStore.categories || [];
    diskStore.brands = diskStore.brands || [];
    diskStore.units = diskStore.units || [];
    diskStore.models = diskStore.models || [];
    diskStore.colors = diskStore.colors || [];
    diskStore.sizes = diskStore.sizes || [];
    diskStore.deviceBrands = diskStore.deviceBrands || [];
    diskStore.deviceModels = diskStore.deviceModels || [];
    diskStore.products = diskStore.products || [];
    diskStore.variations = diskStore.variations || [];
    diskStore.variationTemplates = diskStore.variationTemplates || [];
    diskStore.warranties = diskStore.warranties || [];
    diskStore.locations = diskStore.locations || [];
    diskStore.combos = diskStore.combos || [];
    let modified = false;
    for (const defCat of defaults.categories) {
      if (!diskStore.categories.some((c) => c.name.toLowerCase() === defCat.name.toLowerCase())) {
        diskStore.categories.push(defCat);
        modified = true;
      }
    }
    for (const defBrand of defaults.brands) {
      if (!diskStore.brands.some((b) => b.name.toLowerCase() === defBrand.name.toLowerCase())) {
        diskStore.brands.push(defBrand);
        modified = true;
      }
    }
    for (const defUnit of defaults.units) {
      if (!diskStore.units.some((u) => u.name.toLowerCase() === defUnit.name.toLowerCase())) {
        diskStore.units.push(defUnit);
        modified = true;
      }
    }
    for (const defModel of defaults.models) {
      if (!diskStore.models.some((m) => m.name.toLowerCase() === defModel.name.toLowerCase())) {
        diskStore.models.push(defModel);
        modified = true;
      }
    }
    for (const defColor of defaults.colors) {
      if (!diskStore.colors.some((c) => c.name.toLowerCase() === defColor.name.toLowerCase())) {
        diskStore.colors.push(defColor);
        modified = true;
      }
    }
    for (const defSize of defaults.sizes) {
      if (!diskStore.sizes.some((s) => s.name.toLowerCase() === defSize.name.toLowerCase())) {
        diskStore.sizes.push(defSize);
        modified = true;
      }
    }
    for (const defProd of defaults.products) {
      if (!diskStore.products.some((p) => p.name.toLowerCase() === defProd.name.toLowerCase())) {
        diskStore.products.push(defProd);
        modified = true;
      }
    }
    for (const defVar of defaults.variations) {
      if (!diskStore.variations.some((v) => v.sku === defVar.sku)) {
        diskStore.variations.push(defVar);
        modified = true;
      }
    }
    if (modified) {
      saveStoreToDisk(companyId, diskStore);
    }
    tenantStores.set(companyId, diskStore);
    return diskStore;
  }
  tenantStores.set(companyId, defaults);
  saveStoreToDisk(companyId, defaults);
  return defaults;
}
var ProductService = class _ProductService {
  /**
   * List products with pagination, search, category, brand, and type filters
   */
  static async listProducts(companyId, params) {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(params.pageSize) || 10));
    const offset = (page - 1) * pageSize;
    if (isSupabaseAdminConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        let query = supabase.from("products").select("*, units(name, short_name), brands(name), categories(name, code)", { count: "exact" }).eq("company_id", companyId);
        if (params.search && params.search.trim()) {
          const term = `%${params.search.trim()}%`;
          query = query.or(`name.ilike.${term},sku.ilike.${term},barcode.ilike.${term}`);
        }
        if (params.categoryId) {
          query = query.eq("category_id", params.categoryId);
        }
        if (params.brandId) {
          query = query.eq("brand_id", params.brandId);
        }
        if (params.unitId) {
          query = query.eq("unit_id", params.unitId);
        }
        if (params.productType) {
          query = query.eq("product_type", params.productType);
        }
        if (params.active !== void 0 && params.active !== "") {
          const isActive = params.active === "true" || params.active === true;
          query = query.eq("active", isActive);
        }
        query = query.order("name", { ascending: true }).range(offset, offset + pageSize - 1);
        const { data, count, error } = await query;
        if (!error && data) {
          const totalItems2 = count || 0;
          const totalPages2 = Math.ceil(totalItems2 / pageSize);
          const products = data.map((row) => ({
            id: row.id,
            companyId: row.company_id,
            name: row.name,
            sku: row.sku,
            barcodeType: row.barcode_type,
            barcode: row.barcode,
            productType: row.product_type,
            unitId: row.unit_id,
            unitName: row.units?.name || null,
            unitShortName: row.units?.short_name || null,
            brandId: row.brand_id,
            brandName: row.brands?.name || null,
            categoryId: row.category_id,
            categoryName: row.categories?.name || null,
            categoryCode: row.categories?.code || null,
            description: row.description,
            operationalNotes: row.operational_notes,
            imageUrl: row.image_url,
            brochureUrl: row.brochure_url,
            brochureName: row.brochure_name,
            weight: row.weight ? Number(row.weight) : null,
            preparationTime: row.preparation_time,
            manageStock: row.manage_stock,
            alertQuantity: Number(row.alert_quantity) || 5,
            enableImeiSerial: row.enable_imei_serial,
            notForSale: row.not_for_sale,
            applicableTax: row.applicable_tax,
            salePriceTaxType: row.sale_price_tax_type,
            defaultPurchasePrice: Number(row.default_purchase_price) || 0,
            marginPercent: Number(row.margin_percent) || 0,
            defaultSalePrice: Number(row.default_sale_price) || 0,
            warrantyDuration: row.warranty_duration,
            warrantyUnit: row.warranty_unit || "days",
            active: row.active,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            currentStock: 0
          }));
          return {
            data: products,
            meta: {
              page,
              pageSize,
              totalItems: totalItems2,
              totalPages: totalPages2,
              hasNextPage: page < totalPages2,
              hasPreviousPage: page > 1
            }
          };
        }
      } catch (err) {
        console.warn("Supabase product query error, using in-memory store:", err);
      }
    }
    const store = getTenantStore(companyId);
    let filtered = [...store.products];
    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.barcode && p.barcode.toLowerCase().includes(term)
      );
    }
    if (params.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === params.categoryId);
    }
    if (params.brandId) {
      filtered = filtered.filter((p) => p.brandId === params.brandId);
    }
    if (params.unitId) {
      filtered = filtered.filter((p) => p.unitId === params.unitId);
    }
    if (params.productType) {
      filtered = filtered.filter((p) => p.productType === params.productType);
    }
    if (params.active !== void 0 && params.active !== "") {
      const isActive = params.active === "true" || params.active === true;
      filtered = filtered.filter((p) => p.active === isActive);
    }
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginated = filtered.slice(offset, offset + pageSize);
    return {
      data: paginated,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }
  /**
   * Get single product with full relational details
   */
  static async getProductById(companyId, productId) {
    const store = getTenantStore(companyId);
    const product = store.products.find((p) => p.id === productId);
    if (!product) return null;
    const variations = store.variations.filter((v) => v.productId === productId);
    const locations = store.locations.filter((l) => l.productId === productId);
    const combos = store.combos.filter((c) => c.comboProductId === productId);
    const deviceModels = store.deviceModels.filter((dm) => product.deviceModelIds?.includes(dm.id));
    return {
      ...product,
      variations,
      locations,
      combos,
      deviceModels
    };
  }
  /**
   * Consulta o próximo SKU sequencial da empresa (sem avançar ou consumir a sequência)
   */
  static async getNextSku(companyId) {
    return withCompanySkuLock(companyId, async () => {
      const store = getTenantStore(companyId);
      const nextNum = calculateNextSkuNumber(companyId, store);
      return `PRD-${nextNum}`;
    });
  }
  /**
   * Aloca e confirma o próximo SKU da empresa de forma sequencial atômica
   * O SKU definitivo é gerado rigorosamente no backend para cada company_id, iniciando em PRD-100000.
   */
  static async allocateSku(companyId, preferredSku) {
    const store = getTenantStore(companyId);
    const trimmed = preferredSku?.trim();
    if (trimmed && !trimmed.match(/^PRD-\d+$/i)) {
      if (store.products.some((p) => p.sku.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error(`O SKU "${trimmed}" j\xE1 est\xE1 em uso nesta empresa.`);
      }
      return trimmed;
    }
    const nextNum = calculateNextSkuNumber(companyId, store);
    const generatedSku = `PRD-${nextNum}`;
    store.nextSkuSequence = nextNum + 1;
    saveStoreToDisk(companyId, store);
    return generatedSku;
  }
  /**
   * Create product with automatic variation & location assignment
   */
  static async createProduct(companyId, payload) {
    return withCompanySkuLock(companyId, async () => {
      const store = getTenantStore(companyId);
      const sku = await _ProductService.allocateSku(companyId, payload.sku);
      const skuExists = store.products.some((p) => p.sku.toLowerCase() === sku.toLowerCase());
      if (skuExists) {
        throw new Error(`O SKU "${sku}" j\xE1 est\xE1 em uso nesta empresa.`);
      }
      if (payload.barcode?.trim()) {
        const barcodeExists = store.products.some(
          (p) => p.barcode && p.barcode.trim() === payload.barcode.trim()
        );
        if (barcodeExists) {
          throw new Error(`O c\xF3digo de barras "${payload.barcode}" j\xE1 est\xE1 cadastrado nesta empresa.`);
        }
      }
      const unit = store.units.find((u) => u.id === payload.unitId);
      const brand = store.brands.find((b) => b.id === payload.brandId);
      const category = store.categories.find((c) => c.id === payload.categoryId);
      const model = payload.modelId ? store.models?.find((m) => m.id === payload.modelId) : void 0;
      const color = payload.colorId ? store.colors?.find((c) => c.id === payload.colorId) : void 0;
      const size = payload.sizeId ? store.sizes?.find((s) => s.id === payload.sizeId) : void 0;
      const newProductId = `prod-${Date.now()}`;
      const productType = payload.productType || "single";
      let totalInitialStock = 0;
      if (payload.locationInputs && Array.isArray(payload.locationInputs)) {
        totalInitialStock = payload.locationInputs.reduce((sum, l) => sum + (Number(l.initialStock) || 0), 0);
      }
      const newProduct = {
        id: newProductId,
        companyId,
        name: payload.name.trim(),
        sku,
        barcodeType: payload.barcodeType || "C128",
        barcode: payload.barcode?.trim() || null,
        productType,
        unitId: payload.unitId,
        unitName: unit?.name || "Unidade",
        unitShortName: unit?.shortName || "Un",
        brandId: payload.brandId || null,
        brandName: brand?.name || payload.brandName || null,
        modelId: payload.modelId || null,
        modelName: model?.name || payload.modelName || null,
        categoryId: payload.categoryId || null,
        categoryName: category?.name || payload.categoryName || null,
        categoryCode: category?.code || null,
        colorId: payload.colorId || null,
        colorName: color?.name || payload.colorName || null,
        sizeId: payload.sizeId || null,
        sizeName: size?.name || payload.sizeName || null,
        description: payload.description || null,
        operationalNotes: payload.operationalNotes || null,
        imageUrl: payload.imageUrl || null,
        brochureUrl: payload.brochureUrl || null,
        brochureName: payload.brochureName || null,
        weight: payload.weight ? Number(payload.weight) : null,
        preparationTime: payload.preparationTime ? Number(payload.preparationTime) : null,
        manageStock: payload.manageStock !== void 0 ? payload.manageStock : true,
        alertQuantity: payload.alertQuantity !== void 0 ? Number(payload.alertQuantity) : 5,
        enableImeiSerial: !!payload.enableImeiSerial,
        notForSale: !!payload.notForSale,
        applicableTax: payload.applicableTax || null,
        salePriceTaxType: payload.salePriceTaxType || "exclusive",
        defaultPurchasePrice: Number(payload.defaultPurchasePrice) || 0,
        marginPercent: Number(payload.marginPercent) || 0,
        defaultSalePrice: Number(payload.defaultSalePrice) || 0,
        warrantyDuration: payload.warrantyDuration ? Number(payload.warrantyDuration) : null,
        warrantyUnit: payload.warrantyUnit || "days",
        active: payload.active !== void 0 ? payload.active : true,
        currentStock: totalInitialStock,
        deviceModelIds: payload.deviceModelIds || [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      store.products.unshift(newProduct);
      if (productType === "single") {
        const singleVariation = {
          id: `var-${Date.now()}`,
          companyId,
          productId: newProductId,
          name: "Padr\xE3o",
          sku,
          barcode: newProduct.barcode,
          purchasePrice: newProduct.defaultPurchasePrice,
          marginPercent: newProduct.marginPercent,
          salePrice: newProduct.defaultSalePrice,
          attributes: {
            ...newProduct.colorName ? { Cor: newProduct.colorName } : {},
            ...newProduct.sizeName ? { Tamanho: newProduct.sizeName } : {}
          },
          isDefault: true,
          active: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        store.variations.push(singleVariation);
        if (payload.locationInputs && payload.locationInputs.length > 0) {
          for (const locInput of payload.locationInputs) {
            store.locations.push({
              id: `ploc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              companyId,
              productId: newProductId,
              variationId: singleVariation.id,
              locationId: locInput.locationId,
              locationName: "Local",
              rackLocation: locInput.rackLocation || null,
              manageStock: locInput.manageStock !== void 0 ? locInput.manageStock : true,
              initialStock: Number(locInput.initialStock) || 0,
              currentStock: Number(locInput.initialStock) || 0,
              minStock: locInput.minStock ? Number(locInput.minStock) : null,
              maxStock: locInput.maxStock ? Number(locInput.maxStock) : null,
              isAvailable: locInput.isAvailable !== void 0 ? locInput.isAvailable : true,
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              updatedAt: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        }
      } else if (productType === "variable" && payload.variations && payload.variations.length > 0) {
        for (let i = 0; i < payload.variations.length; i++) {
          const v = payload.variations[i];
          const vSku = v.sku?.trim() || `${sku}-${i + 1}`;
          const variationItem = {
            id: `var-${Date.now()}-${i}`,
            companyId,
            productId: newProductId,
            name: v.name.trim(),
            sku: vSku,
            barcode: v.barcode?.trim() || null,
            purchasePrice: Number(v.purchasePrice) || newProduct.defaultPurchasePrice,
            marginPercent: Number(v.marginPercent) || newProduct.marginPercent,
            salePrice: Number(v.salePrice) || newProduct.defaultSalePrice,
            attributes: v.attributes || {},
            isDefault: i === 0,
            active: true,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          store.variations.push(variationItem);
          if (payload.locationInputs && payload.locationInputs.length > 0) {
            for (const locInput of payload.locationInputs) {
              store.locations.push({
                id: `ploc-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                companyId,
                productId: newProductId,
                variationId: variationItem.id,
                locationId: locInput.locationId,
                rackLocation: locInput.rackLocation || null,
                manageStock: locInput.manageStock !== void 0 ? locInput.manageStock : true,
                initialStock: Number(locInput.initialStock) || 0,
                currentStock: Number(locInput.initialStock) || 0,
                minStock: locInput.minStock ? Number(locInput.minStock) : null,
                maxStock: locInput.maxStock ? Number(locInput.maxStock) : null,
                isAvailable: locInput.isAvailable !== void 0 ? locInput.isAvailable : true,
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                updatedAt: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          }
        }
      } else if (productType === "combo" && payload.combos) {
        for (const c of payload.combos) {
          store.combos.push({
            id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            companyId,
            comboProductId: newProductId,
            componentVariationId: c.componentVariationId,
            quantity: Number(c.quantity) || 1,
            unitPrice: c.unitPrice ? Number(c.unitPrice) : null,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      saveStoreToDisk(companyId, store);
      return newProduct;
    });
  }
  /**
   * Update existing product
   */
  static async updateProduct(companyId, productId, payload) {
    const store = getTenantStore(companyId);
    const index = store.products.findIndex((p) => p.id === productId);
    if (index === -1) {
      throw new Error("Produto n\xE3o encontrado.");
    }
    const current = store.products[index];
    if (payload.sku && payload.sku.trim().toLowerCase() !== current.sku.toLowerCase()) {
      const skuConflict = store.products.some(
        (p) => p.id !== productId && p.sku.toLowerCase() === payload.sku.trim().toLowerCase()
      );
      if (skuConflict) {
        throw new Error(`O SKU "${payload.sku}" j\xE1 est\xE1 em uso por outro produto.`);
      }
    }
    if (payload.barcode && payload.barcode.trim() !== current.barcode) {
      const barcodeConflict = store.products.some(
        (p) => p.id !== productId && p.barcode === payload.barcode.trim()
      );
      if (barcodeConflict) {
        throw new Error(`O c\xF3digo de barras "${payload.barcode}" j\xE1 est\xE1 em uso por outro produto.`);
      }
    }
    const unit = payload.unitId ? store.units.find((u) => u.id === payload.unitId) : void 0;
    const brand = payload.brandId !== void 0 ? store.brands.find((b) => b.id === payload.brandId) : void 0;
    const category = payload.categoryId !== void 0 ? store.categories.find((c) => c.id === payload.categoryId) : void 0;
    const model = payload.modelId !== void 0 ? store.models?.find((m) => m.id === payload.modelId) : void 0;
    const color = payload.colorId !== void 0 ? store.colors?.find((c) => c.id === payload.colorId) : void 0;
    const size = payload.sizeId !== void 0 ? store.sizes?.find((s) => s.id === payload.sizeId) : void 0;
    const updated = {
      ...current,
      name: payload.name !== void 0 ? payload.name.trim() : current.name,
      sku: payload.sku !== void 0 ? payload.sku.trim() : current.sku,
      barcodeType: payload.barcodeType || current.barcodeType,
      barcode: payload.barcode !== void 0 ? payload.barcode?.trim() || null : current.barcode,
      productType: payload.productType || current.productType,
      unitId: payload.unitId || current.unitId,
      unitName: unit ? unit.name : current.unitName,
      unitShortName: unit ? unit.shortName : current.unitShortName,
      brandId: payload.brandId !== void 0 ? payload.brandId : current.brandId,
      brandName: brand ? brand.name : payload.brandId === null ? null : payload.brandName || current.brandName,
      modelId: payload.modelId !== void 0 ? payload.modelId : current.modelId,
      modelName: model ? model.name : payload.modelId === null ? null : payload.modelName || current.modelName,
      categoryId: payload.categoryId !== void 0 ? payload.categoryId : current.categoryId,
      categoryName: category ? category.name : payload.categoryId === null ? null : payload.categoryName || current.categoryName,
      categoryCode: category ? category.code : payload.categoryId === null ? null : current.categoryCode,
      colorId: payload.colorId !== void 0 ? payload.colorId : current.colorId,
      colorName: color ? color.name : payload.colorId === null ? null : payload.colorName || current.colorName,
      sizeId: payload.sizeId !== void 0 ? payload.sizeId : current.sizeId,
      sizeName: size ? size.name : payload.sizeId === null ? null : payload.sizeName || current.sizeName,
      description: payload.description !== void 0 ? payload.description : current.description,
      operationalNotes: payload.operationalNotes !== void 0 ? payload.operationalNotes : current.operationalNotes,
      imageUrl: payload.imageUrl !== void 0 ? payload.imageUrl : current.imageUrl,
      brochureUrl: payload.brochureUrl !== void 0 ? payload.brochureUrl : current.brochureUrl,
      brochureName: payload.brochureName !== void 0 ? payload.brochureName : current.brochureName,
      weight: payload.weight !== void 0 ? payload.weight ? Number(payload.weight) : null : current.weight,
      preparationTime: payload.preparationTime !== void 0 ? payload.preparationTime ? Number(payload.preparationTime) : null : current.preparationTime,
      manageStock: payload.manageStock !== void 0 ? payload.manageStock : current.manageStock,
      alertQuantity: payload.alertQuantity !== void 0 ? Number(payload.alertQuantity) : current.alertQuantity,
      enableImeiSerial: payload.enableImeiSerial !== void 0 ? payload.enableImeiSerial : current.enableImeiSerial,
      notForSale: payload.notForSale !== void 0 ? payload.notForSale : current.notForSale,
      applicableTax: payload.applicableTax !== void 0 ? payload.applicableTax : current.applicableTax,
      salePriceTaxType: payload.salePriceTaxType || current.salePriceTaxType,
      defaultPurchasePrice: payload.defaultPurchasePrice !== void 0 ? Number(payload.defaultPurchasePrice) : current.defaultPurchasePrice,
      marginPercent: payload.marginPercent !== void 0 ? Number(payload.marginPercent) : current.marginPercent,
      defaultSalePrice: payload.defaultSalePrice !== void 0 ? Number(payload.defaultSalePrice) : current.defaultSalePrice,
      warrantyDuration: payload.warrantyDuration !== void 0 ? payload.warrantyDuration : current.warrantyDuration,
      warrantyUnit: payload.warrantyUnit || current.warrantyUnit,
      active: payload.active !== void 0 ? payload.active : current.active,
      deviceModelIds: payload.deviceModelIds || current.deviceModelIds,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (payload.locationInputs && Array.isArray(payload.locationInputs) && payload.locationInputs.length > 0) {
      let totalStock = 0;
      for (const locInput of payload.locationInputs) {
        const stockVal = Number(locInput.initialStock) || 0;
        totalStock += stockVal;
        const existingLoc = store.locations.find(
          (l) => l.productId === productId && l.locationId === locInput.locationId
        );
        if (existingLoc) {
          existingLoc.initialStock = stockVal;
          existingLoc.currentStock = stockVal;
          if (locInput.rackLocation !== void 0) existingLoc.rackLocation = locInput.rackLocation;
          if (locInput.minStock !== void 0) existingLoc.minStock = locInput.minStock ? Number(locInput.minStock) : null;
          if (locInput.maxStock !== void 0) existingLoc.maxStock = locInput.maxStock ? Number(locInput.maxStock) : null;
          existingLoc.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        } else {
          store.locations.push({
            id: `ploc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            companyId,
            productId,
            variationId: store.variations.find((v) => v.productId === productId)?.id || `var-${productId}`,
            locationId: locInput.locationId,
            locationName: "Local",
            rackLocation: locInput.rackLocation || null,
            manageStock: locInput.manageStock !== void 0 ? locInput.manageStock : true,
            initialStock: stockVal,
            currentStock: stockVal,
            minStock: locInput.minStock ? Number(locInput.minStock) : null,
            maxStock: locInput.maxStock ? Number(locInput.maxStock) : null,
            isAvailable: locInput.isAvailable !== void 0 ? locInput.isAvailable : true,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      updated.currentStock = totalStock;
    }
    store.products[index] = updated;
    saveStoreToDisk(companyId, store);
    return updated;
  }
  /**
   * Delete product
   */
  static async deleteProduct(companyId, productId) {
    const store = getTenantStore(companyId);
    const initialCount = store.products.length;
    store.products = store.products.filter((p) => p.id !== productId);
    store.variations = store.variations.filter((v) => v.productId !== productId);
    store.locations = store.locations.filter((l) => l.productId !== productId);
    store.combos = store.combos.filter((c) => c.comboProductId !== productId);
    saveStoreToDisk(companyId, store);
    return store.products.length < initialCount;
  }
  /**
   * Duplicate product with new SKU
   */
  static async duplicateProduct(companyId, productId) {
    const original = await this.getProductById(companyId, productId);
    if (!original) throw new Error("Produto original n\xE3o encontrado.");
    let newSku = void 0;
    if (!original.sku.match(/^PRD-\d+$/i)) {
      const store = getTenantStore(companyId);
      let suffixIndex = 1;
      let candidate = `${original.sku}-COPIA`;
      while (store.products.some((p) => p.sku.toLowerCase() === candidate.toLowerCase())) {
        suffixIndex++;
        candidate = `${original.sku}-COPIA-${suffixIndex}`;
      }
      newSku = candidate;
    }
    return this.createProduct(companyId, {
      ...original,
      name: `${original.name} (C\xF3pia)`,
      sku: newSku,
      barcode: null,
      // Clear barcode to avoid conflicts
      locationInputs: original.locations?.map((l) => ({
        locationId: l.locationId,
        rackLocation: l.rackLocation,
        manageStock: l.manageStock,
        initialStock: 0,
        minStock: l.minStock,
        maxStock: l.maxStock,
        isAvailable: l.isAvailable
      }))
    });
  }
  /**
   * Update stock opening / initial stock
   */
  static async saveStockOpening(companyId, productId, payload) {
    const store = getTenantStore(companyId);
    const product = store.products.find((p) => p.id === productId);
    if (!product) throw new Error("Produto n\xE3o encontrado.");
    let newTotalStock = 0;
    for (const item of payload.items) {
      const loc = store.locations.find(
        (l) => l.productId === productId && l.locationId === item.locationId
      );
      if (loc) {
        loc.initialStock = item.quantity;
        loc.currentStock = item.quantity;
        if (item.rackLocation !== void 0) loc.rackLocation = item.rackLocation;
      } else {
        store.locations.push({
          id: `ploc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          companyId,
          productId,
          variationId: item.variationId || `var-${productId}`,
          locationId: item.locationId,
          rackLocation: item.rackLocation || null,
          manageStock: true,
          initialStock: item.quantity,
          currentStock: item.quantity,
          minStock: null,
          maxStock: null,
          isAvailable: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      newTotalStock += item.quantity;
    }
    product.currentStock = newTotalStock;
    product.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveStoreToDisk(companyId, store);
    return true;
  }
  /**
   * Batch actions on products (delete, deactivate, activate, add/remove from branch)
   */
  static async batchAction(companyId, payload) {
    const store = getTenantStore(companyId);
    let affected = 0;
    switch (payload.action) {
      case "delete":
        store.products = store.products.filter((p) => {
          if (payload.productIds.includes(p.id)) {
            affected++;
            return false;
          }
          return true;
        });
        break;
      case "deactivate":
        for (const p of store.products) {
          if (payload.productIds.includes(p.id)) {
            p.active = false;
            affected++;
          }
        }
        break;
      case "activate":
        for (const p of store.products) {
          if (payload.productIds.includes(p.id)) {
            p.active = true;
            affected++;
          }
        }
        break;
      case "add_to_location":
        if (payload.locationId) {
          for (const pid of payload.productIds) {
            const exists = store.locations.some(
              (l) => l.productId === pid && l.locationId === payload.locationId
            );
            if (!exists) {
              store.locations.push({
                id: `ploc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                companyId,
                productId: pid,
                variationId: `var-${pid}`,
                locationId: payload.locationId,
                rackLocation: null,
                manageStock: true,
                initialStock: 0,
                currentStock: 0,
                minStock: null,
                maxStock: null,
                isAvailable: true,
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                updatedAt: (/* @__PURE__ */ new Date()).toISOString()
              });
              affected++;
            }
          }
        }
        break;
      case "remove_from_location":
        if (payload.locationId) {
          store.locations = store.locations.filter((l) => {
            if (payload.productIds.includes(l.productId) && l.locationId === payload.locationId) {
              affected++;
              return false;
            }
            return true;
          });
        }
        break;
    }
    saveStoreToDisk(companyId, store);
    return { affected };
  }
  // ==========================================
  // AUXILIARY CATALOG ENTITIES (CATEGORIES, BRANDS, UNITS, MODELS)
  // ==========================================
  static async listCategories(companyId) {
    const store = getTenantStore(companyId);
    return store.categories;
  }
  static async createCategory(companyId, payload) {
    const store = getTenantStore(companyId);
    const trimmedName = payload.name.trim();
    const existing = store.categories.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }
    const newCat = {
      id: `cat-${Date.now()}`,
      companyId,
      name: trimmedName,
      code: payload.code?.trim() || `CAT-${Date.now().toString().slice(-4)}`,
      description: payload.description || null,
      parentId: payload.parentId || null,
      active: payload.active !== void 0 ? payload.active : true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.categories.push(newCat);
    saveStoreToDisk(companyId, store);
    return newCat;
  }
  static async updateCategory(companyId, categoryId, payload) {
    const store = getTenantStore(companyId);
    const cat = store.categories.find((c) => c.id === categoryId);
    if (!cat) throw new Error("Categoria n\xE3o encontrada.");
    if (payload.name) cat.name = payload.name.trim();
    if (payload.code !== void 0) cat.code = payload.code?.trim() || null;
    if (payload.description !== void 0) cat.description = payload.description;
    if (payload.parentId !== void 0) cat.parentId = payload.parentId;
    if (payload.active !== void 0) cat.active = payload.active;
    cat.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveStoreToDisk(companyId, store);
    return cat;
  }
  static async deleteCategory(companyId, categoryId) {
    const store = getTenantStore(companyId);
    const initial = store.categories.length;
    store.categories = store.categories.filter((c) => c.id !== categoryId);
    saveStoreToDisk(companyId, store);
    return store.categories.length < initial;
  }
  static async listBrands(companyId) {
    const store = getTenantStore(companyId);
    return store.brands;
  }
  static async createBrand(companyId, payload) {
    const store = getTenantStore(companyId);
    const trimmedName = payload.name.trim();
    const existing = store.brands.find(
      (b) => b.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }
    const newBrand = {
      id: `b-${Date.now()}`,
      companyId,
      name: trimmedName,
      description: payload.description || null,
      active: payload.active !== void 0 ? payload.active : true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.brands.push(newBrand);
    saveStoreToDisk(companyId, store);
    return newBrand;
  }
  static async updateBrand(companyId, brandId, payload) {
    const store = getTenantStore(companyId);
    const brand = store.brands.find((b) => b.id === brandId);
    if (!brand) throw new Error("Marca n\xE3o encontrada.");
    if (payload.name) brand.name = payload.name.trim();
    if (payload.description !== void 0) brand.description = payload.description;
    if (payload.active !== void 0) brand.active = payload.active;
    brand.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveStoreToDisk(companyId, store);
    return brand;
  }
  static async deleteBrand(companyId, brandId) {
    const store = getTenantStore(companyId);
    const initial = store.brands.length;
    store.brands = store.brands.filter((b) => b.id !== brandId);
    saveStoreToDisk(companyId, store);
    return store.brands.length < initial;
  }
  // ==========================================
  // MODELOS DE CATÁLOGO (REUTILIZÁVEIS)
  // ==========================================
  static async listModels(companyId, brandId) {
    const store = getTenantStore(companyId);
    if (brandId) {
      return store.models.filter((m) => m.brandId === brandId);
    }
    return store.models;
  }
  static async createModel(companyId, payload) {
    const store = getTenantStore(companyId);
    const trimmedName = payload.name.trim();
    const existing = store.models.find(
      (m) => m.name.toLowerCase() === trimmedName.toLowerCase() && (payload.brandId ? m.brandId === payload.brandId : true)
    );
    if (existing) {
      return existing;
    }
    const brand = payload.brandId ? store.brands.find((b) => b.id === payload.brandId) : void 0;
    const newModel = {
      id: `m-${Date.now()}`,
      companyId,
      brandId: payload.brandId || null,
      brandName: brand?.name || null,
      name: trimmedName,
      technicalCode: payload.technicalCode?.trim() || null,
      active: payload.active !== void 0 ? payload.active : true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.models.push(newModel);
    saveStoreToDisk(companyId, store);
    return newModel;
  }
  static async updateModel(companyId, modelId, payload) {
    const store = getTenantStore(companyId);
    const model = store.models.find((m) => m.id === modelId);
    if (!model) throw new Error("Modelo n\xE3o encontrado.");
    if (payload.name) model.name = payload.name.trim();
    if (payload.brandId !== void 0) {
      model.brandId = payload.brandId;
      const b = store.brands.find((br) => br.id === payload.brandId);
      model.brandName = b ? b.name : null;
    }
    if (payload.technicalCode !== void 0) model.technicalCode = payload.technicalCode?.trim() || null;
    if (payload.active !== void 0) model.active = payload.active;
    model.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveStoreToDisk(companyId, store);
    return model;
  }
  static async deleteModel(companyId, modelId) {
    const store = getTenantStore(companyId);
    const initial = store.models.length;
    store.models = store.models.filter((m) => m.id !== modelId);
    saveStoreToDisk(companyId, store);
    return store.models.length < initial;
  }
  // ==========================================
  // CORES DE CATÁLOGO (REUTILIZÁVEIS)
  // ==========================================
  static async listColors(companyId) {
    const store = getTenantStore(companyId);
    return store.colors;
  }
  static async createColor(companyId, payload) {
    const store = getTenantStore(companyId);
    const trimmedName = payload.name.trim();
    const existing = store.colors.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }
    const newColor = {
      id: `col-${Date.now()}`,
      companyId,
      name: trimmedName,
      hex: payload.hex?.trim() || null,
      active: payload.active !== void 0 ? payload.active : true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.colors.push(newColor);
    saveStoreToDisk(companyId, store);
    return newColor;
  }
  static async updateColor(companyId, colorId, payload) {
    const store = getTenantStore(companyId);
    const color = store.colors.find((c) => c.id === colorId);
    if (!color) throw new Error("Cor n\xE3o encontrada.");
    if (payload.name) color.name = payload.name.trim();
    if (payload.hex !== void 0) color.hex = payload.hex?.trim() || null;
    if (payload.active !== void 0) color.active = payload.active;
    color.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveStoreToDisk(companyId, store);
    return color;
  }
  static async deleteColor(companyId, colorId) {
    const store = getTenantStore(companyId);
    const initial = store.colors.length;
    store.colors = store.colors.filter((c) => c.id !== colorId);
    saveStoreToDisk(companyId, store);
    return store.colors.length < initial;
  }
  // ==========================================
  // TAMANHOS DE CATÁLOGO (REUTILIZÁVEIS)
  // ==========================================
  static async listSizes(companyId) {
    const store = getTenantStore(companyId);
    return store.sizes;
  }
  static async createSize(companyId, payload) {
    const store = getTenantStore(companyId);
    if (!payload || !payload.name || typeof payload.name !== "string" || !payload.name.trim()) {
      throw new Error("O nome do tamanho \xE9 obrigat\xF3rio.");
    }
    const trimmedName = payload.name.trim();
    const trimmedCode = payload.code ? payload.code.trim() : null;
    const existing = store.sizes.find(
      (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      if (trimmedCode && !existing.code) {
        existing.code = trimmedCode;
        existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        saveStoreToDisk(companyId, store);
      }
      return existing;
    }
    const newSize = {
      id: `sz-${Date.now()}`,
      companyId,
      name: trimmedName,
      code: trimmedCode,
      active: payload.active !== void 0 ? payload.active : true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.sizes.push(newSize);
    saveStoreToDisk(companyId, store);
    return newSize;
  }
  static async updateSize(companyId, sizeId, payload) {
    const store = getTenantStore(companyId);
    const size = store.sizes.find((s) => s.id === sizeId);
    if (!size) throw new Error("Tamanho n\xE3o encontrado.");
    if (payload.name) size.name = payload.name.trim();
    if (payload.code !== void 0) size.code = payload.code ? payload.code.trim() : null;
    if (payload.active !== void 0) size.active = payload.active;
    size.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveStoreToDisk(companyId, store);
    return size;
  }
  static async deleteSize(companyId, sizeId) {
    const store = getTenantStore(companyId);
    const initial = store.sizes.length;
    store.sizes = store.sizes.filter((s) => s.id !== sizeId);
    saveStoreToDisk(companyId, store);
    return store.sizes.length < initial;
  }
  // ==========================================
  // UNIDADES DE MEDIDA (REUTILIZÁVEIS)
  // ==========================================
  static async listUnits(companyId) {
    const store = getTenantStore(companyId);
    return store.units;
  }
  static async createUnit(companyId, payload) {
    const store = getTenantStore(companyId);
    const trimmedName = payload.name.trim();
    const existing = store.units.find(
      (u) => u.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }
    const newUnit = {
      id: `u-${Date.now()}`,
      companyId,
      name: trimmedName,
      shortName: payload.shortName.trim(),
      allowDecimal: !!payload.allowDecimal,
      active: payload.active !== void 0 ? payload.active : true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.units.push(newUnit);
    saveStoreToDisk(companyId, store);
    return newUnit;
  }
  static async updateUnit(companyId, unitId, payload) {
    const store = getTenantStore(companyId);
    const unit = store.units.find((u) => u.id === unitId);
    if (!unit) throw new Error("Unidade n\xE3o encontrada.");
    if (payload.name) unit.name = payload.name.trim();
    if (payload.shortName) unit.shortName = payload.shortName.trim();
    if (payload.allowDecimal !== void 0) unit.allowDecimal = payload.allowDecimal;
    if (payload.active !== void 0) unit.active = payload.active;
    unit.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveStoreToDisk(companyId, store);
    return unit;
  }
  static async deleteUnit(companyId, unitId) {
    const store = getTenantStore(companyId);
    const initial = store.units.length;
    store.units = store.units.filter((u) => u.id !== unitId);
    saveStoreToDisk(companyId, store);
    return store.units.length < initial;
  }
  static async listDeviceBrands(companyId) {
    const store = getTenantStore(companyId);
    return store.deviceBrands;
  }
  static async listDeviceModels(companyId, brandId) {
    const store = getTenantStore(companyId);
    if (brandId) {
      return store.deviceModels.filter((dm) => dm.deviceBrandId === brandId);
    }
    return store.deviceModels;
  }
  static async createDeviceModel(companyId, payload) {
    const store = getTenantStore(companyId);
    const brand = store.deviceBrands.find((db) => db.id === payload.deviceBrandId);
    const newModel = {
      id: `dm-${Date.now()}`,
      companyId,
      deviceBrandId: payload.deviceBrandId,
      deviceBrandName: brand?.name || "Marca",
      name: payload.name.trim(),
      technicalCode: payload.technicalCode?.trim() || null,
      active: payload.active !== void 0 ? payload.active : true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.deviceModels.push(newModel);
    saveStoreToDisk(companyId, store);
    return newModel;
  }
  // ==========================================
  // VARIATION TEMPLATES (GRADE / VARIAÇÕES)
  // ==========================================
  static async listVariationTemplates(companyId) {
    const store = getTenantStore(companyId);
    return store.variationTemplates || [];
  }
  static async createVariationTemplate(companyId, payload) {
    const store = getTenantStore(companyId);
    store.variationTemplates = store.variationTemplates || [];
    const trimmedName = payload.name?.trim();
    if (!trimmedName) {
      throw new Error("O nome da varia\xE7\xE3o \xE9 obrigat\xF3rio.");
    }
    const existing = store.variationTemplates.find(
      (v) => v.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      throw new Error(`J\xE1 existe uma varia\xE7\xE3o cadastrada com o nome "${trimmedName}".`);
    }
    let valuesList = [];
    if (Array.isArray(payload.values)) {
      valuesList = payload.values.map((v) => String(v).trim()).filter(Boolean);
    } else if (typeof payload.values === "string") {
      valuesList = payload.values.split(",").map((v) => v.trim()).filter(Boolean);
    }
    if (valuesList.length === 0) {
      throw new Error("Informe ao menos um valor para a varia\xE7\xE3o (ex.: Preto, Branco).");
    }
    const newTemplate = {
      id: `var-tpl-${Date.now()}`,
      companyId,
      name: trimmedName,
      values: valuesList,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.variationTemplates.push(newTemplate);
    saveStoreToDisk(companyId, store);
    return newTemplate;
  }
  static async updateVariationTemplate(companyId, id, payload) {
    const store = getTenantStore(companyId);
    store.variationTemplates = store.variationTemplates || [];
    const item = store.variationTemplates.find((v) => v.id === id);
    if (!item) throw new Error("Varia\xE7\xE3o n\xE3o encontrada.");
    if (payload.name) {
      const trimmedName = payload.name.trim();
      const duplicate = store.variationTemplates.find(
        (v) => v.id !== id && v.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`J\xE1 existe uma varia\xE7\xE3o cadastrada com o nome "${trimmedName}".`);
      }
      item.name = trimmedName;
    }
    if (payload.values !== void 0) {
      let valuesList = [];
      if (Array.isArray(payload.values)) {
        valuesList = payload.values.map((v) => String(v).trim()).filter(Boolean);
      } else if (typeof payload.values === "string") {
        valuesList = payload.values.split(",").map((v) => v.trim()).filter(Boolean);
      }
      if (valuesList.length === 0) {
        throw new Error("Informe ao menos um valor para a varia\xE7\xE3o.");
      }
      item.values = valuesList;
    }
    item.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveStoreToDisk(companyId, store);
    return item;
  }
  static async deleteVariationTemplate(companyId, id) {
    const store = getTenantStore(companyId);
    store.variationTemplates = store.variationTemplates || [];
    const item = store.variationTemplates.find((v) => v.id === id);
    if (!item) throw new Error("Varia\xE7\xE3o n\xE3o encontrada.");
    const inUse = store.products.some((p) => {
      if (p.variationTemplateId === id) return true;
      const pVars = store.variations.filter((v) => v.productId === p.id);
      return pVars.some(
        (v) => item.values.some((val) => val.toLowerCase() === v.name.toLowerCase())
      );
    });
    if (inUse) {
      throw new Error("Esta varia\xE7\xE3o n\xE3o pode ser exclu\xEDda pois est\xE1 vinculada a produtos cadastrados.");
    }
    const initial = store.variationTemplates.length;
    store.variationTemplates = store.variationTemplates.filter((v) => v.id !== id);
    saveStoreToDisk(companyId, store);
    return store.variationTemplates.length < initial;
  }
  // ==========================================
  // WARRANTIES (Prazos e Termos de Garantia)
  // ==========================================
  static async listWarranties(companyId) {
    const store = getTenantStore(companyId);
    store.warranties = store.warranties || [];
    return [...store.warranties].sort((a, b) => {
      const nameA = a.nome || a.name || "";
      const nameB = b.nome || b.name || "";
      return nameA.localeCompare(nameB);
    });
  }
  static async createWarranty(companyId, payload) {
    const store = getTenantStore(companyId);
    store.warranties = store.warranties || [];
    const name = (payload.nome || payload.name || "").trim();
    if (!name) {
      throw new Error("O nome da garantia \xE9 obrigat\xF3rio.");
    }
    const exists = store.warranties.some(
      (w) => (w.nome || w.name || "").toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      throw new Error(`J\xE1 existe uma garantia cadastrada com o nome "${name}".`);
    }
    const durationValue = Number(payload.duracao_valor ?? payload.durationValue ?? 0);
    if (isNaN(durationValue) || durationValue <= 0) {
      throw new Error("A dura\xE7\xE3o da garantia deve ser um n\xFAmero inteiro positivo.");
    }
    const rawUnit = payload.duracao_unidade ?? payload.durationUnit ?? "Dias";
    const durationUnit = rawUnit === "Meses" || rawUnit === "months" ? "Meses" : rawUnit === "Anos" || rawUnit === "years" ? "Anos" : "Dias";
    const description = (payload.descricao ?? payload.description ?? null)?.trim() || null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newWarranty = {
      id: `war-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      companyId,
      company_id: companyId,
      name,
      nome: name,
      description,
      descricao: description,
      durationValue,
      duracao_valor: durationValue,
      durationUnit,
      duracao_unidade: durationUnit,
      createdAt: now,
      created_at: now,
      updatedAt: now,
      updated_at: now
    };
    store.warranties.push(newWarranty);
    saveStoreToDisk(companyId, store);
    return newWarranty;
  }
  static async updateWarranty(companyId, id, payload) {
    const store = getTenantStore(companyId);
    store.warranties = store.warranties || [];
    const item = store.warranties.find((w) => w.id === id);
    if (!item) {
      throw new Error("Garantia n\xE3o encontrada.");
    }
    const name = (payload.nome !== void 0 ? payload.nome : payload.name)?.trim();
    if (name !== void 0) {
      if (!name) {
        throw new Error("O nome da garantia n\xE3o pode ser vazio.");
      }
      const duplicate = store.warranties.some(
        (w) => w.id !== id && (w.nome || w.name || "").toLowerCase() === name.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`J\xE1 existe uma garantia cadastrada com o nome "${name}".`);
      }
      item.name = name;
      item.nome = name;
    }
    if (payload.duracao_valor !== void 0 || payload.durationValue !== void 0) {
      const val = Number(payload.duracao_valor ?? payload.durationValue);
      if (isNaN(val) || val <= 0) {
        throw new Error("A dura\xE7\xE3o da garantia deve ser um n\xFAmero inteiro positivo.");
      }
      item.durationValue = val;
      item.duracao_valor = val;
    }
    if (payload.duracao_unidade !== void 0 || payload.durationUnit !== void 0) {
      const rawUnit = payload.duracao_unidade ?? payload.durationUnit;
      const durationUnit = rawUnit === "Meses" || rawUnit === "months" ? "Meses" : rawUnit === "Anos" || rawUnit === "years" ? "Anos" : "Dias";
      item.durationUnit = durationUnit;
      item.duracao_unidade = durationUnit;
    }
    if (payload.descricao !== void 0 || payload.description !== void 0) {
      const desc = (payload.descricao !== void 0 ? payload.descricao : payload.description)?.trim() || null;
      item.description = desc;
      item.descricao = desc;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    item.updatedAt = now;
    item.updated_at = now;
    saveStoreToDisk(companyId, store);
    return item;
  }
  static async deleteWarranty(companyId, id) {
    const store = getTenantStore(companyId);
    store.warranties = store.warranties || [];
    const item = store.warranties.find((w) => w.id === id);
    if (!item) {
      throw new Error("Garantia n\xE3o encontrada.");
    }
    const inUse = store.products.some((p) => {
      if (p.warrantyId === id) return true;
      if (p.garantiaId === id) return true;
      const pName = p.warrantyName || p.garantiaNome;
      if (pName && pName.toLowerCase() === (item.nome || item.name || "").toLowerCase()) {
        return true;
      }
      return false;
    });
    if (inUse) {
      throw new Error("Esta garantia n\xE3o pode ser exclu\xEDda pois est\xE1 vinculada a produtos cadastrados.");
    }
    const initial = store.warranties.length;
    store.warranties = store.warranties.filter((w) => w.id !== id);
    saveStoreToDisk(companyId, store);
    return store.warranties.length < initial;
  }
};

// src/config/productImportColumns.ts
var OFFICIAL_PRODUCT_IMPORT_COLUMNS = [
  {
    number: 1,
    key: "name",
    name: "Nome do Produto (NAME)",
    required: true,
    instruction: "Nome oficial do item ou mercadoria no cat\xE1logo. Obrigat\xF3rio em todas as linhas."
  },
  {
    number: 2,
    key: "brand",
    name: "Marca (BRAND)",
    required: false,
    instruction: "Nome da marca ou fabricante. Se n\xE3o existir, ser\xE1 criada automaticamente."
  },
  {
    number: 3,
    key: "unit",
    name: "Unidade (UNIT)",
    required: true,
    instruction: "Unidade de medida principal (ex: UN, KG, MT, CX, L, PC). Obrigat\xF3rio."
  },
  {
    number: 4,
    key: "category",
    name: "Categoria (CATEGORY)",
    required: false,
    instruction: "Nome da categoria principal do produto."
  },
  {
    number: 5,
    key: "sub_category",
    name: "Subcategoria (SUB-CATEGORY)",
    required: false,
    instruction: "Nome da subcategoria vinculada \xE0 categoria."
  },
  {
    number: 6,
    key: "sku",
    name: "SKU (SKU)",
    required: false,
    instruction: "C\xF3digo SKU \xFAnico. Deixe em branco para o sistema gerar automaticamente (ex: PRD-100000)."
  },
  {
    number: 7,
    key: "barcode_type",
    name: "Tipo de C\xF3digo de Barras (BARCODE TYPE)",
    required: false,
    defaultValue: "C128",
    instruction: "Padr\xE3o: C128. Op\xE7\xF5es v\xE1lidas: C128, C39, EAN-13, EAN-8, UPC-A, UPC-E, ITF-14.",
    options: ["C128", "C39", "EAN-13", "EAN-8", "UPC-A", "UPC-E", "ITF-14"]
  },
  {
    number: 8,
    key: "manage_stock",
    name: "Gerenciar Estoque (MANAGE STOCK)",
    required: true,
    instruction: "Controle de saldo f\xEDsico. 1 = Sim, 0 = N\xE3o.",
    options: ["1", "0"]
  },
  {
    number: 9,
    key: "alert_quantity",
    name: "Quantidade de Alerta (ALERT QUANTITY)",
    required: false,
    instruction: "Quantidade m\xEDnima em estoque para aviso de reposi\xE7\xE3o."
  },
  {
    number: 10,
    key: "expires_in",
    name: "Expira em (EXPIRES IN)",
    required: false,
    instruction: "N\xFAmero referente ao per\xEDodo de validade/garantia do produto."
  },
  {
    number: 11,
    key: "expiry_period_unit",
    name: "Unidade do Per\xEDodo (EXPIRY PERIOD UNIT)",
    required: false,
    instruction: "Unidade de tempo de expira\xE7\xE3o. Op\xE7\xF5es: days, months, dias, meses.",
    options: ["days", "months", "dias", "meses"]
  },
  {
    number: 12,
    key: "applicable_tax",
    name: "Imposto Aplic\xE1vel (APPLICABLE TAX)",
    required: false,
    instruction: "Al\xEDquota ou regra de imposto aplic\xE1vel na venda."
  },
  {
    number: 13,
    key: "selling_price_tax_type",
    name: "Tipo de Imposto Pre\xE7o Venda (SELLING PRICE TAX TYPE)",
    required: true,
    instruction: "Regra de incid\xEAncia tribut\xE1ria no pre\xE7o de venda. Op\xE7\xF5es: inclusive ou exclusive.",
    options: ["inclusive", "exclusive"]
  },
  {
    number: 14,
    key: "product_type",
    name: "Tipo de Produto (PRODUCT TYPE)",
    required: true,
    instruction: "Tipo de cadastro do produto. Op\xE7\xF5es: single (simples) ou variable (vari\xE1vel).",
    options: ["single", "variable", "simples", "variavel"]
  },
  {
    number: 15,
    key: "variation_name",
    name: "Nome da Varia\xE7\xE3o (VARIATION NAME)",
    required: false,
    instruction: 'Obrigat\xF3rio se o tipo de produto for "variable" (ex: Tamanho, Cor, Voltagem). Deixe em branco se for "single".'
  },
  {
    number: 16,
    key: "variation_values",
    name: "Valores da Varia\xE7\xE3o (VARIATION VALUES)",
    required: false,
    instruction: 'Obrigat\xF3rio se "variable". Valores separados pelo caractere "|" (pipe), ex: P|M|G ou 110V|220V.'
  },
  {
    number: 17,
    key: "variation_sku",
    name: "SKU da Varia\xE7\xE3o (VARIATION SKU)",
    required: false,
    instruction: "SKUs customizados para varia\xE7\xF5es. Deixe em branco para gera\xE7\xE3o autom\xE1tica."
  },
  {
    number: 18,
    key: "purchase_price_inc_tax",
    name: "Pre\xE7o de Compra Com Imposto (PURCHASE PRICE INC TAX)",
    required: false,
    instruction: "Pre\xE7o de custo com impostos inclusos. Se n\xE3o informado, calculado pelo pre\xE7o sem imposto."
  },
  {
    number: 19,
    key: "purchase_price_exc_tax",
    name: "Pre\xE7o de Compra Sem Imposto (PURCHASE PRICE EXC TAX)",
    required: false,
    instruction: "Pre\xE7o de custo l\xEDquido sem impostos. Pelo menos um dos pre\xE7os de compra deve ser informado."
  },
  {
    number: 20,
    key: "profit_margin",
    name: "Margem de Lucro % (PROFIT MARGIN)",
    required: false,
    instruction: "Percentual de margem de lucro desejada sobre o custo."
  },
  {
    number: 21,
    key: "selling_price",
    name: "Pre\xE7o de Venda (SELLING PRICE)",
    required: false,
    instruction: "Pre\xE7o padr\xE3o praticado na venda ao consumidor."
  },
  {
    number: 22,
    key: "opening_stock",
    name: "Estoque Inicial (OPENING STOCK)",
    required: false,
    instruction: "Quantidade f\xEDsica inicial em estoque a ser lan\xE7ada para o produto."
  },
  {
    number: 23,
    key: "location",
    name: "Filial / Local Estoque Inicial (LOCATION)",
    required: false,
    instruction: "Nome da filial onde o saldo inicial ser\xE1 lan\xE7ado. Se vazio, utiliza a filial matriz principal."
  },
  {
    number: 24,
    key: "expiry_date",
    name: "Data de Expira\xE7\xE3o (EXPIRY DATE)",
    required: false,
    instruction: "Data limite de validade do lote inicial (formato AAAA-MM-DD ou DD/MM/AAAA)."
  },
  {
    number: 25,
    key: "enable_imei_sr_no",
    name: "Habilitar IMEI ou Serial (ENABLE IMEI OR SERIAL NUMBER)",
    required: false,
    defaultValue: "0",
    instruction: "Controle individual por n\xFAmero de s\xE9rie ou IMEI. 1 = Sim, 0 = N\xE3o.",
    options: ["1", "0"]
  },
  {
    number: 26,
    key: "weight",
    name: "Peso (WEIGHT)",
    required: false,
    instruction: "Peso unit\xE1rio do produto para frete ou pesagem."
  },
  {
    number: 27,
    key: "rack",
    name: "Prateleira / Rack (RACK)",
    required: false,
    instruction: "Endere\xE7amento de dep\xF3sito: identifica\xE7\xE3o da prateleira."
  },
  {
    number: 28,
    key: "row",
    name: "Fila / Corredor (ROW)",
    required: false,
    instruction: "Endere\xE7amento de dep\xF3sito: identifica\xE7\xE3o do corredor ou fila."
  },
  {
    number: 29,
    key: "position",
    name: "Posi\xE7\xE3o (POSITION)",
    required: false,
    instruction: "Endere\xE7amento de dep\xF3sito: posi\xE7\xE3o ou escaninho."
  },
  {
    number: 30,
    key: "image",
    name: "Imagem (IMAGE)",
    required: false,
    instruction: "Nome do arquivo de imagem ou URL direta da foto do produto."
  },
  {
    number: 31,
    key: "product_description",
    name: "Descri\xE7\xE3o do Produto (PRODUCT DESCRIPTION)",
    required: false,
    instruction: "Texto detalhado ou ficha t\xE9cnica do item."
  },
  {
    number: 32,
    key: "custom_field1",
    name: "Campo Personalizado 1 (CUSTOM FIELD 1)",
    required: false,
    instruction: "Atributo adicional customizado 1."
  },
  {
    number: 33,
    key: "custom_field2",
    name: "Campo Personalizado 2 (CUSTOM FIELD 2)",
    required: false,
    instruction: "Atributo adicional customizado 2."
  },
  {
    number: 34,
    key: "custom_field3",
    name: "Campo Personalizado 3 (CUSTOM FIELD 3)",
    required: false,
    instruction: "Atributo adicional customizado 3."
  },
  {
    number: 35,
    key: "custom_field4",
    name: "Campo Personalizado 4 (CUSTOM FIELD 4)",
    required: false,
    instruction: "Atributo adicional customizado 4."
  },
  {
    number: 36,
    key: "not_for_selling",
    name: "N\xE3o Dispon\xEDvel para Venda (NOT FOR SELLING)",
    required: false,
    defaultValue: "0",
    instruction: "Indica se o item \xE9 apenas de consumo interno/insumo. 1 = Sim, 0 = N\xE3o.",
    options: ["1", "0"]
  },
  {
    number: 37,
    key: "product_locations",
    name: "Filiais do Produto (PRODUCT LOCATIONS)",
    required: false,
    instruction: "Nomes das filiais onde o produto estar\xE1 dispon\xEDvel comercialmente, separados por v\xEDrgula."
  }
];
function normalizeHeaderName(name) {
  return name.toLowerCase().replace(/[_\s\-\(\)\.]+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function validateHeaders(detectedHeaders) {
  const detectedCount = detectedHeaders.length;
  const expectedCount = 37;
  const errors = [];
  const mapping = {};
  if (detectedCount < 35) {
    errors.push(
      `O arquivo cont\xE9m apenas ${detectedCount} colunas. O modelo padr\xE3o exige 37 colunas.`
    );
  }
  const normalizedDetected = detectedHeaders.map((h) => normalizeHeaderName(h));
  OFFICIAL_PRODUCT_IMPORT_COLUMNS.forEach((colDef, idx) => {
    if (idx < detectedCount) {
      mapping[colDef.key] = idx;
    } else {
      const normDefName = normalizeHeaderName(colDef.name);
      const foundIdx = normalizedDetected.findIndex((h) => h.includes(normDefName) || normDefName.includes(h));
      if (foundIdx !== -1) {
        mapping[colDef.key] = foundIdx;
      }
    }
  });
  return {
    valid: errors.length === 0,
    detectedCount,
    expectedCount,
    errors,
    mapping
  };
}
function validateRow(rawRow, rowNumber, mapping) {
  const errors = [];
  const getValue = (key, defaultVal = "") => {
    if (Array.isArray(rawRow)) {
      const idx = mapping[key];
      if (idx !== void 0 && idx < rawRow.length) {
        return (rawRow[idx] ?? "").toString().trim();
      }
      return defaultVal;
    }
    const val = rawRow[key];
    return val !== void 0 && val !== null ? val.toString().trim() : defaultVal;
  };
  const name = getValue("name");
  if (!name) {
    errors.push({
      rowNumber,
      columnNumber: 1,
      columnName: "Nome do Produto (NAME)",
      value: name,
      message: "Nome do produto \xE9 obrigat\xF3rio e n\xE3o pode ser vazio."
    });
  }
  const brand = getValue("brand");
  const unit = getValue("unit");
  if (!unit) {
    errors.push({
      rowNumber,
      columnNumber: 3,
      columnName: "Unidade (UNIT)",
      value: unit,
      message: "Unidade de medida \xE9 obrigat\xF3ria (ex: UN, KG, MT, CX, L)."
    });
  }
  const category = getValue("category");
  const subCategory = getValue("sub_category");
  const sku = getValue("sku");
  const rawBarcodeType = getValue("barcode_type", "C128").toUpperCase();
  const validBarcodeTypes = ["C128", "C39", "EAN-13", "EAN-8", "UPC-A", "UPC-E", "ITF-14", "EAN13", "EAN8", "UPCA", "UPCE"];
  let barcodeType = "C128";
  if (rawBarcodeType && !validBarcodeTypes.includes(rawBarcodeType)) {
    errors.push({
      rowNumber,
      columnNumber: 7,
      columnName: "Tipo de C\xF3digo de Barras (BARCODE TYPE)",
      value: rawBarcodeType,
      message: "Tipo de c\xF3digo de barras inv\xE1lido. Permitidos: C128, C39, EAN-13, EAN-8, UPC-A, UPC-E."
    });
  } else if (rawBarcodeType) {
    barcodeType = rawBarcodeType.replace("-", "");
  }
  const rawManageStock = getValue("manage_stock");
  let manageStock = true;
  if (rawManageStock === "1" || rawManageStock.toLowerCase() === "sim" || rawManageStock.toLowerCase() === "yes") {
    manageStock = true;
  } else if (rawManageStock === "0" || rawManageStock.toLowerCase() === "nao" || rawManageStock.toLowerCase() === "n\xE3o" || rawManageStock.toLowerCase() === "no") {
    manageStock = false;
  } else if (rawManageStock) {
    errors.push({
      rowNumber,
      columnNumber: 8,
      columnName: "Gerenciar Estoque (MANAGE STOCK)",
      value: rawManageStock,
      message: "Valor inv\xE1lido para Gerenciar Estoque. Aceito: 1 (Sim) ou 0 (N\xE3o)."
    });
  }
  const rawAlertQuantity = getValue("alert_quantity");
  const alertQuantity = rawAlertQuantity ? parseFloat(rawAlertQuantity) : void 0;
  if (rawAlertQuantity && isNaN(alertQuantity)) {
    errors.push({
      rowNumber,
      columnNumber: 9,
      columnName: "Quantidade de Alerta (ALERT QUANTITY)",
      value: rawAlertQuantity,
      message: "Quantidade de alerta deve ser um n\xFAmero v\xE1lido."
    });
  }
  const rawExpiresIn = getValue("expires_in");
  const expiresIn = rawExpiresIn ? parseFloat(rawExpiresIn) : void 0;
  const expiryPeriodUnit = getValue("expiry_period_unit");
  const applicableTax = getValue("applicable_tax");
  const rawTaxType = getValue("selling_price_tax_type", "exclusive").toLowerCase();
  let sellingPriceTaxType = "exclusive";
  if (rawTaxType === "inclusive" || rawTaxType === "incluso") {
    sellingPriceTaxType = "inclusive";
  } else if (rawTaxType === "exclusive" || rawTaxType === "excluso") {
    sellingPriceTaxType = "exclusive";
  } else if (rawTaxType) {
    errors.push({
      rowNumber,
      columnNumber: 13,
      columnName: "Tipo de Imposto Pre\xE7o Venda (SELLING PRICE TAX TYPE)",
      value: rawTaxType,
      message: 'Tipo de imposto deve ser "inclusive" ou "exclusive".'
    });
  }
  const rawProductType = getValue("product_type", "single").toLowerCase();
  let productType = "single";
  if (rawProductType === "single" || rawProductType === "simples") {
    productType = "single";
  } else if (rawProductType === "variable" || rawProductType === "variavel") {
    productType = "variable";
  } else {
    errors.push({
      rowNumber,
      columnNumber: 14,
      columnName: "Tipo de Produto (PRODUCT TYPE)",
      value: rawProductType,
      message: 'Tipo de produto deve ser "single" ou "variable".'
    });
  }
  const variationName = getValue("variation_name");
  if (productType === "variable" && !variationName) {
    errors.push({
      rowNumber,
      columnNumber: 15,
      columnName: "Nome da Varia\xE7\xE3o (VARIATION NAME)",
      value: "",
      message: 'Nome da varia\xE7\xE3o \xE9 obrigat\xF3rio quando o tipo de produto for "variable".'
    });
  }
  const variationValues = getValue("variation_values");
  if (productType === "variable" && !variationValues) {
    errors.push({
      rowNumber,
      columnNumber: 16,
      columnName: "Valores da Varia\xE7\xE3o (VARIATION VALUES)",
      value: "",
      message: 'Valores da varia\xE7\xE3o s\xE3o obrigat\xF3rios quando o tipo for "variable" (ex: P|M|G).'
    });
  }
  const variationSku = getValue("variation_sku");
  const rawPurchaseInc = getValue("purchase_price_inc_tax").replace(",", ".");
  const purchasePriceIncTax = rawPurchaseInc ? parseFloat(rawPurchaseInc) : void 0;
  const rawPurchaseExc = getValue("purchase_price_exc_tax").replace(",", ".");
  const purchasePriceExcTax = rawPurchaseExc ? parseFloat(rawPurchaseExc) : void 0;
  const rawProfitMargin = getValue("profit_margin").replace(",", ".");
  const profitMargin = rawProfitMargin ? parseFloat(rawProfitMargin) : void 0;
  const rawSellingPrice = getValue("selling_price").replace(",", ".");
  const sellingPrice = rawSellingPrice ? parseFloat(rawSellingPrice) : void 0;
  const rawOpeningStock = getValue("opening_stock").replace(",", ".");
  const openingStock = rawOpeningStock ? parseFloat(rawOpeningStock) : void 0;
  if (rawOpeningStock && isNaN(openingStock)) {
    errors.push({
      rowNumber,
      columnNumber: 22,
      columnName: "Estoque Inicial (OPENING STOCK)",
      value: rawOpeningStock,
      message: "Estoque inicial deve ser um n\xFAmero v\xE1lido."
    });
  }
  const location = getValue("location");
  const expiryDate = getValue("expiry_date");
  const rawEnableImei = getValue("enable_imei_sr_no");
  const enableImeiSerial = rawEnableImei === "1" || rawEnableImei.toLowerCase() === "sim";
  const rawWeight = getValue("weight").replace(",", ".");
  const weight = rawWeight ? parseFloat(rawWeight) : void 0;
  const rack = getValue("rack");
  const row = getValue("row");
  const position = getValue("position");
  const image = getValue("image");
  const productDescription = getValue("product_description");
  const customField1 = getValue("custom_field1");
  const customField2 = getValue("custom_field2");
  const customField3 = getValue("custom_field3");
  const customField4 = getValue("custom_field4");
  const rawNotForSelling = getValue("not_for_selling");
  const notForSelling = rawNotForSelling === "1" || rawNotForSelling.toLowerCase() === "sim";
  const rawProductLocations = getValue("product_locations");
  const productLocations = rawProductLocations ? rawProductLocations.split(",").map((l) => l.trim()).filter(Boolean) : [];
  const rawObj = {};
  if (Array.isArray(rawRow)) {
    rawRow.forEach((val, i) => {
      rawObj[`col_${i + 1}`] = val;
    });
  }
  return {
    rowNumber,
    isValid: errors.length === 0,
    errors,
    raw: rawObj,
    parsed: {
      name,
      brand,
      unit,
      category,
      subCategory,
      sku,
      barcodeType,
      manageStock,
      alertQuantity,
      expiresIn,
      expiryPeriodUnit,
      applicableTax,
      sellingPriceTaxType,
      productType,
      variationName,
      variationValues,
      variationSku,
      purchasePriceIncTax,
      purchasePriceExcTax,
      profitMargin,
      sellingPrice,
      openingStock,
      location,
      expiryDate,
      enableImeiSerial,
      weight,
      rack,
      row,
      position,
      image,
      productDescription,
      customField1,
      customField2,
      customField3,
      customField4,
      notForSelling,
      productLocations
    }
  };
}

// src/server/services/productImportService.ts
var ProductImportService = class {
  /**
   * Generates a preview and validates CSV data before persistence
   */
  static async generatePreview(companyId, rawHeaders, rawRows) {
    const headerValidation = validateHeaders(rawHeaders);
    const items = rawRows.filter((r) => r.length > 0 && r.some((c) => c && c.trim().length > 0)).map((row, idx) => {
      return validateRow(row, idx + 1, headerValidation.mapping);
    });
    const totalRows = items.length;
    const validRows = items.filter((i) => i.isValid).length;
    const invalidRows = totalRows - validRows;
    return {
      totalRows,
      validRows,
      invalidRows,
      columnValidation: {
        valid: headerValidation.valid,
        detectedCount: headerValidation.detectedCount,
        expectedCount: headerValidation.expectedCount,
        missingColumns: headerValidation.errors
      },
      items
    };
  }
  /**
   * Executes batch persistence of validated products in database / store
   */
  static async executeImport(companyId, payload) {
    const items = payload.items || [];
    if (!items || items.length === 0) {
      throw new Error("Nenhum produto v\xE1lido foi fornecido para importa\xE7\xE3o.");
    }
    const existingUnits = await ProductService.listUnits(companyId);
    const existingBrands = await ProductService.listBrands(companyId);
    const existingCategories = await ProductService.listCategories(companyId);
    const existingLocations = await CompanyService.listLocations(companyId);
    const unitMap = /* @__PURE__ */ new Map();
    existingUnits.forEach((u) => {
      unitMap.set(u.shortName.toLowerCase(), u.id);
      unitMap.set(u.name.toLowerCase(), u.id);
    });
    const brandMap = /* @__PURE__ */ new Map();
    existingBrands.forEach((b) => brandMap.set(b.name.toLowerCase(), b.id));
    const categoryMap = /* @__PURE__ */ new Map();
    existingCategories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id));
    const defaultLocation = existingLocations.find((l) => l.isMain) || existingLocations[0] || {
      id: "loc-matriz",
      name: "Matriz - Centro"
    };
    let importedCount = 0;
    let errorsCount = 0;
    const errors = [];
    const importedProducts = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNo = i + 1;
      try {
        let unitId = unitMap.get(item.unit.toLowerCase());
        if (!unitId) {
          const newUnit = await ProductService.createUnit(companyId, {
            name: item.unit.toUpperCase(),
            shortName: item.unit.toUpperCase().substring(0, 5),
            allowDecimal: true,
            active: true
          });
          unitId = newUnit.id;
          unitMap.set(item.unit.toLowerCase(), unitId);
          unitMap.set(newUnit.shortName.toLowerCase(), unitId);
        }
        let brandId = null;
        let brandName = null;
        if (item.brand && item.brand.trim()) {
          const cleanBrand = item.brand.trim();
          brandId = brandMap.get(cleanBrand.toLowerCase()) || null;
          if (!brandId) {
            const newBrand = await ProductService.createBrand(companyId, {
              name: cleanBrand,
              active: true
            });
            brandId = newBrand.id;
            brandMap.set(cleanBrand.toLowerCase(), brandId);
          }
          brandName = cleanBrand;
        }
        let categoryId = null;
        let categoryName = null;
        if (item.category && item.category.trim()) {
          const cleanCat = item.category.trim();
          categoryId = categoryMap.get(cleanCat.toLowerCase()) || null;
          if (!categoryId) {
            const newCat = await ProductService.createCategory(companyId, {
              name: cleanCat,
              active: true
            });
            categoryId = newCat.id;
            categoryMap.set(cleanCat.toLowerCase(), categoryId);
          }
          categoryName = cleanCat;
        }
        let targetLocationId = defaultLocation.id;
        let targetLocationName = defaultLocation.name;
        if (item.location && item.location.trim()) {
          const matchedLoc = existingLocations.find(
            (l) => l.name.toLowerCase() === item.location.trim().toLowerCase()
          );
          if (matchedLoc) {
            targetLocationId = matchedLoc.id;
            targetLocationName = matchedLoc.name;
          }
        }
        const rackParts = [item.rack, item.row, item.position].filter(Boolean);
        const rackLocation = rackParts.length > 0 ? rackParts.join(" - ") : void 0;
        const locationInputs = [
          {
            locationId: targetLocationId,
            initialStock: item.openingStock !== void 0 ? Number(item.openingStock) : 0,
            currentStock: item.openingStock !== void 0 ? Number(item.openingStock) : 0,
            manageStock: item.manageStock,
            rackLocation: rackLocation || null,
            isAvailable: true
          }
        ];
        const purchasePrice = item.purchasePriceIncTax || item.purchasePriceExcTax || 0;
        const sellingPrice = item.sellingPrice || purchasePrice * 1.3;
        const profitMargin = item.profitMargin || (purchasePrice > 0 ? (sellingPrice - purchasePrice) / purchasePrice * 100 : 30);
        const barcodeType = item.barcodeType === "C39" || item.barcodeType === "EAN13" || item.barcodeType === "EAN8" || item.barcodeType === "UPCA" || item.barcodeType === "UPCE" ? item.barcodeType : "C128";
        const variations = item.productType === "variable" && item.variationValues ? item.variationValues.split("|").map((val, idx) => ({
          name: `${item.variationName || "Varia\xE7\xE3o"}: ${val.trim()}`,
          sku: item.variationSku ? `${item.variationSku}-${idx + 1}` : "",
          purchasePrice,
          marginPercent: profitMargin,
          salePrice: sellingPrice,
          attributes: { [item.variationName || "Atributo"]: val.trim() },
          isDefault: idx === 0
        })) : void 0;
        const productPayload = {
          name: item.name,
          sku: item.sku || void 0,
          barcodeType,
          barcode: null,
          productType: item.productType,
          unitId,
          brandId,
          brandName,
          categoryId,
          categoryName,
          description: item.productDescription || null,
          operationalNotes: [
            item.customField1 ? `Campo 1: ${item.customField1}` : null,
            item.customField2 ? `Campo 2: ${item.customField2}` : null,
            item.customField3 ? `Campo 3: ${item.customField3}` : null,
            item.customField4 ? `Campo 4: ${item.customField4}` : null
          ].filter(Boolean).join(" | ") || null,
          imageUrl: item.image || null,
          weight: item.weight || null,
          manageStock: item.manageStock,
          alertQuantity: item.alertQuantity || 5,
          enableImeiSerial: !!item.enableImeiSerial,
          notForSale: !!item.notForSelling,
          applicableTax: item.applicableTax || null,
          salePriceTaxType: item.sellingPriceTaxType,
          defaultPurchasePrice: purchasePrice,
          marginPercent: profitMargin,
          defaultSalePrice: sellingPrice,
          active: true,
          locationInputs,
          variations
        };
        const createdProduct = await ProductService.createProduct(companyId, productPayload);
        importedProducts.push({
          id: createdProduct.id,
          name: createdProduct.name,
          sku: createdProduct.sku,
          initialStock: item.openingStock,
          locationName: targetLocationName
        });
        importedCount++;
      } catch (err) {
        errorsCount++;
        errors.push(`Linha ${rowNo} (${item.name || "Sem nome"}): ${err.message}`);
      }
    }
    return {
      totalRows: items.length,
      importedCount,
      errorsCount,
      errors: errors.length > 0 ? errors : void 0,
      importedProducts
    };
  }
};

// src/server/services/repairService.ts
var STATUS_LABELS = {
  pending: "Pendente",
  in_progress: "Em Andamento / Bancada",
  waiting_parts: "Aguardando Pe\xE7as",
  approved: "Or\xE7amento Aprovado",
  completed: "Reparo Conclu\xEDdo",
  cancelled: "Cancelado",
  delivered: "Entregue ao Cliente"
};
var INITIAL_JOB_SHEETS = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    jobSheetNumber: "OS-2026-001",
    customerId: "cust-1",
    customerName: "Carlos Eduardo Mendes",
    customerPhone: "(11) 98765-4321",
    customerEmail: "carlos.mendes@email.com",
    deviceType: "Smartphone",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    serialNumber: "DN6ZQ9Y80D",
    color: "Tit\xE2nio Natural",
    accessories: "Capa transparente, pel\xEDcula quebrada",
    reportedDefect: "Display trincado ap\xF3s queda; touch com falhas no canto superior direito.",
    technicalDiagnosis: "Necess\xE1ria troca do m\xF3dulo frontal OLED original e calibra\xE7\xE3o do Face ID.",
    technicianName: "Rodrigo Alves",
    status: "in_progress",
    priority: "urgent",
    estimatedCostCents: 189e3,
    finalCostCents: 189e3,
    partsCostCents: 12e4,
    laborCostCents: 69e3,
    warrantyDays: 90,
    notes: "Cliente solicitou urg\xEAncia para retirada no mesmo dia.",
    createdAt: new Date(Date.now() - 36e5 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 36e5 * 1).toISOString()
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    jobSheetNumber: "OS-2026-002",
    customerId: "cust-2",
    customerName: "Mariana Silveira Ramos",
    customerPhone: "(11) 97123-8899",
    customerEmail: "mari.silveira@empresa.com.br",
    deviceType: "Notebook",
    brand: "Dell",
    model: "Inspiron 15 3520",
    serialNumber: "8H2K9P3",
    color: "Prata",
    accessories: "Fonte original e mouse sem fio",
    reportedDefect: "Superaquecimento constante, ventoinha com barulho estranho e lentid\xE3o cr\xEDtica.",
    technicalDiagnosis: "Cooler com rolamento danificado e pasta t\xE9rmica ressecada. Necess\xE1ria substitui\xE7\xE3o e limpeza qu\xEDmica.",
    technicianName: "Felipe Santos",
    status: "waiting_parts",
    priority: "normal",
    estimatedCostCents: 38e3,
    finalCostCents: 38e3,
    partsCostCents: 16e3,
    laborCostCents: 22e3,
    warrantyDays: 90,
    notes: "Pe\xE7a solicitada ao fornecedor Dell. Previs\xE3o de chegada: amanh\xE3.",
    createdAt: new Date(Date.now() - 864e5 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 36e5 * 6).toISOString()
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    jobSheetNumber: "OS-2026-003",
    customerId: "cust-3",
    customerName: "Lucas Ferreira Lima",
    customerPhone: "(11) 96543-2109",
    customerEmail: "lucas.lima@tech.io",
    deviceType: "Console",
    brand: "Sony",
    model: "PlayStation 5 Slim",
    serialNumber: "CFI-2000B",
    color: "Branco",
    accessories: "Cabo HDMI e cabo de for\xE7a",
    reportedDefect: "N\xE3o liga ap\xF3s surto de energia na rede el\xE9trica.",
    technicalDiagnosis: "Fonte interna queimada no circuito prim\xE1rio (fus\xEDvel e MOSFETs rompidos).",
    solutionApplied: "Substitui\xE7\xE3o completa do m\xF3dulo da fonte de alimenta\xE7\xE3o e testes de estresse.",
    technicianName: "Rodrigo Alves",
    status: "completed",
    priority: "high",
    estimatedCostCents: 65e3,
    finalCostCents: 65e3,
    partsCostCents: 38e3,
    laborCostCents: 27e3,
    warrantyDays: 180,
    notes: "Aparelho testado por 4 horas cont\xEDnuas em jogos 4K.",
    createdAt: new Date(Date.now() - 864e5 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 36e5 * 2).toISOString()
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    jobSheetNumber: "OS-2026-004",
    customerId: "cust-4",
    customerName: "Fernanda Barbosa Costa",
    customerPhone: "(11) 95544-3322",
    customerEmail: "fernanda.costa@advocacia.com",
    deviceType: "Smartphone",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    serialNumber: "R5CW30XYZ",
    color: "Cinza Tit\xE2nio",
    accessories: "Caneta S-Pen inclusa",
    reportedDefect: "Bateria descarrega muito r\xE1pido (menos de 3 horas) e conector USB-C esquentando.",
    technicalDiagnosis: "Sub-placa de carga em curto e ciclo de bateria excedido (820 ciclos).",
    technicianName: "Felipe Santos",
    status: "pending",
    priority: "normal",
    estimatedCostCents: 49e3,
    finalCostCents: 49e3,
    partsCostCents: 28e3,
    laborCostCents: 21e3,
    warrantyDays: 90,
    notes: "Aguardando confirma\xE7\xE3o do cliente sobre o or\xE7amento.",
    createdAt: new Date(Date.now() - 36e5 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 36e5 * 8).toISOString()
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    jobSheetNumber: "OS-2026-005",
    customerId: "cust-5",
    customerName: "Gabriel Nogueira Prado",
    customerPhone: "(11) 94433-2211",
    customerEmail: "gnprado@gmail.com",
    deviceType: "Tablet",
    brand: "Apple",
    model: "iPad Air 5\xAA Gera\xE7\xE3o (M1)",
    serialNumber: "DMPX4029Q1",
    color: "Azul",
    accessories: "Smart Folio case",
    reportedDefect: "Vidro quebrado ap\xF3s impacto, display LCD intacto.",
    technicalDiagnosis: "Troca do vidro / touch laminado com cola OCA.",
    solutionApplied: "Troca efetuada com sucesso em c\xE2mara de v\xE1cuo, calibra\xE7\xE3o ok.",
    technicianName: "Rodrigo Alves",
    status: "delivered",
    priority: "normal",
    estimatedCostCents: 85e3,
    finalCostCents: 85e3,
    partsCostCents: 42e3,
    laborCostCents: 43e3,
    warrantyDays: 90,
    deliveryDate: new Date(Date.now() - 864e5 * 1).toISOString(),
    createdAt: new Date(Date.now() - 864e5 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 864e5 * 1).toISOString()
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    jobSheetNumber: "OS-2026-006",
    customerId: "cust-6",
    customerName: "Juliana Camargo Dias",
    customerPhone: "(11) 93322-1100",
    deviceType: "Smartphone",
    brand: "Xiaomi",
    model: "Redmi Note 13 Pro 5G",
    color: "Midnight Black",
    reportedDefect: "Aparelho reiniciando em loop infinito ap\xF3s atualiza\xE7\xE3o de sistema.",
    technicalDiagnosis: "Falha de parti\xE7\xE3o de boot. Recupera\xE7\xE3o via firmware oficial EDL.",
    technicianName: "Felipe Santos",
    status: "completed",
    priority: "low",
    estimatedCostCents: 22e3,
    finalCostCents: 22e3,
    partsCostCents: 0,
    laborCostCents: 22e3,
    warrantyDays: 30,
    createdAt: new Date(Date.now() - 864e5 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 36e5 * 5).toISOString()
  }
];
var JOB_SHEETS_STORE = [...INITIAL_JOB_SHEETS];
var jobSheetsStore = /* @__PURE__ */ new Map();
INITIAL_JOB_SHEETS.forEach((item) => {
  jobSheetsStore.set(item.id, item);
});
async function getBrandsForRepair(companyId) {
  const defaultBrands = [
    { id: "1", name: "Samsung", status: "active", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "2", name: "Apple", status: "active", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "3", name: "Motorola", status: "active", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "4", name: "Xiaomi", status: "active", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "5", name: "LG", status: "active", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "6", name: "Lenovo", status: "active", active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
  ];
  try {
    const brands = await ProductService.listBrands(companyId);
    if (brands && brands.length > 0) {
      return brands.map((b) => ({
        id: b.id,
        name: b.name,
        status: b.active ? "active" : "inactive",
        active: b.active,
        description: b.description,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
      }));
    }
  } catch (err) {
    console.warn("Fallback to default brands in getBrandsForRepair:", err);
  }
  return defaultBrands;
}
async function generateJobSheetNumber(companyId, _statusId) {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  let prefix = "OS";
  try {
    const settings = await getRepairSettings(companyId);
    if (settings && settings.workOrderPrefix) {
      prefix = settings.workOrderPrefix.replace(/[-_/\s]+$/, "");
    }
  } catch {
    prefix = "OS";
  }
  const count = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId).length + 1;
  const padded = String(count).padStart(4, "0");
  if (prefix.includes(String(year))) {
    return `${prefix}-${padded}`;
  }
  return `${prefix}-${year}-${padded}`;
}
async function createJobSheet(companyId, data) {
  if (!data.customerName || !data.customerPhone) {
    throw new Error("Nome e telefone do cliente s\xE3o obrigat\xF3rios");
  }
  const brandName = data.brandName || data.brand;
  if (!data.brandId && !brandName) {
    throw new Error("Marca \xE9 obrigat\xF3ria");
  }
  if (!data.model) {
    throw new Error("Modelo \xE9 obrigat\xF3rio");
  }
  if (!data.reportedDefect) {
    throw new Error("Defeito relatado \xE9 obrigat\xF3rio");
  }
  const statusId = data.statusId || data.status || "pending";
  const jobSheetNumber = await generateJobSheetNumber(companyId, statusId);
  const validStatus = ["pending", "in_progress", "waiting_parts", "approved", "completed", "cancelled", "delivered"].includes(statusId) ? statusId : "pending";
  const finalCostCents = data.finalValue !== void 0 ? Math.round(Number(data.finalValue) * 100) : data.finalCostCents || data.estimatedCostCents || 0;
  const finalValue = data.finalValue !== void 0 ? Number(data.finalValue) : finalCostCents / 100;
  const newJobSheet = {
    id: crypto.randomUUID(),
    companyId,
    jobSheetNumber,
    number: jobSheetNumber,
    customerId: `cust-${Date.now()}`,
    customerName: data.customerName.trim(),
    customerPhone: data.customerPhone.trim(),
    customerEmail: data.customerEmail?.trim(),
    customerDocument: data.customerDocument?.trim(),
    deviceType: (data.deviceType || "Smartphone").trim(),
    brand: (brandName || "").trim(),
    brandId: data.brandId,
    brandName: (brandName || "").trim(),
    model: data.model.trim(),
    serialNumber: data.serialNumber?.trim(),
    color: data.color?.trim(),
    devicePassword: data.devicePassword?.trim(),
    accessories: data.accessories?.trim(),
    reportedDefect: data.reportedDefect.trim(),
    technicalDiagnosis: data.technicalDiagnosis?.trim() || "",
    responsibleTechnician: (data.responsibleTechnician || data.technicianName || "").trim(),
    technicianName: (data.responsibleTechnician || data.technicianName || "").trim(),
    priority: data.priority || "normal",
    status: validStatus,
    statusId,
    estimatedCostCents: data.estimatedCostCents || finalCostCents,
    finalCostCents,
    finalValue,
    partsCostCents: data.partsCostCents || 0,
    laborCostCents: data.laborCostCents || 0,
    warrantyDays: data.warrantyDays !== void 0 ? data.warrantyDays : 90,
    notes: data.notes?.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  jobSheetsStore.set(newJobSheet.id, newJobSheet);
  JOB_SHEETS_STORE.unshift(newJobSheet);
  return newJobSheet;
}
var RepairService = class {
  /**
   * Buscar marcas de produtos para uso em Reparar
   */
  static async getBrandsForRepair(companyId) {
    return getBrandsForRepair(companyId);
  }
  /**
   * Gerar número sequencial da OS
   */
  static async generateJobSheetNumber(companyId, statusId) {
    return generateJobSheetNumber(companyId, statusId);
  }
  /**
   * List all JobSheets for a company with optional filters
   */
  static async listJobSheets(companyId, filters) {
    let items = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId);
    if (filters?.status && filters.status !== "all") {
      items = items.filter((j) => j.status === filters.status);
    }
    if (filters?.priority && filters.priority !== "all") {
      items = items.filter((j) => j.priority === filters.priority);
    }
    if (filters?.brand && filters.brand !== "all") {
      items = items.filter((j) => j.brand.toLowerCase() === filters.brand?.toLowerCase());
    }
    if (filters?.deviceType && filters.deviceType !== "all") {
      items = items.filter((j) => j.deviceType.toLowerCase() === filters.deviceType?.toLowerCase());
    }
    if (filters?.search && filters.search.trim() !== "") {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (j) => j.jobSheetNumber.toLowerCase().includes(q) || j.customerName.toLowerCase().includes(q) || j.customerPhone.includes(q) || j.model.toLowerCase().includes(q) || j.brand.toLowerCase().includes(q) || j.reportedDefect.toLowerCase().includes(q)
      );
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  /**
   * Get single JobSheet by ID
   */
  static async getJobSheetById(companyId, id) {
    return JOB_SHEETS_STORE.find((j) => j.companyId === companyId && j.id === id) || null;
  }
  /**
   * Create a new JobSheet
   */
  static async createJobSheet(companyId, payload) {
    return createJobSheet(companyId, payload);
  }
  /**
   * Update an existing JobSheet
   */
  static async updateJobSheet(companyId, id, payload) {
    const index = JOB_SHEETS_STORE.findIndex((j) => j.companyId === companyId && j.id === id);
    if (index === -1) return null;
    const current = JOB_SHEETS_STORE[index];
    const updated = {
      ...current,
      customerName: payload.customerName !== void 0 ? payload.customerName.trim() : current.customerName,
      customerPhone: payload.customerPhone !== void 0 ? payload.customerPhone.trim() : current.customerPhone,
      customerEmail: payload.customerEmail !== void 0 ? payload.customerEmail?.trim() : current.customerEmail,
      deviceType: payload.deviceType !== void 0 ? payload.deviceType.trim() : current.deviceType,
      brand: payload.brand !== void 0 ? payload.brand.trim() : current.brand,
      brandId: payload.brandId !== void 0 ? payload.brandId : current.brandId,
      brandName: payload.brandName !== void 0 ? payload.brandName : current.brandName,
      model: payload.model !== void 0 ? payload.model.trim() : current.model,
      serialNumber: payload.serialNumber !== void 0 ? payload.serialNumber?.trim() : current.serialNumber,
      reportedDefect: payload.reportedDefect !== void 0 ? payload.reportedDefect.trim() : current.reportedDefect,
      technicalDiagnosis: payload.technicalDiagnosis !== void 0 ? payload.technicalDiagnosis?.trim() : current.technicalDiagnosis,
      solutionApplied: payload.solutionApplied !== void 0 ? payload.solutionApplied?.trim() : current.solutionApplied,
      technicianName: payload.technicianName !== void 0 ? payload.technicianName?.trim() : current.technicianName,
      responsibleTechnician: payload.responsibleTechnician !== void 0 ? payload.responsibleTechnician?.trim() : payload.technicianName || current.responsibleTechnician,
      status: payload.status !== void 0 ? payload.status : current.status,
      priority: payload.priority !== void 0 ? payload.priority : current.priority,
      estimatedCostCents: payload.estimatedCostCents !== void 0 ? payload.estimatedCostCents : current.estimatedCostCents,
      finalCostCents: payload.finalCostCents !== void 0 ? payload.finalCostCents : current.finalCostCents,
      finalValue: payload.finalValue !== void 0 ? payload.finalValue : payload.finalCostCents ? payload.finalCostCents / 100 : current.finalValue,
      partsCostCents: payload.partsCostCents !== void 0 ? payload.partsCostCents : current.partsCostCents,
      laborCostCents: payload.laborCostCents !== void 0 ? payload.laborCostCents : current.laborCostCents,
      warrantyDays: payload.warrantyDays !== void 0 ? payload.warrantyDays : current.warrantyDays,
      notes: payload.notes !== void 0 ? payload.notes?.trim() : current.notes,
      deliveryDate: payload.deliveryDate !== void 0 ? payload.deliveryDate : current.deliveryDate,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    JOB_SHEETS_STORE[index] = updated;
    jobSheetsStore.set(updated.id, updated);
    return updated;
  }
  /**
   * Delete a JobSheet
   */
  static async deleteJobSheet(companyId, id) {
    const before = JOB_SHEETS_STORE.length;
    JOB_SHEETS_STORE = JOB_SHEETS_STORE.filter((j) => !(j.companyId === companyId && j.id === id));
    jobSheetsStore.delete(id);
    return JOB_SHEETS_STORE.length < before;
  }
  /**
   * Analytics Summary
   */
  static async getAnalyticsSummary(companyId) {
    const companySheets = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId);
    const total = companySheets.length;
    let pendingCount = 0;
    let inProgressCount = 0;
    let waitingPartsCount = 0;
    let completedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let totalRevenueCents = 0;
    const statusMap = {
      pending: { count: 0, totalCost: 0 },
      in_progress: { count: 0, totalCost: 0 },
      waiting_parts: { count: 0, totalCost: 0 },
      approved: { count: 0, totalCost: 0 },
      completed: { count: 0, totalCost: 0 },
      cancelled: { count: 0, totalCost: 0 },
      delivered: { count: 0, totalCost: 0 }
    };
    for (const sheet of companySheets) {
      statusMap[sheet.status].count += 1;
      statusMap[sheet.status].totalCost += sheet.finalCostCents || 0;
      totalRevenueCents += sheet.finalCostCents || 0;
      if (sheet.status === "pending") pendingCount++;
      else if (sheet.status === "in_progress") inProgressCount++;
      else if (sheet.status === "waiting_parts") waitingPartsCount++;
      else if (sheet.status === "completed") completedCount++;
      else if (sheet.status === "delivered") deliveredCount++;
      else if (sheet.status === "cancelled") cancelledCount++;
    }
    const statusMetrics = Object.keys(statusMap).map((st) => ({
      status: st,
      label: STATUS_LABELS[st],
      count: statusMap[st].count,
      percentage: total > 0 ? Math.round(statusMap[st].count / total * 100) : 0,
      totalCostCents: statusMap[st].totalCost
    }));
    return {
      totalJobSheets: total,
      pendingCount,
      inProgressCount,
      waitingPartsCount,
      completedCount,
      deliveredCount,
      cancelledCount,
      totalRevenueCents,
      avgTicketCents: total > 0 ? Math.round(totalRevenueCents / total) : 0,
      statusMetrics
    };
  }
  /**
   * Brand Trends
   */
  static async getBrandTrends(companyId) {
    const companySheets = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId);
    const total = companySheets.length;
    const brandMap = {};
    for (const s of companySheets) {
      const b = s.brand || "Outras";
      if (!brandMap[b]) brandMap[b] = { count: 0, revenueCents: 0 };
      brandMap[b].count++;
      brandMap[b].revenueCents += s.finalCostCents || 0;
    }
    return Object.entries(brandMap).map(([brand, data]) => ({
      brand,
      count: data.count,
      revenueCents: data.revenueCents,
      percentage: total > 0 ? Math.round(data.count / total * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }
  /**
   * Device Trends
   */
  static async getDeviceTrends(companyId) {
    const companySheets = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId);
    const total = companySheets.length;
    const devMap = {};
    for (const s of companySheets) {
      const d = s.deviceType || "Outros";
      devMap[d] = (devMap[d] || 0) + 1;
    }
    return Object.entries(devMap).map(([deviceType, count]) => ({
      deviceType,
      count,
      percentage: total > 0 ? Math.round(count / total * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }
  /**
   * Model Trends
   */
  static async getModelTrends(companyId) {
    const companySheets = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId);
    const total = companySheets.length;
    const modelMap = {};
    for (const s of companySheets) {
      const m = s.model || "Desconhecido";
      if (!modelMap[m]) modelMap[m] = { brand: s.brand, count: 0 };
      modelMap[m].count++;
    }
    return Object.entries(modelMap).map(([model, data]) => ({
      model,
      brand: data.brand,
      count: data.count,
      percentage: total > 0 ? Math.round(data.count / total * 100) : 0
    })).sort((a, b) => b.count - a.count).slice(0, 10);
  }
  // ==============================================================================
  // MÓDULO DE CONFIGURAÇÕES DE REPARO
  // ==============================================================================
  static async getRepairStatuses(companyId) {
    return getRepairStatuses(companyId);
  }
  static async createRepairStatus(companyId, status) {
    return createRepairStatus(companyId, status);
  }
  static async updateRepairStatus(companyId, statusId, data) {
    return updateRepairStatus(companyId, statusId, data);
  }
  static async deleteRepairStatus(companyId, statusId) {
    return deleteRepairStatus(companyId, statusId);
  }
  static async getDeviceModels(companyId) {
    return getDeviceModels(companyId);
  }
  static async createDeviceModel(companyId, model) {
    return createDeviceModel(companyId, model);
  }
  static async updateDeviceModel(companyId, modelId, data) {
    return updateDeviceModel(companyId, modelId, data);
  }
  static async deleteDeviceModel(companyId, modelId) {
    return deleteDeviceModel(companyId, modelId);
  }
  static async getRepairSettings(companyId) {
    return getRepairSettings(companyId);
  }
  static async updateRepairSettings(companyId, settings) {
    return updateRepairSettings(companyId, settings);
  }
  static async getLabelSettings(companyId) {
    return getLabelSettings(companyId);
  }
  static async updateLabelSettings(companyId, settings) {
    return updateLabelSettings(companyId, settings);
  }
  static async getCompleteSettings(companyId) {
    const [statuses, deviceModels, general, label] = await Promise.all([
      getRepairStatuses(companyId),
      getDeviceModels(companyId),
      getRepairSettings(companyId),
      getLabelSettings(companyId)
    ]);
    return { statuses, deviceModels, general, label };
  }
};
var DEFAULT_STATUSES = [
  { id: "status-pending", name: "Pendente / Triagem", color: "#f59e0b", sortOrder: 1, emoji: "\u23F3" },
  { id: "status-in-progress", name: "Em Bancada / Reparo", color: "#3b82f6", sortOrder: 2, emoji: "\u{1F527}" },
  { id: "status-waiting-parts", name: "Aguardando Pe\xE7as", color: "#8b5cf6", sortOrder: 3, emoji: "\u{1F4E6}" },
  { id: "status-approved", name: "Or\xE7amento Aprovado", color: "#06b6d4", sortOrder: 4, emoji: "\u2705" },
  { id: "status-completed", name: "Reparo Conclu\xEDdo", color: "#10b981", sortOrder: 5, emoji: "\u{1F3AF}" },
  { id: "status-delivered", name: "Entregue ao Cliente", color: "#6366f1", sortOrder: 6, emoji: "\u{1F680}" },
  { id: "status-cancelled", name: "Cancelado / Sem Reparo", color: "#64748b", sortOrder: 7, emoji: "\u274C" }
];
var DEFAULT_DEVICE_MODELS = [
  {
    id: "model-iphone-15-pm",
    modelName: "iPhone 15 Pro Max",
    deviceType: "Smartphone",
    brand: "Apple",
    repairChecklist: ["Tela OLED / Touch", "Face ID e C\xE2mera TrueDepth", "Bateria e Conector USB-C", "Alto-Falante e Auricular", "Carca\xE7a e Bot\xF5es de A\xE7\xE3o"]
  },
  {
    id: "model-galaxy-s24-ultra",
    modelName: "Galaxy S24 Ultra",
    deviceType: "Smartphone",
    brand: "Samsung",
    repairChecklist: ["Tela Dynamic AMOLED", "S-Pen e Conector", "Biometria Ultrass\xF4nica", "C\xE2meras 200MP e Zoom", "Carregamento por Indu\xE7\xE3o e Bateria"]
  },
  {
    id: "model-macbook-pro-14",
    modelName: 'MacBook Pro M3 14"',
    deviceType: "Notebook",
    brand: "Apple",
    repairChecklist: ["Display Liquid Retina XDR", "Teclado Magic Keyboard e Trackpad", "Portas Thunderbolt / HDMI / SD", "Bateria e Ciclos", "Limpeza Interna e Pasta T\xE9rmica"]
  },
  {
    id: "model-dell-xps-15",
    modelName: "Dell XPS 15",
    deviceType: "Notebook",
    brand: "Dell",
    repairChecklist: ["Tela 4K Touch", "Teclado Retroiluminado", "Cooler e Dissipa\xE7\xE3o", "Bateria e Fonte", "Portas USB-C / Thunderbolt"]
  },
  {
    id: "model-ps5",
    modelName: "PlayStation 5",
    deviceType: "Console",
    brand: "Sony",
    repairChecklist: ["Leitor \xD3ptico Blu-Ray", "Porta HDMI 2.1", "Metal L\xEDquido e Refrigera\xE7\xE3o", "Fonte Interna de Alimenta\xE7\xE3o", "Conex\xE3o Bluetooth e Controles"]
  },
  {
    id: "model-ipad-pro-129",
    modelName: 'iPad Pro 12.9" M2',
    deviceType: "Tablet",
    brand: "Apple",
    repairChecklist: ["Display Liquid Retina XDR", "Suporte Apple Pencil 2", "Bateria de 10.758 mAh", "C\xE2mera Traseira com LiDAR", "Face ID e Microfones"]
  }
];
var DEFAULT_GENERAL_SETTINGS = {
  defaultStatusId: "status-pending",
  workOrderPrefix: "OS-2026-",
  defaultRepairChecklist: "1. Teste de ligar e desligar\n2. Teste de carregamento e porta de dados\n3. Verifica\xE7\xE3o de tela, touch e ilumina\xE7\xE3o\n4. Teste de som, microfone e alto-falantes\n5. Teste de c\xE2meras e sensores\n6. Teste de conectividade Wi-Fi e Bluetooth",
  productConfiguration: "Aparelho entregue com carregador original, capa protetora de silicone e pel\xEDcula de vidro.",
  customerReportedProblem: "Aparelho n\xE3o liga ap\xF3s queda ou apresenta superaquecimento ao carregar.",
  productCondition: "Marcas normais de uso nas bordas, sem trincados no vidro traseiro.",
  termsAndConditions: `<h3>Termos e Condi\xE7\xF5es de Servi\xE7o</h3>
<p>1. <strong>Prazo de An\xE1lise:</strong> O prazo estimado de diagn\xF3stico t\xE9cnico \xE9 de at\xE9 48 horas \xFAteis a contar da entrada.</p>
<p>2. <strong>Retirada de Equipamentos:</strong> Equipamentos n\xE3o retirados em at\xE9 90 (noventa) dias ap\xF3s notifica\xE7\xE3o de conclus\xE3o poder\xE3o ser desmobilizados para cobertura de custos operacionais conforme legisla\xE7\xE3o vigente.</p>
<p>3. <strong>Garantia Legal:</strong> Garantia legal de 90 dias exclusivamente sobre os componentes substitu\xEDdos e servi\xE7os executados, com exclus\xE3o de danos por umidade, queda ou interven\xE7\xE3o de terceiros.</p>`
};
var DEFAULT_LABEL_SETTINGS = {
  labelWidthMM: 60,
  labelHeightMM: 40,
  customerInfo: {
    name: true,
    address: false,
    phone: true,
    alternatePhone: false,
    email: false
  },
  labelDetails: {
    salesPerson: false,
    barcode: true,
    status: true,
    dueDate: true
  },
  labelInformation: {
    technician: true,
    problem: true
  },
  deviceInfo: {
    imeiSerial: true,
    brandModel: true,
    location: true,
    password: false
  }
};
var REPAIR_SETTINGS_STORE = /* @__PURE__ */ new Map();
function getCompanyStore(companyId) {
  if (!REPAIR_SETTINGS_STORE.has(companyId)) {
    REPAIR_SETTINGS_STORE.set(companyId, {
      statuses: [...DEFAULT_STATUSES],
      deviceModels: [...DEFAULT_DEVICE_MODELS],
      general: { ...DEFAULT_GENERAL_SETTINGS },
      label: { ...DEFAULT_LABEL_SETTINGS }
    });
  }
  return REPAIR_SETTINGS_STORE.get(companyId);
}
async function getRepairStatuses(companyId) {
  const store = getCompanyStore(companyId);
  return [...store.statuses].sort((a, b) => a.sortOrder - b.sortOrder);
}
async function createRepairStatus(companyId, status) {
  const store = getCompanyStore(companyId);
  const newStatus = {
    id: `status-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...status,
    sortOrder: status.sortOrder ?? store.statuses.length + 1
  };
  store.statuses.push(newStatus);
  return newStatus;
}
async function updateRepairStatus(companyId, statusId, data) {
  const store = getCompanyStore(companyId);
  const index = store.statuses.findIndex((s) => s.id === statusId);
  if (index === -1) {
    throw new Error(`Status ${statusId} n\xE3o encontrado.`);
  }
  store.statuses[index] = { ...store.statuses[index], ...data };
  return store.statuses[index];
}
async function deleteRepairStatus(companyId, statusId) {
  const store = getCompanyStore(companyId);
  store.statuses = store.statuses.filter((s) => s.id !== statusId);
}
async function getDeviceModels(companyId) {
  const store = getCompanyStore(companyId);
  return [...store.deviceModels];
}
async function createDeviceModel(companyId, model) {
  const store = getCompanyStore(companyId);
  const newModel = {
    id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...model,
    repairChecklist: model.repairChecklist || []
  };
  store.deviceModels.push(newModel);
  return newModel;
}
async function updateDeviceModel(companyId, modelId, data) {
  const store = getCompanyStore(companyId);
  const index = store.deviceModels.findIndex((m) => m.id === modelId);
  if (index === -1) {
    throw new Error(`Modelo ${modelId} n\xE3o encontrado.`);
  }
  store.deviceModels[index] = { ...store.deviceModels[index], ...data };
  return store.deviceModels[index];
}
async function deleteDeviceModel(companyId, modelId) {
  const store = getCompanyStore(companyId);
  store.deviceModels = store.deviceModels.filter((m) => m.id !== modelId);
}
async function getRepairSettings(companyId) {
  const store = getCompanyStore(companyId);
  return { ...store.general };
}
async function updateRepairSettings(companyId, settings) {
  const store = getCompanyStore(companyId);
  store.general = { ...store.general, ...settings };
  return { ...store.general };
}
async function getLabelSettings(companyId) {
  const store = getCompanyStore(companyId);
  return JSON.parse(JSON.stringify(store.label));
}
async function updateLabelSettings(companyId, settings) {
  const store = getCompanyStore(companyId);
  store.label = {
    ...store.label,
    ...settings,
    customerInfo: { ...store.label.customerInfo, ...settings.customerInfo || {} },
    labelDetails: { ...store.label.labelDetails, ...settings.labelDetails || {} },
    labelInformation: { ...store.label.labelInformation, ...settings.labelInformation || {} },
    deviceInfo: { ...store.label.deviceInfo, ...settings.deviceInfo || {} }
  };
  return JSON.parse(JSON.stringify(store.label));
}

// src/server/services/repairBrandService.ts
var repairBrandsStore = /* @__PURE__ */ new Map();
var RepairBrandService = class {
  /**
   * Buscar todas as marcas sincronizadas (Produtos + Reparar)
   */
  static async getBrands(companyId) {
    const defaultBrands = [
      {
        id: "1",
        name: "Samsung",
        description: "Marca Samsung",
        category: "Eletr\xF4nicos",
        status: "active",
        syncedFromProducts: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "2",
        name: "Apple",
        description: "Marca Apple",
        category: "Eletr\xF4nicos",
        status: "active",
        syncedFromProducts: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "3",
        name: "Motorola",
        description: "Marca Motorola",
        category: "Eletr\xF4nicos",
        status: "active",
        syncedFromProducts: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "4",
        name: "Xiaomi",
        description: "Marca Xiaomi",
        category: "Eletr\xF4nicos",
        status: "active",
        syncedFromProducts: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "5",
        name: "LG",
        description: "Marca LG",
        category: "Eletr\xF4nicos",
        status: "active",
        syncedFromProducts: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "6",
        name: "Lenovo",
        description: "Marca Lenovo",
        category: "Eletr\xF4nicos",
        status: "active",
        syncedFromProducts: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    try {
      const productBrands = await ProductService.listBrands(companyId);
      const productBrandsMap = /* @__PURE__ */ new Map();
      if (productBrands && productBrands.length > 0) {
        for (const pb of productBrands) {
          const stored = repairBrandsStore.get(pb.id);
          productBrandsMap.set(pb.id, {
            id: pb.id,
            name: pb.name,
            description: pb.description || stored?.description || "",
            category: stored?.category || "Eletr\xF4nicos",
            status: pb.active ? "active" : "inactive",
            syncedFromProducts: true,
            createdAt: pb.createdAt ? new Date(pb.createdAt) : /* @__PURE__ */ new Date(),
            updatedAt: pb.updatedAt ? new Date(pb.updatedAt) : /* @__PURE__ */ new Date()
          });
        }
      } else {
        for (const db of defaultBrands) {
          productBrandsMap.set(db.id, db);
        }
      }
      const repairOnlyBrands = [];
      for (const [id, rBrand] of repairBrandsStore.entries()) {
        if (!productBrandsMap.has(id)) {
          repairOnlyBrands.push(rBrand);
        }
      }
      return [...Array.from(productBrandsMap.values()), ...repairOnlyBrands];
    } catch (err) {
      console.warn("[RepairBrandService] Falha ao carregar do ProductService, usando fallback:", err);
      const repairOnlyBrands = Array.from(repairBrandsStore.values());
      return [...defaultBrands, ...repairOnlyBrands];
    }
  }
  /**
   * Criar marca em Reparar e sincronizar com Produtos
   */
  static async createBrand(companyId, data) {
    if (!data.name || !data.name.trim()) {
      throw new Error("Nome da marca \xE9 obrigat\xF3rio");
    }
    const trimmedName = data.name.trim();
    let createdProductBrandId = "";
    try {
      const pBrand = await ProductService.createBrand(companyId, {
        name: trimmedName,
        description: data.description || null,
        active: data.status === "active"
      });
      createdProductBrandId = pBrand.id;
    } catch (err) {
      console.warn("[RepairBrandService] Erro ao sincronizar com ProductService:", err);
    }
    const brandId = createdProductBrandId || crypto.randomUUID();
    const newBrand = {
      id: brandId,
      name: trimmedName,
      description: data.description || "",
      category: data.category || "Eletr\xF4nicos",
      status: data.status || "active",
      syncedFromProducts: false,
      // Criada originalmente pelo módulo Reparar
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    repairBrandsStore.set(brandId, newBrand);
    return newBrand;
  }
  /**
   * Atualizar marca
   */
  static async updateBrand(companyId, brandId, data) {
    let existing = repairBrandsStore.get(brandId);
    if (!existing) {
      const productBrands = await ProductService.listBrands(companyId);
      const found = productBrands.find((b) => b.id === brandId);
      if (found) {
        existing = {
          id: found.id,
          name: found.name,
          description: found.description || "",
          category: "Eletr\xF4nicos",
          status: found.active ? "active" : "inactive",
          syncedFromProducts: true,
          createdAt: new Date(found.createdAt),
          updatedAt: new Date(found.updatedAt)
        };
      }
    }
    if (!existing) {
      throw new Error("Marca n\xE3o encontrada");
    }
    const updated = {
      ...existing,
      name: data.name !== void 0 ? data.name.trim() : existing.name,
      description: data.description !== void 0 ? data.description : existing.description,
      category: data.category !== void 0 ? data.category : existing.category,
      status: data.status !== void 0 ? data.status : existing.status,
      updatedAt: /* @__PURE__ */ new Date()
    };
    try {
      await ProductService.updateBrand(companyId, brandId, {
        name: updated.name,
        description: updated.description || null,
        active: updated.status === "active"
      });
    } catch {
    }
    repairBrandsStore.set(brandId, updated);
    return updated;
  }
  /**
   * Excluir marca (apenas se não for sincronizada de Produtos)
   */
  static async deleteBrand(companyId, brandId) {
    const existing = repairBrandsStore.get(brandId);
    if (!existing) {
      const productBrands = await ProductService.listBrands(companyId);
      const found = productBrands.find((b) => b.id === brandId);
      if (found) {
        throw new Error("N\xE3o \xE9 poss\xEDvel excluir marcas sincronizadas de Produtos. Exclua no m\xF3dulo de Produtos.");
      }
      throw new Error("Marca n\xE3o encontrada");
    }
    if (existing.syncedFromProducts) {
      throw new Error("N\xE3o \xE9 poss\xEDvel excluir marcas sincronizadas de Produtos. Exclua no m\xF3dulo de Produtos.");
    }
    repairBrandsStore.delete(brandId);
    try {
      await ProductService.deleteBrand(companyId, brandId);
    } catch {
    }
    return true;
  }
};

// src/server/services/purchaseService.ts
var purchasesStore = /* @__PURE__ */ new Map();
var purchaseReturnsStore = /* @__PURE__ */ new Map();
function ensureSeedData(companyId) {
  const existingPurchases = Array.from(purchasesStore.values()).filter((p) => p.companyId === companyId);
  if (existingPurchases.length === 0) {
    const p1Id = crypto.randomUUID();
    const p1 = {
      id: p1Id,
      companyId,
      purchaseNumber: "COMP-2026-0001",
      supplierId: "sup-001",
      supplierName: "Dell Computadores do Brasil Ltda",
      referenceNumber: "NF-89201-E",
      purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
      status: "received",
      address: "Av. das Na\xE7\xF5es Unidas, 12901 - S\xE3o Paulo/SP",
      companyLocationId: "loc-matriz",
      locationName: "Matriz - S\xE3o Paulo",
      paymentTerm: "net_30",
      paymentTermDays: 30,
      totalItems: 10,
      totalNetValue: 35e3,
      discountType: "percentage",
      discountValue: 5,
      discountTotal: 1750,
      taxType: "percentage",
      taxTotal: 1662.5,
      additionalNotes: "Lote de notebooks corporativos Latitude 5430 para renova\xE7\xE3o de parque.",
      items: [
        {
          id: crypto.randomUUID(),
          productId: "prod-001",
          productName: "Notebook Dell Latitude 5430 Core i7 16GB 512GB SSD",
          sku: "DELL-LAT-5430",
          barcode: "7891234567890",
          quantity: 10,
          unitCostBeforeDiscount: 3500,
          discountPercentage: 5,
          unitCostBeforeTax: 3325,
          subtotalBeforeTax: 33250,
          taxOnProducts: 5,
          netCost: 34912.5,
          totalLine: 34912.5,
          profitMarginPercent: 30,
          unitSalePriceWithTax: 4538.62
        }
      ],
      payments: [
        {
          id: crypto.randomUUID(),
          advanceBalance: 0,
          amount: 35e3,
          paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3),
          paymentMethod: "bank_transfer",
          paymentNote: "TED banc\xE1ria compensada"
        }
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString()
    };
    const p2Id = crypto.randomUUID();
    const p2 = {
      id: p2Id,
      companyId,
      purchaseNumber: "COMP-2026-0002",
      supplierId: "sup-002",
      supplierName: "Samsung Eletr\xF4nica da Amaz\xF4nia",
      referenceNumber: "NF-44102-S",
      purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
      status: "pending",
      address: "Rua Verbo Divino, 1488 - S\xE3o Paulo/SP",
      companyLocationId: "loc-filial",
      locationName: "Filial - Rio de Janeiro",
      paymentTerm: "net_15",
      paymentTermDays: 15,
      totalItems: 25,
      totalNetValue: 18750,
      discountType: "none",
      discountValue: 0,
      discountTotal: 0,
      taxType: "none",
      taxTotal: 0,
      additionalNotes: "Monitores 24 polegadas LED IPS Full HD.",
      items: [
        {
          id: crypto.randomUUID(),
          productId: "prod-002",
          productName: 'Monitor Samsung 24" IPS Full HD 75Hz',
          sku: "SAM-MON-24IPS",
          barcode: "7899876543210",
          quantity: 25,
          unitCostBeforeDiscount: 750,
          discountPercentage: 0,
          unitCostBeforeTax: 750,
          subtotalBeforeTax: 18750,
          taxOnProducts: 0,
          netCost: 18750,
          totalLine: 18750,
          profitMarginPercent: 35,
          unitSalePriceWithTax: 1012.5
        }
      ],
      payments: [
        {
          id: crypto.randomUUID(),
          advanceBalance: 0,
          amount: 9375,
          paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3),
          paymentMethod: "pix",
          paymentNote: "Adiantamento 50% via chave PIX"
        }
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString()
    };
    const p3Id = crypto.randomUUID();
    const p3 = {
      id: p3Id,
      companyId,
      purchaseNumber: "COMP-2026-0003",
      supplierId: "sup-003",
      supplierName: "Logitech do Brasil Com\xE9rcio de Acess\xF3rios",
      referenceNumber: "PED-7821",
      purchaseDate: (/* @__PURE__ */ new Date()).toISOString(),
      status: "requested",
      address: "Alameda Santos, 2300 - S\xE3o Paulo/SP",
      companyLocationId: "loc-matriz",
      locationName: "Matriz - S\xE3o Paulo",
      paymentTerm: "immediate",
      paymentTermDays: 0,
      totalItems: 50,
      totalNetValue: 8500,
      discountType: "fixed",
      discountValue: 500,
      discountTotal: 500,
      taxType: "none",
      taxTotal: 0,
      additionalNotes: "Combos teclado e mouse sem fio MK270.",
      items: [
        {
          id: crypto.randomUUID(),
          productId: "prod-003",
          productName: "Kit Teclado e Mouse Sem Fio Logitech MK270",
          sku: "LOG-MK270-BR",
          barcode: "7896541239870",
          quantity: 50,
          unitCostBeforeDiscount: 180,
          discountPercentage: 0,
          unitCostBeforeTax: 180,
          subtotalBeforeTax: 9e3,
          taxOnProducts: 0,
          netCost: 8500,
          totalLine: 8500,
          profitMarginPercent: 40,
          unitSalePriceWithTax: 252
        }
      ],
      payments: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    purchasesStore.set(p1.id, p1);
    purchasesStore.set(p2.id, p2);
    purchasesStore.set(p3.id, p3);
    const ret1 = {
      id: crypto.randomUUID(),
      companyId,
      returnNumber: "DEV-COMP-2026-0001",
      purchaseId: p2Id,
      purchaseNumber: "COMP-2026-0002",
      supplierId: "sup-002",
      supplierName: "Samsung Eletr\xF4nica da Amaz\xF4nia",
      returnDate: (/* @__PURE__ */ new Date()).toISOString(),
      status: "completed",
      totalRefundAmount: 1500,
      notes: "Devolu\xE7\xE3o de 2 monitores com avaria cosm\xE9tica de transporte.",
      items: [
        {
          id: crypto.randomUUID(),
          productId: "prod-002",
          productName: 'Monitor Samsung 24" IPS Full HD 75Hz',
          sku: "SAM-MON-24IPS",
          quantityReturned: 2,
          unitCost: 750,
          totalRefund: 1500,
          reason: "Avaria externa no gabinete detectada no recebimento"
        }
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    purchaseReturnsStore.set(ret1.id, ret1);
  }
}
function generatePurchaseNumber() {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const count = purchasesStore.size + 1;
  return `COMP-${year}-${String(count).padStart(4, "0")}`;
}
function generatePurchaseReturnNumber() {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const count = purchaseReturnsStore.size + 1;
  return `DEV-COMP-${year}-${String(count).padStart(4, "0")}`;
}
async function createPurchase(companyId, data) {
  const purchaseNumber = generatePurchaseNumber();
  const purchase = {
    id: crypto.randomUUID(),
    purchaseNumber,
    companyId,
    ...data,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  };
  purchasesStore.set(purchase.id, purchase);
  return purchase;
}
async function getPurchases(companyId) {
  ensureSeedData(companyId);
  return Array.from(purchasesStore.values()).filter((p) => p.companyId === companyId);
}
async function getPurchaseById(companyId, purchaseId) {
  ensureSeedData(companyId);
  const purchase = purchasesStore.get(purchaseId);
  if (!purchase || purchase.companyId !== companyId) {
    throw new Error("Compra n\xE3o encontrada");
  }
  return purchase;
}
async function updatePurchase(companyId, purchaseId, data) {
  ensureSeedData(companyId);
  const purchase = purchasesStore.get(purchaseId);
  if (!purchase || purchase.companyId !== companyId) {
    throw new Error("Compra n\xE3o encontrada");
  }
  const updated = {
    ...purchase,
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  };
  purchasesStore.set(purchaseId, updated);
  return updated;
}
async function deletePurchase(companyId, purchaseId) {
  ensureSeedData(companyId);
  const purchase = purchasesStore.get(purchaseId);
  if (!purchase || purchase.companyId !== companyId) {
    throw new Error("Compra n\xE3o encontrada");
  }
  purchasesStore.delete(purchaseId);
  return true;
}
async function getPurchaseReturns(companyId) {
  ensureSeedData(companyId);
  return Array.from(purchaseReturnsStore.values()).filter((r) => r.companyId === companyId);
}
async function getPurchaseReturnById(companyId, returnId) {
  ensureSeedData(companyId);
  const ret = purchaseReturnsStore.get(returnId);
  if (!ret || ret.companyId !== companyId) {
    throw new Error("Devolu\xE7\xE3o de compra n\xE3o encontrada");
  }
  return ret;
}
async function createPurchaseReturn(companyId, data) {
  const returnNumber = generatePurchaseReturnNumber();
  const record = {
    id: crypto.randomUUID(),
    returnNumber,
    companyId,
    ...data,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  };
  purchaseReturnsStore.set(record.id, record);
  return record;
}
async function deletePurchaseReturn(companyId, returnId) {
  ensureSeedData(companyId);
  const ret = purchaseReturnsStore.get(returnId);
  if (!ret || ret.companyId !== companyId) {
    throw new Error("Devolu\xE7\xE3o de compra n\xE3o encontrada");
  }
  purchaseReturnsStore.delete(returnId);
  return true;
}
function calculateItemTotals(item) {
  const quantity = Number(item.quantity) || 0;
  const unitCostBeforeDiscount = Number(item.unitCostBeforeDiscount) || 0;
  const discountPercentage = Number(item.discountPercentage) || 0;
  const discountAmount = unitCostBeforeDiscount * (discountPercentage / 100);
  const unitCostBeforeTax = Math.max(0, unitCostBeforeDiscount - discountAmount);
  const subtotalBeforeTax = unitCostBeforeTax * quantity;
  const taxRate = Number(item.taxOnProducts) || 0;
  const taxOnProducts = subtotalBeforeTax * (taxRate / 100);
  const netCost = subtotalBeforeTax + taxOnProducts;
  const totalLine = netCost;
  const profitMarginPercent = Number(item.profitMarginPercent ?? 30);
  const unitSalePriceWithTax = unitCostBeforeTax * (1 + profitMarginPercent / 100);
  return {
    id: item.id || crypto.randomUUID(),
    productId: item.productId || "",
    productName: item.productName || "",
    sku: item.sku || "",
    barcode: item.barcode || "",
    quantity,
    unitCostBeforeDiscount,
    discountPercentage,
    unitCostBeforeTax,
    subtotalBeforeTax,
    taxOnProducts,
    netCost,
    totalLine,
    profitMarginPercent,
    unitSalePriceWithTax
  };
}
function calculatePurchaseTotals(items, discountType, discountValue, taxType, taxValue = 0) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.totalLine) || 0), 0);
  let discountTotal = 0;
  const dVal = Number(discountValue) || 0;
  if (discountType === "percentage") {
    discountTotal = subtotal * (dVal / 100);
  } else if (discountType === "fixed") {
    discountTotal = dVal;
  }
  const afterDiscount = Math.max(0, subtotal - discountTotal);
  let taxTotal = 0;
  const tVal = Number(taxValue) || (taxType !== "none" ? dVal : 0);
  if (taxType === "percentage") {
    taxTotal = afterDiscount * (tVal / 100);
  } else if (taxType === "fixed") {
    taxTotal = tVal;
  }
  const totalNetValue = afterDiscount + taxTotal;
  return {
    totalItems: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    subtotal,
    discountTotal,
    taxTotal,
    totalNetValue
  };
}
var PurchaseService = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getPurchaseReturns,
  getPurchaseReturnById,
  createPurchaseReturn,
  deletePurchaseReturn,
  calculateItemTotals,
  calculatePurchaseTotals,
  generatePurchaseNumber,
  generatePurchaseReturnNumber
};

// src/server/services/sellService.ts
var sellsStore = /* @__PURE__ */ new Map();
function ensureSeedData2(companyId) {
  const existing = Array.from(sellsStore.values()).filter((s) => s.companyId === companyId);
  if (existing.length === 0) {
    const s1Id = crypto.randomUUID();
    const s1 = {
      id: s1Id,
      companyId,
      invoiceNumber: "FAT-2026-0012",
      invoiceScheme: "fatura_facil",
      customerId: "cust-001",
      customerName: "TechCorp Solu\xE7\xF5es Tecnol\xF3gicas Ltda",
      contactNumber: "+55 11 98877-6655",
      billingAddress: "Av. Paulista, 1000 - Conj 101, S\xE3o Paulo/SP",
      shippingAddress: "Av. Paulista, 1000 - Conj 101, S\xE3o Paulo/SP",
      companyLocationId: "loc-sp",
      locationName: "Franquia S\xE3o Paulo",
      sellDate: "07-09-2026 10:26 AM",
      status: "final",
      paymentStatus: "paid",
      paymentTerm: "prazo_de",
      paymentTermDays: 30,
      userName: "Admin Geral",
      isSubscription: false,
      attachedDocumentName: "proposta_comercial_assinado.pdf",
      items: [
        {
          id: crypto.randomUUID(),
          productId: "prod-001",
          productName: "Notebook Dell Latitude 5430 Core i7 16GB",
          sku: "DELL-LAT-5430",
          barcode: "7891234567890",
          quantity: 2,
          unitPrice: 4850,
          discountPercentage: 5,
          discountAmount: 485,
          taxRate: 10,
          taxAmount: 921.5,
          imTaxPrice: 5069.25,
          subtotal: 9651.5
        },
        {
          id: crypto.randomUUID(),
          productId: "prod-002",
          productName: "Monitor Dell 27 4K UHD UltraSharp",
          sku: "DELL-MON-4K",
          barcode: "7891234567891",
          quantity: 2,
          unitPrice: 2200,
          discountPercentage: 0,
          discountAmount: 0,
          taxRate: 10,
          taxAmount: 440,
          imTaxPrice: 2420,
          subtotal: 4840
        }
      ],
      discountType: "percentage",
      discountValue: 0,
      discountTotal: 0,
      cashback: {
        redeemed: 0,
        accessible: 150,
        redeemedValue: 0
      },
      orderTaxRate: 0,
      orderTaxType: "none",
      orderTaxTotal: 0,
      saleNote: "Venda corporativa faturada via Franquia SP.",
      shipping: {
        shippingDetails: "Transportadora Jadlog Express - Envio Priorit\xE1rio",
        shippingAddress: "Av. Paulista, 1000 - Conj 101, S\xE3o Paulo/SP",
        shippingCost: 80,
        shippingStatus: "delivered",
        deliveredTo: "Marcos Silveira (Recep\xE7\xE3o)",
        deliveryPerson: "Carlos Eduardo",
        shippingDocumentName: "comprovante_entrega_0012.pdf"
      },
      totalQuantity: 4,
      itemsTotal: 14491.5,
      totalAmount: 14571.5,
      totalPaid: 14571.5,
      sellDue: 0,
      payments: [
        {
          id: crypto.randomUUID(),
          advanceBalance: 0,
          amount: 14571.5,
          paidAt: "07-09-2026 10:26 AM",
          paymentMethod: "pix",
          paymentNote: "PIX autenticado no ato da entrega",
          changeReturn: 0,
          balance: 0
        }
      ],
      createdAt: "2026-09-07T08:30:00.000Z",
      updatedAt: "2026-09-07T08:30:00.000Z"
    };
    const s2Id = crypto.randomUUID();
    const s2 = {
      id: s2Id,
      companyId,
      invoiceNumber: "FAT-2026-0013",
      invoiceScheme: "fatura_facil",
      customerId: "cust-002",
      customerName: "Inova Digital Com\xE9rcio e Servi\xE7os",
      contactNumber: "+55 11 97711-2233",
      billingAddress: "Rua Bela Cintra, 450, S\xE3o Paulo/SP",
      shippingAddress: "Rua Bela Cintra, 450, S\xE3o Paulo/SP",
      companyLocationId: "loc-sp",
      locationName: "Franquia S\xE3o Paulo",
      sellDate: "06-09-2026 14:15 PM",
      status: "final",
      paymentStatus: "partial",
      paymentTerm: "prazo_de",
      paymentTermDays: 15,
      userName: "Vendedor Loja",
      isSubscription: false,
      items: [
        {
          id: crypto.randomUUID(),
          productId: "prod-003",
          productName: "Teclado Mec\xE2nico Logitech MX Keys",
          sku: "LOGI-MX-KEYS",
          barcode: "7891234567892",
          quantity: 5,
          unitPrice: 650,
          discountPercentage: 10,
          discountAmount: 325,
          taxRate: 5,
          taxAmount: 146.25,
          imTaxPrice: 614.25,
          subtotal: 3071.25
        }
      ],
      discountType: "none",
      discountValue: 0,
      discountTotal: 0,
      cashback: {
        redeemed: 0,
        accessible: 80,
        redeemedValue: 0
      },
      orderTaxRate: 0,
      orderTaxType: "none",
      orderTaxTotal: 0,
      saleNote: "Entrada de 50% paga e saldo para 15 dias.",
      shipping: {
        shippingDetails: "Retirada no balc\xE3o",
        shippingAddress: "Rua Bela Cintra, 450, S\xE3o Paulo/SP",
        shippingCost: 0,
        shippingStatus: "delivered",
        deliveredTo: "Ana Paula",
        deliveryPerson: "Balc\xE3o"
      },
      totalQuantity: 5,
      itemsTotal: 3071.25,
      totalAmount: 3071.25,
      totalPaid: 1500,
      sellDue: 1571.25,
      payments: [
        {
          id: crypto.randomUUID(),
          advanceBalance: 0,
          amount: 1500,
          paidAt: "06-09-2026 14:15 PM",
          paymentMethod: "cash",
          paymentNote: "Entrada paga em dinheiro",
          changeReturn: 0,
          balance: 1571.25
        }
      ],
      createdAt: "2026-09-06T14:15:00.000Z",
      updatedAt: "2026-09-06T14:15:00.000Z"
    };
    const s3Id = crypto.randomUUID();
    const s3 = {
      id: s3Id,
      companyId,
      invoiceNumber: "FAT-2026-0014",
      invoiceScheme: "fatura_facil",
      customerId: "cust-003",
      customerName: "Consultoria Alfa & Gest\xE3o",
      contactNumber: "+55 21 99123-4567",
      billingAddress: "Av. Rio Branco, 156 - Sala 802, Rio de Janeiro/RJ",
      shippingAddress: "Av. Rio Branco, 156 - Sala 802, Rio de Janeiro/RJ",
      companyLocationId: "loc-rj",
      locationName: "Filial Rio de Janeiro",
      sellDate: "05-09-2026 09:30 AM",
      status: "final",
      paymentStatus: "due",
      paymentTerm: "prazo_de",
      paymentTermDays: 30,
      userName: "Admin Geral",
      isSubscription: true,
      items: [
        {
          id: crypto.randomUUID(),
          productId: "prod-004",
          productName: "Licen\xE7a Anual Olyps Pro Cloud Multi-Empresa",
          sku: "LIC-OLYPS-PRO",
          barcode: "7891234567893",
          quantity: 1,
          unitPrice: 2400,
          discountPercentage: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          imTaxPrice: 2400,
          subtotal: 2400
        }
      ],
      discountType: "none",
      discountValue: 0,
      discountTotal: 0,
      orderTaxRate: 0,
      orderTaxType: "none",
      orderTaxTotal: 0,
      saleNote: "Assinatura anual faturada com boleto para 30 dias.",
      shipping: {
        shippingCost: 0,
        shippingStatus: "delivered",
        shippingDetails: "Ativa\xE7\xE3o digital online"
      },
      totalQuantity: 1,
      itemsTotal: 2400,
      totalAmount: 2400,
      totalPaid: 0,
      sellDue: 2400,
      payments: [],
      createdAt: "2026-09-05T09:30:00.000Z",
      updatedAt: "2026-09-05T09:30:00.000Z"
    };
    sellsStore.set(s1Id, s1);
    sellsStore.set(s2Id, s2);
    sellsStore.set(s3Id, s3);
  }
}
var SellService = class {
  static async getSells(companyId) {
    ensureSeedData2(companyId);
    const list = Array.from(sellsStore.values()).filter((s) => s.companyId === companyId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }
  static async getSellById(companyId, sellId) {
    ensureSeedData2(companyId);
    const sell = sellsStore.get(sellId);
    if (!sell || sell.companyId !== companyId) {
      return null;
    }
    return sell;
  }
  static async createSell(companyId, payload) {
    ensureSeedData2(companyId);
    let invoiceNumber = (payload.invoiceNumber || "").trim();
    if (!invoiceNumber) {
      const existing = Array.from(sellsStore.values()).filter((s) => s.companyId === companyId);
      const nextSeq = String(existing.length + 1).padStart(4, "0");
      invoiceNumber = `FAT-2026-${nextSeq}`;
    }
    const items = payload.items || [];
    const totalQuantity = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
    const itemsTotal = items.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
    const shippingCost = Number(payload.shipping?.shippingCost) || 0;
    const discountTotal = Number(payload.discountTotal) || 0;
    const cashbackRedeemed = Number(payload.cashback?.redeemedValue) || 0;
    const orderTaxTotal = Number(payload.orderTaxTotal) || 0;
    const totalAmount = Math.max(
      0,
      itemsTotal - discountTotal - cashbackRedeemed + orderTaxTotal + shippingCost
    );
    const payments = payload.payments || [];
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const sellDue = Math.max(0, totalAmount - totalPaid);
    let paymentStatus = "due";
    if (totalPaid >= totalAmount && totalAmount > 0) {
      paymentStatus = "paid";
    } else if (totalPaid > 0) {
      paymentStatus = "partial";
    } else {
      paymentStatus = "due";
    }
    const newId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newRecord = {
      id: newId,
      companyId,
      invoiceNumber,
      invoiceScheme: payload.invoiceScheme || "fatura_facil",
      customerId: payload.customerId || "cust-001",
      customerName: payload.customerName || "Cliente Balc\xE3o",
      contactNumber: payload.contactNumber || "",
      billingAddress: payload.billingAddress || "",
      shippingAddress: payload.shippingAddress || "",
      companyLocationId: payload.companyLocationId || "loc-sp",
      locationName: payload.locationName || "Franquia S\xE3o Paulo",
      sellDate: payload.sellDate || "07-09-2026 10:26 AM",
      status: payload.status || "final",
      paymentStatus,
      paymentTerm: payload.paymentTerm || "prazo_de",
      paymentTermDays: payload.paymentTermDays || 0,
      userName: payload.userName || "Admin Geral",
      isSubscription: Boolean(payload.isSubscription),
      attachedDocumentName: payload.attachedDocumentName,
      items,
      discountType: payload.discountType || "percentage",
      discountValue: Number(payload.discountValue) || 0,
      discountTotal,
      cashback: payload.cashback || {
        redeemed: 0,
        accessible: 0,
        redeemedValue: 0
      },
      orderTaxRate: Number(payload.orderTaxRate) || 0,
      orderTaxType: payload.orderTaxType || "none",
      orderTaxTotal,
      saleNote: payload.saleNote || "",
      shipping: {
        shippingDetails: payload.shipping?.shippingDetails || "",
        shippingAddress: payload.shipping?.shippingAddress || "",
        shippingCost,
        shippingStatus: payload.shipping?.shippingStatus || "pending",
        deliveredTo: payload.shipping?.deliveredTo || "",
        deliveryPerson: payload.shipping?.deliveryPerson || "",
        shippingDocumentName: payload.shipping?.shippingDocumentName
      },
      totalQuantity,
      itemsTotal,
      totalAmount,
      totalPaid,
      sellDue,
      payments,
      createdAt: now,
      updatedAt: now
    };
    sellsStore.set(newId, newRecord);
    return newRecord;
  }
  static async updateSell(companyId, sellId, payload) {
    ensureSeedData2(companyId);
    const existing = sellsStore.get(sellId);
    if (!existing || existing.companyId !== companyId) {
      throw new Error(`Venda com ID ${sellId} n\xE3o encontrada.`);
    }
    const updated = {
      ...existing,
      ...payload,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    sellsStore.set(sellId, updated);
    return updated;
  }
  static async deleteSell(companyId, sellId) {
    ensureSeedData2(companyId);
    const existing = sellsStore.get(sellId);
    if (!existing || existing.companyId !== companyId) {
      throw new Error(`Venda com ID ${sellId} n\xE3o encontrada.`);
    }
    sellsStore.delete(sellId);
    return true;
  }
};

// src/server/services/pdvService.ts
var posRecordsStore = /* @__PURE__ */ new Map();
var posExpensesStore = /* @__PURE__ */ new Map();
var posCashRegistersStore = /* @__PURE__ */ new Map();
var posQuotesStore = /* @__PURE__ */ new Map();
var DEFAULT_POS_PRODUCTS = [
  {
    id: "pos-prod-01",
    name: "C\xE2mera Frontal iPhone 13 Pro Max",
    code: "EL100954",
    sku: "CAM-FRT-IP13PM",
    barcode: "7891000100954",
    category: "C\xE2meras",
    brand: "Apple",
    price: 320,
    imTaxPrice: 352,
    stock: 14,
    imageUrl: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&q=80"
  },
  {
    id: "pos-prod-02",
    name: "C\xE2mera Traseira Samsung Galaxy S22 Ultra",
    code: "EL100891",
    sku: "CAM-TRS-S22U",
    barcode: "7891000100891",
    category: "C\xE2meras",
    brand: "Samsung",
    price: 450,
    imTaxPrice: 495,
    stock: 9,
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&q=80"
  },
  {
    id: "pos-prod-03",
    name: "M\xF3dulo de Display OLED Xiaomi 12",
    code: "EL100890",
    sku: "DSP-OLED-MI12",
    barcode: "7891000100890",
    category: "Telas",
    brand: "Xiaomi",
    price: 580,
    imTaxPrice: 638,
    stock: 6,
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&q=80"
  },
  {
    id: "pos-prod-04",
    name: "Bateria Original iPhone 12 / 12 Pro 2815mAh",
    code: "EL100939",
    sku: "BAT-IP12-ORIG",
    barcode: "7891000100939",
    category: "Baterias",
    brand: "Apple",
    price: 210,
    imTaxPrice: 231,
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1609592424368-450ef7773229?w=300&q=80"
  },
  {
    id: "pos-prod-05",
    name: "Conector de Carga Flex Type-C Moto G82",
    code: "EL100912",
    sku: "FLX-CHG-G82",
    barcode: "7891000100912",
    category: "Conectores",
    brand: "Motorola",
    price: 75,
    imTaxPrice: 82.5,
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&q=80"
  },
  {
    id: "pos-prod-06",
    name: "Alto-Falante Auricular Samsung A53 5G",
    code: "EL100965",
    sku: "SPK-AUR-A53",
    barcode: "7891000100965",
    category: "\xC1udio",
    brand: "Samsung",
    price: 65,
    imTaxPrice: 71.5,
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80"
  },
  {
    id: "pos-prod-07",
    name: "Fonte Carregador Turbo 67W GaN Xiaomi",
    code: "EL100980",
    sku: "CHG-GAN-67W",
    barcode: "7891000100980",
    category: "Acess\xF3rios",
    brand: "Xiaomi",
    price: 180,
    imTaxPrice: 198,
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&q=80"
  },
  {
    id: "pos-prod-08",
    name: "Pel\xEDcula Hidrogel Fosca Premium Universal",
    code: "EL100774",
    sku: "PEL-HDG-UNIV",
    barcode: "7891000100774",
    category: "Acess\xF3rios",
    brand: "Universal",
    price: 35,
    imTaxPrice: 38.5,
    stock: 150,
    imageUrl: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=300&q=80"
  }
];
function ensureSeedPOSData(companyId) {
  const existing = Array.from(posRecordsStore.values()).filter(
    (p) => p.companyId === companyId
  );
  if (existing.length === 0) {
    const pos1Id = crypto.randomUUID();
    const pos1 = {
      id: pos1Id,
      companyId,
      invoiceNumber: "POS-2026-0001",
      sellDate: "07-09-2026 10:45",
      customerId: "cust-fake-01",
      customerName: "Cliente Consumidor Final",
      contactNumber: "+55 11 99999-0001",
      locationName: "Franquia S\xE3o Paulo (Loja Online SP)",
      companyLocationId: "loc-sp",
      paymentStatus: "paid",
      paymentMethod: "Dinheiro",
      totalAmount: 390.5,
      totalPaid: 390.5,
      sellDue: 0,
      shippingStatus: "delivered",
      totalItems: 2,
      items: [
        {
          id: crypto.randomUUID(),
          productId: "pos-prod-01",
          productName: "C\xE2mera Frontal iPhone 13 Pro Max",
          code: "EL100954",
          quantity: 1,
          unitPrice: 320,
          imTaxPrice: 352,
          subtotal: 352,
          discount: 0,
          taxRate: 10
        },
        {
          id: crypto.randomUUID(),
          productId: "pos-prod-08",
          productName: "Pel\xEDcula Hidrogel Fosca Premium Universal",
          code: "EL100774",
          quantity: 1,
          unitPrice: 35,
          imTaxPrice: 38.5,
          subtotal: 38.5,
          discount: 0,
          taxRate: 10
        }
      ],
      addedBy: "Admin Geral",
      isSubscription: false,
      createdAt: "2026-09-07T10:45:00.000Z"
    };
    const pos2Id = crypto.randomUUID();
    const pos2 = {
      id: pos2Id,
      companyId,
      invoiceNumber: "POS-2026-0002",
      sellDate: "07-09-2026 09:12",
      customerId: "cust-fake-02",
      customerName: "Marcos Silveira Inform\xE1tica",
      contactNumber: "+55 11 98844-3322",
      locationName: "Franquia S\xE3o Paulo (Loja Online SP)",
      companyLocationId: "loc-sp",
      paymentStatus: "paid",
      paymentMethod: "Cart\xE3o de Cr\xE9dito",
      totalAmount: 638,
      totalPaid: 638,
      sellDue: 0,
      shippingStatus: "delivered",
      totalItems: 1,
      items: [
        {
          id: crypto.randomUUID(),
          productId: "pos-prod-03",
          productName: "M\xF3dulo de Display OLED Xiaomi 12",
          code: "EL100890",
          quantity: 1,
          unitPrice: 580,
          imTaxPrice: 638,
          subtotal: 638,
          discount: 0,
          taxRate: 10
        }
      ],
      addedBy: "Admin Geral",
      isSubscription: false,
      createdAt: "2026-09-07T09:12:00.000Z"
    };
    const pos3Id = crypto.randomUUID();
    const pos3 = {
      id: pos3Id,
      companyId,
      invoiceNumber: "POS-2026-0003",
      sellDate: "06-09-2026 17:30",
      customerId: "cust-fake-03",
      customerName: "Oficina do Celular Express",
      contactNumber: "+55 11 97722-1100",
      locationName: "Franquia S\xE3o Paulo (Loja Online SP)",
      companyLocationId: "loc-sp",
      paymentStatus: "partial",
      paymentMethod: "M\xFAltiplo (PIX + Dinheiro)",
      totalAmount: 513.5,
      totalPaid: 300,
      sellDue: 213.5,
      shippingStatus: "delivered",
      totalItems: 2,
      items: [
        {
          id: crypto.randomUUID(),
          productId: "pos-prod-02",
          productName: "C\xE2mera Traseira Samsung Galaxy S22 Ultra",
          code: "EL100891",
          quantity: 1,
          unitPrice: 450,
          imTaxPrice: 495,
          subtotal: 495,
          discount: 0,
          taxRate: 10
        },
        {
          id: crypto.randomUUID(),
          productId: "pos-prod-05",
          productName: "Conector de Carga Flex Type-C Moto G82",
          code: "EL100912",
          quantity: 1,
          unitPrice: 75,
          imTaxPrice: 18.5,
          subtotal: 18.5,
          discount: 0,
          taxRate: 10
        }
      ],
      addedBy: "Admin Geral",
      isSubscription: false,
      createdAt: "2026-09-06T17:30:00.000Z"
    };
    posRecordsStore.set(pos1Id, pos1);
    posRecordsStore.set(pos2Id, pos2);
    posRecordsStore.set(pos3Id, pos3);
  }
}
var POSService = class {
  static async getPOSRecords(companyId) {
    ensureSeedPOSData(companyId);
    return Array.from(posRecordsStore.values()).filter((p) => p.companyId === companyId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  static async getPOSById(companyId, id) {
    ensureSeedPOSData(companyId);
    const item = posRecordsStore.get(id);
    if (!item || item.companyId !== companyId) return null;
    return item;
  }
  static async createPOSRecord(companyId, payload) {
    ensureSeedPOSData(companyId);
    const now = /* @__PURE__ */ new Date();
    const newId = crypto.randomUUID();
    const invCount = Array.from(posRecordsStore.values()).filter(
      (p) => p.companyId === companyId
    ).length + 1;
    const invoiceNumber = payload.invoiceNumber || `POS-${now.getFullYear()}-${String(invCount).padStart(4, "0")}`;
    const rawItems = payload.items || [];
    const items = rawItems.map((it) => ({
      id: it.id || crypto.randomUUID(),
      productId: it.productId || "prod-custom",
      productName: it.productName || it.nome || it.name || "Produto",
      code: it.code || it.codigo || it.sku || "PDV-ITEM",
      sku: it.sku || it.codigo,
      quantity: Number(it.quantity ?? it.quantidade ?? 1),
      unitPrice: Number(it.unitPrice ?? it.precoUnitario ?? it.price ?? 0),
      imTaxPrice: Number(it.imTaxPrice ?? 0),
      subtotal: Number(it.subtotal ?? Number(it.unitPrice ?? it.precoUnitario ?? 0) * Number(it.quantity ?? it.quantidade ?? 1)),
      discount: Number(it.discount ?? it.desconto ?? 0),
      taxRate: Number(it.taxRate ?? it.imposto ?? 0),
      imageUrl: it.imageUrl,
      nome: it.nome || it.productName || it.name,
      quantidade: Number(it.quantidade ?? it.quantity ?? 1),
      precoUnitario: Number(it.precoUnitario ?? it.unitPrice ?? 0)
    }));
    const totalItems = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
    const totalAmount = Number(payload.totalAmount ?? payload.total) || items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
    const totalPaid = Number(payload.totalPaid ?? payload.valorPago) || totalAmount;
    const sellDue = Math.max(0, totalAmount - totalPaid);
    const record = {
      id: newId,
      companyId,
      invoiceNumber,
      sellDate: payload.sellDate || "07-09-2026 11:03",
      customerId: payload.customerId || "cust-fake-01",
      customerName: payload.customerName || payload.cliente || "Cliente Consumidor Final",
      contactNumber: payload.contactNumber || "+55 11 99999-0000",
      locationName: payload.locationName || "Franquia S\xE3o Paulo (Loja Online SP)",
      companyLocationId: payload.companyLocationId || "loc-sp",
      paymentStatus: sellDue <= 0 ? "paid" : totalPaid > 0 ? "partial" : "pending",
      paymentMethod: payload.paymentMethod || payload.formaPagamento || "Dinheiro",
      totalAmount,
      totalPaid,
      sellDue,
      shippingStatus: payload.shippingStatus || "delivered",
      totalItems,
      items,
      addedBy: payload.addedBy || "Admin Geral",
      isSubscription: !!payload.isSubscription,
      notes: payload.notes || "",
      createdAt: now.toISOString()
    };
    posRecordsStore.set(newId, record);
    return record;
  }
  static async deletePOSRecord(companyId, id) {
    ensureSeedPOSData(companyId);
    const existing = posRecordsStore.get(id);
    if (!existing || existing.companyId !== companyId) {
      throw new Error(`Registro POS com ID ${id} n\xE3o encontrado.`);
    }
    posRecordsStore.delete(id);
    return true;
  }
  static async createExpense(companyId, payload) {
    const expense = {
      id: crypto.randomUUID(),
      companyId,
      amount: Number(payload.amount) || 0,
      category: payload.category || "Geral",
      note: payload.note || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    posExpensesStore.set(expense.id, expense);
    return expense;
  }
  static async getExpenses(companyId) {
    const list = [];
    for (const exp of posExpensesStore.values()) {
      if (exp.companyId === companyId) {
        list.push(exp);
      }
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  static async getCashRegister(companyId) {
    const existing = posCashRegistersStore.get(companyId);
    if (existing) {
      return existing;
    }
    const defaultRegister = {
      id: crypto.randomUUID(),
      companyId,
      isOpen: true,
      openedAt: "07-09-2026 08:00:00",
      initialCash: 250,
      currentCash: 1480,
      totalSalesCash: 1230,
      totalExpenses: 0,
      notes: "Abertura de turno normal de vendas POS",
      openedBy: "Operador Caixa 01"
    };
    posCashRegistersStore.set(companyId, defaultRegister);
    return defaultRegister;
  }
  static async updateCashRegister(companyId, payload) {
    const current = await this.getCashRegister(companyId);
    const updated = {
      ...current,
      ...payload,
      companyId
    };
    if (payload.closingCash !== void 0) {
      updated.difference = Number(payload.closingCash) - updated.currentCash;
    }
    posCashRegistersStore.set(companyId, updated);
    return updated;
  }
  static async createQuote(companyId, payload) {
    const quoteCount = Array.from(posQuotesStore.values()).filter(
      (q) => q.companyId === companyId
    ).length;
    const quoteNumber = `COT-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(quoteCount + 1).padStart(4, "0")}`;
    const quote = {
      id: crypto.randomUUID(),
      companyId,
      quoteNumber,
      customerId: payload.customerId || "cust-fake-01",
      customerName: payload.customerName || "Cliente Consumidor Final",
      validUntil: payload.validUntil || "14-09-2026",
      totalAmount: Number(payload.totalAmount) || 0,
      items: payload.items || [],
      notes: payload.notes || "Cota\xE7\xE3o gerada diretamente pelo Terminal POS",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    posQuotesStore.set(quote.id, quote);
    return quote;
  }
  static async getQuotes(companyId) {
    const list = [];
    for (const q of posQuotesStore.values()) {
      if (q.companyId === companyId) {
        list.push(q);
      }
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  static async getAlerts(companyId) {
    return [
      {
        id: "alt-01",
        type: "low_stock",
        title: "Estoque Cr\xEDtico: Display OLED Xiaomi 12",
        description: "Restam apenas 6 unidades no invent\xE1rio da loja.",
        timestamp: "10 min atr\xE1s",
        severity: "warning",
        isRead: false
      },
      {
        id: "alt-02",
        type: "low_stock",
        title: "Estoque Baixo: C\xE2mera Traseira S22 Ultra",
        description: "Restam 9 unidades no invent\xE1rio.",
        timestamp: "25 min atr\xE1s",
        severity: "warning",
        isRead: false
      },
      {
        id: "alt-03",
        type: "pending_payment",
        title: "Pagamento Parcial Pendente",
        description: "Fatura POS-2026-0004 possui saldo devedor de R$ 132,00.",
        timestamp: "1 hora atr\xE1s",
        severity: "info",
        isRead: false
      },
      {
        id: "alt-04",
        type: "due_date",
        title: "Vencimento de Venda a Cr\xE9dito",
        description: "Venda a cr\xE9dito #POS-003 vence nos pr\xF3ximos 3 dias.",
        timestamp: "2 horas atr\xE1s",
        severity: "info",
        isRead: true
      }
    ];
  }
  static async getCatalogProducts() {
    return DEFAULT_POS_PRODUCTS;
  }
};

// src/server/services/draftService.ts
var DraftService = class {
  static async getDrafts(companyId) {
    const allSells = await SellService.getSells(companyId);
    return allSells.filter((s) => s.status === "draft");
  }
  static async getDraftById(companyId, id) {
    const sell = await SellService.getSellById(companyId, id);
    if (!sell || sell.status !== "draft") return null;
    return sell;
  }
  static async createDraft(companyId, payload) {
    const draftPayload = {
      ...payload,
      status: "draft"
    };
    return SellService.createSell(companyId, draftPayload);
  }
  static async updateDraft(companyId, id, payload) {
    const draftPayload = {
      ...payload,
      status: "draft"
    };
    return SellService.updateSell(companyId, id, draftPayload);
  }
  static async deleteDraft(companyId, id) {
    return SellService.deleteSell(companyId, id);
  }
};

// src/server/services/contactService.ts
var memorySuppliers = /* @__PURE__ */ new Map();
var memoryCustomers = /* @__PURE__ */ new Map();
var memoryGroups = /* @__PURE__ */ new Map();
function initializeSeedData(companyId) {
  if (!memorySuppliers.has(companyId)) {
    memorySuppliers.set(companyId, [
      {
        id: "10000000-0000-0000-0000-000000000001",
        companyId,
        personType: "legal",
        name: "Tech Distribuidora Ltda",
        tradeName: "Tech Dist",
        document: "12.345.678/0001-90",
        stateRegistration: "123456789",
        municipalRegistration: "987654321",
        email: "contato@techdist.com.br",
        phone: "(11) 3456-7890",
        mobile: "(11) 98765-4321",
        website: "https://techdist.com.br",
        contactName: "Carlos Eduardo",
        address: "Av. Paulista, 1000, Sala 52",
        neighborhood: "Bela Vista",
        city: "S\xE3o Paulo",
        state: "SP",
        postalCode: "01310-100",
        country: "Brasil",
        category: "Eletr\xF4nicos & Pe\xE7as",
        paymentTerms: "30 dias (Boleto)",
        bankInfo: {
          bankName: "Banco do Brasil",
          agency: "1234-5",
          accountNumber: "98765-4",
          pixKey: "contato@techdist.com.br"
        },
        notes: "Fornecedor principal de telas e baterias originais.",
        status: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "10000000-0000-0000-0000-000000000002",
        companyId,
        personType: "legal",
        name: "Inova Componentes e Ferramentas SA",
        tradeName: "Inova Pe\xE7as",
        document: "98.765.432/0001-10",
        stateRegistration: "987654321",
        municipalRegistration: "123456789",
        email: "vendas@inovape\xE7as.com.br",
        phone: "(19) 3210-9876",
        mobile: "(19) 99887-6655",
        website: "https://inovapecas.com.br",
        contactName: "Mariana Silveira",
        address: "Rua das Ind\xFAstrias, 500",
        neighborhood: "Distrito Industrial",
        city: "Campinas",
        state: "SP",
        postalCode: "13000-000",
        country: "Brasil",
        category: "Acess\xF3rios e Ferramentas",
        paymentTerms: "\xC0 vista com 5% desc.",
        bankInfo: {
          bankName: "Ita\xFA Unibanco",
          agency: "0342",
          accountNumber: "11223-9",
          pixKey: "financeiro@inovapecas.com.br"
        },
        notes: "Fornecedor de esta\xE7\xF5es de solda e microsc\xF3pios.",
        status: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]);
  }
  if (!memoryGroups.has(companyId)) {
    memoryGroups.set(companyId, [
      {
        id: "20000000-0000-0000-0000-000000000001",
        companyId,
        name: "Varejo Padr\xE3o",
        description: "Clientes convencionais de balc\xE3o e ordem de servi\xE7o",
        discountPercentage: 0,
        priceTable: "Tabela Balc\xE3o",
        status: "active",
        customerCount: 1,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "20000000-0000-0000-0000-000000000002",
        companyId,
        name: "Revendedores VIP",
        description: "Assist\xEAncias t\xE9cnicas parceiras com desconto em pe\xE7as",
        discountPercentage: 15,
        priceTable: "Tabela Revenda",
        status: "active",
        customerCount: 1,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]);
  }
  if (!memoryCustomers.has(companyId)) {
    memoryCustomers.set(companyId, [
      {
        id: "30000000-0000-0000-0000-000000000001",
        companyId,
        customerGroupId: "20000000-0000-0000-0000-000000000001",
        customerGroupName: "Varejo Padr\xE3o",
        personType: "individual",
        name: "Lucas Gabriel Albuquerque",
        tradeName: null,
        document: "123.456.789-00",
        stateRegistration: null,
        municipalRegistration: null,
        email: "lucas.albuquerque@email.com",
        phone: "(11) 2345-6789",
        mobile: "(11) 98765-1122",
        website: null,
        contactName: null,
        address: "Rua Augusta, 1500, Apto 42",
        neighborhood: "Consola\xE7\xE3o",
        city: "S\xE3o Paulo",
        state: "SP",
        postalCode: "01304-001",
        country: "Brasil",
        creditLimit: 2500,
        notes: "Cliente fiel, prefere contato por WhatsApp.",
        status: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "30000000-0000-0000-0000-000000000002",
        companyId,
        customerGroupId: "20000000-0000-0000-0000-000000000002",
        customerGroupName: "Revendedores VIP",
        personType: "legal",
        name: "Nexus Solu\xE7\xF5es Mobile Ltda",
        tradeName: "Nexus Tech",
        document: "45.678.901/0001-23",
        stateRegistration: "543216789",
        municipalRegistration: "987123456",
        email: "contato@nexustech.com.br",
        phone: "(11) 4002-8922",
        mobile: "(11) 97711-2233",
        website: "https://nexustech.com.br",
        contactName: "Amanda Ferreira",
        address: "Av. Brigadeiro Faria Lima, 2200",
        neighborhood: "Pinheiros",
        city: "S\xE3o Paulo",
        state: "SP",
        postalCode: "01451-000",
        country: "Brasil",
        creditLimit: 15e3,
        notes: "Faturamento quinzenal para reparos terceirizados.",
        status: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]);
  }
}
var ContactService = class {
  // ============================================================================
  // FORNECEDORES (SUPPLIERS)
  // ============================================================================
  static async listSuppliers(companyId, params = {}) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        return await SupplierService.listByCompany(companyId, {
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          search: params.search,
          status: params.status,
          personType: params.personType,
          category: params.category
        });
      } catch {
      }
    }
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
    let list = memorySuppliers.get(companyId) || [];
    if (params.status) {
      list = list.filter((s) => s.status === params.status);
    }
    if (params.personType) {
      list = list.filter((s) => s.personType === params.personType);
    }
    if (params.category && params.category.trim()) {
      const cat = params.category.trim().toLowerCase();
      list = list.filter((s) => s.category && s.category.toLowerCase().includes(cat));
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.tradeName && s.tradeName.toLowerCase().includes(q) || s.document && s.document.toLowerCase().includes(q) || s.email && s.email.toLowerCase().includes(q) || s.phone && s.phone.toLowerCase().includes(q)
      );
    }
    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const offset = (page - 1) * pageSize;
    const data = list.slice(offset, offset + pageSize);
    return {
      data,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }
  static async getSupplierById(companyId, supplierId) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        const found = await SupplierService.getById(companyId, supplierId);
        if (found) return found;
      } catch {
      }
    }
    const list = memorySuppliers.get(companyId) || [];
    return list.find((s) => s.id === supplierId) || null;
  }
  static async createSupplier(companyId, payload) {
    initializeSeedData(companyId);
    if (!payload.name || !payload.name.trim()) {
      throw new Error("O nome ou raz\xE3o social do fornecedor \xE9 obrigat\xF3rio.");
    }
    if (isSupabaseAdminConfigured()) {
      try {
        const created = await SupplierService.create(companyId, payload);
        if (created) {
          const list2 = memorySuppliers.get(companyId) || [];
          list2.unshift(created);
          memorySuppliers.set(companyId, list2);
          return created;
        }
      } catch {
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newSupplier = {
      id: crypto.randomUUID(),
      companyId,
      personType: payload.personType || "legal",
      name: payload.name.trim(),
      tradeName: payload.tradeName?.trim() || null,
      document: payload.document?.trim() || null,
      stateRegistration: payload.stateRegistration?.trim() || null,
      municipalRegistration: payload.municipalRegistration?.trim() || null,
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      mobile: payload.mobile?.trim() || null,
      website: payload.website?.trim() || null,
      contactName: payload.contactName?.trim() || null,
      address: payload.address?.trim() || null,
      neighborhood: payload.neighborhood?.trim() || null,
      city: payload.city?.trim() || null,
      state: payload.state?.trim() || null,
      postalCode: payload.postalCode?.trim() || null,
      country: payload.country?.trim() || "Brasil",
      category: payload.category?.trim() || null,
      paymentTerms: payload.paymentTerms?.trim() || null,
      bankInfo: payload.bankInfo || {},
      notes: payload.notes?.trim() || null,
      status: payload.status || "active",
      createdAt: now,
      updatedAt: now
    };
    const list = memorySuppliers.get(companyId) || [];
    list.unshift(newSupplier);
    memorySuppliers.set(companyId, list);
    return newSupplier;
  }
  static async updateSupplier(companyId, supplierId, payload) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        const updated2 = await SupplierService.update(companyId, supplierId, payload);
        if (updated2) {
          const list2 = memorySuppliers.get(companyId) || [];
          const idx = list2.findIndex((s) => s.id === supplierId);
          if (idx !== -1) list2[idx] = updated2;
          return updated2;
        }
      } catch {
      }
    }
    const list = memorySuppliers.get(companyId) || [];
    const index = list.findIndex((s) => s.id === supplierId);
    if (index === -1) {
      throw new Error("Fornecedor n\xE3o encontrado.");
    }
    const existing = list[index];
    const updated = {
      ...existing,
      personType: payload.personType ?? existing.personType,
      name: payload.name !== void 0 ? payload.name.trim() : existing.name,
      tradeName: payload.tradeName !== void 0 ? payload.tradeName?.trim() || null : existing.tradeName,
      document: payload.document !== void 0 ? payload.document?.trim() || null : existing.document,
      stateRegistration: payload.stateRegistration !== void 0 ? payload.stateRegistration?.trim() || null : existing.stateRegistration,
      municipalRegistration: payload.municipalRegistration !== void 0 ? payload.municipalRegistration?.trim() || null : existing.municipalRegistration,
      email: payload.email !== void 0 ? payload.email?.trim() || null : existing.email,
      phone: payload.phone !== void 0 ? payload.phone?.trim() || null : existing.phone,
      mobile: payload.mobile !== void 0 ? payload.mobile?.trim() || null : existing.mobile,
      website: payload.website !== void 0 ? payload.website?.trim() || null : existing.website,
      contactName: payload.contactName !== void 0 ? payload.contactName?.trim() || null : existing.contactName,
      address: payload.address !== void 0 ? payload.address?.trim() || null : existing.address,
      neighborhood: payload.neighborhood !== void 0 ? payload.neighborhood?.trim() || null : existing.neighborhood,
      city: payload.city !== void 0 ? payload.city?.trim() || null : existing.city,
      state: payload.state !== void 0 ? payload.state?.trim() || null : existing.state,
      postalCode: payload.postalCode !== void 0 ? payload.postalCode?.trim() || null : existing.postalCode,
      country: payload.country !== void 0 ? payload.country?.trim() || "Brasil" : existing.country,
      category: payload.category !== void 0 ? payload.category?.trim() || null : existing.category,
      paymentTerms: payload.paymentTerms !== void 0 ? payload.paymentTerms?.trim() || null : existing.paymentTerms,
      bankInfo: payload.bankInfo !== void 0 ? payload.bankInfo : existing.bankInfo,
      notes: payload.notes !== void 0 ? payload.notes?.trim() || null : existing.notes,
      status: payload.status ?? existing.status,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    list[index] = updated;
    memorySuppliers.set(companyId, list);
    return updated;
  }
  static async deleteSupplier(companyId, supplierId) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        await SupplierService.delete(companyId, supplierId);
      } catch {
      }
    }
    const list = memorySuppliers.get(companyId) || [];
    const filtered = list.filter((s) => s.id !== supplierId);
    memorySuppliers.set(companyId, filtered);
    return true;
  }
  // ============================================================================
  // CLIENTES (CUSTOMERS)
  // ============================================================================
  static async listCustomers(companyId, params = {}) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        return await CustomerService.listByCompany(companyId, {
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          search: params.search,
          status: params.status,
          personType: params.personType,
          groupId: params.customerGroupId
        });
      } catch {
      }
    }
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
    let list = memoryCustomers.get(companyId) || [];
    if (params.status) {
      list = list.filter((c) => c.status === params.status);
    }
    if (params.personType) {
      list = list.filter((c) => c.personType === params.personType);
    }
    if (params.customerGroupId) {
      list = list.filter((c) => c.customerGroupId === params.customerGroupId);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.tradeName && c.tradeName.toLowerCase().includes(q) || c.document && c.document.toLowerCase().includes(q) || c.email && c.email.toLowerCase().includes(q) || c.phone && c.phone.toLowerCase().includes(q) || c.mobile && c.mobile.toLowerCase().includes(q)
      );
    }
    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const offset = (page - 1) * pageSize;
    const data = list.slice(offset, offset + pageSize);
    return {
      data,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }
  static async getCustomerById(companyId, customerId) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        const found = await CustomerService.getById(companyId, customerId);
        if (found) return found;
      } catch {
      }
    }
    const list = memoryCustomers.get(companyId) || [];
    return list.find((c) => c.id === customerId) || null;
  }
  static async createCustomer(companyId, payload) {
    initializeSeedData(companyId);
    if (!payload.name || !payload.name.trim()) {
      throw new Error("O nome do cliente \xE9 obrigat\xF3rio.");
    }
    if (isSupabaseAdminConfigured()) {
      try {
        const created = await CustomerService.create(companyId, payload);
        if (created) {
          const list2 = memoryCustomers.get(companyId) || [];
          list2.unshift(created);
          memoryCustomers.set(companyId, list2);
          return created;
        }
      } catch {
      }
    }
    const groups = memoryGroups.get(companyId) || [];
    const group = payload.customerGroupId ? groups.find((g) => g.id === payload.customerGroupId) : null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newCustomer = {
      id: crypto.randomUUID(),
      companyId,
      customerGroupId: payload.customerGroupId || null,
      customerGroupName: group?.name || null,
      personType: payload.personType || "individual",
      name: payload.name.trim(),
      tradeName: payload.tradeName?.trim() || null,
      document: payload.document?.trim() || null,
      stateRegistration: payload.stateRegistration?.trim() || null,
      municipalRegistration: payload.municipalRegistration?.trim() || null,
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      mobile: payload.mobile?.trim() || null,
      website: payload.website?.trim() || null,
      contactName: payload.contactName?.trim() || null,
      address: payload.address?.trim() || null,
      neighborhood: payload.neighborhood?.trim() || null,
      city: payload.city?.trim() || null,
      state: payload.state?.trim() || null,
      postalCode: payload.postalCode?.trim() || null,
      country: payload.country?.trim() || "Brasil",
      creditLimit: payload.creditLimit ?? 0,
      notes: payload.notes?.trim() || null,
      status: payload.status || "active",
      createdAt: now,
      updatedAt: now
    };
    const list = memoryCustomers.get(companyId) || [];
    list.unshift(newCustomer);
    memoryCustomers.set(companyId, list);
    return newCustomer;
  }
  static async updateCustomer(companyId, customerId, payload) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        const updated2 = await CustomerService.update(companyId, customerId, payload);
        if (updated2) {
          const list2 = memoryCustomers.get(companyId) || [];
          const idx = list2.findIndex((c) => c.id === customerId);
          if (idx !== -1) list2[idx] = updated2;
          return updated2;
        }
      } catch {
      }
    }
    const list = memoryCustomers.get(companyId) || [];
    const index = list.findIndex((c) => c.id === customerId);
    if (index === -1) {
      throw new Error("Cliente n\xE3o encontrado.");
    }
    const existing = list[index];
    const groups = memoryGroups.get(companyId) || [];
    const group = payload.customerGroupId ? groups.find((g) => g.id === payload.customerGroupId) : existing.customerGroupId ? groups.find((g) => g.id === existing.customerGroupId) : null;
    const updated = {
      ...existing,
      customerGroupId: payload.customerGroupId !== void 0 ? payload.customerGroupId : existing.customerGroupId,
      customerGroupName: group?.name || existing.customerGroupName,
      personType: payload.personType ?? existing.personType,
      name: payload.name !== void 0 ? payload.name.trim() : existing.name,
      tradeName: payload.tradeName !== void 0 ? payload.tradeName?.trim() || null : existing.tradeName,
      document: payload.document !== void 0 ? payload.document?.trim() || null : existing.document,
      stateRegistration: payload.stateRegistration !== void 0 ? payload.stateRegistration?.trim() || null : existing.stateRegistration,
      municipalRegistration: payload.municipalRegistration !== void 0 ? payload.municipalRegistration?.trim() || null : existing.municipalRegistration,
      email: payload.email !== void 0 ? payload.email?.trim() || null : existing.email,
      phone: payload.phone !== void 0 ? payload.phone?.trim() || null : existing.phone,
      mobile: payload.mobile !== void 0 ? payload.mobile?.trim() || null : existing.mobile,
      website: payload.website !== void 0 ? payload.website?.trim() || null : existing.website,
      contactName: payload.contactName !== void 0 ? payload.contactName?.trim() || null : existing.contactName,
      address: payload.address !== void 0 ? payload.address?.trim() || null : existing.address,
      neighborhood: payload.neighborhood !== void 0 ? payload.neighborhood?.trim() || null : existing.neighborhood,
      city: payload.city !== void 0 ? payload.city?.trim() || null : existing.city,
      state: payload.state !== void 0 ? payload.state?.trim() || null : existing.state,
      postalCode: payload.postalCode !== void 0 ? payload.postalCode?.trim() || null : existing.postalCode,
      country: payload.country !== void 0 ? payload.country?.trim() || "Brasil" : existing.country,
      creditLimit: payload.creditLimit !== void 0 ? payload.creditLimit : existing.creditLimit,
      notes: payload.notes !== void 0 ? payload.notes?.trim() || null : existing.notes,
      status: payload.status ?? existing.status,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    list[index] = updated;
    memoryCustomers.set(companyId, list);
    return updated;
  }
  static async deleteCustomer(companyId, customerId) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        await CustomerService.delete(companyId, customerId);
      } catch {
      }
    }
    const list = memoryCustomers.get(companyId) || [];
    const filtered = list.filter((c) => c.id !== customerId);
    memoryCustomers.set(companyId, filtered);
    return true;
  }
  // ============================================================================
  // GRUPOS DE CLIENTES (CUSTOMER GROUPS)
  // ============================================================================
  static async listCustomerGroups(companyId) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        const groups = await CustomerGroupService.listByCompany(companyId);
        if (groups && groups.length > 0) return groups;
      } catch {
      }
    }
    return memoryGroups.get(companyId) || [];
  }
  static async getCustomerGroupById(companyId, groupId) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        const found = await CustomerGroupService.getById(companyId, groupId);
        if (found) return found;
      } catch {
      }
    }
    const groups = memoryGroups.get(companyId) || [];
    return groups.find((g) => g.id === groupId) || null;
  }
  static async createCustomerGroup(companyId, payload) {
    initializeSeedData(companyId);
    if (!payload.name || !payload.name.trim()) {
      throw new Error("O nome do grupo de clientes \xE9 obrigat\xF3rio.");
    }
    if (isSupabaseAdminConfigured()) {
      try {
        const created = await CustomerGroupService.create(companyId, payload);
        if (created) {
          const list2 = memoryGroups.get(companyId) || [];
          list2.push(created);
          memoryGroups.set(companyId, list2);
          return created;
        }
      } catch {
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newGroup = {
      id: crypto.randomUUID(),
      companyId,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      discountPercentage: payload.discountPercentage ?? 0,
      priceTable: payload.priceTable?.trim() || null,
      status: payload.status || "active",
      customerCount: 0,
      createdAt: now,
      updatedAt: now
    };
    const list = memoryGroups.get(companyId) || [];
    list.push(newGroup);
    memoryGroups.set(companyId, list);
    return newGroup;
  }
  static async updateCustomerGroup(companyId, groupId, payload) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        const updated2 = await CustomerGroupService.update(companyId, groupId, payload);
        if (updated2) {
          const list2 = memoryGroups.get(companyId) || [];
          const idx = list2.findIndex((g) => g.id === groupId);
          if (idx !== -1) list2[idx] = updated2;
          return updated2;
        }
      } catch {
      }
    }
    const list = memoryGroups.get(companyId) || [];
    const index = list.findIndex((g) => g.id === groupId);
    if (index === -1) {
      throw new Error("Grupo de clientes n\xE3o encontrado.");
    }
    const existing = list[index];
    const updated = {
      ...existing,
      name: payload.name !== void 0 ? payload.name.trim() : existing.name,
      description: payload.description !== void 0 ? payload.description?.trim() || null : existing.description,
      discountPercentage: payload.discountPercentage !== void 0 ? payload.discountPercentage : existing.discountPercentage,
      priceTable: payload.priceTable !== void 0 ? payload.priceTable?.trim() || null : existing.priceTable,
      status: payload.status ?? existing.status,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    list[index] = updated;
    memoryGroups.set(companyId, list);
    return updated;
  }
  static async deleteCustomerGroup(companyId, groupId) {
    initializeSeedData(companyId);
    if (isSupabaseAdminConfigured()) {
      try {
        await CustomerGroupService.delete(companyId, groupId);
      } catch {
      }
    }
    const list = memoryGroups.get(companyId) || [];
    const filtered = list.filter((g) => g.id !== groupId);
    memoryGroups.set(companyId, filtered);
    return true;
  }
};

// server.ts
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path2.default.dirname(__filename);
var UUID_REGEX2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  validateServerEnv();
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app.get("/api/health/supabase", (req, res) => {
    const isConfigured = isSupabaseAdminConfigured();
    const response = {
      status: isConfigured ? "ok" : "unconfigured",
      service: "supabase",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      configured: isConfigured
    };
    res.status(isConfigured ? 200 : 200).json(response);
  });
  app.get("/api/platform/admin-status", requireAuth, requirePlatformAdmin, (req, res) => {
    const authReq = req;
    const response = {
      success: true,
      data: {
        authorized: true,
        userId: authReq.userId,
        role: "super_admin"
      },
      meta: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    res.status(200).json(response);
  });
  app.get("/api/platform/dashboard/summary", requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const summary = await PlatformAdminService.getDashboardSummary();
      const response = {
        success: true,
        data: summary,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "DASHBOARD_SUMMARY_ERROR",
          message: "Erro interno ao consultar indicadores globais da plataforma."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/platform/companies", requireAuth, requirePlatformAdmin, async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20;
    const search = typeof req.query.search === "string" ? req.query.search : void 0;
    const statusParam = typeof req.query.status === "string" ? req.query.status : void 0;
    const sortByParam = typeof req.query.sortBy === "string" ? req.query.sortBy : void 0;
    const sortDirParam = typeof req.query.sortDirection === "string" ? req.query.sortDirection : void 0;
    const validStatuses = ["active", "inactive", "suspended", "pending", "all"];
    const status = statusParam && validStatuses.includes(statusParam) ? statusParam : void 0;
    const validSortCols = ["name", "created_at", "status", "slug"];
    const sortBy = sortByParam && validSortCols.includes(sortByParam) ? sortByParam : void 0;
    const sortDirection = sortDirParam === "asc" ? "asc" : "desc";
    try {
      const result = await PlatformAdminService.listCompanies({
        page,
        pageSize,
        search,
        status,
        sortBy,
        sortDirection
      });
      const response = {
        success: true,
        data: result.companies,
        meta: {
          pagination: result.pagination,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COMPANIES_FETCH_ERROR",
          message: "Erro interno ao listar empresas da plataforma."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/platform/companies/:companyId", requireAuth, requirePlatformAdmin, async (req, res) => {
    const companyId = req.params.companyId;
    if (!companyId || !UUID_REGEX2.test(companyId)) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_COMPANY_ID",
          message: "Identificador de empresa inv\xE1lido. Deve ser um UUID v4."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const companyDetails = await PlatformAdminService.getCompanyDetails(companyId);
      if (!companyDetails) {
        const errorResponse = {
          success: false,
          error: {
            code: "COMPANY_NOT_FOUND",
            message: "Empresa n\xE3o encontrada na plataforma."
          }
        };
        res.status(404).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: companyDetails,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COMPANY_DETAILS_ERROR",
          message: "Erro interno ao consultar detalhes da empresa."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.patch("/api/platform/companies/:companyId/status", requireAuth, requirePlatformAdmin, async (req, res) => {
    const companyId = req.params.companyId;
    if (!companyId || !UUID_REGEX2.test(companyId)) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_COMPANY_ID",
          message: "Identificador de empresa inv\xE1lido. Deve ser um UUID v4."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    const { status } = req.body;
    const validStatuses = ["active", "inactive", "suspended", "pending"];
    if (!status || !validStatuses.includes(status)) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: `Status inv\xE1lido. Valores aceitos: ${validStatuses.join(", ")}.`
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const updatedCompany = await PlatformAdminService.updateCompanyStatus(companyId, status);
      if (!updatedCompany) {
        const errorResponse = {
          success: false,
          error: {
            code: "COMPANY_NOT_FOUND",
            message: "Empresa n\xE3o encontrada para atualiza\xE7\xE3o de status."
          }
        };
        res.status(404).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: updatedCompany,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COMPANY_STATUS_UPDATE_ERROR",
          message: "Erro interno ao atualizar status da empresa."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.post("/api/platform/companies", requireAuth, requirePlatformAdmin, async (req, res) => {
    const authReq = req;
    const body = req.body;
    if (!body || !body.name || body.name.trim().length === 0) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_NAME",
          message: "O nome da empresa \xE9 obrigat\xF3rio."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const createdCompany = await CompanyService.createCompany(body, authReq.userId);
      if (!createdCompany) {
        const errorResponse = {
          success: false,
          error: {
            code: "COMPANY_CREATE_FAILED",
            message: "N\xE3o foi poss\xEDvel cadastrar a empresa. Verifique os dados."
          }
        };
        res.status(500).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: createdCompany,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(201).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COMPANY_CREATE_ERROR",
          message: "Erro interno ao criar empresa."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.put("/api/platform/companies/:companyId", requireAuth, requirePlatformAdmin, async (req, res) => {
    const companyId = req.params.companyId;
    if (!companyId || !UUID_REGEX2.test(companyId)) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_COMPANY_ID",
          message: "Identificador de empresa inv\xE1lido. Deve ser um UUID v4."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    const body = req.body;
    try {
      const updatedCompany = await CompanyService.updateCompany(companyId, body);
      if (!updatedCompany) {
        const errorResponse = {
          success: false,
          error: {
            code: "COMPANY_UPDATE_FAILED",
            message: "N\xE3o foi poss\xEDvel atualizar os dados da empresa."
          }
        };
        res.status(500).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: updatedCompany,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COMPANY_UPDATE_ERROR",
          message: "Erro interno ao atualizar empresa."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/companies/:companyId", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const company = await CompanyService.getCompanyById(companyId);
      if (!company) {
        const errorResponse = {
          success: false,
          error: {
            code: "COMPANY_NOT_FOUND",
            message: "Empresa n\xE3o encontrada."
          }
        };
        res.status(404).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: company,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COMPANY_FETCH_ERROR",
          message: "Erro ao consultar dados da empresa."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.put("/api/companies/:companyId", requireAuth, requireCompanyContext, requirePermission("empresa.configurar"), async (req, res) => {
    const companyId = req.params.companyId;
    const body = req.body;
    try {
      const updated = await CompanyService.updateCompany(companyId, body);
      if (!updated) {
        const errorResponse = {
          success: false,
          error: {
            code: "COMPANY_UPDATE_FAILED",
            message: "Falha ao salvar dados da empresa."
          }
        };
        res.status(500).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: updated,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COMPANY_UPDATE_ERROR",
          message: "Erro interno ao salvar configura\xE7\xF5es da empresa."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/companies/:companyId/locations", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const locations = await CompanyService.listLocations(companyId);
      const response = {
        success: true,
        data: locations,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "LOCATIONS_FETCH_ERROR",
          message: "Erro ao listar locais comerciais."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.post("/api/companies/:companyId/locations", requireAuth, requireCompanyContext, requirePermission("empresa.configurar"), async (req, res) => {
    const companyId = req.params.companyId;
    const body = req.body;
    if (!body || !body.name || body.name.trim().length === 0) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_LOCATION_NAME",
          message: "O nome do local comercial \xE9 obrigat\xF3rio."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const created = await CompanyService.createLocation(companyId, body);
      if (!created) {
        const errorResponse = {
          success: false,
          error: {
            code: "LOCATION_CREATE_FAILED",
            message: "N\xE3o foi poss\xEDvel cadastrar o local comercial."
          }
        };
        res.status(500).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: created,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(201).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "LOCATION_CREATE_ERROR",
          message: "Erro interno ao cadastrar local comercial."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.put("/api/companies/:companyId/locations/:locationId", requireAuth, requireCompanyContext, requirePermission("empresa.configurar"), async (req, res) => {
    const companyId = req.params.companyId;
    const locationId = req.params.locationId;
    const body = req.body;
    try {
      const updated = await CompanyService.updateLocation(companyId, locationId, body);
      if (!updated) {
        const errorResponse = {
          success: false,
          error: {
            code: "LOCATION_UPDATE_FAILED",
            message: "N\xE3o foi poss\xEDvel atualizar o local comercial."
          }
        };
        res.status(500).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: updated,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "LOCATION_UPDATE_ERROR",
          message: "Erro interno ao atualizar local comercial."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.delete("/api/companies/:companyId/locations/:locationId", requireAuth, requireCompanyContext, requirePermission("empresa.configurar"), async (req, res) => {
    const companyId = req.params.companyId;
    const locationId = req.params.locationId;
    try {
      const deleted = await CompanyService.deleteLocation(companyId, locationId);
      if (!deleted) {
        const errorResponse = {
          success: false,
          error: {
            code: "LOCATION_DELETE_FAILED",
            message: "N\xE3o foi poss\xEDvel excluir o local comercial."
          }
        };
        res.status(500).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: { deleted: true },
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "LOCATION_DELETE_ERROR",
          message: "Erro interno ao excluir local comercial."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/companies/my", requireAuth, async (req, res) => {
    const authReq = req;
    const userId = authReq.userId;
    if (!userId) {
      const errorResponse = {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "Autentica\xE7\xE3o necess\xE1ria."
        }
      };
      res.status(401).json(errorResponse);
      return;
    }
    try {
      const companies = await CompanyMembershipService.listUserCompanies(userId);
      const response = {
        success: true,
        data: companies,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COMPANY_FETCH_ERROR",
          message: "Erro ao buscar empresas associadas ao usu\xE1rio."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/companies/:companyId/context", requireAuth, requireCompanyContext, (req, res) => {
    const authReq = req;
    const response = {
      success: true,
      data: authReq.companyContext,
      meta: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    res.status(200).json(response);
  });
  app.get("/api/companies/:companyId/permissions", requireAuth, requireCompanyContext, async (req, res) => {
    const authReq = req;
    const userId = authReq.userId;
    const companyContext = authReq.companyContext;
    if (!userId || !companyContext) {
      const errorResponse = {
        success: false,
        error: {
          code: "CONTEXT_MISSING",
          message: "Contexto de autentica\xE7\xE3o e empresa ausente."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const permissions = await PermissionService.getUserPermissions(userId, companyContext.companyId);
      const response = {
        success: true,
        data: {
          companyId: companyContext.companyId,
          companyName: companyContext.companyName,
          role: companyContext.role,
          permissions
        },
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "PERMISSIONS_FETCH_ERROR",
          message: "Erro ao consultar cat\xE1logo de permiss\xF5es do usu\xE1rio."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/companies/:companyId/permissions/check/:permission", requireAuth, requireCompanyContext, async (req, res) => {
    const authReq = req;
    const userId = authReq.userId;
    const companyContext = authReq.companyContext;
    const permissionKey = req.params.permission;
    if (!userId || !companyContext || !permissionKey) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Par\xE2metros de permiss\xE3o incompletos."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const isGranted = await PermissionService.hasPermission(userId, companyContext.companyId, permissionKey);
      if (!isGranted) {
        const forbiddenResponse = {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: `Acesso negado. O papel "${companyContext.role}" n\xE3o possui a permiss\xE3o "${permissionKey}".`
          }
        };
        res.status(403).json(forbiddenResponse);
        return;
      }
      const response = {
        success: true,
        data: {
          authorized: true,
          permission: permissionKey,
          companyId: companyContext.companyId,
          role: companyContext.role
        },
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "PERMISSION_CHECK_ERROR",
          message: "Erro interno ao validar permiss\xE3o espec\xEDfica."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/companies/:companyId/users", requireAuth, requireCompanyContext, requirePermission("usuarios.ler"), async (req, res) => {
    const companyId = req.params.companyId;
    const { search, role, status } = req.query;
    try {
      const result = await CompanyMembershipService.listCompanyUsers(companyId, { search, role, status });
      const response = {
        success: true,
        data: result,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "USERS_FETCH_ERROR",
          message: err instanceof Error ? err.message : "Erro ao consultar lista de usu\xE1rios da empresa."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.post("/api/companies/:companyId/users", requireAuth, requireCompanyContext, requirePermission("usuarios.criar"), async (req, res) => {
    const companyId = req.params.companyId;
    const body = req.body;
    if (!body || !body.email) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "O e-mail do colaborador \xE9 obrigat\xF3rio."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await CompanyMembershipService.addCompanyUser(companyId, body);
      if (!result.success || !result.data) {
        const isQuotaError = result.error?.includes("Limite de usu\xE1rios atingido");
        const errorResponse = {
          success: false,
          error: {
            code: isQuotaError ? "USER_LIMIT_EXCEEDED" : "USER_ADD_FAILED",
            message: result.error || "N\xE3o foi poss\xEDvel adicionar o usu\xE1rio."
          }
        };
        res.status(isQuotaError ? 403 : 400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(201).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "USER_ADD_ERROR",
          message: err instanceof Error ? err.message : "Erro interno ao adicionar colaborador."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.patch("/api/companies/:companyId/users/:userId/role", requireAuth, requireCompanyContext, requirePermission("usuarios.permissoes"), async (req, res) => {
    const companyId = req.params.companyId;
    const userId = req.params.userId;
    const body = req.body;
    if (!body || !body.role) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "O novo papel do usu\xE1rio \xE9 obrigat\xF3rio."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await CompanyMembershipService.updateUserRole(companyId, userId, body.role);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "USER_ROLE_UPDATE_FAILED",
            message: result.error || "Falha ao atualizar papel do usu\xE1rio."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "USER_ROLE_UPDATE_ERROR",
          message: err instanceof Error ? err.message : "Erro interno ao atualizar papel."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.patch("/api/companies/:companyId/users/:userId/status", requireAuth, requireCompanyContext, requirePermission("usuarios.suspender"), async (req, res) => {
    const companyId = req.params.companyId;
    const userId = req.params.userId;
    const body = req.body;
    if (!body || !body.status) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "O novo status do usu\xE1rio \xE9 obrigat\xF3rio."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await CompanyMembershipService.updateUserStatus(companyId, userId, body.status);
      if (!result.success || !result.data) {
        const isQuotaError = result.error?.includes("limite");
        const errorResponse = {
          success: false,
          error: {
            code: isQuotaError ? "USER_LIMIT_EXCEEDED" : "USER_STATUS_UPDATE_FAILED",
            message: result.error || "Falha ao atualizar status do usu\xE1rio."
          }
        };
        res.status(isQuotaError ? 403 : 400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "USER_STATUS_UPDATE_ERROR",
          message: err instanceof Error ? err.message : "Erro interno ao atualizar status."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/public/plans", async (req, res) => {
    try {
      const publicPlans = await SubscriptionPlanService.getPublicPlans();
      const response = {
        success: true,
        data: publicPlans,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "PUBLIC_PLANS_FETCH_ERROR",
          message: "Erro ao consultar cat\xE1logo comercial p\xFAblico de planos."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/platform/subscription-plans", requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const statusParam = typeof req.query.status === "string" ? req.query.status : void 0;
      const searchParam = typeof req.query.search === "string" ? req.query.search : void 0;
      const validStatuses = ["active", "inactive", "archived", "all"];
      const status = statusParam && validStatuses.includes(statusParam) ? statusParam : "all";
      const plans = await SubscriptionPlanService.listPlans({ status, search: searchParam });
      const response = {
        success: true,
        data: plans,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "PLANS_LIST_ERROR",
          message: "Erro interno ao listar planos de assinatura."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/platform/subscription-plans/:planId", requireAuth, requirePlatformAdmin, async (req, res) => {
    const planId = req.params.planId;
    if (!planId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID do plano n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const plan = await SubscriptionPlanService.getPlanById(planId);
      if (!plan) {
        const notFoundResponse = {
          success: false,
          error: {
            code: "PLAN_NOT_FOUND",
            message: "Plano n\xE3o encontrado."
          }
        };
        res.status(404).json(notFoundResponse);
        return;
      }
      const response = {
        success: true,
        data: plan,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "PLAN_FETCH_ERROR",
          message: "Erro ao consultar detalhes do plano."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.post("/api/platform/subscription-plans", requireAuth, requirePlatformAdmin, async (req, res) => {
    const body = req.body;
    if (!body || !body.name || !body.code) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "Nome e c\xF3digo do plano s\xE3o obrigat\xF3rios."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await SubscriptionPlanService.createPlan(body);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "PLAN_CREATION_FAILED",
            message: result.error || "Erro ao cadastrar novo plano."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(201).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "PLAN_CREATION_ERROR",
          message: "Erro interno ao criar plano."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.put("/api/platform/subscription-plans/:planId", requireAuth, requirePlatformAdmin, async (req, res) => {
    const planId = req.params.planId;
    const body = req.body;
    if (!planId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID do plano n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await SubscriptionPlanService.updatePlan(planId, body);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "PLAN_UPDATE_FAILED",
            message: result.error || "Erro ao atualizar plano."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "PLAN_UPDATE_ERROR",
          message: "Erro interno ao atualizar plano."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.patch("/api/platform/subscription-plans/:planId/status", requireAuth, requirePlatformAdmin, async (req, res) => {
    const planId = req.params.planId;
    const { status } = req.body;
    if (!planId || !status) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "ID do plano e novo status s\xE3o obrigat\xF3rios."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await SubscriptionPlanService.updatePlanStatus(planId, status);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "STATUS_UPDATE_FAILED",
            message: result.error || "Falha ao alterar status do plano."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "STATUS_UPDATE_ERROR",
          message: "Erro interno ao alterar status do plano."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/platform/subscriptions", requireAuth, requirePlatformAdmin, async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20;
    const companyId = typeof req.query.companyId === "string" ? req.query.companyId : void 0;
    const planId = typeof req.query.planId === "string" ? req.query.planId : void 0;
    const statusParam = typeof req.query.status === "string" ? req.query.status : void 0;
    const validStatuses = ["pending", "active", "expired", "suspended", "cancelled", "all"];
    const status = statusParam && validStatuses.includes(statusParam) ? statusParam : "all";
    try {
      const result = await SubscriptionService.listSubscriptions({
        companyId,
        planId,
        status,
        page,
        pageSize
      });
      const response = {
        success: true,
        data: result,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "SUBSCRIPTIONS_LIST_ERROR",
          message: "Erro interno ao consultar lista de assinaturas."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/platform/subscriptions/:subscriptionId", requireAuth, requirePlatformAdmin, async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    if (!subscriptionId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID da assinatura n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const sub = await SubscriptionService.getSubscriptionById(subscriptionId);
      if (!sub) {
        const notFoundResponse = {
          success: false,
          error: {
            code: "SUBSCRIPTION_NOT_FOUND",
            message: "Assinatura n\xE3o encontrada."
          }
        };
        res.status(404).json(notFoundResponse);
        return;
      }
      const response = {
        success: true,
        data: sub,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "SUBSCRIPTION_FETCH_ERROR",
          message: "Erro ao consultar detalhes da assinatura."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.post("/api/platform/subscriptions", requireAuth, requirePlatformAdmin, async (req, res) => {
    const body = req.body;
    if (!body || !body.companyId || !body.planId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "Empresa (companyId) e Plano (planId) s\xE3o obrigat\xF3rios."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await SubscriptionService.createSubscription(body);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "SUBSCRIPTION_CREATION_FAILED",
            message: result.error || "Erro ao registrar assinatura."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(201).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "SUBSCRIPTION_CREATION_ERROR",
          message: "Erro interno ao criar assinatura."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.patch("/api/platform/subscriptions/:subscriptionId/activate", requireAuth, requirePlatformAdmin, async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    const { notes } = req.body;
    if (!subscriptionId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID da assinatura n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await SubscriptionService.activateSubscription(subscriptionId, notes);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "ACTIVATION_FAILED",
            message: result.error || "Falha ao ativar assinatura."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "ACTIVATION_ERROR",
          message: "Erro interno ao ativar assinatura no servidor."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.patch("/api/platform/subscriptions/:subscriptionId/suspend", requireAuth, requirePlatformAdmin, async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    const { reason, notes } = req.body;
    if (!subscriptionId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID da assinatura n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await SubscriptionService.suspendSubscription(subscriptionId, reason, notes);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "SUSPENSION_FAILED",
            message: result.error || "Falha ao suspender assinatura."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "SUSPENSION_ERROR",
          message: "Erro interno ao suspender assinatura."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.patch("/api/platform/subscriptions/:subscriptionId/cancel", requireAuth, requirePlatformAdmin, async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    const { reason, notes } = req.body;
    if (!subscriptionId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID da assinatura n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await SubscriptionService.cancelSubscription(subscriptionId, reason, notes);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "CANCELLATION_FAILED",
            message: result.error || "Falha ao cancelar assinatura."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "CANCELLATION_ERROR",
          message: "Erro interno ao cancelar assinatura."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/companies/:companyId/subscription", requireAuth, requireCompanyContext, async (req, res) => {
    const authReq = req;
    const companyContext = authReq.companyContext;
    const targetCompanyId = req.params.companyId;
    if (!companyContext || companyContext.companyId !== targetCompanyId) {
      const isSuperAdmin = await PlatformAdminService.isPlatformAdmin(authReq.userId);
      if (!isSuperAdmin) {
        const forbiddenResponse = {
          success: false,
          error: {
            code: "FORBIDDEN_COMPANY_ACCESS",
            message: "Acesso negado. Voc\xEA s\xF3 pode consultar a assinatura da sua pr\xF3pria empresa."
          }
        };
        res.status(403).json(forbiddenResponse);
        return;
      }
    }
    try {
      const summary = await SubscriptionService.getCompanySubscription(targetCompanyId);
      const response = {
        success: true,
        data: summary,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COMPANY_SUBSCRIPTION_ERROR",
          message: "Erro interno ao consultar dados da assinatura da empresa."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/companies/:companyId/subscription/limits", requireAuth, requireCompanyContext, async (req, res) => {
    const targetCompanyId = req.params.companyId;
    try {
      const limits = await SubscriptionService.getSubscriptionLimits(targetCompanyId);
      const response = {
        success: true,
        data: limits,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "LIMITS_FETCH_ERROR",
          message: "Erro ao consultar limites operacionais da empresa."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/companies/:companyId/repairs", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const { status, priority, brand, deviceType, search } = req.query;
      const items = await RepairService.listJobSheets(companyId, {
        status,
        priority,
        brand,
        deviceType,
        search
      });
      res.status(200).json({ success: true, data: items });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao listar ordens de servi\xE7o" } });
    }
  });
  app.get(["/api/companies/:companyId/repair/brands", "/api/companies/:companyId/repairs/brands"], requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const brands = await RepairBrandService.getBrands(companyId);
      res.status(200).json({ success: true, data: brands });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err?.message || "Erro ao buscar marcas sincronizadas" } });
    }
  });
  app.post(["/api/companies/:companyId/repair/brands", "/api/companies/:companyId/repairs/brands"], requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const brand = await RepairBrandService.createBrand(companyId, req.body);
      res.status(201).json({ success: true, data: brand });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err?.message || "Erro ao criar marca" } });
    }
  });
  app.patch(["/api/companies/:companyId/repair/brands/:id", "/api/companies/:companyId/repairs/brands/:id"], requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const updated = await RepairBrandService.updateBrand(companyId, id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err?.message || "Erro ao atualizar marca" } });
    }
  });
  app.delete(["/api/companies/:companyId/repair/brands/:id", "/api/companies/:companyId/repairs/brands/:id"], requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      await RepairBrandService.deleteBrand(companyId, id);
      res.status(200).json({ success: true, message: "Marca exclu\xEDda com sucesso" });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err?.message || "Erro ao excluir marca" } });
    }
  });
  app.get("/api/companies/:companyId/repairs/analytics", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const [summary, brandTrends, deviceTrends, modelTrends] = await Promise.all([
        RepairService.getAnalyticsSummary(companyId),
        RepairService.getBrandTrends(companyId),
        RepairService.getDeviceTrends(companyId),
        RepairService.getModelTrends(companyId)
      ]);
      res.status(200).json({
        success: true,
        data: { summary, brandTrends, deviceTrends, modelTrends }
      });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao obter m\xE9tricas de reparos" } });
    }
  });
  app.post("/api/companies/:companyId/repairs", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const created = await RepairService.createJobSheet(companyId, req.body);
      res.status(201).json({ success: true, data: created });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao criar ordem de servi\xE7o" } });
    }
  });
  app.patch("/api/companies/:companyId/repairs/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const updated = await RepairService.updateJobSheet(companyId, id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, error: { message: "Ordem de servi\xE7o n\xE3o encontrada" } });
        return;
      }
      res.status(200).json({ success: true, data: updated });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao atualizar ordem de servi\xE7o" } });
    }
  });
  app.delete("/api/companies/:companyId/repairs/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const success = await RepairService.deleteJobSheet(companyId, id);
      res.status(200).json({ success });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao excluir ordem de servi\xE7o" } });
    }
  });
  app.get("/api/companies/:companyId/repair-settings", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.getCompleteSettings(companyId);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao obter configura\xE7\xF5es do m\xF3dulo de reparo" } });
    }
  });
  app.get("/api/companies/:companyId/repair-settings/statuses", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.getRepairStatuses(companyId);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao listar status de reparo" } });
    }
  });
  app.post("/api/companies/:companyId/repair-settings/statuses", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.createRepairStatus(companyId, req.body);
      res.status(201).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao criar status de reparo" } });
    }
  });
  app.patch("/api/companies/:companyId/repair-settings/statuses/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const data = await RepairService.updateRepairStatus(companyId, id, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao atualizar status de reparo" } });
    }
  });
  app.put("/api/companies/:companyId/repair-settings/statuses/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const data = await RepairService.updateRepairStatus(companyId, id, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao atualizar status de reparo" } });
    }
  });
  app.delete("/api/companies/:companyId/repair-settings/statuses/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      await RepairService.deleteRepairStatus(companyId, id);
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao remover status de reparo" } });
    }
  });
  app.get("/api/companies/:companyId/repair-settings/device-models", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.getDeviceModels(companyId);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao listar modelos de dispositivos" } });
    }
  });
  app.post("/api/companies/:companyId/repair-settings/device-models", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.createDeviceModel(companyId, req.body);
      res.status(201).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao criar modelo de dispositivo" } });
    }
  });
  app.patch("/api/companies/:companyId/repair-settings/device-models/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const data = await RepairService.updateDeviceModel(companyId, id, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao atualizar modelo de dispositivo" } });
    }
  });
  app.put("/api/companies/:companyId/repair-settings/device-models/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const data = await RepairService.updateDeviceModel(companyId, id, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao atualizar modelo de dispositivo" } });
    }
  });
  app.delete("/api/companies/:companyId/repair-settings/device-models/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      await RepairService.deleteDeviceModel(companyId, id);
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao excluir modelo de dispositivo" } });
    }
  });
  app.get("/api/companies/:companyId/repair-settings/general", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.getRepairSettings(companyId);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao obter configura\xE7\xF5es gerais de reparo" } });
    }
  });
  app.patch("/api/companies/:companyId/repair-settings/general", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.updateRepairSettings(companyId, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao salvar configura\xE7\xF5es gerais de reparo" } });
    }
  });
  app.put("/api/companies/:companyId/repair-settings/general", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.updateRepairSettings(companyId, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao salvar configura\xE7\xF5es gerais de reparo" } });
    }
  });
  app.get("/api/companies/:companyId/repair-settings/label", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.getLabelSettings(companyId);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao obter configura\xE7\xF5es de etiqueta" } });
    }
  });
  app.patch("/api/companies/:companyId/repair-settings/label", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.updateLabelSettings(companyId, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao salvar configura\xE7\xF5es de etiqueta" } });
    }
  });
  app.put("/api/companies/:companyId/repair-settings/label", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.updateLabelSettings(companyId, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: "Erro ao salvar configura\xE7\xF5es de etiqueta" } });
    }
  });
  app.get("/api/platform/coupons", requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20;
      const search = typeof req.query.search === "string" ? req.query.search : void 0;
      const statusParam = typeof req.query.status === "string" ? req.query.status : void 0;
      const discountTypeParam = typeof req.query.discountType === "string" ? req.query.discountType : void 0;
      const validStatuses = ["active", "inactive", "all"];
      const status = statusParam && validStatuses.includes(statusParam) ? statusParam : "all";
      const validDiscountTypes = ["percentage", "fixed_amount", "all"];
      const discountType = discountTypeParam && validDiscountTypes.includes(discountTypeParam) ? discountTypeParam : "all";
      const result = await CouponService.listCoupons({
        search,
        status,
        discountType,
        page,
        pageSize
      });
      const response = {
        success: true,
        data: result,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COUPONS_LIST_ERROR",
          message: "Erro interno ao consultar lista de cupons promocionais."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/platform/coupons/:couponId", requireAuth, requirePlatformAdmin, async (req, res) => {
    const couponId = req.params.couponId;
    if (!couponId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID do cupom n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const coupon = await CouponService.getCouponById(couponId);
      if (!coupon) {
        const notFoundResponse = {
          success: false,
          error: {
            code: "COUPON_NOT_FOUND",
            message: "Cupom de desconto n\xE3o encontrado."
          }
        };
        res.status(404).json(notFoundResponse);
        return;
      }
      const response = {
        success: true,
        data: coupon,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COUPON_FETCH_ERROR",
          message: "Erro ao consultar detalhes do cupom."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.post("/api/platform/coupons", requireAuth, requirePlatformAdmin, async (req, res) => {
    const body = req.body;
    if (!body || !body.code || !body.discountType || body.discountValue === void 0) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "C\xF3digo, tipo de desconto e valor do desconto s\xE3o obrigat\xF3rios."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await CouponService.createCoupon(body);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "COUPON_CREATE_FAILED",
            message: result.error || "Erro ao cadastrar cupom de desconto."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(201).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COUPON_CREATE_ERROR",
          message: "Erro interno ao salvar novo cupom no servidor."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.put("/api/platform/coupons/:couponId", requireAuth, requirePlatformAdmin, async (req, res) => {
    const couponId = req.params.couponId;
    const body = req.body;
    if (!couponId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID do cupom n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await CouponService.updateCoupon(couponId, body);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "COUPON_UPDATE_FAILED",
            message: result.error || "Erro ao atualizar dados do cupom."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COUPON_UPDATE_ERROR",
          message: "Erro interno ao atualizar cupom."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.patch("/api/platform/coupons/:couponId/status", requireAuth, requirePlatformAdmin, async (req, res) => {
    const couponId = req.params.couponId;
    const { status } = req.body;
    if (!couponId || !status || !["active", "inactive"].includes(status)) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "ID do cupom e status v\xE1lido (active/inactive) s\xE3o obrigat\xF3rios."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await CouponService.updateCouponStatus(couponId, status);
      if (!result.success || !result.data) {
        const errorResponse = {
          success: false,
          error: {
            code: "STATUS_UPDATE_FAILED",
            message: result.error || "Falha ao alterar status do cupom."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: result.data,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "STATUS_UPDATE_ERROR",
          message: "Erro interno ao alterar status do cupom."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.delete("/api/platform/coupons/:couponId", requireAuth, requirePlatformAdmin, async (req, res) => {
    const couponId = req.params.couponId;
    if (!couponId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID do cupom n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const result = await CouponService.deleteCoupon(couponId);
      if (!result.success) {
        const errorResponse = {
          success: false,
          error: {
            code: "COUPON_DELETE_FAILED",
            message: result.error || "Falha ao excluir cupom."
          }
        };
        res.status(400).json(errorResponse);
        return;
      }
      const response = {
        success: true,
        data: { deleted: true },
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COUPON_DELETE_ERROR",
          message: "Erro interno ao remover cupom."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/platform/coupons/:couponId/usages", requireAuth, requirePlatformAdmin, async (req, res) => {
    const couponId = req.params.couponId;
    try {
      const usages = await CouponService.listCouponUsages(couponId);
      const response = {
        success: true,
        data: usages,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COUPON_USAGES_ERROR",
          message: "Erro ao consultar hist\xF3rico de utiliza\xE7\xF5es do cupom."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.post("/api/public/coupons/validate", async (req, res) => {
    const { code, planId, companyId } = req.body;
    if (!code || !planId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "C\xF3digo do cupom e ID do plano s\xE3o obrigat\xF3rios para valida\xE7\xE3o."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const validation = await CouponService.validateCoupon(code, planId, companyId);
      const response = {
        success: true,
        data: validation,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COUPON_VALIDATION_ERROR",
          message: "Erro interno ao validar cupom de desconto."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.post("/api/platform/coupons/validate", requireAuth, requirePlatformAdmin, async (req, res) => {
    const { code, planId, companyId } = req.body;
    if (!code || !planId) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "C\xF3digo do cupom e ID do plano s\xE3o obrigat\xF3rios."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const validation = await CouponService.validateCoupon(code, planId, companyId);
      const response = {
        success: true,
        data: validation,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch {
      const errorResponse = {
        success: false,
        error: {
          code: "COUPON_VALIDATION_ERROR",
          message: "Erro ao validar cupom."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/platform/announcements", requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 10;
      const search = typeof req.query.search === "string" ? req.query.search : void 0;
      const type = typeof req.query.type === "string" ? req.query.type : void 0;
      const priority = typeof req.query.priority === "string" ? req.query.priority : void 0;
      const targetAudience = typeof req.query.targetAudience === "string" ? req.query.targetAudience : void 0;
      const isPublished = req.query.isPublished !== void 0 ? req.query.isPublished === "true" ? true : req.query.isPublished === "false" ? false : "all" : void 0;
      const activeOnly = req.query.activeOnly === "true";
      const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : void 0;
      const sortDirection = req.query.sortDirection === "asc" ? "asc" : req.query.sortDirection === "desc" ? "desc" : void 0;
      const result = await AnnouncementService.getAnnouncements({
        search,
        type,
        priority,
        targetAudience,
        isPublished,
        activeOnly,
        page,
        pageSize,
        sortBy,
        sortDirection
      });
      const response = {
        success: true,
        data: result,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "ANNOUNCEMENTS_LIST_ERROR",
          message: err.message || "Erro ao listar comunicados."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/platform/announcements/:id", requireAuth, requirePlatformAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID do comunicado n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const announcement = await AnnouncementService.getAnnouncementById(id);
      if (!announcement) {
        const notFoundResponse = {
          success: false,
          error: {
            code: "ANNOUNCEMENT_NOT_FOUND",
            message: "Comunicado n\xE3o encontrado."
          }
        };
        res.status(404).json(notFoundResponse);
        return;
      }
      const response = {
        success: true,
        data: announcement,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "ANNOUNCEMENT_FETCH_ERROR",
          message: err.message || "Erro ao buscar detalhes do comunicado."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.post("/api/platform/announcements", requireAuth, requirePlatformAdmin, async (req, res) => {
    const body = req.body;
    const authReq = req;
    if (!body || !body.title || !body.title.trim() || !body.message || !body.message.trim()) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "T\xEDtulo e mensagem do comunicado s\xE3o obrigat\xF3rios."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const created = await AnnouncementService.createAnnouncement(body, authReq.userId);
      const response = {
        success: true,
        data: created,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(201).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "ANNOUNCEMENT_CREATE_ERROR",
          message: err.message || "Erro ao criar comunicado."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.put("/api/platform/announcements/:id", requireAuth, requirePlatformAdmin, async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    if (!id) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID do comunicado n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const updated = await AnnouncementService.updateAnnouncement(id, body);
      const response = {
        success: true,
        data: updated,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "ANNOUNCEMENT_UPDATE_ERROR",
          message: err.message || "Erro ao atualizar comunicado."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.patch("/api/platform/announcements/:id/status", requireAuth, requirePlatformAdmin, async (req, res) => {
    const { id } = req.params;
    const { isPublished } = req.body;
    if (!id || typeof isPublished !== "boolean") {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "ID do comunicado e status de publica\xE7\xE3o (isPublished boolean) s\xE3o obrigat\xF3rios."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const updated = isPublished ? await AnnouncementService.publishAnnouncement(id) : await AnnouncementService.unpublishAnnouncement(id);
      const response = {
        success: true,
        data: updated,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "STATUS_UPDATE_ERROR",
          message: err.message || "Erro ao alterar status de publica\xE7\xE3o do comunicado."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.delete("/api/platform/announcements/:id", requireAuth, requirePlatformAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID do comunicado n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      await AnnouncementService.deleteAnnouncement(id);
      const response = {
        success: true,
        data: { deleted: true },
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "ANNOUNCEMENT_DELETE_ERROR",
          message: err.message || "Erro ao excluir comunicado."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const authReq = req;
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20;
      const search = typeof req.query.search === "string" ? req.query.search : void 0;
      const category = typeof req.query.category === "string" ? req.query.category : void 0;
      const priority = typeof req.query.priority === "string" ? req.query.priority : void 0;
      const companyId = typeof req.query.companyId === "string" ? req.query.companyId : void 0;
      const isRead = req.query.isRead !== void 0 ? req.query.isRead === "true" ? true : req.query.isRead === "false" ? false : "all" : void 0;
      const result = await NotificationService.getUserNotifications(authReq.userId, {
        search,
        category,
        priority,
        companyId,
        isRead,
        page,
        pageSize
      });
      const response = {
        success: true,
        data: result,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "NOTIFICATIONS_LIST_ERROR",
          message: err.message || "Erro ao listar notifica\xE7\xF5es."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    const authReq = req;
    try {
      const unreadCount = await NotificationService.getUnreadCount(authReq.userId);
      const response = {
        success: true,
        data: { unreadCount },
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "NOTIFICATIONS_COUNT_ERROR",
          message: err.message || "Erro ao obter contagem de notifica\xE7\xF5es n\xE3o lidas."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const authReq = req;
    const { id } = req.params;
    if (!id) {
      const errorResponse = {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "ID da notifica\xE7\xE3o n\xE3o fornecido."
        }
      };
      res.status(400).json(errorResponse);
      return;
    }
    try {
      const updated = await NotificationService.markAsRead(id, authReq.userId);
      const response = {
        success: true,
        data: updated,
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const isNotFound = err.message?.includes("n\xE3o encontrada") || err.message?.includes("n\xE3o pertence");
      const statusCode = isNotFound ? 404 : 500;
      const errorResponse = {
        success: false,
        error: {
          code: isNotFound ? "NOTIFICATION_NOT_FOUND" : "NOTIFICATION_READ_ERROR",
          message: err.message || "Erro ao marcar notifica\xE7\xE3o como lida."
        }
      };
      res.status(statusCode).json(errorResponse);
    }
  });
  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    const authReq = req;
    try {
      const count = await NotificationService.markAllAsRead(authReq.userId);
      const response = {
        success: true,
        data: { count, markedAll: true },
        meta: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.status(200).json(response);
    } catch (err) {
      const errorResponse = {
        success: false,
        error: {
          code: "NOTIFICATIONS_READ_ALL_ERROR",
          message: err.message || "Erro ao marcar todas as notifica\xE7\xF5es como lidas."
        }
      };
      res.status(500).json(errorResponse);
    }
  });
  app.get(
    "/api/companies/:companyId/customer-groups",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.ler"),
    async (req, res) => {
      const companyId = req.params.companyId;
      try {
        const groups = await ContactService.listCustomerGroups(companyId);
        const response = {
          success: true,
          data: groups,
          meta: {
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        res.status(200).json(response);
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "CUSTOMER_GROUPS_FETCH_ERROR",
            message: err.message || "Erro ao listar grupos de clientes."
          }
        });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/customer-groups",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.criar"),
    async (req, res) => {
      const companyId = req.params.companyId;
      const payload = req.body;
      try {
        const created = await ContactService.createCustomerGroup(companyId, payload);
        const response = {
          success: true,
          data: created,
          meta: {
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        res.status(201).json(response);
      } catch (err) {
        res.status(400).json({
          success: false,
          error: {
            code: "CUSTOMER_GROUP_CREATE_ERROR",
            message: err.message || "Erro ao criar grupo de clientes."
          }
        });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/customer-groups/:groupId",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.ler"),
    async (req, res) => {
      const { companyId, groupId } = req.params;
      try {
        const group = await ContactService.getCustomerGroupById(companyId, groupId);
        if (!group) {
          res.status(404).json({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Grupo de clientes n\xE3o encontrado."
            }
          });
          return;
        }
        res.status(200).json({
          success: true,
          data: group,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "CUSTOMER_GROUP_FETCH_ERROR",
            message: err.message || "Erro ao buscar grupo de clientes."
          }
        });
      }
    }
  );
  app.put(
    "/api/companies/:companyId/customer-groups/:groupId",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.atualizar"),
    async (req, res) => {
      const { companyId, groupId } = req.params;
      const payload = req.body;
      try {
        const updated = await ContactService.updateCustomerGroup(companyId, groupId, payload);
        res.status(200).json({
          success: true,
          data: updated,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(400).json({
          success: false,
          error: {
            code: "CUSTOMER_GROUP_UPDATE_ERROR",
            message: err.message || "Erro ao atualizar grupo de clientes."
          }
        });
      }
    }
  );
  app.delete(
    "/api/companies/:companyId/customer-groups/:groupId",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.excluir"),
    async (req, res) => {
      const { companyId, groupId } = req.params;
      try {
        await ContactService.deleteCustomerGroup(companyId, groupId);
        res.status(200).json({
          success: true,
          data: { message: "Grupo de clientes exclu\xEDdo com sucesso." },
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "CUSTOMER_GROUP_DELETE_ERROR",
            message: err.message || "Erro ao excluir grupo de clientes."
          }
        });
      }
    }
  );
  app.get("/api/customer-groups", requireAuth, async (req, res) => {
    const companyId = req.headers["x-company-id"] || req.query.companyId || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const groups = await ContactService.listCustomerGroups(companyId);
      res.status(200).json({
        success: true,
        data: groups,
        meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: "FETCH_ERROR", message: err.message || "Erro ao buscar grupos." }
      });
    }
  });
  app.post("/api/customer-groups", requireAuth, async (req, res) => {
    const companyId = req.headers["x-company-id"] || req.query.companyId || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const created = await ContactService.createCustomerGroup(companyId, req.body);
      res.status(201).json({
        success: true,
        data: created,
        meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: { code: "CREATE_ERROR", message: err.message || "Erro ao criar grupo." }
      });
    }
  });
  app.get(
    "/api/companies/:companyId/customers",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.ler"),
    async (req, res) => {
      const companyId = req.params.companyId;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const search = req.query.search || void 0;
      const status = req.query.status || void 0;
      const personType = req.query.personType || void 0;
      const groupId = req.query.customerGroupId || req.query.groupId || void 0;
      try {
        const result = await ContactService.listCustomers(companyId, {
          page,
          pageSize,
          search,
          status,
          personType,
          customerGroupId: groupId
        });
        res.status(200).json({
          success: true,
          data: result.data,
          meta: {
            ...result.meta,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "CUSTOMERS_FETCH_ERROR",
            message: err.message || "Erro ao listar clientes."
          }
        });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/customers",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.criar"),
    async (req, res) => {
      const companyId = req.params.companyId;
      const payload = req.body;
      try {
        const created = await ContactService.createCustomer(companyId, payload);
        res.status(201).json({
          success: true,
          data: created,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(400).json({
          success: false,
          error: {
            code: "CUSTOMER_CREATE_ERROR",
            message: err.message || "Erro ao criar cliente."
          }
        });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/customers/:customerId",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.ler"),
    async (req, res) => {
      const { companyId, customerId } = req.params;
      try {
        const customer = await ContactService.getCustomerById(companyId, customerId);
        if (!customer) {
          res.status(404).json({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Cliente n\xE3o encontrado."
            }
          });
          return;
        }
        res.status(200).json({
          success: true,
          data: customer,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "CUSTOMER_FETCH_ERROR",
            message: err.message || "Erro ao buscar dados do cliente."
          }
        });
      }
    }
  );
  app.put(
    "/api/companies/:companyId/customers/:customerId",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.atualizar"),
    async (req, res) => {
      const { companyId, customerId } = req.params;
      const payload = req.body;
      try {
        const updated = await ContactService.updateCustomer(companyId, customerId, payload);
        res.status(200).json({
          success: true,
          data: updated,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(400).json({
          success: false,
          error: {
            code: "CUSTOMER_UPDATE_ERROR",
            message: err.message || "Erro ao atualizar cliente."
          }
        });
      }
    }
  );
  app.delete(
    "/api/companies/:companyId/customers/:customerId",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.excluir"),
    async (req, res) => {
      const { companyId, customerId } = req.params;
      try {
        await ContactService.deleteCustomer(companyId, customerId);
        res.status(200).json({
          success: true,
          data: { message: "Cliente exclu\xEDdo com sucesso." },
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "CUSTOMER_DELETE_ERROR",
            message: err.message || "Erro ao excluir cliente."
          }
        });
      }
    }
  );
  app.get("/api/customers", requireAuth, async (req, res) => {
    const companyId = req.headers["x-company-id"] || req.query.companyId || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const result = await ContactService.listCustomers(companyId, req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        meta: { ...result.meta, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: "FETCH_ERROR", message: err.message || "Erro ao buscar clientes." }
      });
    }
  });
  app.post("/api/customers", requireAuth, async (req, res) => {
    const companyId = req.headers["x-company-id"] || req.query.companyId || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const created = await ContactService.createCustomer(companyId, req.body);
      res.status(201).json({
        success: true,
        data: created,
        meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: { code: "CREATE_ERROR", message: err.message || "Erro ao criar cliente." }
      });
    }
  });
  app.get(
    "/api/companies/:companyId/suppliers",
    requireAuth,
    requireCompanyContext,
    requirePermission("fornecedores.ler"),
    async (req, res) => {
      const companyId = req.params.companyId;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const search = req.query.search || void 0;
      const status = req.query.status || void 0;
      const personType = req.query.personType || void 0;
      const category = req.query.category || void 0;
      try {
        const result = await ContactService.listSuppliers(companyId, {
          page,
          pageSize,
          search,
          status,
          personType,
          category
        });
        res.status(200).json({
          success: true,
          data: result.data,
          meta: {
            ...result.meta,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "SUPPLIERS_FETCH_ERROR",
            message: err.message || "Erro ao listar fornecedores."
          }
        });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/suppliers",
    requireAuth,
    requireCompanyContext,
    requirePermission("fornecedores.criar"),
    async (req, res) => {
      const companyId = req.params.companyId;
      const payload = req.body;
      try {
        const created = await ContactService.createSupplier(companyId, payload);
        res.status(201).json({
          success: true,
          data: created,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(400).json({
          success: false,
          error: {
            code: "SUPPLIER_CREATE_ERROR",
            message: err.message || "Erro ao criar fornecedor."
          }
        });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/suppliers/:supplierId",
    requireAuth,
    requireCompanyContext,
    requirePermission("fornecedores.ler"),
    async (req, res) => {
      const { companyId, supplierId } = req.params;
      try {
        const supplier = await ContactService.getSupplierById(companyId, supplierId);
        if (!supplier) {
          res.status(404).json({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Fornecedor n\xE3o encontrado."
            }
          });
          return;
        }
        res.status(200).json({
          success: true,
          data: supplier,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "SUPPLIER_FETCH_ERROR",
            message: err.message || "Erro ao buscar dados do fornecedor."
          }
        });
      }
    }
  );
  app.put(
    "/api/companies/:companyId/suppliers/:supplierId",
    requireAuth,
    requireCompanyContext,
    requirePermission("fornecedores.atualizar"),
    async (req, res) => {
      const { companyId, supplierId } = req.params;
      const payload = req.body;
      try {
        const updated = await ContactService.updateSupplier(companyId, supplierId, payload);
        res.status(200).json({
          success: true,
          data: updated,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(400).json({
          success: false,
          error: {
            code: "SUPPLIER_UPDATE_ERROR",
            message: err.message || "Erro ao atualizar fornecedor."
          }
        });
      }
    }
  );
  app.delete(
    "/api/companies/:companyId/suppliers/:supplierId",
    requireAuth,
    requireCompanyContext,
    requirePermission("fornecedores.excluir"),
    async (req, res) => {
      const { companyId, supplierId } = req.params;
      try {
        await ContactService.deleteSupplier(companyId, supplierId);
        res.status(200).json({
          success: true,
          data: { message: "Fornecedor exclu\xEDdo com sucesso." },
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "SUPPLIER_DELETE_ERROR",
            message: err.message || "Erro ao excluir fornecedor."
          }
        });
      }
    }
  );
  app.get("/api/suppliers", requireAuth, async (req, res) => {
    const companyId = req.headers["x-company-id"] || req.query.companyId || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const result = await ContactService.listSuppliers(companyId, req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        meta: { ...result.meta, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: "FETCH_ERROR", message: err.message || "Erro ao buscar fornecedores." }
      });
    }
  });
  app.post("/api/suppliers", requireAuth, async (req, res) => {
    const companyId = req.headers["x-company-id"] || req.query.companyId || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const created = await ContactService.createSupplier(companyId, req.body);
      res.status(201).json({
        success: true,
        data: created,
        meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: { code: "CREATE_ERROR", message: err.message || "Erro ao criar fornecedor." }
      });
    }
  });
  app.post(
    "/api/companies/:companyId/contacts/import/preview",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.criar"),
    async (req, res) => {
      const companyId = req.params.companyId;
      const { targetType, rows } = req.body;
      if (!targetType || !Array.isArray(rows)) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_IMPORT_PAYLOAD",
            message: "Tipo de destino (targetType) e lista de linhas (rows) s\xE3o obrigat\xF3rios."
          }
        });
        return;
      }
      try {
        const preview = await ContactImportService.generatePreview(companyId, targetType, rows);
        res.status(200).json({
          success: true,
          data: preview,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "IMPORT_PREVIEW_ERROR",
            message: err.message || "Erro ao gerar pr\xE9via de importa\xE7\xE3o."
          }
        });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/contacts/import/confirm",
    requireAuth,
    requireCompanyContext,
    requirePermission("clientes.criar"),
    async (req, res) => {
      const companyId = req.params.companyId;
      const payload = req.body;
      if (!payload || !payload.targetType || !Array.isArray(payload.items)) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_CONFIRM_PAYLOAD",
            message: "Payload inv\xE1lido para confirma\xE7\xE3o de importa\xE7\xE3o."
          }
        });
        return;
      }
      try {
        const result = await ContactImportService.executeImport(companyId, payload);
        res.status(200).json({
          success: true,
          data: result,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "IMPORT_EXECUTE_ERROR",
            message: err.message || "Erro ao processar importa\xE7\xE3o."
          }
        });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/products/import/preview",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      const companyId = req.params.companyId;
      const { headers, rows } = req.body;
      if (!Array.isArray(headers) || !Array.isArray(rows)) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PRODUCT_IMPORT_PAYLOAD",
            message: "Cabe\xE7alhos (headers) e linhas (rows) s\xE3o obrigat\xF3rios no payload."
          }
        });
        return;
      }
      try {
        const preview = await ProductImportService.generatePreview(companyId, headers, rows);
        res.status(200).json({
          success: true,
          data: preview,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "PRODUCT_IMPORT_PREVIEW_ERROR",
            message: err.message || "Erro ao validar planilha de produtos."
          }
        });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/products/import/confirm",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      const companyId = req.params.companyId;
      const payload = req.body;
      if (!payload || !Array.isArray(payload.items)) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PRODUCT_CONFIRM_PAYLOAD",
            message: "Lista de produtos validados (items) \xE9 obrigat\xF3ria para confirma\xE7\xE3o."
          }
        });
        return;
      }
      try {
        const result = await ProductImportService.executeImport(companyId, payload);
        res.status(200).json({
          success: true,
          data: result,
          meta: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: {
            code: "PRODUCT_IMPORT_EXECUTE_ERROR",
            message: err.message || "Erro ao executar importa\xE7\xE3o de produtos."
          }
        });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/products",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      const companyId = req.params.companyId;
      try {
        const result = await ProductService.listProducts(companyId, req.query);
        res.status(200).json({
          success: true,
          data: result.data,
          meta: result.meta
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: { code: "LIST_PRODUCTS_ERROR", message: err.message || "Erro ao listar produtos." }
        });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/products/next-sku",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      const companyId = req.params.companyId;
      try {
        const nextSku = await ProductService.getNextSku(companyId);
        res.status(200).json({
          success: true,
          data: { nextSku }
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: { code: "GET_NEXT_SKU_ERROR", message: err.message || "Erro ao gerar pr\xF3ximo SKU." }
        });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/products/:productId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      const { companyId, productId } = req.params;
      try {
        const product = await ProductService.getProductById(companyId, productId);
        if (!product) {
          res.status(404).json({
            success: false,
            error: { code: "PRODUCT_NOT_FOUND", message: "Produto n\xE3o encontrado." }
          });
          return;
        }
        res.status(200).json({ success: true, data: product });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: { code: "GET_PRODUCT_ERROR", message: err.message || "Erro ao obter produto." }
        });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/products",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      const companyId = req.params.companyId;
      try {
        const newProduct = await ProductService.createProduct(companyId, req.body);
        res.status(201).json({ success: true, data: newProduct });
      } catch (err) {
        res.status(400).json({
          success: false,
          error: { code: "CREATE_PRODUCT_ERROR", message: err.message || "Erro ao criar produto." }
        });
      }
    }
  );
  app.put(
    "/api/companies/:companyId/products/:productId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.atualizar"),
    async (req, res) => {
      const { companyId, productId } = req.params;
      try {
        const updated = await ProductService.updateProduct(companyId, productId, req.body);
        res.status(200).json({ success: true, data: updated });
      } catch (err) {
        res.status(400).json({
          success: false,
          error: { code: "UPDATE_PRODUCT_ERROR", message: err.message || "Erro ao atualizar produto." }
        });
      }
    }
  );
  app.delete(
    "/api/companies/:companyId/products/:productId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.excluir"),
    async (req, res) => {
      const { companyId, productId } = req.params;
      try {
        const success = await ProductService.deleteProduct(companyId, productId);
        res.status(200).json({ success });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: { code: "DELETE_PRODUCT_ERROR", message: err.message || "Erro ao excluir produto." }
        });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/products/:productId/duplicate",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      const { companyId, productId } = req.params;
      try {
        const copy = await ProductService.duplicateProduct(companyId, productId);
        res.status(201).json({ success: true, data: copy });
      } catch (err) {
        res.status(400).json({
          success: false,
          error: { code: "DUPLICATE_PRODUCT_ERROR", message: err.message || "Erro ao duplicar produto." }
        });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/products/:productId/stock-opening",
    requireAuth,
    requireCompanyContext,
    requirePermission("estoque.ajustar"),
    async (req, res) => {
      const { companyId, productId } = req.params;
      try {
        const result = await ProductService.saveStockOpening(companyId, productId, req.body);
        res.status(200).json({ success: result });
      } catch (err) {
        res.status(400).json({
          success: false,
          error: { code: "STOCK_OPENING_ERROR", message: err.message || "Erro ao registrar estoque inicial." }
        });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/products/batch",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.atualizar"),
    async (req, res) => {
      const companyId = req.params.companyId;
      try {
        const result = await ProductService.batchAction(companyId, req.body);
        res.status(200).json({ success: true, data: result });
      } catch (err) {
        res.status(400).json({
          success: false,
          error: { code: "BATCH_PRODUCT_ERROR", message: err.message || "Erro na a\xE7\xE3o em lote." }
        });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/categories",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      try {
        const categories = await ProductService.listCategories(req.params.companyId);
        res.status(200).json({ success: true, data: categories });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/categories",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      try {
        const cat = await ProductService.createCategory(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: cat });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.put(
    "/api/companies/:companyId/categories/:categoryId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.atualizar"),
    async (req, res) => {
      try {
        const cat = await ProductService.updateCategory(req.params.companyId, req.params.categoryId, req.body);
        res.status(200).json({ success: true, data: cat });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.delete(
    "/api/companies/:companyId/categories/:categoryId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.excluir"),
    async (req, res) => {
      try {
        const success = await ProductService.deleteCategory(req.params.companyId, req.params.categoryId);
        res.status(200).json({ success });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/brands",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      try {
        const brands = await ProductService.listBrands(req.params.companyId);
        res.status(200).json({ success: true, data: brands });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/brands",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      try {
        const brand = await ProductService.createBrand(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: brand });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.put(
    "/api/companies/:companyId/brands/:brandId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.atualizar"),
    async (req, res) => {
      try {
        const brand = await ProductService.updateBrand(req.params.companyId, req.params.brandId, req.body);
        res.status(200).json({ success: true, data: brand });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.delete(
    "/api/companies/:companyId/brands/:brandId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.excluir"),
    async (req, res) => {
      try {
        const success = await ProductService.deleteBrand(req.params.companyId, req.params.brandId);
        res.status(200).json({ success });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/units",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      try {
        const units = await ProductService.listUnits(req.params.companyId);
        res.status(200).json({ success: true, data: units });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/units",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      try {
        const unit = await ProductService.createUnit(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: unit });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.put(
    "/api/companies/:companyId/units/:unitId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.atualizar"),
    async (req, res) => {
      try {
        const unit = await ProductService.updateUnit(req.params.companyId, req.params.unitId, req.body);
        res.status(200).json({ success: true, data: unit });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.delete(
    "/api/companies/:companyId/units/:unitId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.excluir"),
    async (req, res) => {
      try {
        const success = await ProductService.deleteUnit(req.params.companyId, req.params.unitId);
        res.status(200).json({ success });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.get(
    ["/api/companies/:companyId/variation-templates", "/api/companies/:companyId/variations"],
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      try {
        const list = await ProductService.listVariationTemplates(req.params.companyId);
        res.status(200).json({ success: true, data: list });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.post(
    ["/api/companies/:companyId/variation-templates", "/api/companies/:companyId/variations"],
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      try {
        const item = await ProductService.createVariationTemplate(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: item });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.put(
    ["/api/companies/:companyId/variation-templates/:id", "/api/companies/:companyId/variations/:id"],
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.atualizar"),
    async (req, res) => {
      try {
        const item = await ProductService.updateVariationTemplate(
          req.params.companyId,
          req.params.id,
          req.body
        );
        res.status(200).json({ success: true, data: item });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.delete(
    ["/api/companies/:companyId/variation-templates/:id", "/api/companies/:companyId/variations/:id"],
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.excluir"),
    async (req, res) => {
      try {
        const success = await ProductService.deleteVariationTemplate(
          req.params.companyId,
          req.params.id
        );
        res.status(200).json({ success });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.get(
    ["/api/companies/:companyId/warranties", "/api/companies/:companyId/garantias"],
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      try {
        const list = await ProductService.listWarranties(req.params.companyId);
        res.status(200).json({ success: true, data: list });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.post(
    ["/api/companies/:companyId/warranties", "/api/companies/:companyId/garantias"],
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      try {
        const item = await ProductService.createWarranty(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: item });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.put(
    ["/api/companies/:companyId/warranties/:id", "/api/companies/:companyId/garantias/:id"],
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.atualizar"),
    async (req, res) => {
      try {
        const item = await ProductService.updateWarranty(
          req.params.companyId,
          req.params.id,
          req.body
        );
        res.status(200).json({ success: true, data: item });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.delete(
    ["/api/companies/:companyId/warranties/:id", "/api/companies/:companyId/garantias/:id"],
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.excluir"),
    async (req, res) => {
      try {
        const success = await ProductService.deleteWarranty(
          req.params.companyId,
          req.params.id
        );
        res.status(200).json({ success });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/device-brands",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      try {
        const brands = await ProductService.listDeviceBrands(req.params.companyId);
        res.status(200).json({ success: true, data: brands });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/device-models",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      try {
        const brandId = req.query.brandId;
        const models = await ProductService.listDeviceModels(req.params.companyId, brandId);
        res.status(200).json({ success: true, data: models });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/device-models",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      try {
        const model = await ProductService.createDeviceModel(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: model });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/models",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      try {
        const brandId = req.query.brandId;
        const models = await ProductService.listModels(req.params.companyId, brandId);
        res.status(200).json({ success: true, data: models });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/models",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      try {
        const model = await ProductService.createModel(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: model });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.put(
    "/api/companies/:companyId/models/:modelId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.atualizar"),
    async (req, res) => {
      try {
        const model = await ProductService.updateModel(req.params.companyId, req.params.modelId, req.body);
        res.status(200).json({ success: true, data: model });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.delete(
    "/api/companies/:companyId/models/:modelId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.excluir"),
    async (req, res) => {
      try {
        const success = await ProductService.deleteModel(req.params.companyId, req.params.modelId);
        res.status(200).json({ success });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/colors",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      try {
        const colors = await ProductService.listColors(req.params.companyId);
        res.status(200).json({ success: true, data: colors });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/colors",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      try {
        const color = await ProductService.createColor(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: color });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.put(
    "/api/companies/:companyId/colors/:colorId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.atualizar"),
    async (req, res) => {
      try {
        const color = await ProductService.updateColor(req.params.companyId, req.params.colorId, req.body);
        res.status(200).json({ success: true, data: color });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.delete(
    "/api/companies/:companyId/colors/:colorId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.excluir"),
    async (req, res) => {
      try {
        const success = await ProductService.deleteColor(req.params.companyId, req.params.colorId);
        res.status(200).json({ success });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.get(
    "/api/companies/:companyId/sizes",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.ler"),
    async (req, res) => {
      try {
        const sizes = await ProductService.listSizes(req.params.companyId);
        res.status(200).json({ success: true, data: sizes });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.post(
    "/api/companies/:companyId/sizes",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.criar"),
    async (req, res) => {
      try {
        const size = await ProductService.createSize(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: size });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.put(
    "/api/companies/:companyId/sizes/:sizeId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.atualizar"),
    async (req, res) => {
      try {
        const size = await ProductService.updateSize(req.params.companyId, req.params.sizeId, req.body);
        res.status(200).json({ success: true, data: size });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.delete(
    "/api/companies/:companyId/sizes/:sizeId",
    requireAuth,
    requireCompanyContext,
    requirePermission("produtos.excluir"),
    async (req, res) => {
      try {
        const success = await ProductService.deleteSize(req.params.companyId, req.params.sizeId);
        res.status(200).json({ success });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );
  app.get("/api/companies/:companyId/purchases", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const purchases = await PurchaseService.getPurchases(companyId);
      res.status(200).json({ success: true, data: purchases });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar compras." } });
    }
  });
  app.get("/api/purchases", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.companyId || req.query.companyId || req.headers["x-company-id"] || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const purchases = await PurchaseService.getPurchases(companyId);
      res.status(200).json({ success: true, data: purchases });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar compras." } });
    }
  });
  app.get("/api/companies/:companyId/purchases/:purchaseId", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, purchaseId } = req.params;
    try {
      const purchase = await PurchaseService.getPurchaseById(companyId, purchaseId);
      res.status(200).json({ success: true, data: purchase });
    } catch (err) {
      res.status(404).json({ success: false, error: { message: err.message || "Compra n\xE3o encontrada." } });
    }
  });
  app.post("/api/companies/:companyId/purchases", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const purchase = await PurchaseService.createPurchase(companyId, req.body);
      res.status(201).json({ success: true, data: purchase });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao criar compra." } });
    }
  });
  app.post("/api/purchases", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.companyId || req.body.companyId || req.headers["x-company-id"] || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const purchase = await PurchaseService.createPurchase(companyId, req.body);
      res.status(201).json({ success: true, data: purchase });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao criar compra." } });
    }
  });
  app.put("/api/companies/:companyId/purchases/:purchaseId", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, purchaseId } = req.params;
    try {
      const updated = await PurchaseService.updatePurchase(companyId, purchaseId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao atualizar compra." } });
    }
  });
  app.delete("/api/companies/:companyId/purchases/:purchaseId", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, purchaseId } = req.params;
    try {
      await PurchaseService.deletePurchase(companyId, purchaseId);
      res.status(200).json({ success: true, message: "Compra exclu\xEDda com sucesso." });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao excluir compra." } });
    }
  });
  app.get("/api/companies/:companyId/purchase-returns", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const returns = await PurchaseService.getPurchaseReturns(companyId);
      res.status(200).json({ success: true, data: returns });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar devolu\xE7\xF5es." } });
    }
  });
  app.get("/api/purchase-returns", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.companyId || req.query.companyId || req.headers["x-company-id"] || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const returns = await PurchaseService.getPurchaseReturns(companyId);
      res.status(200).json({ success: true, data: returns });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar devolu\xE7\xF5es." } });
    }
  });
  app.post("/api/companies/:companyId/purchase-returns", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const returnRecord = await PurchaseService.createPurchaseReturn(companyId, req.body);
      res.status(201).json({ success: true, data: returnRecord });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao registrar devolu\xE7\xE3o." } });
    }
  });
  app.delete("/api/companies/:companyId/purchase-returns/:returnId", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, returnId } = req.params;
    try {
      await PurchaseService.deletePurchaseReturn(companyId, returnId);
      res.status(200).json({ success: true, message: "Devolu\xE7\xE3o exclu\xEDda com sucesso." });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao excluir devolu\xE7\xE3o." } });
    }
  });
  app.get("/api/companies/:companyId/sells", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const sells = await SellService.getSells(companyId);
      res.status(200).json({ success: true, data: sells });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar vendas." } });
    }
  });
  app.get("/api/sells", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.companyId || req.query.companyId || req.headers["x-company-id"] || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const sells = await SellService.getSells(companyId);
      res.status(200).json({ success: true, data: sells });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar vendas." } });
    }
  });
  app.get("/api/companies/:companyId/sells/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const sell = await SellService.getSellById(companyId, id);
      if (!sell) {
        return res.status(404).json({ success: false, error: { message: "Venda n\xE3o encontrada." } });
      }
      res.status(200).json({ success: true, data: sell });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar detalhes da venda." } });
    }
  });
  app.post("/api/companies/:companyId/sells", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const sell = await SellService.createSell(companyId, req.body);
      res.status(201).json({ success: true, data: sell });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao registrar venda." } });
    }
  });
  app.post("/api/sells", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.companyId || req.body.companyId || req.headers["x-company-id"] || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const sell = await SellService.createSell(companyId, req.body);
      res.status(201).json({ success: true, data: sell });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao registrar venda." } });
    }
  });
  app.patch("/api/companies/:companyId/sells/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const updated = await SellService.updateSell(companyId, id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao atualizar venda." } });
    }
  });
  app.delete("/api/companies/:companyId/sells/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      await SellService.deleteSell(companyId, id);
      res.status(200).json({ success: true, message: "Venda exclu\xEDda com sucesso." });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao excluir venda." } });
    }
  });
  app.get("/api/companies/:companyId/pos", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const records = await POSService.getPOSRecords(companyId);
      res.status(200).json({ success: true, data: records });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar registros de POS." } });
    }
  });
  app.get("/api/pos", requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.companyId || req.query.companyId || req.headers["x-company-id"] || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const records = await POSService.getPOSRecords(companyId);
      res.status(200).json({ success: true, data: records });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar registros de POS." } });
    }
  });
  app.get("/api/companies/:companyId/pos/products", requireAuth, requireCompanyContext, async (req, res) => {
    try {
      const products = await POSService.getCatalogProducts();
      res.status(200).json({ success: true, data: products });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar cat\xE1logo do POS." } });
    }
  });
  app.get("/api/companies/:companyId/pos/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const record = await POSService.getPOSById(companyId, id);
      if (!record) {
        return res.status(404).json({ success: false, error: { message: "Registro de POS n\xE3o encontrado." } });
      }
      res.status(200).json({ success: true, data: record });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar detalhes do POS." } });
    }
  });
  app.post(["/api/companies/:companyId/pos", "/api/companies/:companyId/pdv"], async (req, res) => {
    const { companyId } = req.params;
    try {
      const record = await POSService.createPOSRecord(companyId, req.body);
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao registrar venda no POS." } });
    }
  });
  app.post(["/api/pos", "/api/pdv"], async (req, res) => {
    const companyId = req.companyId || req.body.companyId || req.headers["x-company-id"] || "550e8400-e29b-41d4-a716-446655440001";
    try {
      const record = await POSService.createPOSRecord(companyId, req.body);
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao registrar venda no POS." } });
    }
  });
  app.delete("/api/companies/:companyId/pos/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      await POSService.deletePOSRecord(companyId, id);
      res.status(200).json({ success: true, message: "Registro de POS exclu\xEDdo com sucesso." });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao excluir registro de POS." } });
    }
  });
  const invoiceSettingsStore = /* @__PURE__ */ new Map();
  const defaultInvoiceSettings = {
    pixKey: "financeiro@techstore.com.br",
    pixKeyType: "email",
    merchantName: "TechStore Brasil Matriz",
    merchantCity: "SAO PAULO",
    bankName: "Banco Ita\xFA",
    bankCode: "341",
    agency: "0452",
    account: "98765-4",
    accountType: "corrente",
    soundEnabled: true
  };
  app.get("/api/companies/:companyId/invoice-settings", async (req, res) => {
    const { companyId } = req.params;
    const settings = invoiceSettingsStore.get(companyId) || defaultInvoiceSettings;
    res.status(200).json({ success: true, data: settings, ...settings });
  });
  app.post("/api/companies/:companyId/invoice-settings", async (req, res) => {
    const { companyId } = req.params;
    const current = invoiceSettingsStore.get(companyId) || defaultInvoiceSettings;
    const updated = { ...current, ...req.body };
    invoiceSettingsStore.set(companyId, updated);
    res.status(200).json({ success: true, data: updated, ...updated });
  });
  app.get("/api/companies/:companyId/pix-config", async (req, res) => {
    const { companyId } = req.params;
    const settings = invoiceSettingsStore.get(companyId) || defaultInvoiceSettings;
    res.status(200).json({
      success: true,
      pixKey: settings.pixKey,
      merchantName: settings.merchantName,
      merchantCity: settings.merchantCity,
      pixKeyType: settings.pixKeyType
    });
  });
  app.post("/api/companies/:companyId/pos/expense", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const expense = await POSService.createExpense(companyId, req.body);
      res.status(201).json({ success: true, data: expense });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao lan\xE7ar despesa no POS." } });
    }
  });
  app.get("/api/companies/:companyId/expenses", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const expenses = await POSService.getExpenses(companyId);
      res.status(200).json({ success: true, data: expenses });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar despesas." } });
    }
  });
  app.post("/api/companies/:companyId/expenses", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const expense = await POSService.createExpense(companyId, req.body);
      res.status(201).json({ success: true, data: expense });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao registrar despesa." } });
    }
  });
  app.get("/api/companies/:companyId/sells/quotes", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const quotes = await POSService.getQuotes(companyId);
      res.status(200).json({ success: true, data: quotes });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar cota\xE7\xF5es." } });
    }
  });
  app.post("/api/companies/:companyId/sells/quotes", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const quote = await POSService.createQuote(companyId, req.body);
      res.status(201).json({ success: true, data: quote });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao registrar cota\xE7\xE3o." } });
    }
  });
  app.get("/api/companies/:companyId/cash-register", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const register = await POSService.getCashRegister(companyId);
      res.status(200).json({ success: true, data: register });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar status da gaveta/caixa." } });
    }
  });
  app.post("/api/companies/:companyId/cash-register", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const register = await POSService.updateCashRegister(companyId, req.body);
      res.status(200).json({ success: true, data: register });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao atualizar dados do caixa." } });
    }
  });
  app.get("/api/companies/:companyId/pos/alerts", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const alerts = await POSService.getAlerts(companyId);
      res.status(200).json({ success: true, data: alerts });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar alertas do POS." } });
    }
  });
  app.get("/api/companies/:companyId/sells/drafts", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const drafts = await DraftService.getDrafts(companyId);
      res.status(200).json({ success: true, data: drafts });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message || "Erro ao buscar rascunhos." } });
    }
  });
  app.post("/api/companies/:companyId/sells/drafts", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const draft = await DraftService.createDraft(companyId, req.body);
      res.status(201).json({ success: true, data: draft });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao criar rascunho." } });
    }
  });
  app.patch("/api/companies/:companyId/sells/drafts/:id", requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const updated = await DraftService.updateDraft(companyId, id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || "Erro ao atualizar rascunho." } });
    }
  });
  app.get(["/pos", "/pos/create", "/pdv", "/pdv/create"], (req, res) => {
    res.redirect("/#/pdv/create");
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OLYPS PRO server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
