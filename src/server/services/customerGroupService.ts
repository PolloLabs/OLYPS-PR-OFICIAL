import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import type {
  UUID,
  CustomerGroup,
  CreateCustomerGroupPayload,
  UpdateCustomerGroupPayload,
  CustomerGroupStatus,
} from '../../types/index.js';

interface DatabaseCustomerGroupRow {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  discount_percentage: number | string;
  price_table: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  customers_count?: number;
}

function mapCustomerGroupRow(row: DatabaseCustomerGroupRow, customersCount = 0): CustomerGroup {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    discountPercentage: Number(row.discount_percentage) || 0,
    priceTable: row.price_table,
    status: (row.status as CustomerGroupStatus) || 'active',
    customersCount: typeof row.customers_count === 'number' ? row.customers_count : customersCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// In-memory store fallback when Supabase is not connected
const inMemoryCustomerGroups = new Map<string, DatabaseCustomerGroupRow[]>();

export class CustomerGroupService {
  /**
   * List all customer groups for a specific company
   */
  static async listByCompany(companyId: UUID): Promise<CustomerGroup[]> {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('customer_groups')
        .select(`
          *,
          customers:customers(count)
        `)
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Erro ao listar grupos de clientes: ${error.message}`);
      }

      return (data || []).map((row: any) => {
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
  static async getById(companyId: UUID, groupId: UUID): Promise<CustomerGroup | null> {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .eq('id', groupId)
        .eq('company_id', companyId)
        .maybeSingle();

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
  static async create(companyId: UUID, payload: CreateCustomerGroupPayload): Promise<CustomerGroup> {
    if (!payload.name || !payload.name.trim()) {
      throw new Error('O nome do grupo de clientes é obrigatório.');
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('customer_groups')
        .insert({
          company_id: companyId,
          name: payload.name.trim(),
          description: payload.description?.trim() || null,
          discount_percentage: payload.discountPercentage || 0,
          price_table: payload.priceTable?.trim() || null,
          status: payload.status || 'active',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um grupo de clientes com este nome nesta empresa.');
        }
        throw new Error(`Erro ao criar grupo de clientes: ${error.message}`);
      }

      return mapCustomerGroupRow(data);
    }

    const groups = inMemoryCustomerGroups.get(companyId) || [];
    if (groups.some((g) => g.name.toLowerCase() === payload.name.trim().toLowerCase())) {
      throw new Error('Já existe um grupo de clientes com este nome nesta empresa.');
    }

    const now = new Date().toISOString();
    const newGroup: DatabaseCustomerGroupRow = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      discount_percentage: payload.discountPercentage || 0,
      price_table: payload.priceTable?.trim() || null,
      status: payload.status || 'active',
      created_at: now,
      updated_at: now,
    };

    groups.push(newGroup);
    inMemoryCustomerGroups.set(companyId, groups);
    return mapCustomerGroupRow(newGroup);
  }

  /**
   * Update an existing customer group
   */
  static async update(
    companyId: UUID,
    groupId: UUID,
    payload: UpdateCustomerGroupPayload
  ): Promise<CustomerGroup> {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.name !== undefined) {
        if (!payload.name.trim()) throw new Error('O nome do grupo não pode ser vazio.');
        updateData.name = payload.name.trim();
      }
      if (payload.description !== undefined) updateData.description = payload.description?.trim() || null;
      if (payload.discountPercentage !== undefined) updateData.discount_percentage = payload.discountPercentage;
      if (payload.priceTable !== undefined) updateData.price_table = payload.priceTable?.trim() || null;
      if (payload.status !== undefined) updateData.status = payload.status;

      const { data, error } = await supabase
        .from('customer_groups')
        .update(updateData)
        .eq('id', groupId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um grupo de clientes com este nome nesta empresa.');
        }
        throw new Error(`Erro ao atualizar grupo de clientes: ${error.message}`);
      }

      return mapCustomerGroupRow(data);
    }

    const groups = inMemoryCustomerGroups.get(companyId) || [];
    const index = groups.findIndex((g) => g.id === groupId);
    if (index === -1) {
      throw new Error('Grupo de clientes não encontrado.');
    }

    if (payload.name !== undefined) {
      if (!payload.name.trim()) throw new Error('O nome do grupo não pode ser vazio.');
      const duplicate = groups.find(
        (g) => g.id !== groupId && g.name.toLowerCase() === payload.name!.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error('Já existe um grupo de clientes com este nome nesta empresa.');
      }
      groups[index].name = payload.name.trim();
    }

    if (payload.description !== undefined) groups[index].description = payload.description?.trim() || null;
    if (payload.discountPercentage !== undefined) groups[index].discount_percentage = payload.discountPercentage;
    if (payload.priceTable !== undefined) groups[index].price_table = payload.priceTable?.trim() || null;
    if (payload.status !== undefined) groups[index].status = payload.status;
    groups[index].updated_at = new Date().toISOString();

    inMemoryCustomerGroups.set(companyId, groups);
    return mapCustomerGroupRow(groups[index]);
  }

  /**
   * Delete a customer group
   */
  static async delete(companyId: UUID, groupId: UUID): Promise<void> {
    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('customer_groups')
        .delete()
        .eq('id', groupId)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Erro ao excluir grupo de clientes: ${error.message}`);
      }
      return;
    }

    const groups = inMemoryCustomerGroups.get(companyId) || [];
    const filtered = groups.filter((g) => g.id !== groupId);
    inMemoryCustomerGroups.set(companyId, filtered);
  }
}
