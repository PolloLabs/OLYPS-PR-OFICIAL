import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  ToggleLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Tag,
  Calendar,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { PlanFormModal } from './PlanFormModal.js';
import { PlanDetailsModal } from './PlanDetailsModal.js';
import { ChangePlanStatusModal } from './ChangePlanStatusModal.js';
import { PricingPlans } from '../../public/PricingPlans.js';
import type {
  SubscriptionPlan,
  PlanStatus,
  CreatePlanPayload,
  UpdatePlanPayload,
  ApiResponse,
} from '../../../types/index.js';

interface SubscriptionPlansViewProps {
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Grátis';
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatBillingPeriod(period: string, isFree: boolean): string {
  if (isFree) return 'sem custo';
  switch (period) {
    case 'monthly':
      return '/mês';
    case 'yearly':
      return '/ano';
    case 'quarterly':
      return '/trimestre';
    case 'semiannual':
      return '/semestre';
    case 'lifetime':
      return 'vitalício';
    default:
      return `/${period}`;
  }
}

export const SubscriptionPlansView: React.FC<SubscriptionPlansViewProps> = ({
  onShowNotification,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'all'>('all');
  const [activeViewMode, setActiveViewMode] = useState<'admin_table' | 'public_preview'>('admin_table');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<SubscriptionPlan | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<SubscriptionPlan | null>(null);
  const [selectedPlanForStatus, setSelectedPlanForStatus] = useState<SubscriptionPlan | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }

      const res = await fetch(`/api/platform/subscription-plans?${queryParams.toString()}`, {
        headers,
      });

      if (res.ok) {
        const json = (await res.json()) as ApiResponse<SubscriptionPlan[]>;
        if (json.success && Array.isArray(json.data)) {
          setPlans(json.data);
          return;
        }
      }
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.error?.message || 'Falha ao carregar lista de planos comerciais.');
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao buscar planos.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Filter plans locally by search query
  const filteredPlans = plans.filter((plan) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      plan.name.toLowerCase().includes(q) ||
      plan.code.toLowerCase().includes(q) ||
      (plan.description && plan.description.toLowerCase().includes(q))
    );
  });

  // Handle Save (Create / Edit)
  const handleSavePlan = async (payload: CreatePlanPayload | UpdatePlanPayload) => {
    setIsSaving(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      if (selectedPlanForEdit) {
        // Edit PUT
        const res = await fetch(`/api/platform/subscription-plans/${selectedPlanForEdit.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });

        const json = (await res.json()) as ApiResponse<SubscriptionPlan>;
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || 'Falha ao atualizar plano.');
        }

        onShowNotification('success', `Plano "${payload.name}" atualizado com sucesso.`);
      } else {
        // Create POST
        const res = await fetch('/api/platform/subscription-plans', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const json = (await res.json()) as ApiResponse<SubscriptionPlan>;
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || 'Falha ao criar plano comercial.');
        }

        onShowNotification('success', `Plano "${payload.name}" cadastrado com sucesso.`);
      }

      setIsFormOpen(false);
      setSelectedPlanForEdit(null);
      await fetchPlans();
    } catch (err: unknown) {
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Change Status
  const handleConfirmStatusChange = async (planId: string, newStatus: PlanStatus) => {
    setIsUpdatingStatus(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/platform/subscription-plans/${planId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      const json = (await res.json()) as ApiResponse<SubscriptionPlan>;
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Falha ao atualizar status do plano.');
      }

      onShowNotification('success', `Status do plano alterado para "${newStatus}".`);
      await fetchPlans();
    } catch (err: unknown) {
      onShowNotification('error', err instanceof Error ? err.message : 'Erro ao alterar status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: PlanStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Ativo
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Inativo
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Arquivado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" id="superadmin-subscription-plans-view">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Super Admin &bull; Gestão de Planos Comerciais</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre, edite a vigência, benefícios, limites de recursos e regras comerciais dos pacotes OLYPS PRO
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchPlans}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="btn-create-new-plan"
            onClick={() => {
              setSelectedPlanForEdit(null);
              setIsFormOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Plano Comercial</span>
          </button>
        </div>
      </div>

      {/* Sub-tab view mode switcher */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveViewMode('admin_table')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeViewMode === 'admin_table'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Gestão Administrativa (Tabela & CRUD)</span>
        </button>

        <button
          onClick={() => setActiveViewMode('public_preview')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeViewMode === 'public_preview'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Vitrine Comercial Pública (Cards Landing Page)</span>
        </button>
      </div>

      {activeViewMode === 'public_preview' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <PricingPlans
            title="Catálogo Oficial de Planos"
            subtitle="Visualização em tempo real do componente público consumindo a API oficial GET /api/public/plans"
          />
        </div>
      ) : (
        <>
          {/* Error Banner */}
          {fetchError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-xs text-rose-800">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                onClick={fetchPlans}
                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold rounded-lg transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, código ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PlanStatus | 'all')}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="active">Apenas Ativos</option>
                <option value="inactive">Apenas Inativos</option>
                <option value="archived">Apenas Arquivados</option>
              </select>
            </div>
          </div>

          {/* Plans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Plano & Código</th>
                <th className="px-4 py-3">Preço / Período</th>
                <th className="px-4 py-3">Vigência (Dias)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Público</th>
                <th className="px-4 py-3 text-center">Destaque</th>
                <th className="px-4 py-3 text-center">Ordem</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Carregando catálogo de planos comerciais...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Nenhum plano encontrado</p>
                    <p className="text-[11px] text-slate-400">
                      Cadastre um novo plano comercial clicando no botão acima.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>{plan.name}</span>
                            {plan.isFeatured && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                                Destaque
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 uppercase">
                            {plan.code}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">
                        {formatPrice(plan.priceCents)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatBillingPeriod(plan.billingPeriod, plan.isFree)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">
                          {plan.isFree ? (
                            <span className="text-emerald-700">Sem vencimento</span>
                          ) : (
                            `${plan.durationDays} dias`
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">{getStatusBadge(plan.status)}</td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          plan.isPublic
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {plan.isPublic ? 'Sim' : 'Não'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          plan.isFeatured
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'text-slate-400'
                        }`}
                      >
                        {plan.isFeatured ? 'Sim' : '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-600">
                      {plan.displayOrder ?? 10}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedPlanForDetails(plan)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Visualizar detalhes completos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPlanForEdit(plan);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Editar parâmetros comerciais"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedPlanForStatus(plan)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Alterar status"
                        >
                          <ToggleLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Modals */}
      <PlanFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPlanForEdit(null);
        }}
        onSave={handleSavePlan}
        planToEdit={selectedPlanForEdit}
        isSaving={isSaving}
        nextDisplayOrder={plans.length + 1}
      />

      <PlanDetailsModal
        isOpen={Boolean(selectedPlanForDetails)}
        plan={selectedPlanForDetails}
        onClose={() => setSelectedPlanForDetails(null)}
        onEditPlan={(plan) => {
          setSelectedPlanForEdit(plan);
          setIsFormOpen(true);
        }}
      />

      <ChangePlanStatusModal
        isOpen={Boolean(selectedPlanForStatus)}
        plan={selectedPlanForStatus}
        onClose={() => setSelectedPlanForStatus(null)}
        onConfirm={handleConfirmStatusChange}
        isUpdating={isUpdatingStatus}
      />
    </div>
  );
};
