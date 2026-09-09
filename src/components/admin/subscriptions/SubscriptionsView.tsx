import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  PauseCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import { SubscriptionDetailsModal } from './SubscriptionDetailsModal.js';
import { ActivateSubscriptionModal } from './ActivateSubscriptionModal.js';
import { SuspendSubscriptionModal } from './SuspendSubscriptionModal.js';
import { CancelSubscriptionModal } from './CancelSubscriptionModal.js';
import { CreateSubscriptionModal } from './CreateSubscriptionModal.js';
import type {
  SubscriptionRecord,
  SubscriptionStatus,
  SubscriptionPlan,
  CompanyRecord,
  CreateSubscriptionPayload,
  PaginationMeta,
  ApiResponse,
} from '../../../types/index.js';

interface SubscriptionsViewProps {
  companies: CompanyRecord[];
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
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
}

/**
 * Calculates remaining days based on backend expiration date string
 */
function getDaysRemaining(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  companies,
  onShowNotification,
}) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modals state
  const [selectedSubForDetails, setSelectedSubForDetails] = useState<SubscriptionRecord | null>(null);
  const [selectedSubForActivate, setSelectedSubForActivate] = useState<SubscriptionRecord | null>(null);
  const [selectedSubForSuspend, setSelectedSubForSuspend] = useState<SubscriptionRecord | null>(null);
  const [selectedSubForCancel, setSelectedSubForCancel] = useState<SubscriptionRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Loading states for actions
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isSuspending, setIsSuspending] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Load plans for filter dropdown and modal
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const authToken = localStorage.getItem('olyps_auth_token') || '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const res = await fetch('/api/platform/subscription-plans', { headers });
        if (res.ok) {
          const json = (await res.json()) as ApiResponse<SubscriptionPlan[]>;
          if (json.success && Array.isArray(json.data)) {
            setPlans(json.data);
          }
        }
      } catch {
        // silent
      }
    };
    fetchPlans();
  }, []);

  // Fetch Subscriptions
  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('pageSize', String(pageSize));
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (planFilter !== 'all') queryParams.append('planId', planFilter);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());

      const res = await fetch(`/api/platform/subscriptions?${queryParams.toString()}`, { headers });
      if (res.ok) {
        const json = (await res.json()) as ApiResponse<{
          subscriptions: SubscriptionRecord[];
          pagination: PaginationMeta;
        }>;
        if (json.success && json.data) {
          if (Array.isArray(json.data.subscriptions)) {
            setSubscriptions(json.data.subscriptions);
            if (json.data.pagination) {
              setPagination(json.data.pagination);
            }
            return;
          } else if (Array.isArray(json.data)) {
            setSubscriptions(json.data as unknown as SubscriptionRecord[]);
            if (json.meta && typeof json.meta === 'object' && 'pagination' in json.meta) {
              setPagination(json.meta.pagination as PaginationMeta);
            }
            return;
          }
        }
      }
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.error?.message || 'Falha ao carregar lista de assinaturas das empresas.');
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao buscar assinaturas.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, planFilter, searchQuery]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Activate Subscription
  const handleActivate = async (subscriptionId: string) => {
    setIsActivating(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`/api/platform/subscriptions/${subscriptionId}/activate`, {
        method: 'PATCH',
        headers,
      });

      const json = (await res.json()) as ApiResponse<SubscriptionRecord>;
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Falha ao ativar assinatura.');
      }

      onShowNotification('success', 'Assinatura ativada com sucesso. Vigência iniciada!');
      setSelectedSubForActivate(null);
      await fetchSubscriptions();
    } catch (err: unknown) {
      onShowNotification('error', err instanceof Error ? err.message : 'Erro ao ativar assinatura.');
    } finally {
      setIsActivating(false);
    }
  };

  // Suspend Subscription
  const handleSuspend = async (subscriptionId: string, reason: string, notes?: string) => {
    setIsSuspending(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`/api/platform/subscriptions/${subscriptionId}/suspend`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ reason, notes }),
      });

      const json = (await res.json()) as ApiResponse<SubscriptionRecord>;
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Falha ao suspender assinatura.');
      }

      onShowNotification('success', 'Assinatura suspensa com sucesso.');
      setSelectedSubForSuspend(null);
      await fetchSubscriptions();
    } catch (err: unknown) {
      onShowNotification('error', err instanceof Error ? err.message : 'Erro ao suspender.');
    } finally {
      setIsSuspending(false);
    }
  };

  // Cancel Subscription
  const handleCancel = async (subscriptionId: string, reason: string, notes?: string) => {
    setIsCancelling(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`/api/platform/subscriptions/${subscriptionId}/cancel`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ reason, notes }),
      });

      const json = (await res.json()) as ApiResponse<SubscriptionRecord>;
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Falha ao cancelar assinatura.');
      }

      onShowNotification('success', 'Assinatura cancelada com sucesso.');
      setSelectedSubForCancel(null);
      await fetchSubscriptions();
    } catch (err: unknown) {
      onShowNotification('error', err instanceof Error ? err.message : 'Erro ao cancelar.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Create Subscription
  const handleCreateSubscription = async (payload: CreateSubscriptionPayload) => {
    setIsCreating(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/platform/subscriptions', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiResponse<SubscriptionRecord>;
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Falha ao vincular assinatura.');
      }

      onShowNotification('success', 'Assinatura vinculada com sucesso.');
      await fetchSubscriptions();
    } catch (err: unknown) {
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  // Status visual badge
  const renderStatusBadge = (sub: SubscriptionRecord) => {
    const isFree = sub.plan?.isFree;
    const daysRemaining = getDaysRemaining(sub.expiresAt);

    switch (sub.status) {
      case 'active':
        if (isFree) {
          return (
            <div className="flex flex-col">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativa
              </span>
              <span className="text-[10px] text-emerald-700 mt-0.5">Sem vencimento</span>
            </div>
          );
        }
        if (daysRemaining !== null && daysRemaining <= 5 && daysRemaining > 0) {
          return (
            <div className="flex flex-col">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                Vence em breve
              </span>
              <span className="text-[10px] text-amber-700 font-semibold mt-0.5">
                {daysRemaining} dia(s) restante(s)
              </span>
            </div>
          );
        }
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativa
            </span>
            {daysRemaining !== null && daysRemaining > 0 && (
              <span className="text-[10px] text-slate-500 mt-0.5">
                {daysRemaining} dia(s) restante(s)
              </span>
            )}
          </div>
        );

      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando Ativação
          </span>
        );

      case 'suspended':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <PauseCircle className="w-3 h-3 mr-1" />
            Suspensa
          </span>
        );

      case 'expired':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expirada
          </span>
        );

      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" id="superadmin-subscriptions-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Super Admin &bull; Assinaturas de Pacote das Empresas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auditoria, acompanhamento de vigência, vencimentos e controle do ciclo de vida das assinaturas
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchSubscriptions}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="btn-create-subscription"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Vincular Nova Assinatura</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={fetchSubscriptions}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por empresa ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as SubscriptionStatus | 'all');
                setPage(1);
              }}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativas</option>
              <option value="pending">Aguardando Ativação</option>
              <option value="suspended">Suspensas</option>
              <option value="expired">Expiradas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Planos</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3">Status / Vigência</th>
                <th className="px-4 py-3">Início Vigência</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Ativada Em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Carregando assinaturas das empresas...</span>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Nenhuma assinatura encontrada</p>
                    <p className="text-[11px] text-slate-400">
                      Vincule um plano comercial a uma empresa para iniciar a vigência.
                    </p>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Empresa */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{sub.companyName || 'Empresa OLYPS'}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                        ID: {sub.companyId}
                      </div>
                    </td>

                    {/* Plano */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{sub.plan?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">
                        {sub.plan?.code} &bull; {sub.plan?.isFree ? 'Grátis' : `R$ ${((sub.plan?.priceCents || 0) / 100).toFixed(2)}`}
                      </div>
                    </td>

                    {/* Status & Remaining Days */}
                    <td className="px-4 py-3.5">{renderStatusBadge(sub)}</td>

                    {/* Started At */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(sub.startedAt)}</span>
                      </div>
                    </td>

                    {/* Expires At */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800">
                        {sub.plan?.isFree ? (
                          <span className="text-emerald-700 text-[11px]">Sem vencimento</span>
                        ) : (
                          formatDate(sub.expiresAt)
                        )}
                      </span>
                    </td>

                    {/* Activated At */}
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatDate(sub.activatedAt)}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedSubForDetails(sub)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Ver detalhes da assinatura"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Ativar se Pendente */}
                        {sub.status === 'pending' && (
                          <button
                            onClick={() => setSelectedSubForActivate(sub)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Ativar assinatura e iniciar vigência"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        )}

                        {/* Suspender se Ativa */}
                        {sub.status === 'active' && (
                          <button
                            onClick={() => setSelectedSubForSuspend(sub)}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                            title="Suspender assinatura"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancelar se Ativa ou Suspensa */}
                        {(sub.status === 'active' || sub.status === 'suspended') && (
                          <button
                            onClick={() => setSelectedSubForCancel(sub)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Cancelar assinatura"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Mostrando {subscriptions.length} de {pagination.total} assinaturas
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage}
                className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SubscriptionDetailsModal
        isOpen={Boolean(selectedSubForDetails)}
        subscription={selectedSubForDetails}
        onClose={() => setSelectedSubForDetails(null)}
        onActivate={(sub) => setSelectedSubForActivate(sub)}
        onSuspend={(sub) => setSelectedSubForSuspend(sub)}
        onCancel={(sub) => setSelectedSubForCancel(sub)}
      />

      <ActivateSubscriptionModal
        isOpen={Boolean(selectedSubForActivate)}
        subscription={selectedSubForActivate}
        onClose={() => setSelectedSubForActivate(null)}
        onConfirm={handleActivate}
        isActivating={isActivating}
      />

      <SuspendSubscriptionModal
        isOpen={Boolean(selectedSubForSuspend)}
        subscription={selectedSubForSuspend}
        onClose={() => setSelectedSubForSuspend(null)}
        onConfirm={handleSuspend}
        isSuspending={isSuspending}
      />

      <CancelSubscriptionModal
        isOpen={Boolean(selectedSubForCancel)}
        subscription={selectedSubForCancel}
        onClose={() => setSelectedSubForCancel(null)}
        onConfirm={handleCancel}
        isCancelling={isCancelling}
      />

      <CreateSubscriptionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSubscription}
        companies={companies}
        plans={plans}
        isSaving={isCreating}
      />
    </div>
  );
};
