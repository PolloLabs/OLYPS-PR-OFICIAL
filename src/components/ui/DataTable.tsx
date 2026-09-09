import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { CreateButton } from './CreateButton.js';
import { EditButton } from './EditButton.js';
import { DeleteButton } from './DeleteButton.js';
import { ExportButton } from './ExportButton.js';
import { PrintButton } from './PrintButton.js';
import { PageSizeSelector } from './PageSizeSelector.js';
import { ActionButton } from './ActionButton.js';
import { exportToCsv, exportToExcel, exportToPdf } from '../../lib/exportUtils.js';
import type {
  DataTableColumn,
  PageSizeOption,
  ExportFormat,
} from '../../types/navigation.types.js';

export interface DataTableProps<T> {
  id?: string;
  title?: string;
  description?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  // Actions
  onCreate?: () => void;
  createButtonLabel?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  // Export & Print
  onExport?: (format: ExportFormat) => void;
  onPrint?: () => void;
  // Custom toolbar items
  filtersSlot?: React.ReactNode;
  emptyMessage?: string;
  emptyCreateLabel?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  id = 'global-data-table',
  title,
  description,
  columns,
  data,
  keyExtractor,
  loading = false,
  error = null,
  onRetry,
  onCreate,
  createButtonLabel = 'Adicionar',
  onEdit,
  onDelete,
  onView,
  onExport,
  onPrint,
  filtersSlot,
  emptyMessage = 'Não há registros cadastrados.',
  emptyCreateLabel = 'Adicionar primeiro registro',
}: DataTableProps<T>) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();
    return data.filter((item) => {
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [data, searchQuery]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA);
      const strB = String(valB);
      return sortDirection === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
    return sorted;
  }, [filteredData, sortKey, sortDirection]);

  // Pagination calculation
  const totalRecords = sortedData.length;
  const effectivePageSize =
    pageSize === 'all' ? totalRecords || 1 : (pageSize as number);
  const totalPages = Math.max(1, Math.ceil(totalRecords / effectivePageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    if (pageSize === 'all') return sortedData;
    const start = (safeCurrentPage - 1) * effectivePageSize;
    return sortedData.slice(start, start + effectivePageSize);
  }, [sortedData, safeCurrentPage, effectivePageSize, pageSize]);

  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(columnKey);
      setSortDirection('asc');
    }
  };

  const handleDefaultExport = (format: ExportFormat) => {
    if (onExport) {
      onExport(format);
      return;
    }
    const cleanFilename = (title || 'relatorio-olyps-pro')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    if (format === 'csv') {
      exportToCsv(cleanFilename, columns, sortedData);
    } else if (format === 'excel') {
      exportToExcel(cleanFilename, columns, sortedData);
    } else if (format === 'pdf') {
      exportToPdf(cleanFilename, title || 'Relatório de Dados', columns, sortedData);
    }
  };

  const handleDefaultPrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  const hasActions = Boolean(onEdit || onDelete || onView);

  const startRecordIndex =
    totalRecords === 0 ? 0 : (safeCurrentPage - 1) * effectivePageSize + 1;
  const endRecordIndex =
    pageSize === 'all'
      ? totalRecords
      : Math.min(safeCurrentPage * effectivePageSize, totalRecords);

  return (
    <div
      id={id}
      className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden space-y-0"
    >
      {/* Header with Title, Description and Create Action */}
      {(title || onCreate) && (
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            {title && (
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          {onCreate && (
            <CreateButton
              id={`${id}-create-btn`}
              label={createButtonLabel}
              onClick={onCreate}
            />
          )}
        </div>
      )}

      {/* Global Toolbar: Search, Filters, Page Size, Export & Print */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/75 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: Search and Custom Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id={`${id}-search-input`}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Pesquisar..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 shadow-2xs"
            />
          </div>
          {filtersSlot}
        </div>

        {/* Right Side: Page Size Selector, Export Dropdown, Print Button */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <PageSizeSelector
            id={`${id}-page-size`}
            value={pageSize}
            onChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />

          <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

          <ExportButton
            id={`${id}-export`}
            onExport={handleDefaultExport}
            disabled={loading}
          />

          <PrintButton
            id={`${id}-print`}
            onPrint={handleDefaultPrint}
            disabled={loading}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-6 text-center space-y-3 bg-rose-50/50 border-b border-rose-100">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-900">
              Falha ao carregar registros
            </h4>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
          </div>
          {onRetry && (
            <ActionButton variant="outline" size="sm" onClick={onRetry}>
              Tentar novamente
            </ActionButton>
          )}
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={`px-4 py-3 ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center space-x-1 hover:text-slate-900 focus:outline-none font-bold group"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
              {hasActions && (
                <th
                  scope="col"
                  className="px-4 py-3 text-right font-bold w-28"
                >
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-3.5 bg-slate-200 rounded w-12 ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const rowKey = keyExtractor
                  ? keyExtractor(row, index)
                  : String((row as { id?: string }).id || index);

                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {columns.map((col) => {
                      const value = col.accessor
                        ? col.accessor(row)
                        : (row[col.key] as React.ReactNode);

                      return (
                        <td
                          key={col.key}
                          className={`px-4 py-3 text-slate-700 ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {value !== undefined && value !== null
                            ? value
                            : '-'}
                        </td>
                      );
                    })}

                    {hasActions && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {onView && (
                            <button
                              type="button"
                              onClick={() => onView(row)}
                              title="Visualizar detalhes"
                              className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onEdit && (
                            <EditButton
                              size="sm"
                              onClick={() => onEdit(row)}
                              title="Editar"
                            />
                          )}
                          {onDelete && (
                            <DeleteButton
                              size="sm"
                              onDelete={() => onDelete(row)}
                              title="Excluir"
                            />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {emptyMessage}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Nenhum registro encontrado para exibição nesta listagem.
                      </p>
                    </div>
                    {onCreate && (
                      <CreateButton
                        label={emptyCreateLabel}
                        onClick={onCreate}
                        size="sm"
                        className="mt-2"
                      />
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          <span>
            Exibindo <strong>{startRecordIndex}</strong> a{' '}
            <strong>{endRecordIndex}</strong> de{' '}
            <strong>{totalRecords}</strong> registros
          </span>
        </div>

        {pageSize !== 'all' && totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
            >
              Anterior
            </button>

            <span className="px-2 py-1 font-semibold text-slate-800">
              Página {safeCurrentPage} de {totalPages}
            </span>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
