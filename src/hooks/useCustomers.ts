import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api.js';
import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  ContactStatus,
  PersonType,
} from '../types/contact.types.js';

export interface UseCustomersOptions {
  companyId?: string;
  autoFetch?: boolean;
  initialPageSize?: number;
}

export interface CustomerFilters {
  search: string;
  status: ContactStatus | '';
  personType: PersonType | '';
  groupId: string;
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { companyId: initialCompanyId, autoFetch = true, initialPageSize = 10 } = options;

  const [customers, setCustomers] = useState<Customer[]>([]);
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

  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: '',
    personType: '',
    groupId: '',
  });

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

  const fetchCustomers = useCallback(
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
        if (filters.groupId) queryParams.customerGroupId = filters.groupId;

        const endpoint = `/api/companies/${companyId}/customers`;
        const res = await api.get<Customer[]>(endpoint, {
          companyId,
          params: queryParams,
        });

        if (res.success && res.data) {
          setCustomers(res.data);
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
          const msg = res.error?.message || 'Erro ao carregar lista de clientes.';
          setError(msg);
        }
      } catch (err: any) {
        const msg = err.message || 'Falha de comunicação ao buscar clientes.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [getActiveCompanyId, pagination.page, pagination.pageSize, filters]
  );

  const createCustomer = useCallback(
    async (payload: CreateCustomerPayload): Promise<Customer> => {
      const companyId = getActiveCompanyId();
      const endpoint = `/api/companies/${companyId}/customers`;

      const res = await api.post<Customer>(endpoint, payload, { companyId });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Erro ao criar cliente.');
      }

      setCustomers((prev) => [res.data!, ...prev]);
      return res.data;
    },
    [getActiveCompanyId]
  );

  const updateCustomer = useCallback(
    async (customerId: string, payload: UpdateCustomerPayload): Promise<Customer> => {
      const companyId = getActiveCompanyId();
      const endpoint = `/api/companies/${companyId}/customers/${customerId}`;

      const res = await api.put<Customer>(endpoint, payload, { companyId });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Erro ao atualizar cliente.');
      }

      setCustomers((prev) => prev.map((c) => (c.id === customerId ? res.data! : c)));
      return res.data;
    },
    [getActiveCompanyId]
  );

  const deleteCustomer = useCallback(
    async (customerId: string): Promise<boolean> => {
      const companyId = getActiveCompanyId();
      const endpoint = `/api/companies/${companyId}/customers/${customerId}`;

      const res = await api.delete(endpoint, { companyId });

      if (!res.success) {
        throw new Error(res.error?.message || 'Erro ao excluir cliente.');
      }

      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      return true;
    },
    [getActiveCompanyId]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchCustomers();
    }
  }, [autoFetch, fetchCustomers]);

  return {
    customers,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    setPagination,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
