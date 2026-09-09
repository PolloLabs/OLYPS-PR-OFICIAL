import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  FileSpreadsheet,
  FileText,
  Printer,
  Columns,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  CreditCard,
  Edit,
} from 'lucide-react';
import type { SellRecord } from '../../types/sell.types.js';

interface SellTableProps {
  sells: SellRecord[];
  totalEntries: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totals: {
    totalAmount: number;
    totalPaid: number;
    totalDue: number;
  };
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onAddClick: () => void;
  onViewSell: (sell: SellRecord) => void;
  onDeleteSell: (sellId: string) => void;
}

export const SellTable: React.FC<SellTableProps> = ({
  sells,
  totalEntries,
  currentPage,
  totalPages,
  pageSize,
  totals,
  searchTerm,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onAddClick,
  onViewSell,
  onDeleteSell,
}) => {
  // Controle de menu de ações ativo por linha
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Controle de visibilidade de colunas
  const [showColumnPicker, setShowColumnPicker] = useState<boolean>(false);
  const [visibleColumns, setVisibleColumns] = useState({
    action: true,
    date: true,
    invoiceNumber: true,
    customerName: true,
    contactNumber: true,
    location: true,
    paymentStatus: true,
    paymentMethod: true,
    totalAmount: true,
    totalPaid: true,
    sellDue: true,
  });

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Exportar para CSV
  const handleExportCSV = () => {
    const headers = [
      'Data',
      'N. Fatura',
      'Cliente',
      'Contato',
      'Localizacao',
      'Estado Pagamento',
      'Metodo Pagamento',
      'Valor Total',
      'Total Pago',
      'Vender Devedor',
    ];
    const rows = sells.map((s) => [
      `"${s.sellDate}"`,
      `"${s.invoiceNumber}"`,
      `"${s.customerName}"`,
      `"${s.contactNumber || ''}"`,
      `"${s.locationName || ''}"`,
      `"${s.paymentStatus}"`,
      `"${s.payments?.[0]?.paymentMethod || '-'}"`,
      s.totalAmount.toFixed(2),
      s.totalPaid.toFixed(2),
      s.sellDue.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendas_olyps_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar para Excel (HTML table formato Excel)
  const handleExportExcel = () => {
    let tableHtml = '<table><tr><th>Data</th><th>N. Fatura</th><th>Cliente</th><th>Contato</th><th>Localização</th><th>Estado Pagamento</th><th>Método</th><th>Valor Total</th><th>Total Pago</th><th>Devedor</th></tr>';
    sells.forEach((s) => {
      tableHtml += `<tr><td>${s.sellDate}</td><td>${s.invoiceNumber}</td><td>${s.customerName}</td><td>${s.contactNumber || ''}</td><td>${s.locationName || ''}</td><td>${s.paymentStatus}</td><td>${s.payments?.[0]?.paymentMethod || '-'}</td><td>${s.totalAmount.toFixed(2)}</td><td>${s.totalPaid.toFixed(2)}</td><td>${s.sellDue.toFixed(2)}</td></tr>`;
    });
    tableHtml += '</table>';

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_olyps_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Imprimir
  const handlePrint = () => {
    window.print();
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Pago
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Parcial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Vender devedor
          </span>
        );
    }
  };

  const startIndex = totalEntries > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, totalEntries);

  return (
    <div
      id="sell-table-card"
      className="bg-white rounded-md border border-slate-200 border-t-4 border-t-blue-600 shadow-sm"
    >
      {/* Top Header com Título e Botão Adicionar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b border-slate-200 gap-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Todas as vendas
        </h2>
        <button
          id="btn-add-sell"
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          <Plus className="w-4 h-4" />
          <span>+ Adicionar</span>
        </button>
      </div>

      {/* Barra de Ferramentas: Mostrar entradas, Botões de Exportação, Pesquisar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Esquerda: Dropdown Mostrar Entradas + Ações de Exportação */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mr-2">
            <span>Mostrar</span>
            <select
              id="select-page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entradas</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-export-csv"
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors shadow-2xs"
              title="Exportar para CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar para CSV</span>
            </button>

            <button
              id="btn-export-excel"
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors shadow-2xs"
              title="Exportar para Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar para Excel</span>
            </button>

            <button
              id="btn-print-table"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors shadow-2xs"
              title="Imprimir"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir</span>
            </button>

            {/* Dropdown Visibilidade da Coluna */}
            <div className="relative">
              <button
                id="btn-column-visibility"
                type="button"
                onClick={() => setShowColumnPicker((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors shadow-2xs"
                title="Visibilidade da coluna"
              >
                <Columns className="w-3.5 h-3.5 text-slate-500" />
                <span>Visibilidade da coluna</span>
              </button>

              {showColumnPicker && (
                <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-2 z-20 text-xs">
                  <div className="px-3 py-1 font-bold text-slate-800 border-b border-slate-100 mb-1">
                    Exibir Colunas
                  </div>
                  {Object.entries(visibleColumns).map(([key, isVis]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-3 py-1 hover:bg-slate-50 cursor-pointer text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={isVis}
                        onChange={() =>
                          setVisibleColumns((prev) => ({
                            ...prev,
                            [key]: !isVis,
                          }))
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              id="btn-export-pdf"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors shadow-2xs"
              title="Exportar para PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Exportar para PDF</span>
            </button>
          </div>
        </div>

        {/* Direita: Campo de Pesquisa */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-slate-600 font-medium">Pesquisar:</span>
          <div className="relative">
            <input
              id="input-search-sells"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Pesquisar..."
              className="w-48 sm:w-60 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
            <tr>
              {visibleColumns.action && (
                <th className="px-3.5 py-3 w-16 text-center">Ação</th>
              )}
              {visibleColumns.date && <th className="px-3 py-3">Date</th>}
              {visibleColumns.invoiceNumber && (
                <th className="px-3 py-3">n. fatura</th>
              )}
              {visibleColumns.customerName && (
                <th className="px-3 py-3">Nome do cliente</th>
              )}
              {visibleColumns.contactNumber && (
                <th className="px-3 py-3">Número de contato</th>
              )}
              {visibleColumns.location && (
                <th className="px-3 py-3">Localização</th>
              )}
              {visibleColumns.paymentStatus && (
                <th className="px-3 py-3">Estado do pagamento</th>
              )}
              {visibleColumns.paymentMethod && (
                <th className="px-3 py-3">Método de pagamento</th>
              )}
              {visibleColumns.totalAmount && (
                <th className="px-3 py-3 text-right">Valor total</th>
              )}
              {visibleColumns.totalPaid && (
                <th className="px-3 py-3 text-right">Total pago</th>
              )}
              {visibleColumns.sellDue && (
                <th className="px-3 py-3 text-right">Vender devedor</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sells.length > 0 ? (
              sells.map((sell) => (
                <tr
                  key={sell.id}
                  className="hover:bg-blue-50/40 transition-colors"
                >
                  {/* Ação */}
                  {visibleColumns.action && (
                    <td className="px-3.5 py-2.5 text-center relative">
                      <div className="inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === sell.id ? null : sell.id
                            )
                          }
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <span>Ações</span>
                          <MoreVertical className="w-3 h-3" />
                        </button>

                        {/* Menu de Ações */}
                        {activeMenuId === sell.id && (
                          <div
                            ref={menuRef}
                            className="absolute left-3 top-8 mt-1 w-44 bg-white rounded border border-slate-200 shadow-xl py-1 z-30 text-left text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewSell(sell);
                              }}
                              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Visualizar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewSell(sell);
                              }}
                              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Imprimir fatura</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewSell(sell);
                              }}
                              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Adicionar pagamento</span>
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                if (
                                  confirm(
                                    `Tem certeza de que deseja excluir a venda ${sell.invoiceNumber}?`
                                  )
                                ) {
                                  onDeleteSell(sell.id);
                                }
                              }}
                              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Date */}
                  {visibleColumns.date && (
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                      {sell.sellDate}
                    </td>
                  )}

                  {/* n. fatura */}
                  {visibleColumns.invoiceNumber && (
                    <td className="px-3 py-2.5 font-semibold text-blue-700 whitespace-nowrap">
                      {sell.invoiceNumber}
                    </td>
                  )}

                  {/* Nome do cliente */}
                  {visibleColumns.customerName && (
                    <td className="px-3 py-2.5 font-medium text-slate-900">
                      <div>{sell.customerName}</div>
                      {sell.isSubscription && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Assinatura
                        </span>
                      )}
                    </td>
                  )}

                  {/* Número de contato */}
                  {visibleColumns.contactNumber && (
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                      {sell.contactNumber || '-'}
                    </td>
                  )}

                  {/* Localização */}
                  {visibleColumns.location && (
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                      {sell.locationName || '-'}
                    </td>
                  )}

                  {/* Estado do pagamento */}
                  {visibleColumns.paymentStatus && (
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {getPaymentStatusBadge(sell.paymentStatus)}
                    </td>
                  )}

                  {/* Método de pagamento */}
                  {visibleColumns.paymentMethod && (
                    <td className="px-3 py-2.5 text-slate-700 capitalize whitespace-nowrap">
                      {sell.payments?.[0]?.paymentMethod
                        ? sell.payments[0].paymentMethod.replace('_', ' ')
                        : '-'}
                    </td>
                  )}

                  {/* Valor total */}
                  {visibleColumns.totalAmount && (
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {Number(sell.totalAmount).toFixed(2)} R$
                    </td>
                  )}

                  {/* Total pago */}
                  {visibleColumns.totalPaid && (
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {Number(sell.totalPaid).toFixed(2)} R$
                    </td>
                  )}

                  {/* Vender devedor */}
                  {visibleColumns.sellDue && (
                    <td className="px-3 py-2.5 text-right font-bold text-rose-600 whitespace-nowrap">
                      {Number(sell.sellDue).toFixed(2)} R$
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={11}
                  className="px-6 py-8 text-center text-slate-500 font-medium bg-slate-50/50"
                >
                  Sem dados disponíveis na tabela
                </td>
              </tr>
            )}
          </tbody>

          {/* Rodapé com Totais */}
          <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
            <tr>
              <td colSpan={visibleColumns.action ? 1 : 0} className="px-3 py-2.5" />
              <td
                colSpan={
                  (visibleColumns.date ? 1 : 0) +
                  (visibleColumns.invoiceNumber ? 1 : 0) +
                  (visibleColumns.customerName ? 1 : 0) +
                  (visibleColumns.contactNumber ? 1 : 0) +
                  (visibleColumns.location ? 1 : 0) +
                  (visibleColumns.paymentStatus ? 1 : 0) +
                  (visibleColumns.paymentMethod ? 1 : 0) -
                  1
                }
                className="px-3 py-2.5 text-right uppercase text-[11px] text-slate-600"
              >
                Total:
              </td>
              {visibleColumns.totalAmount && (
                <td className="px-3 py-2.5 text-right text-blue-800">
                  {totals.totalAmount.toFixed(2)} R$
                </td>
              )}
              {visibleColumns.totalPaid && (
                <td className="px-3 py-2.5 text-right text-emerald-800">
                  Total pago: {totals.totalPaid.toFixed(2)} R$
                </td>
              )}
              {visibleColumns.sellDue && (
                <td className="px-3 py-2.5 text-right text-rose-800">
                  Vender devedor: {totals.totalDue.toFixed(2)} R$
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Paginação e Mostrador de Entradas */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50 gap-3 text-xs text-slate-600">
        <div>
          Mostrando {startIndex} a {endIndex} de {totalEntries} entradas
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>
          <span className="px-3 py-1 bg-blue-600 text-white font-semibold rounded text-xs">
            {currentPage}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
          >
            <span>Próximo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
