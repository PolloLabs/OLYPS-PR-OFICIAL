import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import type {
  UUID,
  CompanyRecord,
  CompanyStatus,
  CreateCompanyPayload,
  UpdateCompanyPayload,
  CommercialLocation,
  CreateLocationPayload,
  UpdateLocationPayload,
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

function mapLocationRow(row: DatabaseLocationRow): CommercialLocation {
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
    status: (row.status as 'active' | 'inactive') || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CompanyService {
  /**
   * Retrieves single company data by ID.
   */
  public static async getCompanyById(companyId: UUID): Promise<CompanyRecord | null> {
    if (!companyId || !isSupabaseAdminConfigured()) return null;

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();

      if (error || !data) return null;
      return mapCompanyRow(data as unknown as DatabaseCompanyRow);
    } catch {
      return null;
    }
  }

  /**
   * Creates a new company record.
   */
  public static async createCompany(payload: CreateCompanyPayload, creatorUserId?: string): Promise<CompanyRecord | null> {
    if (!payload.name || !isSupabaseAdminConfigured()) return null;

    const slug = payload.slug
      ? payload.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : payload.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

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
        country: payload.country?.trim() || 'Brasil',
        postal_code: payload.postalCode?.trim() || null,
        state_registration: payload.stateRegistration?.trim() || null,
        tax_regime: payload.taxRegime || 'simples_nacional',
        currency: payload.currency || 'BRL',
        timezone: payload.timezone || 'America/Sao_Paulo',
        status: payload.status || 'active',
      };

      const { data, error } = await supabaseAdmin
        .from('companies')
        .insert(insertData)
        .select('*')
        .single();

      if (error || !data) {
        console.warn(`[WARN] Erro ao cadastrar empresa: ${error?.message}`);
        return null;
      }

      const createdCompany = mapCompanyRow(data as unknown as DatabaseCompanyRow);

      // Create default primary commercial location for this company
      try {
        await supabaseAdmin.from('commercial_locations').insert({
          company_id: createdCompany.id,
          name: 'Matriz Principal',
          code: 'LOC-01',
          document: createdCompany.document,
          email: createdCompany.email,
          phone: createdCompany.phone,
          address: createdCompany.address,
          city: createdCompany.city,
          state: createdCompany.state,
          postal_code: createdCompany.postalCode,
          is_main: true,
          status: 'active',
        });
      } catch (locErr) {
        console.warn(`[WARN] Erro ao criar local padrão: ${locErr}`);
      }

      // If creator user is provided, associate them as company_admin
      if (creatorUserId) {
        try {
          await supabaseAdmin.from('company_users').insert({
            company_id: createdCompany.id,
            user_id: creatorUserId,
            role: 'company_admin',
            status: 'active',
          });
        } catch {
          // Non-blocking
        }
      }

      return createdCompany;
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao cadastrar empresa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    }
  }

  /**
   * Updates an existing company's master and fiscal details.
   */
  public static async updateCompany(companyId: UUID, payload: UpdateCompanyPayload): Promise<CompanyRecord | null> {
    if (!companyId || !isSupabaseAdminConfigured()) return null;

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.name !== undefined) updateData.name = payload.name.trim();
      if (payload.legalName !== undefined) updateData.legal_name = payload.legalName ? payload.legalName.trim() : null;
      if (payload.document !== undefined) updateData.document = payload.document ? payload.document.trim() : null;
      if (payload.slug !== undefined) updateData.slug = payload.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (payload.email !== undefined) updateData.email = payload.email ? payload.email.trim() : null;
      if (payload.phone !== undefined) updateData.phone = payload.phone ? payload.phone.trim() : null;
      if (payload.address !== undefined) updateData.address = payload.address ? payload.address.trim() : null;
      if (payload.city !== undefined) updateData.city = payload.city ? payload.city.trim() : null;
      if (payload.state !== undefined) updateData.state = payload.state ? payload.state.trim() : null;
      if (payload.country !== undefined) updateData.country = payload.country ? payload.country.trim() : 'Brasil';
      if (payload.postalCode !== undefined) updateData.postal_code = payload.postalCode ? payload.postalCode.trim() : null;
      if (payload.stateRegistration !== undefined) updateData.state_registration = payload.stateRegistration ? payload.stateRegistration.trim() : null;
      if (payload.taxRegime !== undefined) updateData.tax_regime = payload.taxRegime;
      if (payload.currency !== undefined) updateData.currency = payload.currency;
      if (payload.timezone !== undefined) updateData.timezone = payload.timezone;
      if (payload.status !== undefined) updateData.status = payload.status;

      const { data, error } = await supabaseAdmin
        .from('companies')
        .update(updateData)
        .eq('id', companyId)
        .select('*')
        .maybeSingle();

      if (error || !data) {
        console.warn(`[WARN] Erro ao atualizar empresa ${companyId}: ${error?.message}`);
        return null;
      }

      return mapCompanyRow(data as unknown as DatabaseCompanyRow);
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao atualizar empresa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    }
  }

  // ==============================================================================
  // COMMERCIAL LOCATIONS (03.5)
  // ==============================================================================

  /**
   * Lists all commercial locations belonging to a specific company.
   */
  public static async listLocations(companyId: UUID): Promise<CommercialLocation[]> {
    if (!companyId || !isSupabaseAdminConfigured()) return [];

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('commercial_locations')
        .select('*')
        .eq('company_id', companyId)
        .order('is_main', { ascending: false })
        .order('name', { ascending: true });

      if (error || !data) {
        console.warn(`[WARN] Erro ao listar locais da empresa ${companyId}: ${error?.message}`);
        return [];
      }

      const rows = data as unknown as DatabaseLocationRow[];
      return rows.map(mapLocationRow);
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao listar locais: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return [];
    }
  }

  /**
   * Retrieves single commercial location by ID and company ID.
   */
  public static async getLocationById(companyId: UUID, locationId: UUID): Promise<CommercialLocation | null> {
    if (!companyId || !locationId || !isSupabaseAdminConfigured()) return null;

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('commercial_locations')
        .select('*')
        .eq('id', locationId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (error || !data) return null;
      return mapLocationRow(data as unknown as DatabaseLocationRow);
    } catch {
      return null;
    }
  }

  /**
   * Creates a new commercial location for a company.
   */
  public static async createLocation(companyId: UUID, payload: CreateLocationPayload): Promise<CommercialLocation | null> {
    if (!companyId || !payload.name || !isSupabaseAdminConfigured()) return null;

    try {
      const supabaseAdmin = getSupabaseAdmin();

      // If this is set as main location, unmark existing main locations for this company
      if (payload.isMain) {
        await supabaseAdmin
          .from('commercial_locations')
          .update({ is_main: false })
          .eq('company_id', companyId);
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
        status: payload.status || 'active',
      };

      const { data, error } = await supabaseAdmin
        .from('commercial_locations')
        .insert(insertData)
        .select('*')
        .single();

      if (error || !data) {
        console.warn(`[WARN] Erro ao criar local comercial: ${error?.message}`);
        return null;
      }

      return mapLocationRow(data as unknown as DatabaseLocationRow);
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao criar local comercial: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    }
  }

  /**
   * Updates an existing commercial location.
   */
  public static async updateLocation(
    companyId: UUID,
    locationId: UUID,
    payload: UpdateLocationPayload
  ): Promise<CommercialLocation | null> {
    if (!companyId || !locationId || !isSupabaseAdminConfigured()) return null;

    try {
      const supabaseAdmin = getSupabaseAdmin();

      if (payload.isMain) {
        await supabaseAdmin
          .from('commercial_locations')
          .update({ is_main: false })
          .eq('company_id', companyId);
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.name !== undefined) updateData.name = payload.name.trim();
      if (payload.code !== undefined) updateData.code = payload.code ? payload.code.trim() : null;
      if (payload.document !== undefined) updateData.document = payload.document ? payload.document.trim() : null;
      if (payload.email !== undefined) updateData.email = payload.email ? payload.email.trim() : null;
      if (payload.phone !== undefined) updateData.phone = payload.phone ? payload.phone.trim() : null;
      if (payload.address !== undefined) updateData.address = payload.address ? payload.address.trim() : null;
      if (payload.city !== undefined) updateData.city = payload.city ? payload.city.trim() : null;
      if (payload.state !== undefined) updateData.state = payload.state ? payload.state.trim() : null;
      if (payload.postalCode !== undefined) updateData.postal_code = payload.postalCode ? payload.postalCode.trim() : null;
      if (payload.isMain !== undefined) updateData.is_main = Boolean(payload.isMain);
      if (payload.status !== undefined) updateData.status = payload.status;

      const { data, error } = await supabaseAdmin
        .from('commercial_locations')
        .update(updateData)
        .eq('id', locationId)
        .eq('company_id', companyId)
        .select('*')
        .maybeSingle();

      if (error || !data) {
        console.warn(`[WARN] Erro ao atualizar local comercial ${locationId}: ${error?.message}`);
        return null;
      }

      return mapLocationRow(data as unknown as DatabaseLocationRow);
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao atualizar local comercial: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    }
  }

  /**
   * Deletes a commercial location safely.
   */
  public static async deleteLocation(companyId: UUID, locationId: UUID): Promise<boolean> {
    if (!companyId || !locationId || !isSupabaseAdminConfigured()) return false;

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('commercial_locations')
        .delete()
        .eq('id', locationId)
        .eq('company_id', companyId);

      if (error) {
        console.warn(`[WARN] Erro ao excluir local comercial ${locationId}: ${error.message}`);
        return false;
      }

      return true;
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao excluir local comercial: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return false;
    }
  }
}
