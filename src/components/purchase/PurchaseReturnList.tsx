import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  Plus,
  RefreshCw,
  TrendingDown,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  X,
  PlusCircle,
  Package,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import type {
  PurchaseReturnRecord,
  PurchaseReturnPayload,
  PurchaseSupplier,
  PurchaseRecord,
  PurchaseReturnStatus,
} from '../../types/purchase.types.js';
import { PurchaseReturnFilters, type PurchaseReturnFilterValues } from './PurchaseReturnFilters.js';
import { PurchaseReturnTable } from './PurchaseReturnTable.js';

interface PurchaseReturnListProps {
  companyId: string;
  onShowNotification?: (notification: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => void;
}

const initialFilters: PurchaseReturnFilterValues = {
  searchTerm: '',
  supplierId: 'all',
  status: 'all',
  startDate: '',
  endDate: '',
};

export const PurchaseReturnList: React.FC<PurchaseReturnListProps> = ({
  companyId,
  onShowNotification,
}) => {
  const [returns, setReturns] = useState<PurchaseReturnRecord[]>([]);
  const [suppliers, setSuppliers] = useState<PurchaseSupplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<PurchaseReturnFilterValues>(initialFilters);

  // Modal de Criação de Devolução
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form de Devolução
  const [newReturnData, setNewReturnData] = useState<{
    purchaseId: string;
    supplierId: string;
    returnDate: string;
    status: PurchaseReturnStatus;
    productName: string;
    quantityReturned: number;
    unitCost: number;
    reason: string;
    notes: string;
  }>({
    purchaseId: '',
    supplierId: '',
    returnDate: new Date().toISOString().slice(0, 10),
    status: 'completed',
    productName: '',
    quantityReturned: 1,
    unitCost: 0,
    reason: 'Produto com defeito de fabricação',
    notes: '',
  });

  const loadData = useCallback(async (showFeedback = false) => {
    try {
      setIsLoading(true);
      const [returnsRes, suppliersRes, purchasesRes] = await Promise.all([
        api.get<{ success: boolean; data: PurchaseReturnRecord[] }>(
          `/api/companies/${companyId}/purchase-returns`,
          { companyId }
        ),
        api.get<{ success: boolean; data: PurchaseSupplier[] }>(
          `/api/companies/${companyId}/suppliers`,
          { companyId }
        ).catch(() => ({ success: false, data: [] })),
        api.get<{ success: boolean; data: PurchaseRecord[] }>(
          `/api/companies/${companyId}/purchases`,
          { companyId }
        ).catch(() => ({ success: false, data: [] })),
      ]);

      if (returnsRes?.data && Array.isArray(returnsRes.data)) {
        setReturns(returnsRes.data);
      } else if (Array.isArray(returnsRes)) {
        setReturns(returnsRes as any);
      }

      if (suppliersRes?.data && Array.isArray(suppliersRes.data)) {
        setSuppliers(suppliersRes.data);
      }
      if (purchasesRes?.data && Array.isArray(purchasesRes.data)) {
        setPurchases(purchasesRes.data);
      }

      if (showFeedback && onShowNotification) {
        onShowNotification({
          type: 'success',
          message: 'Retornos Atualizados',
          description: 'A lista de devoluções de compras foi sincronizada com sucesso.',
        });
      }
    } catch (err: any) {
      console.error('Erro ao buscar devoluções:', err);
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: 'Erro ao carregar devoluções',
          description: err.message || 'Falha na conexão com o servidor.',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [companyId, onShowNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Excluir devolução
  const handleDeleteReturn = async (returnId: string) => {
    try {
      await api.delete(`/api/companies/${companyId}/purchase-returns/${returnId}`, { companyId });
      setReturns((prev) => prev.filter((r) => r.id !== returnId));
      if (onShowNotification) {
        onShowNotification({
          type: 'success',
          message: 'Devolução excluída com sucesso',
        });
      }
    } catch (err: any) {
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: 'Erro ao excluir devolução',
          description: err.message || 'Tente novamente.',
        });
      }
    }
  };

  // Salvar nova devolução
  const handleSaveReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReturnData.supplierId) {
      alert('Selecione um fornecedor.');
      return;
    }
    if (!newReturnData.productName.trim()) {
      alert('Informe o nome ou descrição do produto devolvido.');
      return;
    }

    try {
      setIsSaving(true);
      const supplierObj = suppliers.find((s) => s.id === newReturnData.supplierId);
      const purchaseObj = purchases.find((p) => p.id === newReturnData.purchaseId);
      const totalRefund = (Number(newReturnData.quantityReturned) || 0) * (Number(newReturnData.unitCost) || 0);

      const payload: PurchaseReturnPayload = {
        companyId,
        purchaseId: newReturnData.purchaseId || undefined,
        purchaseNumber: purchaseObj?.purchaseNumber || undefined,
        supplierId: newReturnData.supplierId,
        supplierName: supplierObj?.name || 'Fornecedor',
        returnDate: newReturnData.returnDate,
        status: newReturnData.status,
        totalRefundAmount: totalRefund,
        notes: newReturnData.notes,
        items: [
          {
            id: crypto.randomUUID(),
            productId: 'prod-custom',
            productName: newReturnData.productName,
            quantityReturned: Number(newReturnData.quantityReturned) || 1,
            unitCost: Number(newReturnData.unitCost) || 0,
            totalRefund,
            reason: newReturnData.reason,
          },
        ],
      };

      const res = await api.post<{ success: boolean; data: PurchaseReturnRecord }>(
        `/api/companies/${companyId}/purchase-returns`,
        payload,
        { companyId }
      );

      const created = res.data || (res as any);
      setReturns((prev) => [created, ...prev]);
      setIsCreateOpen(false);

      if (onShowNotification) {
        onShowNotification({
          type: 'success',
          message: 'Devolução Registrada com Sucesso!',
          description: `Retorno ${created.returnNumber || ''} gerado e estoque/saldo atualizado.`,
        });
      }
    } catch (err: any) {
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: 'Erro ao salvar devolução',
          description: err.message || 'Verifique os campos obrigatórios.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Filtragem
  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      if (filters.searchTerm.trim()) {
        const query = filters.searchTerm.toLowerCase();
        const numMatch = (item.returnNumber || '').toLowerCase().includes(query);
        const pMatch = (item.purchaseNumber || '').toLowerCase().includes(query);
        const supMatch = (item.supplierName || '').toLowerCase().includes(query);
        if (!numMatch && !pMatch && !supMatch) return false;
      }

      if (filters.supplierId !== 'all' && item.supplierId !== filters.supplierId) {
        return false;
      }

      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      if (filters.startDate) {
        const rDate = new Date(item.returnDate).getTime();
        const sDate = new Date(filters.startDate).getTime();
        if (rDate < sDate) return false;
      }

      if (filters.endDate) {
        const rDate = new Date(item.returnDate).getTime();
        const eDate = new Date(filters.endDate + 'T23:59:59').getTime();
        if (rDate > eDate) return false;
      }

      return true;
    });
  }, [returns, filters]);

  // Métricas
  const metrics = useMemo(() => {
    const totalCount = returns.length;
    let totalRefunded = 0;
    let completedCount = 0;
    let pendingCount = 0;

    returns.forEach((r) => {
      const val = Number(r.totalRefundAmount) || 0;
      totalRefunded += val;
      if (r.status === 'completed') completedCount++;
      if (r.status === 'pending') pendingCount++;
    });

    return {
      totalCount,
      totalRefunded,
      completedCount,
      pendingCount,
    };
  }, [returns]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  return (
    <div id="purchase-return-list-view" className="space-y-6 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Lista de Retorno de Compras
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Controle de devoluções de mercadorias defeituosas, estornos financeiros e créditos com fornecedores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadData(true);
            }}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Devolução</span>
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Estornado</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900">{formatBRL(metrics.totalRefunded)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Crédito / Reembolso total
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Devoluções Registradas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900">{metrics.totalCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Ocorrências de retorno
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Concluídas / Estornadas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-emerald-700">{metrics.completedCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Processos finalizados
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Em Aberto / Pendentes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-amber-700">{metrics.pendingCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Aguardando coleta ou estorno
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <PurchaseReturnFilters
        filters={filters}
        onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
        onReset={() => setFilters(initialFilters)}
        suppliers={suppliers}
      />

      {/* Tabela */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Exibindo <strong className="text-slate-800">{filteredReturns.length}</strong> de{' '}
            <strong className="text-slate-800">{returns.length}</strong> devoluções
          </span>
        </div>

        <PurchaseReturnTable
          returns={filteredReturns}
          isLoading={isLoading}
          onDelete={handleDeleteReturn}
          onOpenCreateModal={() => setIsCreateOpen(true)}
        />
      </div>

      {/* Modal de Nova Devolução */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Registrar Devolução de Compra
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReturn} className="p-6 space-y-4 text-xs">
              {/* Fornecedor */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Fornecedor *
                </label>
                <select
                  required
                  value={newReturnData.supplierId}
                  onChange={(e) => setNewReturnData((prev) => ({ ...prev, supplierId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                >
                  <option value="">Selecione o Fornecedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compra de Origem (opcional) */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Vincular a uma Compra Existente (Opcional)
                </label>
                <select
                  value={newReturnData.purchaseId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    const pObj = purchases.find((p) => p.id === pId);
                    setNewReturnData((prev) => ({
                      ...prev,
                      purchaseId: pId,
                      supplierId: pObj?.supplierId || prev.supplierId,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                >
                  <option value="">Sem vínculo / Compra Avulsa</option>
                  {purchases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.purchaseNumber} &mdash; Ref: {p.referenceNumber || 'S/N'} ({p.supplierName || 'Fornecedor'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Data da Devolução *
                  </label>
                  <input
                    type="date"
                    required
                    value={newReturnData.returnDate}
                    onChange={(e) => setNewReturnData((prev) => ({ ...prev, returnDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Status do Retorno
                  </label>
                  <select
                    value={newReturnData.status}
                    onChange={(e) => setNewReturnData((prev) => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  >
                    <option value="completed">Concluído (Estorno Liberado)</option>
                    <option value="pending">Pendente (Em Análise)</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Produto e Quantidade */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-semibold text-slate-800 block text-xs">Dados do Item Devolvido</span>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Produto / Descrição *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Notebook Dell Latitude 5430"
                    value={newReturnData.productName}
                    onChange={(e) => setNewReturnData((prev) => ({ ...prev, productName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Quantidade *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newReturnData.quantityReturned}
                      onChange={(e) => setNewReturnData((prev) => ({ ...prev, quantityReturned: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Custo Unitário (R$) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={newReturnData.unitCost}
                      onChange={(e) => setNewReturnData((prev) => ({ ...prev, unitCost: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Motivo da Devolução
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Produto danificado durante o transporte"
                    value={newReturnData.reason}
                    onChange={(e) => setNewReturnData((prev) => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 font-semibold text-xs border-t border-slate-200">
                  <span className="text-slate-600">Total do Estorno:</span>
                  <span className="text-amber-800 font-bold">
                    {formatBRL((newReturnData.quantityReturned || 0) * (newReturnData.unitCost || 0))}
                  </span>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Observações Adicionais
                </label>
                <textarea
                  rows={2}
                  value={newReturnData.notes}
                  onChange={(e) => setNewReturnData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações sobre o frete reverso, protocolo de atendimento, etc."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  {isSaving ? 'Salvando...' : 'Confirmar Devolução'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
