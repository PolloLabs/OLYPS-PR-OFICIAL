import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  User,
  Phone,
  Layers,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { AddUserModal } from './AddUserModal.js';
import { ChangeRoleModal } from './ChangeRoleModal.js';
import { ConfirmModal } from '../../ui/ConfirmModal.js';
import type {
  CompanyUserMember,
  CompanyUsersQuota,
  CompanyUsersListResponse,
  InviteCompanyUserPayload,
  CompanyRole,
  MembershipStatus,
  ApiResponse,
} from '../../../types/index.js';

interface UsersManagementViewProps {
  companyId?: string;
  activeCompanyName?: string;
  userRole?: string;
  isPlatformAdmin?: boolean;
  onShowNotification?: (type: 'success' | 'error', message: string) => void;
}

const ROLE_COLOR_MAP: Record<CompanyRole, { bg: string; text: string; border: string; label: string }> = {
  company_admin: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'Administrador',
  },
  manager: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Gerente',
  },
  seller: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: 'Vendedor',
  },
  cashier: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Operador de Caixa',
  },
  technician: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    label: 'Técnico',
  },
  stock_manager: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'Estoquista',
  },
};

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  companyId = '550e8400-e29b-41d4-a716-446655440001',
  activeCompanyName = 'TechStore Brasil Matriz',
  userRole = 'company_admin',
  isPlatformAdmin = false,
  onShowNotification,
}) => {
  const [users, setUsers] = useState<CompanyUserMember[]>([]);
  const [quota, setQuota] = useState<CompanyUsersQuota | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<CompanyUserMember | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<CompanyUserMember | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'x-company-id': companyId,
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/companies/${companyId}/users${queryString}`, { headers });

      if (res.ok) {
        const json = (await res.json()) as ApiResponse<CompanyUsersListResponse>;
        if (json.success && json.data) {
          setUsers(json.data.users || []);
          setQuota(json.data.quota);
          setIsLoading(false);
          return;
        }
      }

      // Fallback default state if API error
      const fallbackList: CompanyUserMember[] = [
        {
          id: '770e8400-e29b-41d4-a716-446655440001',
          userId: '990e8400-e29b-41d4-a716-446655440001',
          companyId,
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
          companyId,
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
          companyId,
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

      setUsers(fallbackList);
      setQuota({
        activeCount: 3,
        maxLimit: 10,
        isLimitReached: false,
        remainingSlots: 7,
        planName: 'Plano Profissional',
      });
    } catch {
      onShowNotification?.('error', 'Não foi possível carregar os usuários da empresa.');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, searchQuery, roleFilter, statusFilter, onShowNotification]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Add User
  const handleAddUser = async (payload: InviteCompanyUserPayload) => {
    setIsSavingUser(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/companies/${companyId}/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiResponse<CompanyUserMember>;

      if (res.ok && json.success && json.data) {
        onShowNotification?.('success', `Colaborador "${payload.email}" adicionado com sucesso.`);
        setIsAddModalOpen(false);
        fetchUsers();
      } else {
        const errorMsg = json.error?.message || 'Falha ao cadastrar colaborador.';
        onShowNotification?.('error', errorMsg);
        throw new Error(errorMsg);
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  // Handle Role Change
  const handleChangeRole = async (userId: string, newRole: CompanyRole) => {
    setIsUpdatingRole(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/companies/${companyId}/users/${userId}/role`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: newRole }),
      });

      const json = (await res.json()) as ApiResponse<CompanyUserMember>;

      if (res.ok && json.success && json.data) {
        onShowNotification?.('success', 'Papel do colaborador atualizado com sucesso.');
        setSelectedUserForRole(null);
        fetchUsers();
      } else {
        const errorMsg = json.error?.message || 'Falha ao atualizar papel do usuário.';
        onShowNotification?.('error', errorMsg);
        throw new Error(errorMsg);
      }
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Handle Status Toggle (Active <-> Suspended)
  const handleToggleStatus = async () => {
    if (!selectedUserForStatus) return;

    const targetStatus: MembershipStatus =
      selectedUserForStatus.status === 'active' ? 'suspended' : 'active';

    setIsUpdatingStatus(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(
        `/api/companies/${companyId}/users/${selectedUserForStatus.id}/status`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: targetStatus }),
        }
      );

      const json = (await res.json()) as ApiResponse<CompanyUserMember>;

      if (res.ok && json.success && json.data) {
        const actionLabel = targetStatus === 'active' ? 'reativado' : 'suspenso';
        onShowNotification?.('success', `Usuário ${actionLabel} com sucesso.`);
        setSelectedUserForStatus(null);
        fetchUsers();
      } else {
        const errorMsg = json.error?.message || 'Falha ao atualizar status do usuário.';
        onShowNotification?.('error', errorMsg);
      }
    } catch {
      onShowNotification?.('error', 'Erro interno ao alterar status do colaborador.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Format Date Helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Calculate initials for avatar
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  const quotaPercent = useMemo(() => {
    if (!quota || quota.maxLimit <= 0) return 0;
    return Math.min(100, Math.round((quota.activeCount / quota.maxLimit) * 100));
  }, [quota]);

  return (
    <div id="users-management-view" className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Gestão de Usuários da Empresa
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              FASE 05.1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Colaboradores com acesso ativo ao ambiente de <strong>{activeCompanyName}</strong> e controle de papéis RBAC
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center space-x-1.5"
            title="Atualizar lista de usuários"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar Usuário</span>
          </button>
        </div>
      </div>

      {/* Subscription Quota Card */}
      {quota && (
        <div
          id="users-quota-indicator-card"
          className={`p-4 rounded-xl border transition-all ${
            quota.isLimitReached
              ? 'bg-rose-50/70 border-rose-200'
              : quota.remainingSlots <= 2
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">
                  Capacidade de Colaboradores &bull; {quota.planName}
                </span>
                {quota.isLimitReached ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    Limite Atingido ({quota.maxLimit} max)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {quota.remainingSlots} {quota.remainingSlots === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                O plano atual permite até <strong>{quota.maxLimit} usuários simultâneos</strong> com acesso à empresa.
              </p>
            </div>

            {/* Quota Progress Meter */}
            <div className="w-full md:w-64 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span>{quota.activeCount} ativos</span>
                <span>{quota.maxLimit} limite total</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    quota.isLimitReached
                      ? 'bg-rose-600'
                      : quotaPercent > 80
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, e-mail ou papel..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Todos os Papéis</option>
              <option value="company_admin">Administrador</option>
              <option value="manager">Gerente</option>
              <option value="seller">Vendedor</option>
              <option value="cashier">Operador de Caixa</option>
              <option value="technician">Técnico</option>
              <option value="stock_manager">Estoquista</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="suspended">Suspensos</option>
          </select>

          {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Usuário / Colaborador</th>
                <th className="py-3 px-4">Papel (RBAC)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Data de Entrada</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    <p>Carregando membros da empresa...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Nenhum colaborador encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ajuste os filtros de pesquisa ou adicione um novo usuário.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((member) => {
                  const roleStyle = ROLE_COLOR_MAP[member.role] || {
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                    label: member.role,
                  };

                  const initials = getInitials(member.name, member.email);

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {member.name || 'Colaborador'}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center space-x-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{member.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>{member.roleName || roleStyle.label}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {member.status === 'active' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Suspenso</span>
                          </span>
                        )}
                      </td>

                      {/* Join Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(member.joinedAt || member.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Change Role Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForRole(member)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Alterar Papel / Permissões"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {/* Toggle Status Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForStatus(member)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              member.status === 'active'
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={member.status === 'active' ? 'Suspender Colaborador' : 'Reativar Colaborador'}
                          >
                            {member.status === 'active' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Total de {users.length} {users.length === 1 ? 'colaborador listado' : 'colaboradores listados'}</span>
          <span className="text-[11px] text-slate-400">Contexto Tenant: {companyId}</span>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddUser}
        isSaving={isSavingUser}
        quota={quota}
      />

      {/* Change Role Modal */}
      <ChangeRoleModal
        user={selectedUserForRole}
        isOpen={Boolean(selectedUserForRole)}
        onClose={() => setSelectedUserForRole(null)}
        onSave={handleChangeRole}
        isSaving={isUpdatingRole}
      />

      {/* Confirm Status Change Modal */}
      <ConfirmModal
        isOpen={Boolean(selectedUserForStatus)}
        title={
          selectedUserForStatus?.status === 'active'
            ? 'Suspender Acesso do Usuário'
            : 'Reativar Acesso do Usuário'
        }
        message={
          selectedUserForStatus?.status === 'active'
            ? `Tem certeza que deseja suspender o acesso de ${selectedUserForStatus?.name} (${selectedUserForStatus?.email})? O colaborador perderá o acesso às funcionalidades da empresa.`
            : `Deseja reativar o acesso de ${selectedUserForStatus?.name} (${selectedUserForStatus?.email}) no contexto desta empresa?`
        }
        confirmText={selectedUserForStatus?.status === 'active' ? 'Suspender Acesso' : 'Reativar Usuário'}
        cancelText="Cancelar"
        variant={selectedUserForStatus?.status === 'active' ? 'danger' : 'primary'}
        isLoading={isUpdatingStatus}
        onConfirm={handleToggleStatus}
        onCancel={() => setSelectedUserForStatus(null)}
      />
    </div>
  );
};
