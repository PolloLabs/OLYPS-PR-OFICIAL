import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  FileSpreadsheet,
  Printer,
  FileDown,
  Columns,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  AlertCircle,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { VariationTemplate } from '../../types/index.js';

interface VariationsViewProps {
  companyId: string;
  onShowNotification?: (type: 'success' | 'error', message: string) => void;
}

export const VariationsView: React.FC<VariationsViewProps> = ({
  companyId,
  onShowNotification,
}) => {
  const [variations, setVariations] = useState<VariationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<'name' | 'values'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Column visibility state
  const [showColVariations, setShowColVariations] = useState<boolean>(true);
  const [showColValues, setShowColValues] = useState<boolean>(true);
  const [isColVisOpen, setIsColVisOpen] = useState<boolean>(false);
  const colVisRef = useRef<HTMLDivElement>(null);

  // Modal State (Add / Edit)
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingVariation, setEditingVariation] = useState<VariationTemplate | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formValuesInput, setFormValuesInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deletingVariation, setDeletingVariation] = useState<VariationTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Close column visibility dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colVisRef.current && !colVisRef.current.contains(e.target as Node)) {
        setIsColVisOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch variations from real API endpoint
  const fetchVariations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/variation-templates`);
      if (res.ok) {
        const json = await res.json();
        setVariations(json.data || []);
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Erro ao carregar variações.');
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Falha ao buscar variações.';
      if (onShowNotification) {
        onShowNotification('error', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVariations();
  }, [companyId]);

  // Filtering & Sorting
  const filteredData = useMemo(() => {
    const term = search.toLowerCase().trim();
    let result = [...variations];

    if (term) {
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(term) ||
          v.values.some((val) => val.toLowerCase().includes(term))
      );
    }

    result.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else {
        valA = a.values.join(', ').toLowerCase();
        valB = b.values.join(', ').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [variations, search, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, startIndex, pageSize]);

  // Keep page within bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (field: 'name' | 'values') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Add & Edit Handlers
  const handleOpenAdd = () => {
    setEditingVariation(null);
    setFormName('');
    setFormValuesInput('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (v: VariationTemplate) => {
    setEditingVariation(v);
    setFormName(v.name);
    setFormValuesInput(v.values.join(', '));
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('O nome da variação é obrigatório.');
      return;
    }

    const valuesList = formValuesInput
      .split(',')
      .map((val) => val.trim())
      .filter(Boolean);

    if (valuesList.length === 0) {
      setFormError('Informe ao menos um valor para a variação (ex.: Preto, Branco).');
      return;
    }

    // Client-side duplicate check
    const duplicate = variations.find(
      (v) =>
        (!editingVariation || v.id !== editingVariation.id) &&
        v.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setFormError(`Já existe uma variação cadastrada com o nome "${trimmedName}".`);
      return;
    }

    setIsSaving(true);
    try {
      if (editingVariation) {
        // Update
        const res = await fetch(
          `/api/companies/${companyId}/variation-templates/${editingVariation.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: trimmedName,
              values: valuesList,
            }),
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Falha ao atualizar variação.');
        }

        if (onShowNotification) {
          onShowNotification('success', `Variação "${trimmedName}" atualizada com sucesso!`);
        }
      } else {
        // Create
        const res = await fetch(`/api/companies/${companyId}/variation-templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            values: valuesList,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Falha ao criar variação.');
        }

        if (onShowNotification) {
          onShowNotification('success', `Variação "${trimmedName}" criada com sucesso!`);
        }
      }

      setModalOpen(false);
      await fetchVariations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar variação.';
      setFormError(msg);
      if (onShowNotification) {
        onShowNotification('error', msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handlers
  const handleOpenDelete = (v: VariationTemplate) => {
    setDeletingVariation(v);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingVariation) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(
        `/api/companies/${companyId}/variation-templates/${deletingVariation.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Falha ao excluir variação.');
      }

      if (onShowNotification) {
        onShowNotification(
          'success',
          `Variação "${deletingVariation.name}" excluída com sucesso!`
        );
      }

      setDeleteModalOpen(false);
      setDeletingVariation(null);
      await fetchVariations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir variação.';
      setDeleteError(msg);
      if (onShowNotification) {
        onShowNotification('error', msg);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Real Exports
  const handleExportCsv = () => {
    const headers: string[] = [];
    if (showColVariations) headers.push('Variations');
    if (showColValues) headers.push('Valores');

    const rows = filteredData.map((v) => {
      const row: string[] = [];
      if (showColVariations) row.push(`"${v.name.replace(/"/g, '""')}"`);
      if (showColValues) row.push(`"${v.values.join(', ').replace(/"/g, '""')}"`);
      return row.join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `variations_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onShowNotification) {
      onShowNotification('success', 'Arquivo CSV exportado com sucesso.');
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((v) => {
      const obj: Record<string, string> = {};
      if (showColVariations) obj['Variations'] = v.name;
      if (showColValues) obj['Valores'] = v.values.join(', ');
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Variations');
    XLSX.writeFile(wb, `variations_${new Date().toISOString().slice(0, 10)}.xlsx`);
    if (onShowNotification) {
      onShowNotification('success', 'Planilha Excel (.xlsx) exportada com sucesso.');
    }
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Variations — Relatório de Variações de Produto', 14, 15);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 21);

    const head: string[][] = [[]];
    if (showColVariations) head[0].push('Variations');
    if (showColValues) head[0].push('Valores');

    const body = filteredData.map((item) => {
      const row: string[] = [];
      if (showColVariations) row.push(item.name);
      if (showColValues) row.push(item.values.join(', '));
      return row;
    });

    autoTable(doc, {
      startY: 25,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [0, 123, 255], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 },
    });

    doc.save(`variations_${new Date().toISOString().slice(0, 10)}.pdf`);
    if (onShowNotification) {
      onShowNotification('success', 'Documento PDF exportado com sucesso.');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const escapeHtml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Variations — OLYPS PRO</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; color: #1e293b; margin: 0; }
            h1 { font-size: 18px; margin: 0 0 4px 0; color: #0f172a; }
            .subtitle { font-size: 11px; color: #64748b; margin: 0 0 16px 0; border-bottom: 2px solid #007bff; padding-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; }
            th { background-color: #007bff; color: #ffffff; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Variations</h1>
          <div class="subtitle">Gerenciar variações de produto &bull; Emissão: ${new Date().toLocaleString('pt-BR')}</div>
          <table>
            <thead>
              <tr>
                ${showColVariations ? '<th>Variations</th>' : ''}
                ${showColValues ? '<th>Valores</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${
                filteredData.length > 0
                  ? filteredData
                      .map(
                        (v) => `
                    <tr>
                      ${showColVariations ? `<td>${escapeHtml(v.name)}</td>` : ''}
                      ${showColValues ? `<td>${escapeHtml(v.values.join(', '))}</td>` : ''}
                    </tr>
                  `
                      )
                      .join('')
                  : '<tr><td colspan="2" style="text-align: center; color: #64748b;">Nenhum registro cadastrado.</td></tr>'
              }
            </tbody>
          </table>
          <div class="footer">Sistema OLYPS PRO &bull; Total de registros: ${filteredData.length}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Preview chips for the Add/Edit form
  const parsedFormValues = useMemo(() => {
    return formValuesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [formValuesInput]);

  // Generate pagination numbers array
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. CABEÇALHO DA PÁGINA (igual ao modelo) */}
      <div>
        <div className="flex items-baseline gap-2.5 pb-2">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Variations</h1>
          <span className="text-xs text-slate-500 font-normal">
            Gerenciar variações de produto
          </span>
        </div>
        <div className="h-0.5 bg-blue-600 w-full" />
      </div>

      {/* 2. CARD PRINCIPAL (igual ao modelo) */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-2xs overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white">
          <h2 className="text-base font-semibold text-slate-800">Todas as variações</h2>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#007bff] hover:bg-[#0069d9] active:bg-[#0062cc] text-white text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Adicionar
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* 3. BARRA DE FERRAMENTAS DA TABELA (igual ao modelo) */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs">
            {/* Left: Selector entries */}
            <div className="flex items-center gap-1.5 text-slate-600 shrink-0">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded px-2 py-1 bg-white text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entradas</span>
            </div>

            {/* Center: Action Buttons */}
            <div className="flex flex-wrap items-center gap-1">
              {/* 1. CSV */}
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
                title="Exportar para CSV"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Exportar para CSV
              </button>

              {/* 2. Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
                title="Exportar para Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Exportar para Excel
              </button>

              {/* 3. Imprimir */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
                title="Imprimir"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Imprimir
              </button>

              {/* 4. Visibilidade da coluna */}
              <div className="relative" ref={colVisRef}>
                <button
                  type="button"
                  onClick={() => setIsColVisOpen(!isColVisOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
                  title="Visibilidade da coluna"
                >
                  <Columns className="w-3.5 h-3.5 text-slate-500" />
                  Visibilidade da coluna
                </button>
                {isColVisOpen && (
                  <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded shadow-md z-20 py-1.5 text-xs animate-fadeIn">
                    <label className="flex items-center px-3 py-1 hover:bg-slate-50 cursor-pointer gap-2 select-none">
                      <input
                        type="checkbox"
                        checked={showColVariations}
                        onChange={(e) => setShowColVariations(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      <span className="text-slate-700">Variations</span>
                    </label>
                    <label className="flex items-center px-3 py-1 hover:bg-slate-50 cursor-pointer gap-2 select-none">
                      <input
                        type="checkbox"
                        checked={showColValues}
                        onChange={(e) => setShowColValues(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      <span className="text-slate-700">Valores</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 5. PDF */}
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
                title="Exportar para PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-rose-600" />
                Exportar para PDF
              </button>
            </div>

            {/* Right: Search */}
            <div className="flex items-center gap-1.5 text-slate-600 shrink-0">
              <span className="font-medium">Pesquisar:</span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Pesquisar ..."
                className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 w-44 transition-colors"
              />
            </div>
          </div>

          {/* 4. TABELA (igual ao modelo) */}
          <div className="overflow-x-auto border border-slate-200 rounded-xs">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {showColVariations && (
                    <th
                      onClick={() => handleSort('name')}
                      className="px-4 py-2.5 text-left font-semibold text-slate-700 border-b border-slate-200 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Variations</span>
                        {sortField === 'name' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-blue-600" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-blue-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>
                  )}
                  {showColValues && (
                    <th
                      onClick={() => handleSort('values')}
                      className="px-4 py-2.5 text-left font-semibold text-slate-700 border-b border-slate-200 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Valores</span>
                        {sortField === 'values' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-blue-600" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-blue-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>
                  )}
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-700 border-b border-slate-200 w-36">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={(showColVariations ? 1 : 0) + (showColValues ? 1 : 0) + 1}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Carregando variações...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={(showColVariations ? 1 : 0) + (showColValues ? 1 : 0) + 1}
                      className="px-4 py-8 text-center text-slate-500 bg-white"
                    >
                      Nenhum registro correspondente encontrado.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr
                      key={item.id}
                      className="even:bg-slate-50/70 odd:bg-white hover:bg-blue-50/30 transition-colors"
                    >
                      {showColVariations && (
                        <td className="px-4 py-2 text-slate-800 font-medium whitespace-nowrap">
                          {item.name}
                        </td>
                      )}
                      {showColValues && (
                        <td className="px-4 py-2 text-slate-600">
                          {item.values.join(', ')}
                        </td>
                      )}
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {/* Botão Editar Azul com ícone de lápis */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#007bff] hover:bg-[#0069d9] active:bg-[#0062cc] text-white text-xs font-normal rounded transition-colors cursor-pointer shadow-2xs"
                            title="Editar"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>
                          {/* Botão Excluir Vermelho com ícone de lixeira */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#dc3545] hover:bg-[#c82333] active:bg-[#bd2130] text-white text-xs font-normal rounded transition-colors cursor-pointer shadow-2xs"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 5. RODAPÉ DA TABELA (igual ao modelo) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-600">
            {/* Contador */}
            <div>
              Mostrando {filteredData.length === 0 ? 0 : startIndex + 1} a{' '}
              {Math.min(startIndex + pageSize, filteredData.length)} de{' '}
              {filteredData.length} entradas
            </div>

            {/* Paginação */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 border border-slate-300 rounded-l-xs bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs text-slate-700 cursor-pointer"
              >
                Anterior
              </button>
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 border border-slate-300 text-xs transition-colors cursor-pointer ${
                    currentPage === p
                      ? 'bg-[#007bff] border-[#007bff] text-white font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2.5 py-1 border border-slate-300 rounded-r-xs bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs text-slate-700 cursor-pointer"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADICIONAR / EDITAR VARIAÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fadeIn">
          <div
            className="bg-white rounded-md max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
              <h3 className="text-base font-semibold text-slate-800">
                {editingVariation ? 'Editar variação' : 'Adicionar variação'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveVariation}>
              <div className="p-5 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Nome da Variação */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Nome da variação: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex.: Cor, Tamanho, Voltagem"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Valores da Variação */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Valores da variação: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formValuesInput}
                    onChange={(e) => setFormValuesInput(e.target.value)}
                    placeholder="Ex.: Preto, Branco, Vermelho, Azul, Verde"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Digite os valores separados por vírgula.
                  </p>
                </div>

                {/* Dynamic Preview of values */}
                {parsedFormValues.length > 0 && (
                  <div>
                    <span className="block text-[11px] font-medium text-slate-600 mb-1.5">
                      Pré-visualização dos valores ({parsedFormValues.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded">
                      {parsedFormValues.map((val, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#007bff] hover:bg-[#0069d9] active:bg-[#0062cc] text-white text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR VARIAÇÃO (com verificação de bloqueio se em uso) */}
      {deleteModalOpen && deletingVariation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fadeIn">
          <div
            className="bg-white rounded-md max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
              <h3 className="text-base font-semibold text-slate-800">
                Excluir variação
              </h3>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3 text-xs">
              {deleteError ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Não é possível excluir</p>
                    <p className="mt-0.5">{deleteError}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-700 text-sm">
                  Tem certeza que deseja excluir a variação{' '}
                  <span className="font-bold text-slate-900">
                    "{deletingVariation.name}"
                  </span>
                  ?
                </p>
              )}

              <p className="text-slate-500 text-xs">
                Esta ação removerá o modelo de variação da empresa.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer"
              >
                {deleteError ? 'Fechar' : 'Cancelar'}
              </button>
              {!deleteError && (
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#dc3545] hover:bg-[#c82333] active:bg-[#bd2130] text-white text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Sim, excluir'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
