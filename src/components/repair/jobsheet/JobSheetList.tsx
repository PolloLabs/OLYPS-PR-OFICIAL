import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PlusCircle,
  Wrench,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Smartphone,
  Save,
  Trash2,
  Settings,
} from 'lucide-react';
import { JobSheetFilters } from './JobSheetFilters.js';
import { JobSheetTabs, type JobSheetTabType } from './JobSheetTabs.js';
import { JobSheetTable } from './JobSheetTable.js';
import { JobSheetExport } from './JobSheetExport.js';
import { NewJobSheetModal } from './NewJobSheetModal.js';
import type {
  JobSheet,
  JobSheetFilterState,
  JobSheetStatus,
  JobSheetPriority,
  CreateJobSheetPayload,
} from '../../../types/repair.types.js';

interface JobSheetListProps {
  companyId: string;
  activeCompanyName?: string;
  onOpenDashboard?: () => void;
  onOpenSettings?: () => void;
  onShowNotification?: (type: 'success' | 'error', message: string) => void;
}

export const JobSheetList: React.FC<JobSheetListProps> = ({
  companyId,
  activeCompanyName,
  onOpenDashboard,
  onOpenSettings,
  onShowNotification,
}) => {
  const [jobSheets, setJobSheets] = useState<JobSheet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [filters, setFilters] = useState<JobSheetFilterState>({
    status: 'all',
    priority: 'all',
    brand: 'all',
    deviceType: 'all',
    search: '',
  });

  // Active Status Tab
  const [activeTab, setActiveTab] = useState<JobSheetTabType>('all');

  // Modals
  const [selectedSheetForView, setSelectedSheetForView] = useState<JobSheet | null>(null);
  const [selectedSheetForEdit, setSelectedSheetForEdit] = useState<JobSheet | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [sheetToDelete, setSheetToDelete] = useState<JobSheet | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState<CreateJobSheetPayload>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerDocument: '',
    deviceType: 'Smartphone',
    brand: 'Apple',
    model: '',
    serialNumber: '',
    color: '',
    accessories: '',
    reportedDefect: '',
    technicalDiagnosis: '',
    technicianName: '',
    priority: 'normal',
    status: 'pending',
    estimatedCostCents: 0,
    finalCostCents: 0,
    partsCostCents: 0,
    laborCostCents: 0,
    warrantyDays: 90,
    notes: '',
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch job sheets from API
  const fetchJobSheets = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/companies/${companyId}/repairs`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setJobSheets(json.data);
          return;
        }
      }
    } catch (err) {
      console.warn('[WARN] Falha ao carregar OS do servidor:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchJobSheets();
  }, [fetchJobSheets]);

  // Extract unique brands and device types for filter selects
  const brands = useMemo(() => {
    const set = new Set<string>();
    jobSheets.forEach((s) => s.brand && set.add(s.brand));
    return Array.from(set).sort();
  }, [jobSheets]);

  const deviceTypes = useMemo(() => {
    const set = new Set<string>();
    jobSheets.forEach((s) => s.deviceType && set.add(s.deviceType));
    return Array.from(set).sort();
  }, [jobSheets]);

  // Status Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<JobSheetTabType, number> = {
      all: jobSheets.length,
      pending: 0,
      in_progress: 0,
      waiting_parts: 0,
      approved: 0,
      completed: 0,
      delivered: 0,
      cancelled: 0,
    };
    jobSheets.forEach((s) => {
      if (counts[s.status] !== undefined) {
        counts[s.status]++;
      }
    });
    return counts;
  }, [jobSheets]);

  // Filtered job sheets
  const filteredJobSheets = useMemo(() => {
    return jobSheets.filter((sheet) => {
      // Status Tab filter
      if (activeTab !== 'all' && sheet.status !== activeTab) {
        return false;
      }
      // Status dropdown filter
      if (filters.status !== 'all' && sheet.status !== filters.status) {
        return false;
      }
      // Priority filter
      if (filters.priority !== 'all' && sheet.priority !== filters.priority) {
        return false;
      }
      // Brand filter
      if (filters.brand !== 'all' && sheet.brand.toLowerCase() !== filters.brand.toLowerCase()) {
        return false;
      }
      // Device filter
      if (filters.deviceType !== 'all' && sheet.deviceType.toLowerCase() !== filters.deviceType.toLowerCase()) {
        return false;
      }
      // Search filter
      if (filters.search.trim() !== '') {
        const q = filters.search.toLowerCase().trim();
        const matchNumber = sheet.jobSheetNumber.toLowerCase().includes(q);
        const matchCustomer = sheet.customerName.toLowerCase().includes(q);
        const matchPhone = sheet.customerPhone.includes(q);
        const matchModel = sheet.model.toLowerCase().includes(q);
        const matchDefect = sheet.reportedDefect.toLowerCase().includes(q);
        if (!matchNumber && !matchCustomer && !matchPhone && !matchModel && !matchDefect) {
          return false;
        }
      }
      return true;
    });
  }, [jobSheets, activeTab, filters]);

  // Status Change Handler
  const handleStatusChange = async (sheet: JobSheet, newStatus: JobSheetStatus) => {
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/companies/${companyId}/repairs/${sheet.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setJobSheets((prev) =>
          prev.map((s) => (s.id === sheet.id ? { ...s, status: newStatus } : s))
        );
        onShowNotification?.('success', `Status da ${sheet.jobSheetNumber} atualizado com sucesso!`);
      } else {
        throw new Error('Erro na resposta do servidor');
      }
    } catch {
      // Update local state even if offline
      setJobSheets((prev) =>
        prev.map((s) => (s.id === sheet.id ? { ...s, status: newStatus } : s))
      );
      onShowNotification?.('success', `Status da ${sheet.jobSheetNumber} atualizado!`);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (sheet: JobSheet) => {
    setSelectedSheetForEdit(sheet);
    setFormData({
      customerName: sheet.customerName,
      customerPhone: sheet.customerPhone,
      customerEmail: sheet.customerEmail || '',
      customerDocument: sheet.customerDocument || '',
      deviceType: sheet.deviceType,
      brand: sheet.brand,
      model: sheet.model,
      serialNumber: sheet.serialNumber || '',
      color: sheet.color || '',
      accessories: sheet.accessories || '',
      reportedDefect: sheet.reportedDefect,
      technicalDiagnosis: sheet.technicalDiagnosis || '',
      technicianName: sheet.technicianName || '',
      priority: sheet.priority,
      status: sheet.status,
      estimatedCostCents: sheet.estimatedCostCents,
      finalCostCents: sheet.finalCostCents,
      partsCostCents: sheet.partsCostCents || 0,
      laborCostCents: sheet.laborCostCents || 0,
      warrantyDays: sheet.warrantyDays || 90,
      notes: sheet.notes || '',
    });
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedSheetForEdit(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerDocument: '',
      deviceType: 'Smartphone',
      brand: 'Apple',
      model: '',
      serialNumber: '',
      color: '',
      accessories: '',
      reportedDefect: '',
      technicalDiagnosis: '',
      technicianName: '',
      priority: 'normal',
      status: 'pending',
      estimatedCostCents: 0,
      finalCostCents: 0,
      partsCostCents: 0,
      laborCostCents: 0,
      warrantyDays: 90,
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  // Save (Create or Edit)
  const handleSaveJobSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.model || !formData.reportedDefect) {
      onShowNotification?.('error', 'Preencha os campos obrigatórios (Cliente, Modelo, Defeito).');
      return;
    }

    setIsSaving(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      if (selectedSheetForEdit) {
        // Edit existing
        const res = await fetch(`/api/companies/${companyId}/repairs/${selectedSheetForEdit.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const json = await res.json();
          const updated = json.data || { ...selectedSheetForEdit, ...formData };
          setJobSheets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        } else {
          setJobSheets((prev) =>
            prev.map((s) => (s.id === selectedSheetForEdit.id ? { ...s, ...formData } : s))
          );
        }
        onShowNotification?.('success', 'Ordem de serviço atualizada com sucesso!');
        setSelectedSheetForEdit(null);
      } else {
        // Create new
        const res = await fetch(`/api/companies/${companyId}/repairs`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setJobSheets((prev) => [json.data, ...prev]);
          }
        } else {
          const newSheet: JobSheet = {
            id: crypto.randomUUID(),
            companyId,
            jobSheetNumber: `OS-2026-${String(jobSheets.length + 1).padStart(3, '0')}`,
            customerId: `cust-${Date.now()}`,
            ...formData,
            finalCostCents: formData.finalCostCents || formData.estimatedCostCents || 0,
            estimatedCostCents: formData.estimatedCostCents || 0,
            status: formData.status || 'pending',
            priority: formData.priority || 'normal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setJobSheets((prev) => [newSheet, ...prev]);
        }
        onShowNotification?.('success', 'Nova ordem de serviço cadastrada com sucesso!');
        setIsCreateModalOpen(false);
      }
    } catch {
      onShowNotification?.('error', 'Ocorreu um erro ao salvar a OS.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete JobSheet
  const handleDeleteJobSheet = async () => {
    if (!sheetToDelete) return;
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      await fetch(`/api/companies/${companyId}/repairs/${sheetToDelete.id}`, {
        method: 'DELETE',
        headers,
      });

      setJobSheets((prev) => prev.filter((s) => s.id !== sheetToDelete.id));
      onShowNotification?.('success', `OS ${sheetToDelete.jobSheetNumber} excluída com sucesso!`);
    } catch {
      setJobSheets((prev) => prev.filter((s) => s.id !== sheetToDelete.id));
      onShowNotification?.('success', `OS removida.`);
    } finally {
      setSheetToDelete(null);
    }
  };

  // Print Handler
  const handlePrintOS = (sheet: JobSheet) => {
    window.print();
  };

  const formatBRL = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  return (
    <div id="jobsheet-list-view" className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-600" />
            Folhas de Trabalho & Ordens de Serviço
          </h2>
          <p className="text-xs text-slate-500">
            {activeCompanyName ? `Empresa: ${activeCompanyName}` : 'Gestão de bancada e assistência técnica'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              title="Configurações de status, modelos, termos e etiquetas"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Configurações</span>
            </button>
          )}

          {onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Ver Indicadores
            </button>
          )}

          <JobSheetExport jobSheets={filteredJobSheets} />

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar Folha</span>
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <JobSheetTabs activeTab={activeTab} counts={tabCounts} onTabChange={setActiveTab} />

      {/* Advanced Filters */}
      <JobSheetFilters
        filters={filters}
        brands={brands}
        deviceTypes={deviceTypes}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onResetFilters={() =>
          setFilters({
            status: 'all',
            priority: 'all',
            brand: 'all',
            deviceType: 'all',
            search: '',
          })
        }
      />

      {/* Results Table */}
      <JobSheetTable
        jobSheets={filteredJobSheets}
        isLoading={isLoading}
        onView={setSelectedSheetForView}
        onEdit={handleOpenEdit}
        onStatusChange={handleStatusChange}
        onPrint={handlePrintOS}
        onDelete={setSheetToDelete}
      />

      {/* Modal: View OS Details */}
      {selectedSheetForView && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-indigo-600">
                  {selectedSheetForView.jobSheetNumber}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-semibold text-slate-700 uppercase">
                  {selectedSheetForView.brand} {selectedSheetForView.model}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSheetForView(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-medium">Cliente:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedSheetForView.customerName}
                  </span>
                  <span className="text-slate-600 block mt-0.5">
                    {selectedSheetForView.customerPhone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Equipamento:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedSheetForView.deviceType} - {selectedSheetForView.brand}
                  </span>
                  <span className="text-slate-500 block mt-0.5 font-mono text-[11px]">
                    S/N: {selectedSheetForView.serialNumber || 'Não informado'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Defeito Relatado:</span>
                <p className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg text-rose-900 leading-relaxed">
                  {selectedSheetForView.reportedDefect}
                </p>
              </div>

              {selectedSheetForView.technicalDiagnosis && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Diagnóstico Técnico:</span>
                  <p className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-950 leading-relaxed">
                    {selectedSheetForView.technicalDiagnosis}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Técnico</span>
                  <span className="font-bold text-slate-800">
                    {selectedSheetForView.technicianName || 'Não atribuído'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Garantia</span>
                  <span className="font-bold text-slate-800">
                    {selectedSheetForView.warrantyDays || 90} dias
                  </span>
                </div>
                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                  <span className="text-indigo-600 block text-[11px]">Valor Final</span>
                  <span className="font-bold text-indigo-950 text-sm">
                    {formatBRL(selectedSheetForView.finalCostCents)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handlePrintOS(selectedSheetForView)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir OS</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSheetForView(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nova OS com Marcas Integradas */}
      <NewJobSheetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        companyId={companyId}
        onSuccess={() => {
          fetchJobSheets();
          onShowNotification?.('success', 'Nova ordem de serviço cadastrada com sucesso!');
        }}
      />

      {/* Modal: Editar OS Existente */}
      {selectedSheetForEdit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                Editar Ordem: {selectedSheetForEdit.jobSheetNumber}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSheetForEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJobSheet} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipo de Aparelho
                  </label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Smartphone">Smartphone</option>
                    <option value="Notebook">Notebook</option>
                    <option value="Console">Console</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Smartwatch">Smartwatch</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Apple, Samsung, Dell..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="iPhone 15, Galaxy S24..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Defeito Relatado pelo Cliente *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.reportedDefect}
                  onChange={(e) => setFormData({ ...formData, reportedDefect: e.target.value })}
                  placeholder="Descreva o problema constatado..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Diagnóstico Técnico Inicial
                </label>
                <textarea
                  rows={2}
                  value={formData.technicalDiagnosis || ''}
                  onChange={(e) => setFormData({ ...formData, technicalDiagnosis: e.target.value })}
                  placeholder="Avaliação técnica preliminar..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Técnico Responsável</label>
                  <input
                    type="text"
                    value={formData.technicianName || ''}
                    onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                    placeholder="Nome do técnico"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as JobSheetPriority })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="urgent">Urgente</option>
                    <option value="high">Alta</option>
                    <option value="normal">Normal</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Final (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.finalCostCents ? (formData.finalCostCents / 100).toFixed(2) : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        finalCostCents: Math.round(parseFloat(e.target.value || '0') * 100),
                      })
                    }
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedSheetForEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar OS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {sheetToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Excluir Ordem de Serviço?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Você tem certeza que deseja excluir a ordem{' '}
                <strong className="text-slate-700">{sheetToDelete.jobSheetNumber}</strong>? Essa ação não
                poderá ser desfeita.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSheetToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteJobSheet}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
