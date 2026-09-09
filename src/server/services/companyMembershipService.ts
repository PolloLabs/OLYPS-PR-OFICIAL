import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import { SubscriptionService } from './subscriptionService.js';
import type {
  UUID,
  CompanyId,
  CompanyMembership,
  CompanySummary,
  CompanyRole,
  MembershipStatus,
  CompanyStatus,
  CompanyUserMember,
  InviteCompanyUserPayload,
  CompanyUsersListResponse,
} from '../../types/index.js';

interface DatabaseCompanyUserRow {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  companies?: {
    id: string;
    name: string;
    legal_name: string | null;
    slug: string;
    status: string;
  } | null;
}

export const ROLE_LABELS: Record<string, string> = {
  company_admin: 'Administrador da Empresa',
  manager: 'Gerente',
  seller: 'Vendedor',
  cashier: 'Operador de Caixa',
  technician: 'Técnico',
  stock_manager: 'Estoquista',
};

// In-memory fallback members for development/preview when database is not configured
const FALLBACK_COMPANY_USERS: CompanyUserMember[] = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    userId: '990e8400-e29b-41d4-a716-446655440001',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Carlos Alberto Silva',
    email: 'carlos.silva@techstore.com.br',
    role: 'company_admin',
    roleName: 'Administrador da Empresa',
    status: 'active',
    joinedAt: '2026-08-01T10:00:00.000Z',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    phone: '(11) 98765-4321',
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    userId: '990e8400-e29b-41d4-a716-446655440002',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Marina Souza Lima',
    email: 'marina.vendas@techstore.com.br',
    role: 'seller',
    roleName: 'Vendedor',
    status: 'active',
    joinedAt: '2026-08-10T14:30:00.000Z',
    createdAt: '2026-08-10T14:30:00.000Z',
    updatedAt: '2026-08-10T14:30:00.000Z',
    phone: '(11) 97654-3210',
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    userId: '990e8400-e29b-41d4-a716-446655440003',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Roberto Santos Dias',
    email: 'roberto.caixa@techstore.com.br',
    role: 'cashier',
    roleName: 'Operador de Caixa',
    status: 'active',
    joinedAt: '2026-08-15T09:15:00.000Z',
    createdAt: '2026-08-15T09:15:00.000Z',
    updatedAt: '2026-08-15T09:15:00.000Z',
    phone: '(11) 96543-2109',
  },
];

/**
 * Service responsible for resolving user company memberships, member lifecycle, and tenant isolation checks.
 * Always operates server-side using the secure Supabase Admin instance with validated userId.
 */
