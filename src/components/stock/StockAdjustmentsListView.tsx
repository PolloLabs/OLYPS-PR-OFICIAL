import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SlidersHorizontal,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Eye,
  Trash2,
  Filter,
  Calendar,
  MapPin,
  RefreshCw,
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { DataTable } from '../ui/DataTable.js';
import { StockAdjustmentDetailModal } from './StockAdjustmentDetailModal.js';
import { StockAdjustmentDeleteModal } from './StockAdjustmentDeleteModal.js';
import { exportToCsv, exportToExcel, exportToPdf } from '../../lib/exportUtils.js';
import type { DataTableColumn, ExportFormat } from '../../types/navigation.types.js';
import type {
  StockAdjustment,
  StockAdjustmentKpis,
  StockAdjustmentType,
} from '../../types/stockAdjustment.types.js';
import type { CommercialLocation } from '../../types/index.js';

interface StockAdjustmentsListViewProps {
  companyId: string;
  onNavigateToAdd: () => void;
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

interface StockAdjustmentRow extends Record<string, unknown> {
  id: string;
  adjustmentDate: string;
  referenceNumber: string;
  locationName: string;
  type: StockAdjustmentType;
  totalAmount: number;
  totalRecovered: number;
  reason: string;
  addedBy: string;
  raw: StockAdjustment;
}

export const StockAdjustmentsListView: React.FC<StockAdjustmentsListViewProps> = ({
  companyId,
  onNavigateToAdd,
  onShowNotification,
}) => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [kpis, setKpis] = useState<StockAdjustmentKpis>({
    totalAdjustments: 0,
    totalAdjustedAmount: 0,
    totalRecoveredAmount: 0,
    abnormalAdjustments: 0,
  });
  const [locations, setLocations] = useState<CommercialLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'normal' | 'abnormal'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // Modals
  const [selectedForDetail, setSelectedForDetail] = useState<StockAdjustment | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<StockAdjustment | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load locations
  const loadLocations = useCallback(async () => {
    try {
      const res = await fetch(`/api/companies/${companyId}/locations`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLocations(data.data);
      }
    } catch {
      // Falha silenciosa de locais
    }
  }, [companyId]);

  // Load adjustments and KPIs
  const loadAdjustments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (locationFilter !== 'all') params.append('locationId', locationFilter);

