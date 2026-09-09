import { useState, useEffect, useCallback } from 'react';
import type {
  RepairDashboardSummary,
  BrandTrendData,
  DeviceTrendData,
  ModelTrendData,
  JobSheet,
} from '../../types/repair.types.js';

interface UseRepairAnalyticsOptions {
  companyId: string;
  initialJobSheets?: JobSheet[];
}

export function useRepairAnalytics({ companyId, initialJobSheets }: UseRepairAnalyticsOptions) {
  const [summary, setSummary] = useState<RepairDashboardSummary | null>(null);
  const [brandTrends, setBrandTrends] = useState<BrandTrendData[]>([]);
  const [deviceTrends, setDeviceTrends] = useState<DeviceTrendData[]>([]);
  const [modelTrends, setModelTrends] = useState<ModelTrendData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const calculateFromJobSheets = useCallback((sheets: JobSheet[]) => {
    const total = sheets.length;
    let pendingCount = 0;
    let inProgressCount = 0;
    let waitingPartsCount = 0;
    let completedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let totalRevenueCents = 0;

    const brandMap: Record<string, { count: number; revenueCents: number }> = {};
    const devMap: Record<string, number> = {};
    const modelMap: Record<string, { brand: string; count: number }> = {};

    sheets.forEach((s) => {
      totalRevenueCents += s.finalCostCents || 0;
      if (s.status === 'pending') pendingCount++;
      else if (s.status === 'in_progress') inProgressCount++;
      else if (s.status === 'waiting_parts') waitingPartsCount++;
      else if (s.status === 'completed') completedCount++;
      else if (s.status === 'delivered') deliveredCount++;
      else if (s.status === 'cancelled') cancelledCount++;

      // Brand
      const b = s.brand || 'Outras';
      if (!brandMap[b]) brandMap[b] = { count: 0, revenueCents: 0 };
      brandMap[b].count++;
      brandMap[b].revenueCents += s.finalCostCents || 0;

      // Device
      const d = s.deviceType || 'Outros';
      devMap[d] = (devMap[d] || 0) + 1;

      // Model
      const m = s.model || 'Outros';
      if (!modelMap[m]) modelMap[m] = { brand: s.brand, count: 0 };
      modelMap[m].count++;
    });

    const statusMetrics = [
      {
        status: 'pending' as const,
        label: 'Pendente',
        count: pendingCount,
        percentage: total ? Math.round((pendingCount / total) * 100) : 0,
        totalCostCents: sheets.filter((s) => s.status === 'pending').reduce((a, b) => a + (b.finalCostCents || 0), 0),
      },
      {
        status: 'in_progress' as const,
        label: 'Em Andamento',
        count: inProgressCount,
        percentage: total ? Math.round((inProgressCount / total) * 100) : 0,
        totalCostCents: sheets.filter((s) => s.status === 'in_progress').reduce((a, b) => a + (b.finalCostCents || 0), 0),
      },
      {
        status: 'waiting_parts' as const,
        label: 'Aguardando Peças',
        count: waitingPartsCount,
        percentage: total ? Math.round((waitingPartsCount / total) * 100) : 0,
        totalCostCents: sheets.filter((s) => s.status === 'waiting_parts').reduce((a, b) => a + (b.finalCostCents || 0), 0),
      },
      {
        status: 'completed' as const,
        label: 'Concluído',
        count: completedCount,
        percentage: total ? Math.round((completedCount / total) * 100) : 0,
        totalCostCents: sheets.filter((s) => s.status === 'completed').reduce((a, b) => a + (b.finalCostCents || 0), 0),
      },
      {
        status: 'delivered' as const,
        label: 'Entregue',
        count: deliveredCount,
        percentage: total ? Math.round((deliveredCount / total) * 100) : 0,
        totalCostCents: sheets.filter((s) => s.status === 'delivered').reduce((a, b) => a + (b.finalCostCents || 0), 0),
      },
    ];

    setSummary({
      totalJobSheets: total,
      pendingCount,
      inProgressCount,
      waitingPartsCount,
      completedCount,
      deliveredCount,
      cancelledCount,
      totalRevenueCents,
      avgTicketCents: total > 0 ? Math.round(totalRevenueCents / total) : 0,
      statusMetrics,
    });

    setBrandTrends(
      Object.entries(brandMap)
        .map(([brand, data]) => ({
          brand,
          count: data.count,
          revenueCents: data.revenueCents,
          percentage: total ? Math.round((data.count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
    );

    setDeviceTrends(
      Object.entries(devMap)
        .map(([deviceType, count]) => ({
          deviceType,
          count,
          percentage: total ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
    );

    setModelTrends(
      Object.entries(modelMap)
        .map(([model, data]) => ({
          model,
          brand: data.brand,
          count: data.count,
          percentage: total ? Math.round((data.count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    );
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    setError(null);

    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/companies/${companyId}/repairs/analytics`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setSummary(data.data.summary);
          setBrandTrends(data.data.brandTrends || []);
          setDeviceTrends(data.data.deviceTrends || []);
          setModelTrends(data.data.modelTrends || []);
          return;
        }
      }

      // Fallback: If initialJobSheets passed or API not available, calculate locally
      if (initialJobSheets && initialJobSheets.length > 0) {
        calculateFromJobSheets(initialJobSheets);
      }
    } catch (err: unknown) {
      console.warn('[WARN] useRepairAnalytics fetch error:', err);
      if (initialJobSheets) {
        calculateFromJobSheets(initialJobSheets);
      } else {
        setError('Não foi possível carregar as métricas de reparos no momento.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId, initialJobSheets, calculateFromJobSheets]);

  useEffect(() => {
    if (initialJobSheets && initialJobSheets.length > 0) {
      calculateFromJobSheets(initialJobSheets);
      setIsLoading(false);
    } else {
      fetchAnalytics();
    }
  }, [companyId, initialJobSheets, calculateFromJobSheets, fetchAnalytics]);

  return {
    summary,
    brandTrends,
    deviceTrends,
    modelTrends,
    isLoading,
    error,
    refresh: fetchAnalytics,
    updateFromSheets: calculateFromJobSheets,
  };
}
