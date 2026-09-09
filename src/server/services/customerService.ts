import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import type {
  UUID,
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  ContactStatus,
  PersonType,
  PaginationParams,
  PaginatedResult,
} from '../../types/index.js';

interface DatabaseCustomerRow {
  id: string;
  company_id: string;
  customer_group_id: string | null;
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
  credit_limit: number | string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  customer_groups?: { name: string } | null;
}

function mapCustomerRow(row: DatabaseCustomerRow): Customer {
  return {
    id: row.id,
    companyId: row.company_id,
    customerGroupId: row.customer_group_id,
    customerGroupName: row.customer_groups?.name || null,
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
    creditLimit: Number(row.credit_limit) || 0,
    notes: row.notes,
    status: (row.status as ContactStatus) || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const inMemoryCustomers = new Map<string, DatabaseCustomerRow[]>();

export class CustomerService {
  /**
   * List customers with pagination, filtering and search
   */
  static async listByCompany(
    companyId: UUID,
    params: PaginationParams & {
      search?: string;
      status?: ContactStatus;
      personType?: PersonType;
      groupId?: string;
    }
  ): Promise<PaginatedResult<Customer>> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
    const offset = (page - 1) * pageSize;

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      let query = supabase
        .from('customers')
        .select('*, customer_groups(name)', { count: 'exact' })
        .eq('company_id', companyId);

      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.personType) {
        query = query.eq('person_type', params.personType);
      }

      if (params.groupId) {
        query = query.eq('customer_group_id', params.groupId);
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
        throw new Error(`Erro ao buscar clientes: ${error.message}`);
      }

      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        data: (data || []).map(mapCustomerRow),
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
        (c) =>
          c.name.toLowerCase().includes(s) ||
          (c.trade_name && c.trade_name.toLowerCase().includes(s)) ||
          (c.document && c.document.toLowerCase().includes(s)) ||
          (c.email && c.email.toLowerCase().includes(s))
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
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get single customer by ID
   */
  static async getById(companyId: UUID, customerId: UUID): Promise<Customer | null> {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('customers')
        .select('*, customer_groups(name)')
        .eq('id', customerId)
        .eq('company_id', companyId)
        .maybeSingle();

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
  static async create(companyId: UUID, payload: CreateCustomerPayload): Promise<Customer> {
    if (!payload.name || !payload.name.trim()) {
      throw new Error('O nome / razão social do cliente é obrigatório.');
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('customers')
        .insert({
          company_id: companyId,
          customer_group_id: payload.customerGroupId || null,
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
          credit_limit: payload.creditLimit || 0,
          notes: payload.notes?.trim() || null,
          status: payload.status || 'active',
        })
        .select('*, customer_groups(name)')
        .single();

      if (error) {
        throw new Error(`Erro ao cadastrar cliente: ${error.message}`);
      }

      return mapCustomerRow(data);
    }

    const list = inMemoryCustomers.get(companyId) || [];
    const now = new Date().toISOString();
    const newCustomer: DatabaseCustomerRow = {
      id: crypto.randomUUID(),
      company_id: companyId,
      customer_group_id: payload.customerGroupId || null,
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
      credit_limit: payload.creditLimit || 0,
      notes: payload.notes?.trim() || null,
      status: payload.status || 'active',
      created_at: now,
      updated_at: now,
    };

    list.push(newCustomer);
    inMemoryCustomers.set(companyId, list);
    return mapCustomerRow(newCustomer);
  }

  /**
   * Update an existing customer
   */
  static async update(
    companyId: UUID,
    customerId: UUID,
    payload: UpdateCustomerPayload
  ): Promise<Customer> {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.customerGroupId !== undefined) updateData.customer_group_id = payload.customerGroupId || null;
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
      if (payload.creditLimit !== undefined) updateData.credit_limit = payload.creditLimit;
      if (payload.notes !== undefined) updateData.notes = payload.notes?.trim() || null;
      if (payload.status !== undefined) updateData.status = payload.status;

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId)
        .eq('company_id', companyId)
        .select('*, customer_groups(name)')
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar cliente: ${error.message}`);
      }

      return mapCustomerRow(data);
    }

    const list = inMemoryCustomers.get(companyId) || [];
    const index = list.findIndex((c) => c.id === customerId);
    if (index === -1) {
      throw new Error('Cliente não encontrado.');
    }

    if (payload.name !== undefined) {
      if (!payload.name.trim()) throw new Error('O nome / razão social não pode ser vazio.');
      list[index].name = payload.name.trim();
    }
    if (payload.customerGroupId !== undefined) list[index].customer_group_id = payload.customerGroupId || null;
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
    if (payload.creditLimit !== undefined) list[index].credit_limit = payload.creditLimit;
    if (payload.notes !== undefined) list[index].notes = payload.notes?.trim() || null;
    if (payload.status !== undefined) list[index].status = payload.status;
    list[index].updated_at = new Date().toISOString();

    inMemoryCustomers.set(companyId, list);
    return mapCustomerRow(list[index]);
  }

  /**
   * Delete a customer
   */
  static async delete(companyId: UUID, customerId: UUID): Promise<void> {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Erro ao excluir cliente: ${error.message}`);
      }
      return;
    }

    const list = inMemoryCustomers.get(companyId) || [];
    const filtered = list.filter((c) => c.id !== customerId);
    inMemoryCustomers.set(companyId, filtered);
  }
}