      const url = `/api/companies/${companyId}/stock-adjustments?${params.toString()}`;
      const res = await fetch(url);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Erro ao carregar ajustes de estoque.');
      }

      setAdjustments(result.data || []);
      if (result.kpis) {
        setKpis(result.kpis);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar ajustes.');
      onShowNotification('error', err.message || 'Falha ao buscar ajustes.');
    } finally {
      setLoading(false);
    }
  }, [companyId, startDate, endDate, typeFilter, locationFilter, onShowNotification]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);

  // Exclusão
  const handleDeleteConfirm = async () => {
    if (!selectedForDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/companies/${companyId}/stock-adjustments/${selectedForDelete.id}`,
        { method: 'DELETE' }
      );
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Erro ao excluir ajuste de estoque.');
      }

      onShowNotification('success', 'Ajuste excluído e saldo de estoque revertido.');
      setSelectedForDelete(null);
      loadAdjustments();
    } catch (err: any) {
      onShowNotification('error', err.message || 'Erro ao excluir ajuste.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Linhas formatadas para DataTable
  const tableRows: StockAdjustmentRow[] = useMemo(() => {
    return adjustments.map((adj) => ({
      id: adj.id,
      adjustmentDate: adj.adjustmentDate,
      referenceNumber: adj.referenceNumber,
      locationName: adj.locationName,
      type: adj.type,
      totalAmount: adj.totalAmount,
      totalRecovered: adj.totalRecovered,
      reason: adj.reason,
      addedBy: adj.addedBy,
      raw: adj,
    }));
  }, [adjustments]);

  // Colunas do DataTable
  const columns: DataTableColumn<StockAdjustmentRow>[] = useMemo(
    () => [
      {
        key: 'adjustmentDate',
        header: 'Data',
        sortable: true,
        width: '110px',
        accessor: (row) => {
          const dateStr = row.adjustmentDate ? row.adjustmentDate.split('T')[0] : '';
          const [year, month, day] = dateStr.split('-');
          return (
            <span className="font-medium text-slate-700">
              {day && month && year ? `${day}/${month}/${year}` : row.adjustmentDate}
            </span>
          );
        },
      },
      {
        key: 'referenceNumber',
        header: 'Nº Referência',
        sortable: true,
        width: '130px',
        accessor: (row) => (
          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[11px] border border-blue-100">
            {row.referenceNumber}
          </span>
        ),
      },
      {
        key: 'locationName',
        header: 'Localização',
        sortable: true,
        width: '160px',
        accessor: (row) => (
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{row.locationName}</span>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Tipo',
        sortable: true,
        width: '110px',
        align: 'center',
        accessor: (row) => {
          const isAbnormal = row.type === 'abnormal';
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                isAbnormal
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isAbnormal ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Anormal
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Normal
                </>
              )}
            </span>
          );
        },
      },
      {
        key: 'totalAmount',
        header: 'Valor Total',
        sortable: true,
        align: 'right',
        width: '130px',
        accessor: (row) => (
          <span className="font-bold text-slate-800">
            {Number(row.totalAmount).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        ),
      },
      {
        key: 'totalRecovered',
        header: 'Valor Recuperado',
        sortable: true,
        align: 'right',
        width: '135px',
        accessor: (row) => (
          <span
            className={
              row.totalRecovered > 0
                ? 'font-bold text-emerald-600'
                : 'text-slate-400 font-medium'
            }
          >
            {Number(row.totalRecovered || 0).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        ),
      },
      {
        key: 'reason',
        header: 'Razão',
        sortable: false,
        width: '200px',
        accessor: (row) => (
          <span
            className="block truncate max-w-[190px] text-slate-600 text-xs"
            title={row.reason || 'Sem razão informada'}
          >
            {row.reason || <span className="text-slate-400 italic">—</span>}
          </span>
        ),
      },
      {
        key: 'addedBy',
        header: 'Adicionado por',
        sortable: true,
        width: '140px',
        accessor: (row) => (
          <span className="text-slate-600 truncate block max-w-[130px]">
            {row.addedBy}
          </span>
        ),
      },
    ],
    []
  );

  // Ações da Linha
  const handleView = (row: StockAdjustmentRow) => {
    setSelectedForDetail(row.raw);
  };

  const handleDelete = (row: StockAdjustmentRow) => {
    setSelectedForDelete(row.raw);
  };

  // Exportações
  const handleExport = (format: ExportFormat) => {
    const filename = `ajustes-estoque-${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      exportToCsv(filename, columns, tableRows);
    } else if (format === 'excel') {
      exportToExcel(filename, columns, tableRows);
    } else if (format === 'pdf') {
      exportToPdf(filename, 'Relatório de Ajustes de Estoque', columns, tableRows);
    }
  };

  const hasActiveFilters = Boolean(
    startDate || endDate || typeFilter !== 'all' || locationFilter !== 'all'
  );

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setTypeFilter('all');
    setLocationFilter('all');
  };

  return (
    <div id="stock-adjustments-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header com Ação Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-blue-600" />
            Ajustes de Estoque
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Histórico completo de lançamentos de inventário, correções de saldo, perdas e avarias.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            id="btn-refresh-adjustments"
            onClick={loadAdjustments}
            disabled={loading}
            className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            id="btn-add-stock-adjustment"
            onClick={onNavigateToAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Ajuste</span>
          </button>
        </div>
      </div>

      {/* 1. Cards KPI no Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Ajustes */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">
              Total de Ajustes
            </span>
            <span className="text-xl font-bold text-slate-900 truncate block">
              {kpis.totalAdjustments}
            </span>
          </div>
        </div>

        {/* Valor Total Ajustado */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">
              Valor Total Ajustado
            </span>
            <span className="text-xl font-bold text-slate-900 truncate block">
              {Number(kpis.totalAdjustedAmount).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </div>

        {/* Valor Recuperado */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">
              Valor Recuperado
            </span>
            <span className="text-xl font-bold text-emerald-700 truncate block">
              {Number(kpis.totalRecoveredAmount).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </div>

        {/* Ajustes Anormais */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">
              Ajustes Anormais
            </span>
            <span className="text-xl font-bold text-rose-700 truncate block">
              {kpis.abnormalAdjustments}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros Dinâmica */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-toggle-filters"
              onClick={() => setIsFilterPanelOpen((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
                hasActiveFilters || isFilterPanelOpen
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros Avançados</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                id="btn-clear-filters"
                onClick={clearFilters}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Exibindo <strong>{adjustments.length}</strong> registro(s)</span>
          </div>
        </div>

        {/* Painel Expansível de Filtros */}
        {isFilterPanelOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-150">
            {/* Período: Início */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Data Inicial
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="filter-start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                />
              </div>
            </div>

            {/* Período: Fim */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Data Final
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="filter-end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tipo de Ajuste
              </label>
              <select
                id="filter-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">Todos os Tipos</option>
                <option value="normal">Normal (Inventário/Conferência)</option>
                <option value="abnormal">Anormal (Avaria/Perda/Furto)</option>
              </select>
            </div>

            {/* Localização */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Localização / Loja
              </label>
              <select
                id="filter-location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">Todas as Lojas</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. Tabela Desktop & 5. Cards Mobile */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Visualização Desktop: DataTable global com colunas requeridas */}
        <div className="hidden md:block">
          <DataTable<StockAdjustmentRow>
            id="stock-adjustments-data-table"
            columns={columns}
            data={tableRows}
            loading={loading}
            error={error}
            onRetry={loadAdjustments}
            onCreate={onNavigateToAdd}
            createButtonLabel="Adicionar Ajuste"
            onView={handleView}
            onDelete={handleDelete}
            onExport={handleExport}
            emptyMessage="Nenhum ajuste de estoque registrado até o momento."
            emptyCreateLabel="Adicionar Primeiro Ajuste"
          />
        </div>

        {/* Visualização Mobile: Cards Responsivos */}
        <div className="block md:hidden p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ajustes ({adjustments.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1"
                title="Exportar CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl animate-pulse space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : tableRows.length === 0 ? (
            <div className="py-8 text-center">
              <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Nenhum ajuste encontrado.</p>
              <button
                type="button"
                onClick={onNavigateToAdd}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
              >
                Adicionar Ajuste
              </button>
            </div>
          ) : (
            tableRows.map((row) => {
              const isAbnormal = row.type === 'abnormal';
              const dateStr = row.adjustmentDate ? row.adjustmentDate.split('T')[0] : '';
              const [year, month, day] = dateStr.split('-');
              const formattedDate = day && month && year ? `${day}/${month}/${year}` : row.adjustmentDate;

              return (
                <div
                  key={row.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md text-xs border border-blue-100">
                      {row.referenceNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isAbnormal
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isAbnormal ? 'Anormal' : 'Normal'}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Data:</span>
                      <span className="font-semibold text-slate-700">{formattedDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Localização:</span>
                      <span className="font-medium text-slate-700">{row.locationName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Valor Total:</span>
                      <span className="font-bold text-slate-900">
                        {Number(row.totalAmount).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                    {row.totalRecovered > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Valor Recuperado:</span>
                        <span className="font-bold text-emerald-600">
                          {Number(row.totalRecovered).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    )}
                    {row.reason && (
                      <div className="pt-1 border-t border-slate-100 text-slate-500 italic">
                        "{row.reason}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleView(row)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detalhes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modais */}
      <StockAdjustmentDetailModal
        adjustment={selectedForDetail}
        onClose={() => setSelectedForDetail(null)}
      />

      <StockAdjustmentDeleteModal
        adjustment={selectedForDelete}
        isOpen={Boolean(selectedForDelete)}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setSelectedForDelete(null)}
      />
    </div>
  );
};