export class CompanyMembershipService {
  /**
   * Retrieves all active company memberships for a given user.
   */
  public static async listUserCompanies(userId: UUID): Promise<CompanySummary[]> {
    if (!userId) {
      return [];
    }

    if (!isSupabaseAdminConfigured()) {
      return [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'TechStore Brasil Matriz',
          legalName: 'TechStore Brasil Comércio Ltda',
          slug: 'techstore-matriz',
          status: 'active',
          userRole: 'company_admin',
          membershipStatus: 'active',
          membershipId: '770e8400-e29b-41d4-a716-446655440001',
        },
      ];
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from('company_users')
        .select(`
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
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error || !data) {
        console.warn(`[WARN] Erro ao listar empresas do usuário ${userId}: ${error?.message}`);
        return [];
      }

      const rows = data as unknown as DatabaseCompanyUserRow[];

      return rows
        .filter((row) => row.companies && row.companies.status === 'active')
        .map((row) => ({
          id: row.company_id,
          name: row.companies?.name || '',
          legalName: row.companies?.legal_name || null,
          slug: row.companies?.slug || '',
          status: (row.companies?.status || 'active') as CompanyStatus,
          userRole: row.role as CompanyRole,
          membershipStatus: row.status as MembershipStatus,
          membershipId: row.id,
        }));
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao listar empresas do usuário: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return [];
    }
  }

  /**
   * Retrieves and verifies an active membership of a user in a specific company.
   */
  public static async getActiveMembership(
    userId: UUID,
    companyId: CompanyId
  ): Promise<CompanyMembership | null> {
    if (!userId || !companyId) {
      return null;
    }

    if (!isSupabaseAdminConfigured()) {
      return {
        id: '770e8400-e29b-41d4-a716-446655440001',
        userId,
        companyId,
        companyName: 'TechStore Brasil Matriz',
        role: 'company_admin',
        status: 'active',
        joinedAt: '2026-08-01T10:00:00.000Z',
        lastAccessedAt: null,
      };
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from('company_users')
        .select(`
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
        `)
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const row = data as unknown as DatabaseCompanyUserRow;

      // Check if company itself is active
      if (!row.companies || row.companies.status !== 'active') {
        return null;
      }

      return {
        id: row.id,
        userId: row.user_id,
        companyId: row.company_id,
        companyName: row.companies.name,
        role: row.role as CompanyRole,
        status: row.status as MembershipStatus,
        joinedAt: row.created_at,
        lastAccessedAt: null,
      };
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao buscar membership: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    }
  }

  /**
   * Lists all users belonging to a company, including quota information from active subscription limits.
   */
  public static async listCompanyUsers(
    companyId: CompanyId,
    filters?: { search?: string; role?: string; status?: string }
  ): Promise<CompanyUsersListResponse> {
    const subscriptionSummary = await SubscriptionService.getCompanySubscription(companyId);
    const maxLimit = subscriptionSummary.limits?.max_users || 10;
    const planName = subscriptionSummary.plan?.name || 'Plano Básico';
    const planCode = subscriptionSummary.plan?.code || 'basic';

    let allMembers: CompanyUserMember[] = [];

    if (!isSupabaseAdminConfigured()) {
      allMembers = FALLBACK_COMPANY_USERS.filter((u) => u.companyId === companyId);
    } else {
      try {
        const supabaseAdmin = getSupabaseAdmin();

        const { data, error } = await supabaseAdmin
          .from('company_users')
          .select(`
            id,
            company_id,
            user_id,
            role,
            status,
            created_at,
            updated_at
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (error || !data) {
          console.warn(`[WARN] Erro ao consultar usuários da empresa ${companyId}: ${error?.message}`);
          allMembers = FALLBACK_COMPANY_USERS.filter((u) => u.companyId === companyId);
        } else {
          // Fetch user metadata/emails from auth.users
          let authUserMap = new Map<string, { email?: string; name?: string }>();
          try {
            const listRes = await supabaseAdmin.auth.admin.listUsers();
            const rawUsers = (listRes.data?.users || []) as Array<{ id: string; email?: string; user_metadata?: Record<string, any> }>;
            for (const u of rawUsers) {
              authUserMap.set(u.id, {
                email: u.email,
                name: u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split('@')[0],
              });
            }
          } catch {
            // Safe fallback if listUsers is not permitted
          }

          allMembers = data.map((row) => {
            const authUser = authUserMap.get(row.user_id);
            const friendlyName = authUser?.name || 'Colaborador';
            const email = authUser?.email || `usuario-${row.user_id.substring(0, 6)}@empresa.com`;

            return {
              id: row.id,
              userId: row.user_id,
              companyId: row.company_id,
              name: friendlyName,
              email: email,
              role: row.role as CompanyRole,
              roleName: ROLE_LABELS[row.role] || row.role,
              status: row.status as MembershipStatus,
              joinedAt: row.created_at,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            };
          });
        }
      } catch (err: unknown) {
        console.warn(`[WARN] Exceção ao listar usuários da empresa: ${err instanceof Error ? err.message : 'Erro'}`);
        allMembers = FALLBACK_COMPANY_USERS.filter((u) => u.companyId === companyId);
      }
    }

    const activeCount = allMembers.filter((u) => u.status === 'active').length;
    const isLimitReached = activeCount >= maxLimit;
    const remainingSlots = Math.max(0, maxLimit - activeCount);

