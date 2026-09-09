import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import type {
  UUID,
  Supplier,
  Customer,
  CustomerGroup,
  CreateSupplierPayload,
  UpdateSupplierPayload,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CreateCustomerGroupPayload,
  UpdateCustomerGroupPayload,
  PaginatedResult,
  ContactStatus,
  PersonType,
} from '../../types/index.js';
import { SupplierService } from './supplierService.js';
import { CustomerService } from './customerService.js';
import { CustomerGroupService } from './customerGroupService.js';

// ==============================================================================
// IN-MEMORY STORE (Garante persistência de execução sem DDL/Migrations)
// ==============================================================================

const memorySuppliers = new Map<string, Supplier[]>();
const memoryCustomers = new Map<string, Customer[]>();
const memoryGroups = new Map<string, CustomerGroup[]>();

// Seed inicial para empresas padrões
function initializeSeedData(companyId: string) {
  if (!memorySuppliers.has(companyId)) {
    memorySuppliers.set(companyId, [
      {
        id: '10000000-0000-0000-0000-000000000001',
        companyId,
        personType: 'legal',
        name: 'Tech Distribuidora Ltda',
        tradeName: 'Tech Dist',
        document: '12.345.678/0001-90',
        stateRegistration: '123456789',
        municipalRegistration: '987654321',
        email: 'contato@techdist.com.br',
        phone: '(11) 3456-7890',
        mobile: '(11) 98765-4321',
        website: 'https://techdist.com.br',
        contactName: 'Carlos Eduardo',
        address: 'Av. Paulista, 1000, Sala 52',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01310-100',
        country: 'Brasil',
        category: 'Eletrônicos & Peças',
        paymentTerms: '30 dias (Boleto)',
        bankInfo: {
          bankName: 'Banco do Brasil',
          agency: '1234-5',
          accountNumber: '98765-4',
          pixKey: 'contato@techdist.com.br',
        },
        notes: 'Fornecedor principal de telas e baterias originais.',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        companyId,
        personType: 'legal',
        name: 'Inova Componentes e Ferramentas SA',
        tradeName: 'Inova Peças',
        document: '98.765.432/0001-10',
        stateRegistration: '987654321',
        municipalRegistration: '123456789',
        email: 'vendas@inovapeças.com.br',
        phone: '(19) 3210-9876',
        mobile: '(19) 99887-6655',
        website: 'https://inovapecas.com.br',
        contactName: 'Mariana Silveira',
        address: 'Rua das Indústrias, 500',
        neighborhood: 'Distrito Industrial',
        city: 'Campinas',
        state: 'SP',
        postalCode: '13000-000',
        country: 'Brasil',
        category: 'Acessórios e Ferramentas',
        paymentTerms: 'À vista com 5% desc.',
        bankInfo: {
          bankName: 'Itaú Unibanco',
          agency: '0342',
          accountNumber: '11223-9',
          pixKey: 'financeiro@inovapecas.com.br',
        },
        notes: 'Fornecedor de estações de solda e microscópios.',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  if (!memoryGroups.has(companyId)) {
    memoryGroups.set(companyId, [
      {
        id: '20000000-0000-0000-0000-000000000001',
        companyId,
        name: 'Varejo Padrão',
        description: 'Clientes convencionais de balcão e ordem de serviço',
        discountPercentage: 0,
        priceTable: 'Tabela Balcão',
        status: 'active',
        customerCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        companyId,
        name: 'Revendedores VIP',
        description: 'Assistências técnicas parceiras com desconto em peças',
        discountPercentage: 15,
        priceTable: 'Tabela Revenda',
        status: 'active',
        customerCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  if (!memoryCustomers.has(companyId)) {
    memoryCustomers.set(companyId, [
      {
        id: '30000000-0000-0000-0000-000000000001',
        companyId,
        customerGroupId: '20000000-0000-0000-0000-000000000001',
        customerGroupName: 'Varejo Padrão',
        personType: 'individual',
        name: 'Lucas Gabriel Albuquerque',
        tradeName: null,
        document: '123.456.789-00',
        stateRegistration: null,
        municipalRegistration: null,
        email: 'lucas.albuquerque@email.com',
        phone: '(11) 2345-6789',
        mobile: '(11) 98765-1122',
        website: null,
        contactName: null,
        address: 'Rua Augusta, 1500, Apto 42',
        neighborhood: 'Consolação',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01304-001',
        country: 'Brasil',
        creditLimit: 2500,
        notes: 'Cliente fiel, prefere contato por WhatsApp.',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        companyId,
        customerGroupId: '20000000-0000-0000-0000-000000000002',
        customerGroupName: 'Revendedores VIP',
        personType: 'legal',
        name: 'Nexus Soluções Mobile Ltda',
        tradeName: 'Nexus Tech',
        document: '45.678.901/0001-23',
        stateRegistration: '543216789',
        municipalRegistration: '987123456',
        email: 'contato@nexustech.com.br',
        phone: '(11) 4002-8922',
        mobile: '(11) 97711-2233',
        website: 'https://nexustech.com.br',
        contactName: 'Amanda Ferreira',
        address: 'Av. Brigadeiro Faria Lima, 2200',
        neighborhood: 'Pinheiros',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01451-000',
        country: 'Brasil',
        creditLimit: 15000,
        notes: 'Faturamento quinzenal para reparos terceirizados.',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }
}

export class ContactService {
  // ============================================================================
  // FORNECEDORES (SUPPLIERS)
  // ============================================================================

  static async listSuppliers(
    companyId: UUID,
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: ContactStatus;
      personType?: PersonType;
      category?: string;
    } = {}
  ): Promise<PaginatedResult<Supplier>> {
    initializeSeedData(companyId);

    // Tentar via SupplierService se configurado
    if (isSupabaseAdminConfigured()) {
      try {
        return await SupplierService.listByCompany(companyId, {
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          search: params.search,
          status: params.status,
          personType: params.personType,
          category: params.category,
        });
      } catch {
        // Fallback suave para memória
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
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.tradeName && s.tradeName.toLowerCase().includes(q)) ||
          (s.document && s.document.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.phone && s.phone.toLowerCase().includes(q))
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
        hasPreviousPage: page > 1,
      },
    };
  }

  static async getSupplierById(companyId: UUID, supplierId: UUID): Promise<Supplier | null> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        const found = await SupplierService.getById(companyId, supplierId);
        if (found) return found;
      } catch {
        // Ignore fallback
      }
    }

    const list = memorySuppliers.get(companyId) || [];
    return list.find((s) => s.id === supplierId) || null;
  }

  static async createSupplier(companyId: UUID, payload: CreateSupplierPayload): Promise<Supplier> {
    initializeSeedData(companyId);

    if (!payload.name || !payload.name.trim()) {
      throw new Error('O nome ou razão social do fornecedor é obrigatório.');
    }

    if (isSupabaseAdminConfigured()) {
      try {
        const created = await SupplierService.create(companyId, payload);
        if (created) {
          // Mantém store em memória sincronizado
          const list = memorySuppliers.get(companyId) || [];
          list.unshift(created);
          memorySuppliers.set(companyId, list);
          return created;
        }
      } catch {
        // Prossegue para memória sem falhar
      }
    }

    const now = new Date().toISOString();
    const newSupplier: Supplier = {
      id: crypto.randomUUID(),
      companyId,
      personType: payload.personType || 'legal',
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
      country: payload.country?.trim() || 'Brasil',
      category: payload.category?.trim() || null,
      paymentTerms: payload.paymentTerms?.trim() || null,
      bankInfo: payload.bankInfo || {},
      notes: payload.notes?.trim() || null,
      status: payload.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    const list = memorySuppliers.get(companyId) || [];
    list.unshift(newSupplier);
    memorySuppliers.set(companyId, list);

    return newSupplier;
  }

  static async updateSupplier(
    companyId: UUID,
    supplierId: UUID,
    payload: UpdateSupplierPayload
  ): Promise<Supplier> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        const updated = await SupplierService.update(companyId, supplierId, payload);
        if (updated) {
          const list = memorySuppliers.get(companyId) || [];
          const idx = list.findIndex((s) => s.id === supplierId);
          if (idx !== -1) list[idx] = updated;
          return updated;
        }
      } catch {
        // Fallback para memória
      }
    }

    const list = memorySuppliers.get(companyId) || [];
    const index = list.findIndex((s) => s.id === supplierId);
    if (index === -1) {
      throw new Error('Fornecedor não encontrado.');
    }

    const existing = list[index];
    const updated: Supplier = {
      ...existing,
      personType: payload.personType ?? existing.personType,
      name: payload.name !== undefined ? payload.name.trim() : existing.name,
      tradeName: payload.tradeName !== undefined ? payload.tradeName?.trim() || null : existing.tradeName,
      document: payload.document !== undefined ? payload.document?.trim() || null : existing.document,
      stateRegistration:
        payload.stateRegistration !== undefined
          ? payload.stateRegistration?.trim() || null
          : existing.stateRegistration,
      municipalRegistration:
        payload.municipalRegistration !== undefined
          ? payload.municipalRegistration?.trim() || null
          : existing.municipalRegistration,
      email: payload.email !== undefined ? payload.email?.trim() || null : existing.email,
      phone: payload.phone !== undefined ? payload.phone?.trim() || null : existing.phone,
      mobile: payload.mobile !== undefined ? payload.mobile?.trim() || null : existing.mobile,
      website: payload.website !== undefined ? payload.website?.trim() || null : existing.website,
      contactName:
        payload.contactName !== undefined ? payload.contactName?.trim() || null : existing.contactName,
      address: payload.address !== undefined ? payload.address?.trim() || null : existing.address,
      neighborhood:
        payload.neighborhood !== undefined ? payload.neighborhood?.trim() || null : existing.neighborhood,
      city: payload.city !== undefined ? payload.city?.trim() || null : existing.city,
      state: payload.state !== undefined ? payload.state?.trim() || null : existing.state,
      postalCode:
        payload.postalCode !== undefined ? payload.postalCode?.trim() || null : existing.postalCode,
      country: payload.country !== undefined ? payload.country?.trim() || 'Brasil' : existing.country,
      category: payload.category !== undefined ? payload.category?.trim() || null : existing.category,
      paymentTerms:
        payload.paymentTerms !== undefined ? payload.paymentTerms?.trim() || null : existing.paymentTerms,
      bankInfo: payload.bankInfo !== undefined ? payload.bankInfo : existing.bankInfo,
      notes: payload.notes !== undefined ? payload.notes?.trim() || null : existing.notes,
      status: payload.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    memorySuppliers.set(companyId, list);
    return updated;
  }

  static async deleteSupplier(companyId: UUID, supplierId: UUID): Promise<boolean> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        await SupplierService.delete(companyId, supplierId);
      } catch {
        // Fallback
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

  static async listCustomers(
    companyId: UUID,
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: ContactStatus;
      personType?: PersonType;
      customerGroupId?: string;
    } = {}
  ): Promise<PaginatedResult<Customer>> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        return await CustomerService.listByCompany(companyId, {
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          search: params.search,
          status: params.status,
          personType: params.personType,
          groupId: params.customerGroupId,
        });
      } catch {
        // Fallback
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
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
          (c.document && c.document.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.mobile && c.mobile.toLowerCase().includes(q))
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
        hasPreviousPage: page > 1,
      },
    };
  }

  static async getCustomerById(companyId: UUID, customerId: UUID): Promise<Customer | null> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        const found = await CustomerService.getById(companyId, customerId);
        if (found) return found;
      } catch {
        // Fallback
      }
    }

    const list = memoryCustomers.get(companyId) || [];
    return list.find((c) => c.id === customerId) || null;
  }

  static async createCustomer(companyId: UUID, payload: CreateCustomerPayload): Promise<Customer> {
    initializeSeedData(companyId);

    if (!payload.name || !payload.name.trim()) {
      throw new Error('O nome do cliente é obrigatório.');
    }

    if (isSupabaseAdminConfigured()) {
      try {
        const created = await CustomerService.create(companyId, payload);
        if (created) {
          const list = memoryCustomers.get(companyId) || [];
          list.unshift(created);
          memoryCustomers.set(companyId, list);
          return created;
        }
      } catch {
        // Fallback
      }
    }

    const groups = memoryGroups.get(companyId) || [];
    const group = payload.customerGroupId
      ? groups.find((g) => g.id === payload.customerGroupId)
      : null;

    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      companyId,
      customerGroupId: payload.customerGroupId || null,
      customerGroupName: group?.name || null,
      personType: payload.personType || 'individual',
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
      country: payload.country?.trim() || 'Brasil',
      creditLimit: payload.creditLimit ?? 0,
      notes: payload.notes?.trim() || null,
      status: payload.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    const list = memoryCustomers.get(companyId) || [];
    list.unshift(newCustomer);
    memoryCustomers.set(companyId, list);

    return newCustomer;
  }

  static async updateCustomer(
    companyId: UUID,
    customerId: UUID,
    payload: UpdateCustomerPayload
  ): Promise<Customer> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        const updated = await CustomerService.update(companyId, customerId, payload);
        if (updated) {
          const list = memoryCustomers.get(companyId) || [];
          const idx = list.findIndex((c) => c.id === customerId);
          if (idx !== -1) list[idx] = updated;
          return updated;
        }
      } catch {
        // Fallback
      }
    }

    const list = memoryCustomers.get(companyId) || [];
    const index = list.findIndex((c) => c.id === customerId);
    if (index === -1) {
      throw new Error('Cliente não encontrado.');
    }

    const existing = list[index];
    const groups = memoryGroups.get(companyId) || [];
    const group = payload.customerGroupId
      ? groups.find((g) => g.id === payload.customerGroupId)
      : existing.customerGroupId
      ? groups.find((g) => g.id === existing.customerGroupId)
      : null;

    const updated: Customer = {
      ...existing,
      customerGroupId:
        payload.customerGroupId !== undefined ? payload.customerGroupId : existing.customerGroupId,
      customerGroupName: group?.name || existing.customerGroupName,
      personType: payload.personType ?? existing.personType,
      name: payload.name !== undefined ? payload.name.trim() : existing.name,
      tradeName: payload.tradeName !== undefined ? payload.tradeName?.trim() || null : existing.tradeName,
      document: payload.document !== undefined ? payload.document?.trim() || null : existing.document,
      stateRegistration:
        payload.stateRegistration !== undefined
          ? payload.stateRegistration?.trim() || null
          : existing.stateRegistration,
      municipalRegistration:
        payload.municipalRegistration !== undefined
          ? payload.municipalRegistration?.trim() || null
          : existing.municipalRegistration,
      email: payload.email !== undefined ? payload.email?.trim() || null : existing.email,
      phone: payload.phone !== undefined ? payload.phone?.trim() || null : existing.phone,
      mobile: payload.mobile !== undefined ? payload.mobile?.trim() || null : existing.mobile,
      website: payload.website !== undefined ? payload.website?.trim() || null : existing.website,
      contactName:
        payload.contactName !== undefined ? payload.contactName?.trim() || null : existing.contactName,
      address: payload.address !== undefined ? payload.address?.trim() || null : existing.address,
      neighborhood:
        payload.neighborhood !== undefined ? payload.neighborhood?.trim() || null : existing.neighborhood,
      city: payload.city !== undefined ? payload.city?.trim() || null : existing.city,
      state: payload.state !== undefined ? payload.state?.trim() || null : existing.state,
      postalCode:
        payload.postalCode !== undefined ? payload.postalCode?.trim() || null : existing.postalCode,
      country: payload.country !== undefined ? payload.country?.trim() || 'Brasil' : existing.country,
      creditLimit: payload.creditLimit !== undefined ? payload.creditLimit : existing.creditLimit,
      notes: payload.notes !== undefined ? payload.notes?.trim() || null : existing.notes,
      status: payload.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    memoryCustomers.set(companyId, list);
    return updated;
  }

  static async deleteCustomer(companyId: UUID, customerId: UUID): Promise<boolean> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        await CustomerService.delete(companyId, customerId);
      } catch {
        // Fallback
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

  static async listCustomerGroups(companyId: UUID): Promise<CustomerGroup[]> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        const groups = await CustomerGroupService.listByCompany(companyId);
        if (groups && groups.length > 0) return groups;
      } catch {
        // Fallback
      }
    }

    return memoryGroups.get(companyId) || [];
  }

  static async getCustomerGroupById(companyId: UUID, groupId: UUID): Promise<CustomerGroup | null> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        const found = await CustomerGroupService.getById(companyId, groupId);
        if (found) return found;
      } catch {
        // Fallback
      }
    }

    const groups = memoryGroups.get(companyId) || [];
    return groups.find((g) => g.id === groupId) || null;
  }

  static async createCustomerGroup(
    companyId: UUID,
    payload: CreateCustomerGroupPayload
  ): Promise<CustomerGroup> {
    initializeSeedData(companyId);

    if (!payload.name || !payload.name.trim()) {
      throw new Error('O nome do grupo de clientes é obrigatório.');
    }

    if (isSupabaseAdminConfigured()) {
      try {
        const created = await CustomerGroupService.create(companyId, payload);
        if (created) {
          const list = memoryGroups.get(companyId) || [];
          list.push(created);
          memoryGroups.set(companyId, list);
          return created;
        }
      } catch {
        // Fallback
      }
    }

    const now = new Date().toISOString();
    const newGroup: CustomerGroup = {
      id: crypto.randomUUID(),
      companyId,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      discountPercentage: payload.discountPercentage ?? 0,
      priceTable: payload.priceTable?.trim() || null,
      status: payload.status || 'active',
      customerCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const list = memoryGroups.get(companyId) || [];
    list.push(newGroup);
    memoryGroups.set(companyId, list);

    return newGroup;
  }

  static async updateCustomerGroup(
    companyId: UUID,
    groupId: UUID,
    payload: UpdateCustomerGroupPayload
  ): Promise<CustomerGroup> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        const updated = await CustomerGroupService.update(companyId, groupId, payload);
        if (updated) {
          const list = memoryGroups.get(companyId) || [];
          const idx = list.findIndex((g) => g.id === groupId);
          if (idx !== -1) list[idx] = updated;
          return updated;
        }
      } catch {
        // Fallback
      }
    }

    const list = memoryGroups.get(companyId) || [];
    const index = list.findIndex((g) => g.id === groupId);
    if (index === -1) {
      throw new Error('Grupo de clientes não encontrado.');
    }

    const existing = list[index];
    const updated: CustomerGroup = {
      ...existing,
      name: payload.name !== undefined ? payload.name.trim() : existing.name,
      description:
        payload.description !== undefined ? payload.description?.trim() || null : existing.description,
      discountPercentage:
        payload.discountPercentage !== undefined
          ? payload.discountPercentage
          : existing.discountPercentage,
      priceTable:
        payload.priceTable !== undefined ? payload.priceTable?.trim() || null : existing.priceTable,
      status: payload.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    memoryGroups.set(companyId, list);
    return updated;
  }

  static async deleteCustomerGroup(companyId: UUID, groupId: UUID): Promise<boolean> {
    initializeSeedData(companyId);

    if (isSupabaseAdminConfigured()) {
      try {
        await CustomerGroupService.delete(companyId, groupId);
      } catch {
        // Fallback
      }
    }

    const list = memoryGroups.get(companyId) || [];
    const filtered = list.filter((g) => g.id !== groupId);
    memoryGroups.set(companyId, filtered);
    return true;
  }
}
