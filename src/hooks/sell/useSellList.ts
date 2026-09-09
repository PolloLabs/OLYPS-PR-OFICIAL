import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api.js';
import type {
  SellRecord,
  SellFilterValues,
  SellPaymentStatus,
  SellShippingStatus,
} from '../../types/sell.types.js';

export const initialSellFilters: SellFilterValues = {
  searchTerm: '',
  locationId: 'all',
  customerId: 'all',
  paymentStatus: 'all',
  dateRange: '01-01-2026 - 31-12-2026',
  startDate: '',
  endDate: '',
  userId: 'all',
  shippingStatus: 'all',
  onlySubscriptions: false,
};

export function useSellList(
  companyId: string,
  onShowNotification?: (n: { type: 'success' | 'error' | 'info'; message: string; description?: string }) => void
) {
  const [sells, setSells] = useState<SellRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<SellFilterValues>(initialSellFilters);

  // Paginação
  const [pageSize, setPageSize] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Carregar dados
  const loadData = useCallback(
    async (showFeedback = false) => {
      try {
        setIsLoading(true);
        const res = await api.get<{ success: boolean; data: SellRecord[] }>(
          `/api/companies/${companyId}/sells`,
          { companyId }
        );

        if (res?.data && Array.isArray(res.data)) {
          setSells(res.data);
        } else if (Array.isArray(res)) {
          setSells(res as any);
        }

        if (showFeedback && onShowNotification) {
          onShowNotification({
            type: 'success',
            message: 'Lista de Vendas Atualizada',
            description: 'Os dados foram sincronizados com sucesso.',
          });
        }
      } catch (err: any) {
        console.error('Erro ao carregar vendas:', err);
        if (onShowNotification) {
          onShowNotification({
            type: 'error',
            message: 'Falha ao carregar vendas',
            description: err.message || 'Não foi possível obter a lista de vendas.',
          });
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [companyId, onShowNotification]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Excluir venda
  const deleteSell = async (sellId: string) => {
    try {
      await api.delete(`/api/companies/${companyId}/sells/${sellId}`, { companyId });
      setSells((prev) => prev.filter((s) => s.id !== sellId));
      if (onShowNotification) {
        onShowNotification({
          type: 'success',
          message: 'Venda excluída com sucesso',
        });
      }
    } catch (err: any) {
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: 'Erro ao excluir venda',
          description: err.message || 'Verifique suas permissões.',
        });
      }
    }
  };

  // Filtragem
  const filteredSells = useMemo(() => {
    return sells.filter((item) => {
      // 1. Busca textual
      if (filters.searchTerm.trim()) {
        const query = filters.searchTerm.toLowerCase();
        const invMatch = (item.invoiceNumber || '').toLowerCase().includes(query);
        const custMatch = (item.customerName || '').toLowerCase().includes(query);
        const phoneMatch = (item.contactNumber || '').toLowerCase().includes(query);
        const locMatch = (item.locationName || '').toLowerCase().includes(query);
        if (!invMatch && !custMatch && !phoneMatch && !locMatch) return false;
      }

      // 2. Localização
      if (filters.locationId !== 'all' && item.companyLocationId !== filters.locationId) {
        return false;
      }

      // 3. Cliente
      if (filters.customerId !== 'all' && item.customerId !== filters.customerId) {
        return false;
      }

      // 4. Estado do pagamento
      if (filters.paymentStatus !== 'all' && item.paymentStatus !== filters.paymentStatus) {
        return false;
      }

      // 5. Status da remessa
      if (
        filters.shippingStatus !== 'all' &&
        item.shipping?.shippingStatus !== filters.shippingStatus
      ) {
        return false;
      }

      // 6. Usuário
      if (filters.userId !== 'all' && item.userName !== filters.userId) {
        return false;
      }

      // 7. Apenas Assinaturas
      if (filters.onlySubscriptions && !item.isSubscription) {
        return false;
      }

      return true;
    });
  }, [sells, filters]);

  // Paginação dos dados filtrados
  const totalEntries = filteredSells.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const paginatedSells = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSells.slice(startIndex, startIndex + pageSize);
  }, [filteredSells, currentPage, pageSize]);

  // Totais consolidados
  const totals = useMemo(() => {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalDue = 0;

    filteredSells.forEach((s) => {
      totalAmount += Number(s.totalAmount) || 0;
      totalPaid += Number(s.totalPaid) || 0;
      totalDue += Number(s.sellDue) || 0;
    });

    return {
      totalAmount,
      totalPaid,
      totalDue,
    };
  }, [filteredSells]);

  const updateFilters = (newFilters: Partial<SellFilterValues>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(initialSellFilters);
    setCurrentPage(1);
  };

  return {
    sells,
    filteredSells,
    paginatedSells,
    isLoading,
    isRefreshing,
    filters,
    updateFilters,
    resetFilters,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalEntries,
    totals,
    loadData,
    deleteSell,
  };
}
