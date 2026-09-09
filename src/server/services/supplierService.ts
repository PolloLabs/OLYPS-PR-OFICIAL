import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import type {
  UUID,
  Supplier,
  CreateSupplierPayload,
  UpdateSupplierPayload,
  ContactStatus,
  PersonType,
  PaginationParams,
  PaginatedResult,
} from '../../types/index.js';

interface DatabaseSupplierRow {
  id: string;
  company_id: string;
  person_type: string;
  name: string;
  trade_name: string | null;
  document: string | null;
  state_registration: string | null;
  municipal_registration: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  contact_name: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  category: string | null;
  payment_terms: string | null;
  bank_info: any;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapSupplierRow(row: DatabaseSupplierRow): Supplier {
  return {
    id: row.id,
    companyId: row.company_id,
    personType: (row.person_type as PersonType) || 'legal',
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
    country: row.country || 'Brasil',
    category: row.category,
    paymentTerms: row.payment_terms,
    bankInfo: typeof row.bank_info === 'object' && row.bank_info !== null ? row.bank_info : {},
    notes: row.notes,
    status: (row.status as ContactStatus) || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const inMemorySuppliers = new Map<string, DatabaseSupplierRow[]>();

export class SupplierService {
  /**
   * List suppliers with pagination, filtering and search
   */
  static async listByCompany(
    companyId: UUID,
    params: PaginationParams & {
      search?: string;
      status?: ContactStatus;
      personType?: PersonType;
      category?: string;
    }
  ): Promise<PaginatedResult<Supplier>> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
    const offset = (page - 1) * pageSize;

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      let query = supabase
        .from('suppliers')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId);

      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.personType) {
        query = query.eq('person_type', params.personType);
      }

      if (params.category && params.category.trim()) {
        query = query.eq('category', params.category.trim());
      }

      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`;
        query = query.or(
          `name.ilike.${term},trade_name.ilike.${term},document.ilike.${term},email.ilike.${term},phone.ilike.${term}`
        );
      }

      query = query.order('name', { ascending: true }).range(offset, offset + pageSize - 1);

      const { data, count, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
      }

      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        data: (data || []).map(mapSupplierRow),
        meta: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    // In-memory fallback
    let list = inMemorySuppliers.get(companyId) || [];

    if (params.status) {
      list = list.filter((s) => s.status === params.status);
    }
    if (params.personType) {
      list = list.filter((s) => s.person_type === params.personType);
    }
    if (params.category && params.category.trim()) {
      list = list.filter((s) => s.category === params.category!.trim());
    }
    if (params.search && params.search.trim()) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (sp) =>
          sp.name.toLowerCase().includes(s) ||
          (sp.trade_name && sp.trade_name.toLowerCase().includes(s)) ||
          (sp.document && sp.document.toLowerCase().includes(s)) ||
          (sp.email && sp.email.toLowerCase().includes(s))
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
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get single supplier by ID
   */
  static async getById(companyId: UUID, supplierId: UUID): Promise<Supplier | null> {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .eq('company_id', companyId)
        .maybeSingle();

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
  static async create(companyId: UUID, payload: CreateSupplierPayload): Promise<Supplier> {
    if (!payload.name || !payload.name.trim()) {
      throw new Error('O nome / razão social do fornecedor é obrigatório.');
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          company_id: companyId,
          person_type: payload.personType || 'legal',
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
          country: payload.country?.trim() || 'Brasil',
          category: payload.category?.trim() || null,
          payment_terms: payload.paymentTerms?.trim() || null,
          bank_info: payload.bankInfo || {},
          notes: payload.notes?.trim() || null,
          status: payload.status || 'active',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao cadastrar fornecedor: ${error.message}`);
      }

      return mapSupplierRow(data);
    }

    const list = inMemorySuppliers.get(companyId) || [];
    const now = new Date().toISOString();
    const newSupplier: DatabaseSupplierRow = {
      id: crypto.randomUUID(),
      company_id: companyId,
      person_type: payload.personType || 'legal',
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
      country: payload.country?.trim() || 'Brasil',
      category: payload.category?.trim() || null,
      payment_terms: payload.paymentTerms?.trim() || null,
      bank_info: payload.bankInfo || {},
      notes: payload.notes?.trim() || null,
      status: payload.status || 'active',
      created_at: now,
      updated_at: now,
    };

    list.push(newSupplier);
    inMemorySuppliers.set(companyId, list);
    return mapSupplierRow(newSupplier);
  }

  /**
   * Update an existing supplier
   */
  static async update(
    companyId: UUID,
    supplierId: UUID,
    payload: UpdateSupplierPayload
  ): Promise<Supplier> {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.personType !== undefined) updateData.person_type = payload.personType;
      if (payload.name !== undefined) {
        if (!payload.name.trim()) throw new Error('O nome / razão social não pode ser vazio.');
        updateData.name = payload.name.trim();
      }
      if (payload.tradeName !== undefined) updateData.trade_name = payload.tradeName?.trim() || null;
      if (payload.document !== undefined) updateData.document = payload.document?.trim() || null;
      if (payload.stateRegistration !== undefined) updateData.state_registration = payload.stateRegistration?.trim() || null;
      if (payload.municipalRegistration !== undefined) updateData.municipal_registration = payload.municipalRegistration?.trim() || null;
      if (payload.email !== undefined) updateData.email = payload.email?.trim() || null;
      if (payload.phone !== undefined) updateData.phone = payload.phone?.trim() || null;
      if (payload.mobile !== undefined) updateData.mobile = payload.mobile?.trim() || null;
      if (payload.website !== undefined) updateData.website = payload.website?.trim() || null;
      if (payload.contactName !== undefined) updateData.contact_name = payload.contactName?.trim() || null;
      if (payload.address !== undefined) updateData.address = payload.address?.trim() || null;
      if (payload.neighborhood !== undefined) updateData.neighborhood = payload.neighborhood?.trim() || null;
      if (payload.city !== undefined) updateData.city = payload.city?.trim() || null;
      if (payload.state !== undefined) updateData.state = payload.state?.trim() || null;
      if (payload.postalCode !== undefined) updateData.postal_code = payload.postalCode?.trim() || null;
      if (payload.country !== undefined) updateData.country = payload.country?.trim() || 'Brasil';
      if (payload.category !== undefined) updateData.category = payload.category?.trim() || null;
      if (payload.paymentTerms !== undefined) updateData.payment_terms = payload.paymentTerms?.trim() || null;
      if (payload.bankInfo !== undefined) updateData.bank_info = payload.bankInfo || {};
      if (payload.notes !== undefined) updateData.notes = payload.notes?.trim() || null;
      if (payload.status !== undefined) updateData.status = payload.status;

      const { data, error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', supplierId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar fornecedor: ${error.message}`);
      }

      return mapSupplierRow(data);
    }

    const list = inMemorySuppliers.get(companyId) || [];
    const index = list.findIndex((s) => s.id === supplierId);
    if (index === -1) {
      throw new Error('Fornecedor não encontrado.');
    }

    if (payload.name !== undefined) {
      if (!payload.name.trim()) throw new Error('O nome / razão social não pode ser vazio.');
      list[index].name = payload.name.trim();
    }
    if (payload.personType !== undefined) list[index].person_type = payload.personType;
    if (payload.tradeName !== undefined) list[index].trade_name = payload.tradeName?.trim() || null;
    if (payload.document !== undefined) list[index].document = payload.document?.trim() || null;
    if (payload.stateRegistration !== undefined) list[index].state_registration = payload.stateRegistration?.trim() || null;
    if (payload.municipalRegistration !== undefined) list[index].municipal_registration = payload.municipalRegistration?.trim() || null;
    if (payload.email !== undefined) list[index].email = payload.email?.trim() || null;
    if (payload.phone !== undefined) list[index].phone = payload.phone?.trim() || null;
    if (payload.mobile !== undefined) list[index].mobile = payload.mobile?.trim() || null;
    if (payload.website !== undefined) list[index].website = payload.website?.trim() || null;
    if (payload.contactName !== undefined) list[index].contact_name = payload.contactName?.trim() || null;
    if (payload.address !== undefined) list[index].address = payload.address?.trim() || null;
    if (payload.neighborhood !== undefined) list[index].neighborhood = payload.neighborhood?.trim() || null;
    if (payload.city !== undefined) list[index].city = payload.city?.trim() || null;
    if (payload.state !== undefined) list[index].state = payload.state?.trim() || null;
    if (payload.postalCode !== undefined) list[index].postal_code = payload.postalCode?.trim() || null;
    if (payload.country !== undefined) list[index].country = payload.country?.trim() || 'Brasil';
    if (payload.category !== undefined) list[index].category = payload.category?.trim() || null;
    if (payload.paymentTerms !== undefined) list[index].payment_terms = payload.paymentTerms?.trim() || null;
    if (payload.bankInfo !== undefined) list[index].bank_info = payload.bankInfo || {};
    if (payload.notes !== undefined) list[index].notes = payload.notes?.trim() || null;
    if (payload.status !== undefined) list[index].status = payload.status;
    list[index].updated_at = new Date().toISOString();

    inMemorySuppliers.set(companyId, list);
    return mapSupplierRow(list[index]);
  }

  /**
   * Delete a supplier
   */
  static async delete(companyId: UUID, supplierId: UUID): Promise<void> {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Erro ao excluir fornecedor: ${error.message}`);
      }
      return;
    }

    const list = inMemorySuppliers.get(companyId) || [];
    const filtered = list.filter((s) => s.id !== supplierId);
    inMemorySuppliers.set(companyId, filtered);
  }
}
