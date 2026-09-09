import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api.js';
import type {
  CustomerGroup,
  CreateCustomerGroupPayload,
  UpdateCustomerGroupPayload,
} from '../types/contact.types.js';

export interface UseCustomerGroupsOptions {
  companyId?: string;
  autoFetch?: boolean;
}

export function useCustomerGroups(options: UseCustomerGroupsOptions = {}) {
  const { companyId: initialCompanyId, autoFetch = true } = options;

  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    const companyId = getActiveCompanyId();

    try {
      const endpoint = `/api/companies/${companyId}/customer-groups`;
      const res = await api.get<CustomerGroup[]>(endpoint, { companyId });

      if (res.success && res.data) {
        setGroups(res.data);
      } else {
        const msg = res.error?.message || 'Erro ao carregar grupos de clientes.';
        setError(msg);
      }
    } catch (err: any) {
      const msg = err.message || 'Falha de comunicação ao buscar grupos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [getActiveCompanyId]);

  const createGroup = useCallback(
    async (payload: CreateCustomerGroupPayload): Promise<CustomerGroup> => {
      const companyId = getActiveCompanyId();
      const endpoint = `/api/companies/${companyId}/customer-groups`;

      const res = await api.post<CustomerGroup>(endpoint, payload, { companyId });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Erro ao criar grupo de clientes.');
      }

      setGroups((prev) => [...prev, res.data!]);
      return res.data;
    },
    [getActiveCompanyId]
  );

  const updateGroup = useCallback(
    async (groupId: string, payload: UpdateCustomerGroupPayload): Promise<CustomerGroup> => {
      const companyId = getActiveCompanyId();
      const endpoint = `/api/companies/${companyId}/customer-groups/${groupId}`;

      const res = await api.put<CustomerGroup>(endpoint, payload, { companyId });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Erro ao atualizar grupo de clientes.');
      }

      setGroups((prev) => prev.map((g) => (g.id === groupId ? res.data! : g)));
      return res.data;
    },
    [getActiveCompanyId]
  );

  const deleteGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      const companyId = getActiveCompanyId();
      const endpoint = `/api/companies/${companyId}/customer-groups/${groupId}`;

      const res = await api.delete(endpoint, { companyId });

      if (!res.success) {
        throw new Error(res.error?.message || 'Erro ao excluir grupo de clientes.');
      }

      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      return true;
    },
    [getActiveCompanyId]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchGroups();
    }
  }, [autoFetch, fetchGroups]);

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
