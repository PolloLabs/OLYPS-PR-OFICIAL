import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import { CompanyMembershipService } from './companyMembershipService.js';
import type { UUID, CompanyId, PermissionKey, CompanyRole } from '../../types/index.js';

interface DatabaseRolePermissionJoinRow {
  permissions: {
    key: string;
  } | null;
}

/**
 * Standard fallback permissions mapping in case database tables are in migration phase.
 */
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  company_admin: [
    'dashboard.visualizar',
    'clientes.ler', 'clientes.criar', 'clientes.atualizar', 'clientes.excluir',
    'fornecedores.ler', 'fornecedores.criar', 'fornecedores.atualizar', 'fornecedores.excluir',
    'produtos.ler', 'produtos.criar', 'produtos.atualizar', 'produtos.excluir',
    'estoque.visualizar', 'estoque.ajustar', 'estoque.transferir',
    'vendas.ler', 'vendas.criar', 'vendas.atualizar', 'vendas.cancelar',
    'compras.ler', 'compras.criar', 'compras.atualizar', 'compras.cancelar',
    'reparos.ler', 'reparos.criar', 'reparos.atualizar', 'reparos.finalizar',
    'pdv.abrir', 'pdv.vender', 'pdv.cancelar',
    'financeiro.visualizar', 'financeiro.lancar', 'financeiro.editar',
    'relatorios.visualizar',
    'usuarios.ler', 'usuarios.criar', 'usuarios.atualizar', 'usuarios.suspender', 'usuarios.permissoes',
    'empresa.configurar',
  ],
  manager: [
    'dashboard.visualizar',
    'clientes.ler', 'clientes.criar', 'clientes.atualizar', 'clientes.excluir',
    'fornecedores.ler', 'fornecedores.criar', 'fornecedores.atualizar', 'fornecedores.excluir',
    'produtos.ler', 'produtos.criar', 'produtos.atualizar', 'produtos.excluir',
    'estoque.visualizar', 'estoque.ajustar', 'estoque.transferir',
    'vendas.ler', 'vendas.criar', 'vendas.atualizar', 'vendas.cancelar',
    'compras.ler', 'compras.criar', 'compras.atualizar', 'compras.cancelar',
    'reparos.ler', 'reparos.criar', 'reparos.atualizar', 'reparos.finalizar',
    'pdv.abrir', 'pdv.vender',
    'financeiro.visualizar',
    'relatorios.visualizar',
    'usuarios.ler',
  ],
  seller: [
    'dashboard.visualizar',
    'clientes.ler', 'clientes.criar', 'clientes.atualizar',
    'produtos.ler',
    'estoque.visualizar',
    'vendas.ler', 'vendas.criar', 'vendas.atualizar',
    'pdv.abrir', 'pdv.vender',
    'reparos.ler', 'reparos.criar',
  ],
  cashier: [
    'dashboard.visualizar',
    'clientes.ler', 'clientes.criar',
    'produtos.ler',
    'vendas.ler', 'vendas.criar',
    'pdv.abrir', 'pdv.vender', 'pdv.cancelar',
    'financeiro.visualizar', 'financeiro.lancar',
  ],
  technician: [
    'dashboard.visualizar',
    'clientes.ler',
    'produtos.ler',
    'estoque.visualizar',
    'reparos.ler', 'reparos.criar', 'reparos.atualizar', 'reparos.finalizar',
  ],
  stock_manager: [
    'dashboard.visualizar',
    'fornecedores.ler', 'fornecedores.criar', 'fornecedores.atualizar',
    'produtos.ler', 'produtos.criar', 'produtos.atualizar',
    'estoque.visualizar', 'estoque.ajustar', 'estoque.transferir',
    'compras.ler', 'compras.criar', 'compras.atualizar',
  ],
};

/**
 * Service responsible for evaluating RBAC permissions within a tenant company context.
 * Operates strictly on the server side using the validated userId and companyId.
 */
export class PermissionService {
  /**
   * Retrieves all effective permissions granted to a user within a company.
   *
   * @param userId UUID of the authenticated user
   * @param companyId UUID of the target company
   * @returns Array of permission keys
   */
  public static async getUserPermissions(
    userId: UUID,
    companyId: CompanyId
  ): Promise<PermissionKey[]> {
    if (!userId || !companyId) {
      return [];
    }

    if (!isSupabaseAdminConfigured()) {
      const membership = await CompanyMembershipService.getActiveMembership(userId, companyId);
      const roleKey = membership?.role || 'company_admin';
      return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
    }

    try {
      // 1. Verify active user membership and active company status
      const membership = await CompanyMembershipService.getActiveMembership(userId, companyId);
      if (!membership || membership.status !== 'active') {
        return [];
      }

      const roleKey = membership.role;
      const supabaseAdmin = getSupabaseAdmin();

      // 2. Query role_permissions join
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select(`
          id,
          role_permissions (
            permissions (
              key
            )
          )
        `)
        .eq('key', roleKey)
        .maybeSingle();

      if (!roleError && roleData && Array.isArray(roleData.role_permissions)) {
        const joinRows = roleData.role_permissions as unknown as DatabaseRolePermissionJoinRow[];
        const permissions = joinRows
          .map((item) => item.permissions?.key)
          .filter((key): key is string => Boolean(key));

        if (permissions.length > 0) {
          return permissions;
        }
      }

      // 3. Fallback to predefined role matrix if database seed hasn't been queried yet
      return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
    } catch (err: unknown) {
      console.warn(`[WARN] Exceção ao obter permissões: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
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
  public static async hasPermission(
    userId: UUID,
    companyId: CompanyId,
    permissionKey: PermissionKey
  ): Promise<boolean> {
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
  public static async getRolePermissions(roleKey: CompanyRole): Promise<PermissionKey[]> {
    if (!isSupabaseAdminConfigured()) {
      return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select(`
          id,
          role_permissions (
            permissions (
              key
            )
          )
        `)
        .eq('key', roleKey)
        .maybeSingle();

      if (!roleError && roleData && Array.isArray(roleData.role_permissions)) {
        const joinRows = roleData.role_permissions as unknown as DatabaseRolePermissionJoinRow[];
        const permissions = joinRows
          .map((item) => item.permissions?.key)
          .filter((key): key is string => Boolean(key));

        if (permissions.length > 0) {
          return permissions;
        }
      }

      return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
    } catch {
      return DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
    }
  }
}
