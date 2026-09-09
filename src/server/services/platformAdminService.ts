import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import type {
  UUID,
  PlatformAdminRecord,
  PlatformRole,
  PlatformDashboardSummary,
  PlatformCompanyQueryParams,
  PlatformCompanyListResult,
  PlatformCompanyDetails,
  PlatformCompanyMemberSummary,
  CompanyRecord,
  CompanyStatus,
  CompanyRole,
  MembershipStatus,
  CommercialLocation,
} from '../../types/index.js';

interface DatabaseCompanyRow {
  id: string;
  name: string;
  legal_name: string | null;
  document: string | null;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  state_registration: string | null;
  tax_regime: string | null;
  currency: string | null;
  timezone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseCompanyUserRow {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseLocationRow {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  is_main: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapCompanyRow(row: DatabaseCompanyRow): CompanyRecord {
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
    country: row.country || 'Brasil',
    postalCode: row.postal_code,
    stateRegistration: row.state_registration,
    taxRegime: row.tax_regime || 'simples_nacional',
    currency: row.currency || 'BRL',
    timezone: row.timezone || 'America/Sao_Paulo',
    status: (row.status as CompanyStatus) || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Service responsible for validating platform administrator authority and
 * executing platform-level governance over companies and global metrics.
 * Strictly operates on the server side using the secure Supabase Admin instance.
 */
export class PlatformAdminService {
  /**
   * Verifies if a given user ID possesses active Super Admin / Platform Admin privileges.
   *
   * @param userId UUID of the user to verify
   * @returns boolean indicating active platform admin status
   */
  public static async isPlatformAdmin(userId: string): Promise<boolean> {
    if (!isSupabaseAdminConfigured()) {
      return true;
    }

    if (!userId) {
      return false;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from('platform_admins')
        .select('id, role, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.warn(`[WARN] Erro ao verificar platform admin para o usuário ${userId}: ${error.message}`);
        return false;
      }

      return Boolean(data && data.is_active === true);
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção na verificação de platform admin: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return false;
    }
  }

  /**
   * Retrieves full platform admin details for a validated administrator.
   *
   * @param userId UUID of the platform admin
   * @returns PlatformAdminRecord or null
   */
  public static async getPlatformAdminDetails(userId: string): Promise<PlatformAdminRecord | null> {
    if (!userId || !isSupabaseAdminConfigured()) {
      return null;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from('platform_admins')
        .select('id, user_id, role, is_active, created_at, updated_at, created_by')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        role: data.role as PlatformRole,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
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
  public static async getDashboardSummary(): Promise<PlatformDashboardSummary> {
    const defaultSummary: PlatformDashboardSummary = {
      totalCompanies: 0,
      activeCompanies: 0,
      suspendedCompanies: 0,
      pendingCompanies: 0,
      inactiveCompanies: 0,
      totalMemberships: 0,
      totalPlatformAdmins: 0,
      serverTimestamp: new Date().toISOString(),
    };

    if (!isSupabaseAdminConfigured()) {
      return defaultSummary;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Parallel aggregated queries
      const [companiesRes, membershipsRes, adminsRes] = await Promise.all([
        supabaseAdmin.from('companies').select('status'),
        supabaseAdmin.from('company_users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabaseAdmin.from('platform_admins').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      const companiesList = (companiesRes.data || []) as Array<{ status: string }>;
      let active = 0;
      let suspended = 0;
      let pending = 0;
      let inactive = 0;

      for (const comp of companiesList) {
        if (comp.status === 'active') active++;
        else if (comp.status === 'suspended') suspended++;
        else if (comp.status === 'pending') pending++;
        else if (comp.status === 'inactive') inactive++;
      }

      return {
        totalCompanies: companiesList.length,
        activeCompanies: active,
        suspendedCompanies: suspended,
        pendingCompanies: pending,
        inactiveCompanies: inactive,
        totalMemberships: membershipsRes.count ?? 0,
        totalPlatformAdmins: adminsRes.count ?? 0,
        serverTimestamp: new Date().toISOString(),
      };
    } catch (err: unknown) {
      console.warn(`[WARN] Erro ao obter sumário do dashboard global: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return defaultSummary;
    }
  }

  /**
   * Retrieves a paginated and filterable list of all companies for the Super Admin.
   *
   * @param params Filtering, sorting, and pagination parameters
   * @returns PlatformCompanyListResult
   */
  public static async listCompanies(params: PlatformCompanyQueryParams): Promise<PlatformCompanyListResult> {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
    const offset = (page - 1) * pageSize;

    const defaultResult: PlatformCompanyListResult = {
      companies: [],
      pagination: {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: page > 1,
      },
    };

    if (!isSupabaseAdminConfigured()) {
      return defaultResult;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      let query = supabaseAdmin
        .from('companies')
        .select('*', { count: 'exact' });

      // Apply status filter
      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      // Apply search across name, slug or document safely
      if (params.search && params.search.trim().length > 0) {
        const sanitized = params.search.trim().replace(/[%_]/g, '');
        if (sanitized.length > 0) {
          query = query.or(`name.ilike.%${sanitized}%,slug.ilike.%${sanitized}%,document.ilike.%${sanitized}%,city.ilike.%${sanitized}%`);
        }
      }

      // Safe sorting whitelist
      const allowedSortColumns = ['name', 'created_at', 'status', 'slug'];
      const sortCol = params.sortBy && allowedSortColumns.includes(params.sortBy) ? params.sortBy : 'created_at';
      const isAsc = params.sortDirection === 'asc';

      query = query.order(sortCol, { ascending: isAsc });
      query = query.range(offset, offset + pageSize - 1);

      const { data, count, error } = await query;

      if (error || !data) {
        console.warn(`[WARN] Erro ao listar empresas no painel de controle: ${error?.message}`);
        return defaultResult;
      }

      const rows = data as unknown as DatabaseCompanyRow[];
      const total = count ?? rows.length;
      const totalPages = Math.ceil(total / pageSize);

      const companies: CompanyRecord[] = rows.map(mapCompanyRow);

      return {
        companies,
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
      console.warn(`[WARN] Exceção ao listar empresas: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return defaultResult;
    }
  }

  /**
   * Retrieves single company details including associated members count and locations.
   *
   * @param companyId UUID of the target company
   * @returns PlatformCompanyDetails or null
   */
  public static async getCompanyDetails(companyId: UUID): Promise<PlatformCompanyDetails | null> {
    if (!companyId || !isSupabaseAdminConfigured()) {
      return null;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const [companyRes, membersRes, locationsRes] = await Promise.all([
        supabaseAdmin
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .maybeSingle(),
        supabaseAdmin
          .from('company_users')
          .select('id, company_id, user_id, role, status, created_at, updated_at')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('commercial_locations')
          .select('*')
          .eq('company_id', companyId)
          .order('is_main', { ascending: false })
          .order('name', { ascending: true }),
      ]);

      if (companyRes.error || !companyRes.data) {
        return null;
      }

      const row = companyRes.data as unknown as DatabaseCompanyRow;
      const memberRows = (membersRes.data || []) as unknown as DatabaseCompanyUserRow[];
      const locationRows = (locationsRes.data || []) as unknown as DatabaseLocationRow[];

      const members: PlatformCompanyMemberSummary[] = memberRows.map((m) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role as CompanyRole,
        status: m.status as MembershipStatus,
        joinedAt: m.created_at,
        lastAccessedAt: m.updated_at,
      }));

      const locations: CommercialLocation[] = locationRows.map((loc) => ({
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
        status: (loc.status as 'active' | 'inactive') || 'active',
        createdAt: loc.created_at,
        updatedAt: loc.updated_at,
      }));

      const baseCompany = mapCompanyRow(row);

      return {
        ...baseCompany,
        memberCount: members.length,
        members,
        locationCount: locations.length,
        locations,
      };
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao consultar detalhes da empresa ${companyId}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
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
  public static async updateCompanyStatus(companyId: UUID, status: CompanyStatus): Promise<CompanyRecord | null> {
    if (!companyId || !status || !isSupabaseAdminConfigured()) {
      return null;
    }

    const validStatuses: CompanyStatus[] = ['active', 'inactive', 'suspended', 'pending'];
    if (!validStatuses.includes(status)) {
      return null;
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from('companies')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId)
        .select('*')
        .maybeSingle();

      if (error || !data) {
        console.warn(`[WARN] Erro ao atualizar status da empresa ${companyId}: ${error?.message}`);
        return null;
      }

      return mapCompanyRow(data as unknown as DatabaseCompanyRow);
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao alterar status da empresa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    }
  }
}

