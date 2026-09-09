import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Calendar,
  AlertOctagon,
  AlertTriangle,
  Wrench,
  Sparkles,
  Info,
  Layers,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AnnouncementFormModal } from './AnnouncementFormModal.js';
import { AnnouncementDetailsModal } from './AnnouncementDetailsModal.js';
import { AnnouncementStatusModal } from './AnnouncementStatusModal.js';
import type {
  PlatformAnnouncement,
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementTargetAudience,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  SubscriptionPlan,
  CompanyRecord,
  ApiResponse,
  PaginationMeta,
  PaginatedAnnouncementsResponse,
} from '../../../types/index.js';

interface AnnouncementsManagementViewProps {
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return 'Sem expiração';
  try {
    return new Date(isoDate).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

export const AnnouncementsManagementView: React.FC<AnnouncementsManagementViewProps> = ({
  onShowNotification,
}) => {
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyRecord[]>([]);

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<AnnouncementPriority | 'all'>('all');
  const [audienceFilter, setAudienceFilter] = useState<AnnouncementTargetAudience | 'all'>('all');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [activeOnly, setActiveOnly] = useState<boolean>(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState<PlatformAnnouncement | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [selectedForDetails, setSelectedForDetails] = useState<PlatformAnnouncement | null>(null);

  const [selectedForStatus, setSelectedForStatus] = useState<PlatformAnnouncement | null>(null);
  const [statusActionType, setStatusActionType] = useState<'publish' | 'unpublish' | 'delete'>('publish');
  const [isProcessingStatus, setIsProcessingStatus] = useState<boolean>(false);

  // 1. Fetch metadata (Plans & Companies)
  const fetchMetadata = useCallback(async () => {
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const [plansRes, compsRes] = await Promise.all([
        fetch('/api/platform/subscription-plans', { headers }),
        fetch('/api/platform/companies?pageSize=100', { headers }),
      ]);

      if (plansRes.ok) {
        const json = await plansRes.json();
        if (json.success && Array.isArray(json.data)) setAvailablePlans(json.data);
      }
      if (compsRes.ok) {
        const json = await compsRes.json();
        if (json.success && json.data) {
          const items = Array.isArray(json.data) ? json.data : json.data.items || [];
          setAvailableCompanies(items);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar metadados:', err);
    }
  }, []);

  // 2. Fetch Announcements from API
  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('pageSize', pagination.pageSize.toString());

      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (audienceFilter !== 'all') params.set('targetAudience', audienceFilter);
      if (publishedFilter === 'published') params.set('isPublished', 'true');
      if (publishedFilter === 'draft') params.set('isPublished', 'false');
      if (activeOnly) params.set('activeOnly', 'true');

      const res = await fetch(`/api/platform/announcements?${params.toString()}`, { headers });

      if (!res.ok) {
        throw new Error(`Erro ${res.status}: Não foi possível carregar comunicados.`);
      }

      const json = (await res.json()) as ApiResponse<PaginatedAnnouncementsResponse>;

      if (json.success && json.data) {
        setAnnouncements(json.data.items || []);
        if (json.data.meta) {
          setPagination(json.data.meta);
        }
      } else {
        throw new Error(json.error?.message || 'Falha ao processar lista de comunicados.');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.pageSize,
    searchQuery,
    typeFilter,
    priorityFilter,
    audienceFilter,
    publishedFilter,
    activeOnly,
  ]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Open creation modal
  const handleOpenCreate = () => {
    setAnnouncementToEdit(null);
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (ann: PlatformAnnouncement) => {
    setAnnouncementToEdit(ann);
    setIsFormModalOpen(true);
  };

  // Save Announcement (Create or Update)
  const handleSaveAnnouncement = async (payload: CreateAnnouncementInput | UpdateAnnouncementInput) => {
    setIsSaving(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      if (announcementToEdit) {
        // PUT update
        const res = await fetch(`/api/platform/announcements/${announcementToEdit.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || 'Falha ao atualizar comunicado.');
        }

        onShowNotification('success', `Comunicado "${payload.title}" atualizado com sucesso!`);
      } else {
        // POST create
        const res = await fetch('/api/platform/announcements', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || 'Falha ao criar comunicado.');
        }

        onShowNotification('success', `Comunicado "${payload.title}" criado com sucesso!`);
      }

      setIsFormModalOpen(false);
      setAnnouncementToEdit(null);
      await fetchAnnouncements();
    } catch (err: any) {
      onShowNotification('error', err.message || 'Erro ao salvar comunicado.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Prompt Publish / Unpublish
  const handlePromptToggleStatus = (ann: PlatformAnnouncement) => {
    setSelectedForStatus(ann);
    setStatusActionType(ann.isPublished ? 'unpublish' : 'publish');
  };

  // Prompt Delete
  const handlePromptDelete = (ann: PlatformAnnouncement) => {
    setSelectedForStatus(ann);
    setStatusActionType('delete');
  };

  // Execute Status / Delete Action
  const handleConfirmStatusAction = async () => {
    if (!selectedForStatus) return;

    setIsProcessingStatus(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      if (statusActionType === 'delete') {
        const res = await fetch(`/api/platform/announcements/${selectedForStatus.id}`, {
          method: 'DELETE',
          headers,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || 'Falha ao excluir comunicado.');
        }
        onShowNotification('success', `Comunicado "${selectedForStatus.title}" excluído com sucesso.`);
      } else {
        const isPublished = statusActionType === 'publish';
        const res = await fetch(`/api/platform/announcements/${selectedForStatus.id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ isPublished }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || 'Falha ao alterar status de publicação.');
        }
        onShowNotification(
          'success',
          `Comunicado "${selectedForStatus.title}" ${isPublished ? 'publicado' : 'despublicado'} com sucesso.`
        );
      }

      setSelectedForStatus(null);
      await fetchAnnouncements();
    } catch (err: any) {
      onShowNotification('error', err.message || 'Erro na operação.');
    } finally {
      setIsProcessingStatus(false);
    }
  };

  // Summary Metrics calculations
  const totalCount = pagination.total || announcements.length;
  const publishedCount = announcements.filter((a) => a.isPublished).length;
  const draftCount = announcements.filter((a) => !a.isPublished).length;
  const urgentCount = announcements.filter((a) => a.priority === 'urgent' || a.priority === 'high').length;

  const getTypeBadge = (type: AnnouncementType) => {
    switch (type) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertOctagon className="w-3 h-3 mr-1" />
            Crítico
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Aviso
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Wrench className="w-3 h-3 mr-1" />
            Manutenção
          </span>
        );
      case 'update':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Sparkles className="w-3 h-3 mr-1" />
            Novidade
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <Info className="w-3 h-3 mr-1" />
            Info
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Urgente</span>;
      case 'high':
        return <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Alta</span>;
      case 'normal':
        return <span className="text-[11px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">Normal</span>;
      case 'low':
      default:
        return <span className="text-[11px] font-normal text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">Baixa</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Comunicador &bull; Super Admin
            </h1>
            <p className="text-xs text-slate-500">
              Gestão de informativos, avisos operacionais, alertas e manutenções para as empresas da plataforma
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={fetchAnnouncements}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Comunicado</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total de Comunicados</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalCount}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Registrados na plataforma</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 block">Publicados / Ativos</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{publishedCount}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Disponíveis aos usuários</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Rascunhos</span>
          <span className="text-2xl font-bold text-slate-700 mt-1 block">{draftCount}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Não visíveis aos clientes</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-amber-600 block">Alta Prioridade / Críticos</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">{urgentCount}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Alertas urgentes</span>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou mensagem..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="info">Info</option>
              <option value="update">Novidade</option>
              <option value="warning">Aviso</option>
              <option value="critical">Crítico</option>
              <option value="maintenance">Manutenção</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="sm:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas Prioridades</option>
              <option value="low">Baixa</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          {/* Audience Filter */}
          <div className="sm:col-span-2">
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos Públicos</option>
              <option value="all">Público Geral</option>
              <option value="specific_plans">Planos Específicos</option>
              <option value="specific_companies">Empresas Específicas</option>
            </select>
          </div>

          {/* Published Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Status: Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Rascunhos</option>
            </select>
          </div>
        </div>

        {/* Active Only Switch */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span>Exibir apenas comunicados vigentes e ativos no momento</span>
          </label>

          <span className="text-[11px] text-slate-500 font-medium">
            Exibindo {announcements.length} de {pagination.total} comunicados
          </span>
        </div>
      </div>

      {/* 4. Table / Data Display */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {fetchError && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs font-medium">Carregando comunicados...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Megaphone className="w-10 h-10 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Nenhum comunicado encontrado</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || typeFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Clique no botão "Novo Comunicado" para criar o primeiro comunicado global.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Comunicado</th>
                  <th className="py-3 px-4">Tipo & Prioridade</th>
                  <th className="py-3 px-4">Público-Alvo</th>
                  <th className="py-3 px-4">Vigência</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {announcements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Title & Preview */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                      <div className="font-bold text-slate-900 truncate">{ann.title}</div>
                      <div className="text-slate-500 line-clamp-1 text-[11px] mt-0.5">
                        {ann.message}
                      </div>
                    </td>

                    {/* Type & Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div>{getTypeBadge(ann.type)}</div>
                        <div>{getPriorityBadge(ann.priority)}</div>
                      </div>
                    </td>

                    {/* Audience */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-slate-700">
                        {ann.targetAudience === 'all' && (
                          <>
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Geral (Todos)</span>
                          </>
                        )}
                        {ann.targetAudience === 'specific_plans' && (
                          <>
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{ann.targetPlanIds.length} plano(s)</span>
                          </>
                        )}
                        {ann.targetAudience === 'specific_companies' && (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{ann.targetCompanyIds.length} empresa(s)</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      <div className="text-[11px] flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Início: {formatDate(ann.startsAt)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Expira: {formatDate(ann.expiresAt)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ann.isPublished ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rascunho
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setSelectedForDetails(ann)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(ann)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar comunicado"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromptToggleStatus(ann)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          ann.isPublished
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={ann.isPublished ? 'Despublicar comunicado' : 'Publicar comunicado'}
                      >
                        {ann.isPublished ? (
                          <ToggleLeft className="w-4 h-4" />
                        ) : (
                          <ToggleRight className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromptDelete(ann)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir comunicado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/70 text-xs text-slate-600">
          <div>
            Página <span className="font-semibold text-slate-900">{pagination.page}</span> de{' '}
            <span className="font-semibold text-slate-900">{pagination.totalPages || 1}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage || isLoading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage || isLoading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnnouncementFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setAnnouncementToEdit(null);
        }}
        announcementToEdit={announcementToEdit}
        onSave={handleSaveAnnouncement}
        isSaving={isSaving}
      />

      <AnnouncementDetailsModal
        isOpen={Boolean(selectedForDetails)}
        onClose={() => setSelectedForDetails(null)}
        announcement={selectedForDetails}
        availablePlans={availablePlans}
        availableCompanies={availableCompanies}
        onEdit={(ann) => {
          setSelectedForDetails(null);
          handleOpenEdit(ann);
        }}
        onToggleStatus={(ann) => {
          setSelectedForDetails(null);
          handlePromptToggleStatus(ann);
        }}
        onDelete={(ann) => {
          setSelectedForDetails(null);
          handlePromptDelete(ann);
        }}
      />

      <AnnouncementStatusModal
        isOpen={Boolean(selectedForStatus)}
        onClose={() => setSelectedForStatus(null)}
        announcement={selectedForStatus}
        actionType={statusActionType}
        onConfirm={handleConfirmStatusAction}
        isProcessing={isProcessingStatus}
      />
    </div>
  );
};