    // Apply filtering
    let filtered = [...allMembers];

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.roleName && u.roleName.toLowerCase().includes(q))
      );
    }

    if (filters?.role && filters.role !== 'all') {
      filtered = filtered.filter((u) => u.role === filters.role);
    }

    if (filters?.status && filters.status !== 'all') {
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
        planCode,
      },
    };
  }

  /**
   * Adds or invites a user to the company, strictly enforcing active subscription max_users limits.
   */
  public static async addCompanyUser(
    companyId: CompanyId,
    payload: InviteCompanyUserPayload
  ): Promise<{ success: boolean; data?: CompanyUserMember; error?: string }> {
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
      return { success: false, error: 'E-mail inválido. Informe um endereço de e-mail corporativo válido.' };
    }

    const validRoles = ['company_admin', 'manager', 'seller', 'cashier', 'technician', 'stock_manager'];
    if (!payload.role || !validRoles.includes(payload.role)) {
      return { success: false, error: `Papel inválido. Papéis válidos: ${validRoles.join(', ')}.` };
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    const displayName = payload.name?.trim() || normalizedEmail.split('@')[0];

    // 1. Strict Subscription Limit Check (max_users)
    const subscriptionSummary = await SubscriptionService.getCompanySubscription(companyId);
    const maxUsersLimit = subscriptionSummary.limits?.max_users || 10;

    let currentUsers = isSupabaseAdminConfigured()
      ? (await this.listCompanyUsers(companyId)).users
      : FALLBACK_COMPANY_USERS.filter((u) => u.companyId === companyId);

    const activeCount = currentUsers.filter((u) => u.status === 'active').length;

    if (activeCount >= maxUsersLimit) {
      return {
        success: false,
        error: `Limite de usuários atingido para o plano ${subscriptionSummary.plan?.name || 'atual'} (${maxUsersLimit} colaboradores). Faça upgrade da sua assinatura para adicionar novos usuários.`,
      };
    }

    // 2. Check if user already in company
    const existingMember = currentUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingMember && existingMember.status === 'active') {
      return {
        success: false,
        error: `O e-mail "${normalizedEmail}" já está cadastrado como membro ativo nesta empresa.`,
      };
    }

    const now = new Date().toISOString();

    if (!isSupabaseAdminConfigured()) {
      if (existingMember) {
        existingMember.status = 'active';
        existingMember.role = payload.role;
        existingMember.roleName = ROLE_LABELS[payload.role] || payload.role;
        existingMember.updatedAt = now;
        return { success: true, data: existingMember };
      }

      const newId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `770e8400-e29b-41d4-a716-${Math.random().toString(16).substring(2, 14).padEnd(12, '0')}`;
      const newUserId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `990e8400-e29b-41d4-a716-${Math.random().toString(16).substring(2, 14).padEnd(12, '0')}`;

      const newMember: CompanyUserMember = {
        id: newId,
        userId: newUserId,
        companyId,
        name: displayName,
        email: normalizedEmail,
        role: payload.role,
        roleName: ROLE_LABELS[payload.role] || payload.role,
        status: 'active',
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
        phone: payload.phone || null,
      };

      FALLBACK_COMPANY_USERS.unshift(newMember);
      return { success: true, data: newMember };
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Find or create auth user
      let targetUserId: string | null = null;
      try {
        const listRes = await supabaseAdmin.auth.admin.listUsers();
        const rawUsers = (listRes.data?.users || []) as Array<{ id: string; email?: string }>;
        const found = rawUsers.find((u) => u.email?.toLowerCase() === normalizedEmail);
        if (found) {
          targetUserId = found.id;
        }
      } catch {
        // Continue
      }

      if (!targetUserId) {
        const tempPassword = `Olyps#${Math.random().toString(36).substring(2, 10)}!${Date.now().toString().slice(-4)}`;
        const { data: createdAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: displayName,
            full_name: displayName,
          },
        });

        if (authError || !createdAuthUser.user) {
          return { success: false, error: `Erro ao provisionar usuário de acesso: ${authError?.message || 'Falha de autenticação'}` };
        }
        targetUserId = createdAuthUser.user.id;
      }

      // Check if row already exists in company_users
      const { data: existingRow } = await supabaseAdmin
        .from('company_users')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', targetUserId)
        .maybeSingle();

      let membershipResultRow: DatabaseCompanyUserRow;

      if (existingRow) {
        const { data: updatedRow, error: updateError } = await supabaseAdmin
          .from('company_users')
          .update({
            role: payload.role,
            status: 'active',
            updated_at: now,
          })
          .eq('id', existingRow.id)
          .select('*')
          .single();

        if (updateError || !updatedRow) {
          return { success: false, error: `Falha ao reativar vínculo do usuário: ${updateError?.message}` };
        }
        membershipResultRow = updatedRow as DatabaseCompanyUserRow;
      } else {
        const { data: insertedRow, error: insertError } = await supabaseAdmin
          .from('company_users')
          .insert({
            company_id: companyId,
            user_id: targetUserId,
            role: payload.role,
            status: 'active',
            created_at: now,
            updated_at: now,
          })
          .select('*')
          .single();

        if (insertError || !insertedRow) {
          return { success: false, error: `Falha ao vincular usuário à empresa: ${insertError?.message}` };
        }
        membershipResultRow = insertedRow as DatabaseCompanyUserRow;
      }

      const createdMember: CompanyUserMember = {
        id: membershipResultRow.id,
        userId: membershipResultRow.user_id,
        companyId: membershipResultRow.company_id,
        name: displayName,
        email: normalizedEmail,
        role: membershipResultRow.role as CompanyRole,
        roleName: ROLE_LABELS[membershipResultRow.role] || membershipResultRow.role,
        status: membershipResultRow.status as MembershipStatus,
        joinedAt: membershipResultRow.created_at,
        createdAt: membershipResultRow.created_at,
        updatedAt: membershipResultRow.updated_at,
      };

      return { success: true, data: createdMember };
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao adicionar usuário à empresa: ${err instanceof Error ? err.message : 'Erro'}`);
      return { success: false, error: 'Erro interno ao adicionar colaborador.' };
    }
  }

  /**
   * Updates user role within the company context.
   */
  public static async updateUserRole(
    companyId: CompanyId,
    userId: UUID,
    newRole: CompanyRole
  ): Promise<{ success: boolean; data?: CompanyUserMember; error?: string }> {
    const validRoles = ['company_admin', 'manager', 'seller', 'cashier', 'technician', 'stock_manager'];
    if (!newRole || !validRoles.includes(newRole)) {
      return { success: false, error: `Papel inválido. Papéis válidos: ${validRoles.join(', ')}.` };
    }

    const now = new Date().toISOString();

    if (!isSupabaseAdminConfigured()) {
      const member = FALLBACK_COMPANY_USERS.find(
        (u) => u.companyId === companyId && (u.userId === userId || u.id === userId)
      );

      if (!member) {
        return { success: false, error: 'Membro não encontrado nesta empresa.' };
      }

      member.role = newRole;
      member.roleName = ROLE_LABELS[newRole] || newRole;
      member.updatedAt = now;

      return { success: true, data: member };
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from('company_users')
        .update({
          role: newRole,
          updated_at: now,
        })
        .eq('company_id', companyId)
        .or(`user_id.eq.${userId},id.eq.${userId}`)
        .select('*')
        .single();

      if (error || !data) {
        return { success: false, error: `Falha ao alterar papel do usuário: ${error?.message || 'Não encontrado'}` };
      }

      const row = data as DatabaseCompanyUserRow;

      return {
        success: true,
        data: {
          id: row.id,
          userId: row.user_id,
          companyId: row.company_id,
          name: 'Colaborador',
          email: `usuario-${row.user_id.substring(0, 6)}@empresa.com`,
          role: row.role as CompanyRole,
          roleName: ROLE_LABELS[row.role] || row.role,
          status: row.status as MembershipStatus,
          joinedAt: row.created_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      };
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao alterar papel do usuário: ${err instanceof Error ? err.message : 'Erro'}`);
      return { success: false, error: 'Erro interno ao alterar papel do usuário.' };
    }
  }

  /**
   * Updates user membership status (active / suspended) with quota validation.
   */
  public static async updateUserStatus(
    companyId: CompanyId,
    userId: UUID,
    newStatus: MembershipStatus
  ): Promise<{ success: boolean; data?: CompanyUserMember; error?: string }> {
    if (newStatus !== 'active' && newStatus !== 'suspended') {
      return { success: false, error: 'Status inválido. Deve ser "active" ou "suspended".' };
    }

    // If activating, verify subscription limit
    if (newStatus === 'active') {
      const subscriptionSummary = await SubscriptionService.getCompanySubscription(companyId);
      const maxUsersLimit = subscriptionSummary.limits?.max_users || 10;

      const currentUsers = isSupabaseAdminConfigured()
        ? (await this.listCompanyUsers(companyId)).users
        : FALLBACK_COMPANY_USERS.filter((u) => u.companyId === companyId);

      const activeCount = currentUsers.filter((u) => u.status === 'active' && u.userId !== userId && u.id !== userId).length;

      if (activeCount >= maxUsersLimit) {
        return {
          success: false,
          error: `Não é possível reativar o usuário. O limite de ${maxUsersLimit} usuários ativos do plano foi atingido.`,
        };
      }
    }

    const now = new Date().toISOString();

    if (!isSupabaseAdminConfigured()) {
      const member = FALLBACK_COMPANY_USERS.find(
        (u) => u.companyId === companyId && (u.userId === userId || u.id === userId)
      );

      if (!member) {
        return { success: false, error: 'Membro não encontrado nesta empresa.' };
      }

      member.status = newStatus;
      member.updatedAt = now;

      return { success: true, data: member };
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from('company_users')
        .update({
          status: newStatus,
          updated_at: now,
        })
        .eq('company_id', companyId)
        .or(`user_id.eq.${userId},id.eq.${userId}`)
        .select('*')
        .single();

      if (error || !data) {
        return { success: false, error: `Falha ao alterar status do usuário: ${error?.message || 'Não encontrado'}` };
      }

      const row = data as DatabaseCompanyUserRow;

      return {
        success: true,
        data: {
          id: row.id,
          userId: row.user_id,
          companyId: row.company_id,
          name: 'Colaborador',
          email: `usuario-${row.user_id.substring(0, 6)}@empresa.com`,
          role: row.role as CompanyRole,
          roleName: ROLE_LABELS[row.role] || row.role,
          status: row.status as MembershipStatus,
          joinedAt: row.created_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      };
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao alterar status do usuário: ${err instanceof Error ? err.message : 'Erro'}`);
      return { success: false, error: 'Erro interno ao alterar status do colaborador.' };
    }
  }
}
