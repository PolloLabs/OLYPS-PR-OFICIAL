import { useState, useEffect, useMemo, useCallback } from 'react';
import type { POSRecord, POSFilterValues } from '../../types/pdv.types.js';

const INITIAL_FILTERS: POSFilterValues = {
  searchTerm: '',
  location: 'all',
  customer: 'all',
  paymentStatus: 'all',
  dateRange: 'all',
  user: 'all',
  shippingStatus: 'all',
  isSubscription: false,
};

export function usePOSList(
  companyId: string,
  onNotification?: (n: { type: 'success' | 'error' | 'info'; message: string }) => void
) {
  const [records, setRecords] = useState<POSRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<POSFilterValues>(INITIAL_FILTERS);

  // Paginação
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Seleção e Modal de detalhes/recibo
  const [selectedRecord, setSelectedRecord] = useState<POSRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Carregar dados de vendas POS
  const loadPOSRecords = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/pos`);
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } else {
        // Tentar rota alternativa pdv
        const fallbackRes = await fetch(`/api/companies/${companyId}/pdv`);
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setRecords(Array.isArray(data) ? data : []);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar vendas do PDV:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadPOSRecords();
  }, [loadPOSRecords]);

  // Lista dinâmica de localizações, clientes e usuários
  const locations = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.locationName) set.add(r.locationName);
    });
    return Array.from(set);
  }, [records]);

  const customers = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      if (r.customerId && r.customerName) {
        map.set(r.customerId, r.customerName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [records]);

  const users = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.addedBy) set.add(r.addedBy);
    });
    return Array.from(set);
  }, [records]);

  // Alterar campo de filtro
  const setFilterField = useCallback(
    <K extends keyof POSFilterValues>(field: K, value: POSFilterValues[K]) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
      setCurrentPage(1);
    },
    []
  );

  // Resetar filtros
  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
    onNotification?.({
      type: 'info',
      message: 'Filtros redefinidos para os valores padrão.',
    });
  }, [onNotification]);

  // Aplicar filtros
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Busca geral
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesInvoice = rec.invoiceNumber?.toLowerCase().includes(term);
        const matchesCust = rec.customerName?.toLowerCase().includes(term);
        const matchesPhone = rec.contactNumber?.toLowerCase().includes(term);
        if (!matchesInvoice && !matchesCust && !matchesPhone) {
          return false;
        }
      }

      // Localização
      if (filters.location && filters.location !== 'all') {
        if (rec.locationName !== filters.location) return false;
      }

      // Cliente
      if (filters.customer && filters.customer !== 'all') {
        if (rec.customerId !== filters.customer) return false;
      }

      // Status de Pagamento
      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        if (rec.paymentStatus !== filters.paymentStatus) return false;
      }

      // Usuário
      if (filters.user && filters.user !== 'all') {
        if (rec.addedBy !== filters.user) return false;
      }

      // Assinatura
      if (filters.isSubscription) {
        if (!rec.isSubscription) return false;
      }

      return true;
    });
  }, [records, filters]);

  // Totais do rodapé calculados sobre a lista filtrada
  const totals = useMemo(() => {
    return filteredRecords.reduce(
      (acc, curr) => {
        acc.totalAmount += curr.totalAmount || 0;
        acc.totalPaid += curr.totalPaid || 0;
        acc.sellDue += curr.sellDue || 0;
        return acc;
      },
      { totalAmount: 0, totalPaid: 0, sellDue: 0 }
    );
  }, [filteredRecords]);

  // Paginação
  const totalEntries = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, startIndex, itemsPerPage]);

  // Exclusão de registro
  const deleteRecord = useCallback(
    async (id: string) => {
      if (!confirm('Tem certeza de que deseja excluir este registro do PDV?')) return;
      try {
        const res = await fetch(`/api/companies/${companyId}/pos/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setRecords((prev) => prev.filter((r) => r.id !== id));
          onNotification?.({
            type: 'success',
            message: 'Registro do PDV excluído com sucesso.',
          });
        } else {
          throw new Error('Falha ao excluir registro');
        }
      } catch (err: any) {
        onNotification?.({
          type: 'error',
          message: err.message || 'Erro ao excluir o registro do PDV.',
        });
      }
    },
    [companyId, onNotification]
  );

  return {
    records,
    filteredRecords,
    paginatedRecords,
    filters,
    setFilterField,
    resetFilters,
    isLoading,
    locations,
    customers,
    users,
    totals,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalEntries,
    startIndex,
    deleteRecord,
    selectedRecord,
    setSelectedRecord,
    isDetailModalOpen,
    setIsDetailModalOpen,
    refreshRecords: loadPOSRecords,
  };
}

export const usePDVList = usePOSList;
