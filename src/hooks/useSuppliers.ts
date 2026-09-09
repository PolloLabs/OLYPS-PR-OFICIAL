import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api.js';
import type {
  Supplier,
  CreateSupplierPayload,
  UpdateSupplierPayload,
  ContactStatus,
  PersonType,
} from '../types/contact.types.js';

export interface UseSuppliersOptions {
  companyId?: string;
  autoFetch?: boolean;
  initialPageSize?: number;
}

export interface SupplierFilters {
  search: string;
  status: ContactStatus | '';
  personType: PersonType | '';
  category: string;
}

export function useSuppliers(options: UseSuppliersOptions = {}) {
  const { companyId: initialCompanyId, autoFetch = true, initialPageSize = 10 } = options;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: initialPageSize,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [filters, setFilters] = useState<SupplierFilters>({
    search: '',
    status: '',
    personType: '',
    category: '',
  });

  // Resolve active companyId
  const getActiveCompanyId = useCallback((): string => {
    if (initialCompanyId) return initialCompanyId;
    try {
      const active = localStorage.getItem('olyps_active_company_id');
      if (active) return active;
    } catch {
      // Ignore
    }
    return '550e8400-e29b-41d4-a716-446655440001';
  }, [initialCompanyId]);

  const fetchSuppliers = useCallback(
    async (pageOverride?: number) => {
      setLoading(true);
      setError(null);
      const companyId = getActiveCompanyId();
      const pageToFetch = pageOverride !== undefined ? pageOverride : pagination.page;

      try {
        const queryParams: Record<string, any> = {
          page: pageToFetch,
          pageSize: pagination.pageSize,
        };

        if (filters.search.trim()) queryParams.search = filters.search.trim();
        if (filters.status) queryParams.status = filters.status;
        if (filters.personType) queryParams.personType = filters.personType;
        if (filters.category.trim()) queryParams.category = filters.category.trim();

        const endpoint = `/api/companies/${companyId}/suppliers`;
        const res = await api.get<Supplier[]>(endpoint, {
          companyId,
          params: queryParams,
        });

        if (res.success && res.data) {
          setSuppliers(res.data);
          if (res.meta) {
            setPagination({
              page: res.meta.page ?? pageToFetch,
              pageSize: res.meta.pageSize ?? pagination.pageSize,
              totalItems: res.meta.totalItems ?? res.data.length,
              totalPages: res.meta.totalPages ?? 1,
              hasNextPage: Boolean(res.meta.hasNextPage),
              hasPreviousPage: Boolean(res.meta.hasPreviousPage),
            });
          }
        } else {
          const msg = res.error?.message || 'Erro ao carregar lista de fornecedores.';
          setError(msg);
        }
      } catch (err: any) {
        const msg = err.message || 'Falha de comunicação ao buscar fornecedores.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [getActiveCompanyId, pagination.page, pagination.pageSize, filters]
  );

  const createSupplier = useCallback(
    async (payload: CreateSupplierPayload): Promise<Supplier> => {
      const companyId = getActiveCompanyId();
      const endpoint = `/api/companies/${companyId}/suppliers`;

      const res = await api.post<Supplier>(endpoint, payload, { companyId });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Erro ao criar fornecedor.');
      }

      // Re-busca ou adiciona localmente
      setSuppliers((prev) => [res.data!, ...prev]);
      return res.data;
    },
    [getActiveCompanyId]
  );

  const updateSupplier = useCallback(
    async (supplierId: string, payload: UpdateSupplierPayload): Promise<Supplier> => {
      const companyId = getActiveCompanyId();
      const endpoint = `/api/companies/${companyId}/suppliers/${supplierId}`;

      const res = await api.put<Supplier>(endpoint, payload, { companyId });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Erro ao atualizar fornecedor.');
      }

      setSuppliers((prev) => prev.map((s) => (s.id === supplierId ? res.data! : s)));
      return res.data;
    },
    [getActiveCompanyId]
  );

  const deleteSupplier = useCallback(
    async (supplierId: string): Promise<boolean> => {
      const companyId = getActiveCompanyId();
      const endpoint = `/api/companies/${companyId}/suppliers/${supplierId}`;

      const res = await api.delete(endpoint, { companyId });

      if (!res.success) {
        throw new Error(res.error?.message || 'Erro ao excluir fornecedor.');
      }

      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
      return true;
    },
    [getActiveCompanyId]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchSuppliers();
    }
  }, [autoFetch, fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    setPagination,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
