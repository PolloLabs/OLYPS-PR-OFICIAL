import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Calendar,
  Percent,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Hash,
  Layers,
} from 'lucide-react';
import { CouponFormModal } from './CouponFormModal.js';
import { CouponDetailsModal } from './CouponDetailsModal.js';
import { ChangeCouponStatusModal } from './ChangeCouponStatusModal.js';
import type {
  Coupon,
  CouponStatus,
  CouponDiscountType,
  CreateCouponPayload,
  UpdateCouponPayload,
  SubscriptionPlan,
  ApiResponse,
  PaginationMeta,
} from '../../../types/index.js';

interface CouponsManagementViewProps {
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return 'Sem limite';
  try {
    return new Date(isoDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export const CouponsManagementView: React.FC<CouponsManagementViewProps> = ({
  onShowNotification,
}) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'all'>('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<CouponDiscountType | 'all'>('all');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [selectedCouponForDetails, setSelectedCouponForDetails] = useState<Coupon | null>(null);

  const [selectedCouponForStatus, setSelectedCouponForStatus] = useState<Coupon | null>(null);
  const [statusActionType, setStatusActionType] = useState<'activate' | 'inactivate' | 'delete'>('activate');
  const [isProcessingStatus, setIsProcessingStatus] = useState<boolean>(false);

  // 1. Fetch available plans for plan applicability selection and display
  const fetchPlans = useCallback(async () => {
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/platform/subscription-plans?status=all', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAvailablePlans(json.data);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // 2. Fetch coupons list
  const fetchCoupons = useCallback(async (pageToFetch = 1) => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const params = new URLSearchParams();
      params.append('page', pageToFetch.toString());
      params.append('pageSize', '20');

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (discountTypeFilter !== 'all') {
        params.append('discountType', discountTypeFilter);
      }

      const res = await fetch(`/api/platform/coupons?${params.toString()}`, { headers });
      const json: ApiResponse<{ coupons: Coupon[]; pagination: PaginationMeta }> = await res.json();

      if (json.success && json.data) {
        setCoupons(json.data.coupons || []);
        if (json.data.pagination) {
          setPagination(json.data.pagination);
        }
      } else {
        setFetchError(json.error?.message || 'Falha ao consultar cupons.');
      }
    } catch {
      setFetchError('Erro de conexão ao buscar cupons da plataforma.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, discountTypeFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoupons(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCoupons]);

  // Copy code handler
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
    onShowNotification('success', `Código ${code} copiado para a área de transferência!`);
  };

  // Create / Update Save
  const handleSaveCoupon = async (payload: CreateCouponPayload | UpdateCouponPayload): Promise<boolean> => {
    setIsSaving(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const isEdit = !!couponToEdit;
      const url = isEdit
        ? `/api/platform/coupons/${couponToEdit.id}`
        : '/api/platform/coupons';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const json: ApiResponse<Coupon> = await res.json();
      if (json.success && json.data) {
        onShowNotification(
          'success',
          isEdit
            ? `Cupom "${json.data.code}" atualizado com sucesso!`
            : `Cupom "${json.data.code}" cadastrado com sucesso!`
        );
        fetchCoupons(pagination.page);
        return true;
      } else {
        onShowNotification('error', json.error?.message || 'Erro ao salvar cupom.');
        return false;
      }
    } catch {
      onShowNotification('error', 'Erro interno ao salvar cupom.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Status toggle / delete action
  const handleConfirmStatusChange = async () => {
    if (!selectedCouponForStatus) return;
    setIsProcessingStatus(true);

    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      if (statusActionType === 'delete') {
        const res = await fetch(`/api/platform/coupons/${selectedCouponForStatus.id}`, {
          method: 'DELETE',
          headers,
        });
        const json = await res.json();
        if (json.success) {
          onShowNotification('success', `Cupom "${selectedCouponForStatus.code}" excluído.`);
          setSelectedCouponForStatus(null);
          fetchCoupons(pagination.page);
        } else {
          onShowNotification('error', json.error?.message || 'Erro ao excluir cupom.');
        }
      } else {
        const newStatus: CouponStatus = statusActionType === 'activate' ? 'active' : 'inactive';
        const res = await fetch(`/api/platform/coupons/${selectedCouponForStatus.id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: newStatus }),
        });
        const json = await res.json();
        if (json.success) {
          onShowNotification(
            'success',
            `Cupom "${selectedCouponForStatus.code}" foi ${newStatus === 'active' ? 'ativado' : 'inativado'}.`
          );
          setSelectedCouponForStatus(null);
          fetchCoupons(pagination.page);
        } else {
          onShowNotification('error', json.error?.message || 'Falha ao alterar status.');
        }
      }
    } catch {
      onShowNotification('error', 'Erro de comunicação com o servidor.');
    } finally {
      setIsProcessingStatus(false);
    }
  };

  // Quick stats calculation
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.status === 'active').length;
  const totalUsesCount = coupons.reduce((acc, c) => acc + (c.usesCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-lg">
              FASE 05.3
            </span>
            <h1 className="text-xl font-black text-slate-900">
              Gestão de Cupons e Descontos
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Crie e administre cupons promocionais para planos comerciais com descontos percentuais ou fixos, controle de limites e vigência.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchCoupons(pagination.page)}
            disabled={isLoading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-create-coupon"
            type="button"
            onClick={() => {
              setCouponToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cupom</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total de Cupons
            </span>
            <span className="text-xl font-black text-slate-900">{totalCoupons}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Cupons Ativos
            </span>
            <span className="text-xl font-black text-emerald-700">{activeCoupons}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total de Usos
            </span>
            <span className="text-xl font-black text-slate-900">{totalUsesCount}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Preço Base Intacto
            </span>
            <span className="text-xs font-semibold text-emerald-700 block mt-0.5">
              Regra 05.3 Protegida
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            id="input-coupon-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código ou descrição..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-slate-700 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inativos
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDiscountTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                discountTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tipos: Todos
            </button>
            <button
              type="button"
              onClick={() => setDiscountTypeFilter('percentage')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                discountTypeFilter === 'percentage'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3 h-3" />
              %
            </button>
            <button
              type="button"
              onClick={() => setDiscountTypeFilter('fixed_amount')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                discountTypeFilter === 'fixed_amount'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              R$
            </button>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Coupons Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs">Carregando cupons promocionais...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Tag className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">Nenhum cupom encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || discountTypeFilter !== 'all'
                ? 'Nenhum cupom corresponde aos filtros aplicados.'
                : 'Nenhum cupom cadastrado ainda. Clique em "Novo Cupom" para criar o primeiro.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Código / Campanha</th>
                  <th className="py-3 px-4">Desconto</th>
                  <th className="py-3 px-4">Utilizações</th>
                  <th className="py-3 px-4">Vigência</th>
                  <th className="py-3 px-4">Planos Elegíveis</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => {
                  const hasSpecificPlans = Array.isArray(c.applicablePlanIds) && c.applicablePlanIds.length > 0;
                  const usagePercent = c.maxUses ? Math.min(100, Math.round((c.usesCount / c.maxUses) * 100)) : null;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Code and Description */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code, c.id)}
                            title="Copiar código"
                            className="font-mono font-bold text-xs bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <span>{c.code}</span>
                            {copiedCodeId === c.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400" />
                            )}
                          </button>
                        </div>
                        {c.name && (
                          <div className="text-[11px] font-medium text-slate-600 mt-1 truncate max-w-xs">
                            {c.name}
                          </div>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            c.discountType === 'percentage'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {c.discountType === 'percentage' ? (
                            <>
                              <Percent className="w-3 h-3" />
                              <span>{c.discountValue}% OFF</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3 h-3" />
                              <span>
                                {formatCentsToBRL(c.discountValue >= 100 ? c.discountValue : c.discountValue * 100)} OFF
                              </span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Usages with progress */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-800">
                          {c.usesCount} {c.maxUses ? `/ ${c.maxUses}` : 'usos'}
                        </div>
                        {c.maxUses && (
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (usagePercent || 0) >= 90
                                  ? 'bg-rose-500'
                                  : (usagePercent || 0) >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePercent || 0}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(c.validFrom)} até {formatDate(c.validUntil)}</span>
                        </div>
                      </td>

                      {/* Applicable Plans */}
                      <td className="py-3 px-4">
                        {hasSpecificPlans ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <Layers className="w-3 h-3" />
                            {c.applicablePlanIds?.length} {c.applicablePlanIds?.length === 1 ? 'plano' : 'planos'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Todos os planos
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            c.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {c.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedCouponForDetails(c)}
                            title="Ver Detalhes"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCouponToEdit(c);
                              setIsFormModalOpen(true);
                            }}
                            title="Editar Cupom"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCouponForStatus(c);
                              setStatusActionType(c.status === 'active' ? 'inactivate' : 'activate');
                            }}
                            title={c.status === 'active' ? 'Inativar Cupom' : 'Ativar Cupom'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              c.status === 'active'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {c.status === 'active' ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCouponForStatus(c);
                              setStatusActionType('delete');
                            }}
                            title="Excluir Cupom"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Página <strong className="text-slate-900">{pagination.page}</strong> de{' '}
              <strong className="text-slate-900">{pagination.totalPages}</strong> ({pagination.total} cupons)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchCoupons(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || isLoading}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => fetchCoupons(pagination.page + 1)}
                disabled={!pagination.hasNextPage || isLoading}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CouponFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setCouponToEdit(null);
        }}
        onSave={handleSaveCoupon}
        couponToEdit={couponToEdit}
        isSaving={isSaving}
        availablePlans={availablePlans}
      />

      <CouponDetailsModal
        isOpen={!!selectedCouponForDetails}
        onClose={() => setSelectedCouponForDetails(null)}
        coupon={selectedCouponForDetails}
        availablePlans={availablePlans}
        onEdit={(coupon) => {
          setSelectedCouponForDetails(null);
          setCouponToEdit(coupon);
          setIsFormModalOpen(true);
        }}
      />

      <ChangeCouponStatusModal
        isOpen={!!selectedCouponForStatus}
        onClose={() => setSelectedCouponForStatus(null)}
        coupon={selectedCouponForStatus}
        actionType={statusActionType}
        onConfirm={handleConfirmStatusChange}
        isLoading={isProcessingStatus}
      />
    </div>
  );
};
