import { useState, useEffect, useCallback, useMemo } from 'react';
import type { RepairBrand, BrandFormData } from '../../types/repair.types.js';

export function useRepairBrands(companyId: string) {
  const [brands, setBrands] = useState<RepairBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('olyps_auth_token') : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-company-id': companyId,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [companyId]);

  // Carregar marcas sincronizadas
  const fetchBrands = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/companies/${companyId}/repair/brands`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Erro na resposta do servidor: ${res.status}`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBrands(json.data);
      } else if (Array.isArray(json)) {
        setBrands(json);
      } else {
        setBrands([]);
      }
    } catch (err) {
      setError('Erro ao carregar marcas: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId, getHeaders]);

  // Criar marca (sincroniza com Produtos)
  const createBrand = async (data: BrandFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/companies/${companyId}/repair/brands`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || 'Erro ao criar marca');
      }

      await fetchBrands();
      return true;
    } catch (err) {
      setError('Erro ao criar marca: ' + (err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar marca
  const updateBrand = async (brandId: string, data: Partial<BrandFormData>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/companies/${companyId}/repair/brands/${brandId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || 'Erro ao atualizar marca');
      }

      await fetchBrands();
      return true;
    } catch (err) {
      setError('Erro ao atualizar marca: ' + (err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Excluir marca (apenas se não for sincronizada de Produtos)
  const deleteBrand = async (brandId: string): Promise<boolean> => {
    if (!window.confirm('Tem certeza que deseja excluir esta marca?')) {
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/companies/${companyId}/repair/brands/${brandId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || 'Erro ao excluir marca');
      }

      await fetchBrands();
      return true;
    } catch (err) {
      setError('Erro ao excluir marca: ' + (err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar e quando companyId mudar
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Filtrar marcas
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        brand.name.toLowerCase().includes(q) ||
        (brand.description?.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === 'all' || brand.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [brands, searchTerm, statusFilter]);

  return {
    brands: filteredBrands,
    allBrandsCount: brands.length,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    createBrand,
    updateBrand,
    deleteBrand,
    refetch: fetchBrands,
  };
}
