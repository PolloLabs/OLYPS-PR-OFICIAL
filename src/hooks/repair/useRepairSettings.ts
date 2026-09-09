import { useState, useEffect, useCallback } from 'react';
import type {
  RepairModuleSettings,
  RepairStatus,
  DeviceModel,
  RepairSettings,
  LabelSettings,
} from '../../types/repair.types.js';

export function useRepairSettings(companyId: string) {
  const [settings, setSettings] = useState<RepairModuleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const authToken = localStorage.getItem('olyps_auth_token') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-company-id': companyId,
    };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return headers;
  }, [companyId]);

  const fetchSettings = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/repair-settings`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        throw new Error('Falha ao obter configurações de reparo');
      }
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
      } else {
        throw new Error(json.error?.message || 'Erro ao carregar configurações');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar configurações';
      console.error('[useRepairSettings] Erro ao carregar configurações:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [companyId, getHeaders]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Status operations
  const createStatus = async (statusData: Omit<RepairStatus, 'id'>): Promise<RepairStatus> => {
    const res = await fetch(`/api/companies/${companyId}/repair-settings/statuses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(statusData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Erro ao criar status');
    }
    const created: RepairStatus = json.data;
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            statuses: [...prev.statuses, created].sort((a, b) => a.sortOrder - b.sortOrder),
          }
        : prev
    );
    return created;
  };

  const updateStatus = async (statusId: string, data: Partial<RepairStatus>): Promise<RepairStatus> => {
    const res = await fetch(`/api/companies/${companyId}/repair-settings/statuses/${statusId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Erro ao atualizar status');
    }
    const updated: RepairStatus = json.data;
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            statuses: prev.statuses
              .map((s) => (s.id === statusId ? updated : s))
              .sort((a, b) => a.sortOrder - b.sortOrder),
          }
        : prev
    );
    return updated;
  };

  const deleteStatus = async (statusId: string): Promise<void> => {
    const res = await fetch(`/api/companies/${companyId}/repair-settings/statuses/${statusId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Erro ao excluir status');
    }
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            statuses: prev.statuses.filter((s) => s.id !== statusId),
          }
        : prev
    );
  };

  // Device Model operations
  const createDeviceModel = async (modelData: Omit<DeviceModel, 'id'>): Promise<DeviceModel> => {
    const res = await fetch(`/api/companies/${companyId}/repair-settings/device-models`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(modelData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Erro ao criar modelo');
    }
    const created: DeviceModel = json.data;
    setSettings((prev) =>
      prev ? { ...prev, deviceModels: [...prev.deviceModels, created] } : prev
    );
    return created;
  };

  const updateDeviceModel = async (modelId: string, data: Partial<DeviceModel>): Promise<DeviceModel> => {
    const res = await fetch(`/api/companies/${companyId}/repair-settings/device-models/${modelId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Erro ao atualizar modelo');
    }
    const updated: DeviceModel = json.data;
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            deviceModels: prev.deviceModels.map((m) => (m.id === modelId ? updated : m)),
          }
        : prev
    );
    return updated;
  };

  const deleteDeviceModel = async (modelId: string): Promise<void> => {
    const res = await fetch(`/api/companies/${companyId}/repair-settings/device-models/${modelId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Erro ao excluir modelo');
    }
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            deviceModels: prev.deviceModels.filter((m) => m.id !== modelId),
          }
        : prev
    );
  };

  // General Settings operations
  const updateGeneralSettings = async (data: Partial<RepairSettings>): Promise<RepairSettings> => {
    const res = await fetch(`/api/companies/${companyId}/repair-settings/general`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Erro ao atualizar configurações gerais');
    }
    const updated: RepairSettings = json.data;
    setSettings((prev) => (prev ? { ...prev, general: updated } : prev));
    return updated;
  };

  // Label Settings operations
  const updateLabelSettings = async (data: Partial<LabelSettings>): Promise<LabelSettings> => {
    const res = await fetch(`/api/companies/${companyId}/repair-settings/label`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Erro ao atualizar configurações de etiqueta');
    }
    const updated: LabelSettings = json.data;
    setSettings((prev) => (prev ? { ...prev, label: updated } : prev));
    return updated;
  };

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    createStatus,
    updateStatus,
    deleteStatus,
    createDeviceModel,
    updateDeviceModel,
    deleteDeviceModel,
    updateGeneralSettings,
    updateLabelSettings,
  };
}
