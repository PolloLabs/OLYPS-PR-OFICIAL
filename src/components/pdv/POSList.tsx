import React, { useState } from 'react';
import {
  Plus,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  Receipt,
  X,
  Store,
} from 'lucide-react';
import { POSFilters } from './POSFilters.js';
import { usePOSList } from '../../hooks/pdv/usePOSList.js';
import type { POSRecord } from '../../types/pdv.types.js';

interface POSListProps {
  companyId: string;
  onNavigateToCreate: () => void;
  onShowNotification?: (n: {
    type: 'success' | 'error' | 'info';
    message: string;
  }) => void;
}

export const POSList: React.FC<POSListProps> = ({
  companyId,
  onNavigateToCreate,
  onShowNotification,
}) => {
  const {
    filteredRecords,
    paginatedRecords,
    filters,
    setFilterField,
    resetFilters,
    isLoading,
    locations,
    customers,
    users,
    totals,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalEntries,
    startIndex,
    deleteRecord,
    selectedRecord,
    setSelectedRecord,
    isDetailModalOpen,
    setIsDetailModalOpen,
  } = usePOSList(companyId, onShowNotification);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Exportação CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      onShowNotification?.({
        type: 'info',
        message: 'Nenhum dado para exportar.',
      });
      return;
    }
    const headers = [
      'Data',
      'Fatura',
      'Cliente',
      'Contato',
      'Localização',
      'Estado Pagamento',
      'Método Pagamento',
      'Valor Total',
      'Total Pago',
      'Devedor',
    ];
    const rows = filteredRecords.map((r) => [
      r.sellDate,
      r.invoiceNumber,
      `"${r.customerName}"`,
      r.contactNumber,
      `"${r.locationName}"`,
      r.paymentStatus,
      r.paymentMethod,
      r.totalAmount.toFixed(2),
      r.totalPaid.toFixed(2),
      r.sellDue.toFixed(2),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lista_pdv_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowNotification?.({
      type: 'success',
      message: 'Arquivo CSV gerado com sucesso.',
    });
  };

  // Exportação Excel simples
  const handleExportExcel = () => {
    handleExportCSV();
  };

  // Impressão da tabela
  const handlePrint = () => {
    window.print();
  };

  // Status Badge format
  const renderPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            Pago
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            Parcial
          </span>
        );
      case 'due':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
            Vencido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            Pendente
          </span>
        );
    }
  };

  return (
    <div id="pos-list-page" className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* SEÇÃO DE FILTROS */}
      <POSFilters
        filters={filters}
        onFilterChange={setFilterField}
        onReset={resetFilters}
        locations={locations}
        customers={customers}
        users={users}
      />

      {/* SEÇÃO DA TABELA */}
      <div
        id="pos-table-card"
        className="bg-white rounded-lg shadow-sm border border-slate-200 border-t-4 border-t-blue-600 p-4 md:p-6"
      >
        {/* Cabeçalho da Tabela */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-800">Lista de PDV</h1>
          </div>
          <button
            id="btn-pos-add-new"
            type="button"
            onClick={onNavigateToCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Adicionar
          </button>
        </div>

        {/* Barra de Controles: Entradas, Exportação e Busca */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Dropdown de Entradas */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Mostrar</span>
              <select
                id="select-pos-entries"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100 entradas</option>
              </select>
            </div>

            {/* Botões de Ação / Exportação */}
            <div className="flex items-center gap-1">
              <button
                id="btn-pos-export-csv"
                type="button"
                onClick={handleExportCSV}
                title="Exportar para CSV"
                className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-200 flex items-center gap-1 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Exportar para CSV</span>
              </button>
              <button
                id="btn-pos-export-excel"
                type="button"
                onClick={handleExportExcel}
                title="Exportar para Excel"
                className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-200 flex items-center gap-1 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Exportar para Excel</span>
              </button>
              <button
                id="btn-pos-print"
                type="button"
                onClick={handlePrint}
                title="Imprimir"
                className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-200 flex items-center gap-1 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                id="btn-pos-col-visibility"
                type="button"
                onClick={() =>
                  onShowNotification?.({
                    type: 'info',
                    message: 'Todas as colunas estão visíveis.',
                  })
                }
                title="Visibilidade da coluna"
                className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-200 flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Visibilidade da coluna</span>
              </button>
              <button
                id="btn-pos-export-pdf"
                type="button"
                onClick={handleExportCSV}
                title="Exportar para PDF"
                className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-200 flex items-center gap-1 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Exportar para PDF</span>
              </button>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="input-pos-search"
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilterField('searchTerm', e.target.value)}
              placeholder="Pesquisar..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            />
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table
            id="table-pos-records"
            className="w-full text-left text-xs text-slate-700"
          >
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">Ação</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-3 whitespace-nowrap">n. fatura</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Nome do cliente</th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  Número de contato
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">Localização</th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  Estado do pagamento
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  Método de pagamento
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">
                  Valor total
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">
                  Total pago
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">
                  Vender devedor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Carregando registros do PDV...
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-10 text-center text-slate-400 font-medium"
                  >
                    Sem dados disponíveis na tabela
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    {/* Ação */}
                    <td className="py-2 px-3 whitespace-nowrap relative">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600 transition-colors"
                          title="Visualizar Cupom / Detalhes"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === record.id ? null : record.id
                            )
                          }
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Dropdown de Ações */}
                      {activeMenuId === record.id && (
                        <div
                          className="absolute left-8 top-8 z-30 w-36 bg-white border border-slate-200 rounded shadow-lg py-1"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsDetailModalOpen(true);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Receipt className="w-3.5 h-3.5 text-blue-600" />
                            Ver Cupom
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              window.print();
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            Imprimir
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteRecord(record.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                      {record.sellDate}
                    </td>

                    {/* n. fatura */}
                    <td className="py-2 px-3 whitespace-nowrap font-medium text-blue-600">
                      {record.invoiceNumber}
                    </td>

                    {/* Nome do cliente */}
                    <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-800">
                      {record.customerName}
                    </td>

                    {/* Número de contato */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                      {record.contactNumber}
                    </td>

                    {/* Localização */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                      {record.locationName}
                    </td>

                    {/* Estado do pagamento */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      {renderPaymentBadge(record.paymentStatus)}
                    </td>

                    {/* Método de pagamento */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                      {record.paymentMethod}
                    </td>

                    {/* Valor total */}
                    <td className="py-2 px-3 whitespace-nowrap text-right font-semibold text-slate-800">
                      {record.totalAmount.toFixed(2)} R$
                    </td>

                    {/* Total pago */}
                    <td className="py-2 px-3 whitespace-nowrap text-right font-semibold text-emerald-700">
                      {record.totalPaid.toFixed(2)} R$
                    </td>

                    {/* Vender devedor */}
                    <td className="py-2 px-3 whitespace-nowrap text-right font-semibold text-rose-600">
                      {record.sellDue.toFixed(2)} R$
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Rodapé Cinza com Totais */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800">
              <tr>
                <td colSpan={8} className="py-2.5 px-3 text-right">
                  Total:
                </td>
                <td className="py-2.5 px-3 text-right">
                  {totals.totalAmount.toFixed(2)} R$
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700">
                  {totals.totalPaid.toFixed(2)} R$
                </td>
                <td className="py-2.5 px-3 text-right text-rose-600">
                  {totals.sellDue.toFixed(2)} R$
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-xs text-slate-600">
          <div>
            Mostrando{' '}
            {totalEntries === 0 ? 0 : startIndex + 1} a{' '}
            {Math.min(startIndex + itemsPerPage, totalEntries)} de {totalEntries}{' '}
            entradas
          </div>
          <div className="flex items-center gap-1">
            <button
              id="btn-pos-prev-page"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
            <span className="px-2.5 py-1 text-slate-700 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              id="btn-pos-next-page"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Próximo
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes / Cupom do POS */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-slate-800 relative">
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">OLYPS PRO PDV</h3>
              <p className="text-xs text-slate-500">{selectedRecord.locationName}</p>
              <p className="text-xs font-mono font-semibold text-blue-600 mt-1">
                {selectedRecord.invoiceNumber}
              </p>
            </div>

            <div className="text-xs space-y-1 mb-4 text-slate-600">
              <div className="flex justify-between">
                <span>Data/Hora:</span>
                <span className="font-medium text-slate-800">
                  {selectedRecord.sellDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-medium text-slate-800">
                  {selectedRecord.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Método:</span>
                <span className="font-medium text-slate-800">
                  {selectedRecord.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Operador:</span>
                <span className="font-medium text-slate-800">
                  {selectedRecord.addedBy}
                </span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4 max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100">
                    <th className="text-left pb-1">Item</th>
                    <th className="text-center pb-1">Qtd</th>
                    <th className="text-right pb-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedRecord.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1">
                        <div className="font-medium text-slate-800">
                          {it.productName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {it.code}
                        </div>
                      </td>
                      <td className="py-1 text-center">{it.quantity}</td>
                      <td className="py-1 text-right font-medium">
                        {it.subtotal.toFixed(2)} R$
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-xs mb-4">
              <div className="flex justify-between font-bold text-sm">
                <span>Total a Pagar:</span>
                <span>{selectedRecord.totalAmount.toFixed(2)} R$</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Pago:</span>
                <span>{selectedRecord.totalPaid.toFixed(2)} R$</span>
              </div>
              {selectedRecord.sellDue > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Saldo Devedor:</span>
                  <span>{selectedRecord.sellDue.toFixed(2)} R$</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Cupom
              </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
