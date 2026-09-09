import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  DollarSign,
  CheckCircle2,
  Clock,
  RotateCcw,
  TrendingUp,
  Download,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import type { PurchaseRecord, PurchaseSupplier } from '../../types/purchase.types.js';
import { PurchaseFilters, type PurchaseFilterValues } from './PurchaseFilters.js';
import { PurchaseTable } from './PurchaseTable.js';

interface PurchaseListProps {
  companyId: string;
  onNavigateToCreate?: () => void;
  onNavigateToReturn?: (purchase?: PurchaseRecord) => void;
  onShowNotification?: (notification: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => void;
}

const initialFilters: PurchaseFilterValues = {
  searchTerm: '',
  supplierId: 'all',
  status: 'all',
  paymentStatus: 'all',
  startDate: '',
  endDate: '',
  locationId: 'all',
};

export const PurchaseList: React.FC<PurchaseListProps> = ({
  companyId,
  onNavigateToCreate,
  onNavigateToReturn,
  onShowNotification,
}) => {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<PurchaseSupplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<PurchaseFilterValues>(initialFilters);

  // Carregar compras e fornecedores
  const loadData = useCallback(async (showNotificationFeedback = false) => {
    try {
      setIsLoading(true);
      const [purchasesRes, suppliersRes] = await Promise.all([
        api.get<{ success: boolean; data: PurchaseRecord[] }>(
          `/api/companies/${companyId}/purchases`,
          { companyId }
        ),
        api.get<{ success: boolean; data: PurchaseSupplier[] }>(
          `/api/companies/${companyId}/suppliers`,
          { companyId }
        ).catch(() => ({ success: false, data: [] })),
      ]);

      if (purchasesRes?.data && Array.isArray(purchasesRes.data)) {
        setPurchases(purchasesRes.data);
      } else if (Array.isArray(purchasesRes)) {
        setPurchases(purchasesRes as any);
      }

      if (suppliersRes?.data && Array.isArray(suppliersRes.data)) {
        setSuppliers(suppliersRes.data);
      }

      if (showNotificationFeedback && onShowNotification) {
        onShowNotification({
          type: 'success',
          message: 'Lista de Compras Atualizada',
          description: 'Os dados mais recentes foram sincronizados.',
        });
      }
    } catch (err: any) {
      console.error('Erro ao carregar compras:', err);
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: 'Falha ao buscar compras',
          description: err.message || 'Não foi possível conectar ao servidor.',
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

  // Atualizar filtros
  const handleFilterChange = (newFilters: Partial<PurchaseFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  // Excluir compra
  const handleDeletePurchase = async (purchaseId: string) => {
    try {
      await api.delete(`/api/companies/${companyId}/purchases/${purchaseId}`, { companyId });
      setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
      if (onShowNotification) {
        onShowNotification({
          type: 'success',
          message: 'Compra excluída com sucesso',
        });
      }
    } catch (err: any) {
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: 'Erro ao excluir compra',
          description: err.message || 'Verifique suas permissões.',
        });
      }
    }
  };

  // Filtragem de dados no cliente
  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      // 1. Busca por texto
      if (filters.searchTerm.trim()) {
        const query = filters.searchTerm.toLowerCase();
        const numMatch = (item.purchaseNumber || '').toLowerCase().includes(query);
        const refMatch = (item.referenceNumber || '').toLowerCase().includes(query);
        const supMatch = (item.supplierName || '').toLowerCase().includes(query);
        if (!numMatch && !refMatch && !supMatch) return false;
      }

      // 2. Fornecedor
      if (filters.supplierId !== 'all' && item.supplierId !== filters.supplierId) {
        return false;
      }

      // 3. Status da compra
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      // 4. Status de pagamento
      if (filters.paymentStatus !== 'all') {
        const totalPaid = (item.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const totalNet = Number(item.totalNetValue) || 0;
        let pStatus: 'paid' | 'partial' | 'pending' = 'pending';
        if (totalPaid >= totalNet && totalNet > 0) {
          pStatus = 'paid';
        } else if (totalPaid > 0) {
          pStatus = 'partial';
        }
        if (pStatus !== filters.paymentStatus) return false;
      }

      // 5. Data inicial
      if (filters.startDate) {
        const pDate = new Date(item.purchaseDate).getTime();
        const sDate = new Date(filters.startDate).getTime();
        if (pDate < sDate) return false;
      }

      // 6. Data final
      if (filters.endDate) {
        const pDate = new Date(item.purchaseDate).getTime();
        const eDate = new Date(filters.endDate + 'T23:59:59').getTime();
        if (pDate > eDate) return false;
      }

      // 7. Localização
      if (filters.locationId !== 'all' && item.companyLocationId !== filters.locationId) {
        return false;
      }

      return true;
    });
  }, [purchases, filters]);

  // Cálculos de métricas consolidadas
  const metrics = useMemo(() => {
    let totalPurchasesCount = purchases.length;
    let totalValue = 0;
    let totalPaid = 0;
    let pendingPurchasesCount = 0;

    purchases.forEach((p) => {
      const net = Number(p.totalNetValue) || 0;
      totalValue += net;
      const paid = (p.payments || []).reduce((acc, pay) => acc + (Number(pay.amount) || 0), 0);
      totalPaid += paid;
      if (paid < net) {
        pendingPurchasesCount++;
      }
    });

    const totalDue = Math.max(0, totalValue - totalPaid);

    return {
      totalPurchasesCount,
      totalValue,
      totalPaid,
      totalDue,
      pendingPurchasesCount,
    };
  }, [purchases]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  // Exportar dados em CSV
  const handleExportCSV = () => {
    if (filteredPurchases.length === 0) return;
    const headers = ['Numero', 'Data', 'Fornecedor', 'Referencia', 'Status', 'TotalLiquido'];
    const rows = filteredPurchases.map((p) => [
      p.purchaseNumber,
      new Date(p.purchaseDate).toLocaleDateString('pt-BR'),
      `"${p.supplierName || ''}"`,
      `"${p.referenceNumber || ''}"`,
      p.status,
      Number(p.totalNetValue || 0).toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `compras_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="purchases-list-view" className="space-y-6 pb-12">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Lista de Compras
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Gerencie aquisições, notas de entrada, fornecedores e controle financeiro de suprimentos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Atualizar */}
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

          {/* Exportar */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredPurchases.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Exportar CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Nova Compra */}
          {onNavigateToCreate && (
            <button
              type="button"
              onClick={onNavigateToCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Compra</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total em Compras */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Volume Total de Compras</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900">{formatBRL(metrics.totalValue)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {metrics.totalPurchasesCount} {metrics.totalPurchasesCount === 1 ? 'compra registrada' : 'compras registradas'}
            </div>
          </div>
        </div>

        {/* Total Pago */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Liquidado</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-emerald-700">{formatBRL(metrics.totalPaid)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Pagamentos já quitados
            </div>
          </div>
        </div>

        {/* Total a Pagar / Saldo Devedor */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saldo a Pagar</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-rose-600">{formatBRL(metrics.totalDue)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {metrics.pendingPurchasesCount} {metrics.pendingPurchasesCount === 1 ? 'compra com saldo aberto' : 'compras com saldo aberto'}
            </div>
          </div>
        </div>

        {/* Módulo Devoluções Link Rápido */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Retorno de Compras</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xs text-slate-600">Devoluções a Fornecedores</div>
            {onNavigateToReturn && (
              <button
                type="button"
                onClick={() => onNavigateToReturn()}
                className="mt-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Acessar Lista de Retornos &rarr;</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Filtros */}
      <PurchaseFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        suppliers={suppliers}
      />

      {/* Tabela de Resultados */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Exibindo <strong className="text-slate-800">{filteredPurchases.length}</strong> de{' '}
            <strong className="text-slate-800">{purchases.length}</strong> compras
          </span>
        </div>

        <PurchaseTable
          purchases={filteredPurchases}
          isLoading={isLoading}
          onDelete={handleDeletePurchase}
          onNavigateToReturn={onNavigateToReturn}
          onOpenCreate={onNavigateToCreate}
        />
      </div>
    </div>
  );
};
