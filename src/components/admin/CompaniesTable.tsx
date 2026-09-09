import React from 'react';
import { Search, Eye, Edit3, ChevronLeft, ChevronRight, Filter, Building2, Plus, Download, Printer } from 'lucide-react';
import { CreateButton } from '../ui/CreateButton.js';
import { EditButton } from '../ui/EditButton.js';
import { ExportButton } from '../ui/ExportButton.js';
import { PrintButton } from '../ui/PrintButton.js';
import { exportToCsv, exportToExcel, exportToPdf } from '../../lib/exportUtils.js';
import type { CompanyRecord, CompanyStatus, PaginationMeta, SortDirection, ExportFormat } from '../../types/index.js';

interface CompaniesTableProps {
  companies: CompanyRecord[];
  pagination: PaginationMeta;
  isLoading: boolean;
  searchQuery: string;
  statusFilter: CompanyStatus | 'all';
  sortBy: 'name' | 'created_at' | 'status' | 'slug';
  sortDirection: SortDirection;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: CompanyStatus | 'all') => void;
  onSortChange: (field: 'name' | 'created_at' | 'status' | 'slug') => void;
  onPageChange: (page: number) => void;
  onViewDetails: (company: CompanyRecord) => void;
  onChangeStatus: (company: CompanyRecord) => void;
  onCreateCompany?: () => void;
  onEditCompany?: (company: CompanyRecord) => void;
}

export const CompaniesTable: React.FC<CompaniesTableProps> = ({
  companies,
  pagination,
  isLoading,
  searchQuery,
  statusFilter,
  sortBy,
  sortDirection,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  onPageChange,
  onViewDetails,
  onChangeStatus,
  onCreateCompany,
  onEditCompany,
}) => {
  const getStatusBadge = (status: CompanyStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Ativa
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Suspensa
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Pendente
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            Inativa
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handleExport = (format: ExportFormat) => {
    const exportColumns = [
      { key: 'name', header: 'Nome Fantasia' },
      { key: 'legalName', header: 'Razão Social' },
      { key: 'document', header: 'CNPJ/CPF' },
      { key: 'slug', header: 'Slug' },
      { key: 'status', header: 'Status' },
      { key: 'city', header: 'Cidade' },
      { key: 'state', header: 'UF' },
      { key: 'createdAt', header: 'Criada em' },
    ];
    if (format === 'csv') exportToCsv('empresas-olyps', exportColumns, companies as unknown as Record<string, unknown>[]);
    else if (format === 'excel') exportToExcel('empresas-olyps', exportColumns, companies as unknown as Record<string, unknown>[]);
    else if (format === 'pdf') exportToPdf('empresas-olyps', 'Relatório de Empresas - OLYPS PRO', exportColumns, companies as unknown as Record<string, unknown>[]);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden" id="super-admin-companies-container">
      {/* Table Header and Filters */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="company-search-input"
            type="text"
            placeholder="Buscar por nome, CNPJ, slug ou cidade..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              id="company-status-filter-select"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as CompanyStatus | 'all')}
              className="text-xs font-medium bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativas</option>
              <option value="suspended">Suspensas</option>
              <option value="pending">Pendentes</option>
              <option value="inactive">Inativas</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <select
              id="company-sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'name' | 'created_at' | 'status' | 'slug')}
              className="text-xs font-medium bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="created_at">Data de Cadastro</option>
              <option value="name">Nome Fantasia</option>
              <option value="status">Status</option>
              <option value="slug">Slug</option>
            </select>
          </div>

          <ExportButton onExport={handleExport} disabled={companies.length === 0} />
          <PrintButton onPrint={() => window.print()} disabled={companies.length === 0} />

          {onCreateCompany && (
            <CreateButton
              label="Nova Empresa"
              onClick={onCreateCompany}
            />
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Nome Fantasia</th>
              <th className="py-3 px-4">Razão Social</th>
              <th className="py-3 px-4">CNPJ / Documento</th>
              <th className="py-3 px-4">Cidade / UF</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Cadastro</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Carregando empresas...</span>
                  </div>
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Nenhuma empresa encontrada para os filtros aplicados.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} id={`company-row-${company.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-slate-100 rounded text-slate-600">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span>{company.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {company.legalName || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                    {company.document || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">
                    {company.city ? `${company.city} - ${company.state || ''}` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(company.status)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">
                    {formatDate(company.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      id={`btn-view-details-${company.id}`}
                      type="button"
                      onClick={() => onViewDetails(company)}
                      title="Visualizar Detalhes"
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>Detalhes</span>
                    </button>
                    {onEditCompany && (
                      <button
                        id={`btn-edit-company-${company.id}`}
                        type="button"
                        onClick={() => onEditCompany(company)}
                        title="Editar Empresa"
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 rounded border border-slate-300 shadow-xs transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-slate-600" />
                        <span>Editar</span>
                      </button>
                    )}
                    <button
                      id={`btn-change-status-${company.id}`}
                      type="button"
                      onClick={() => onChangeStatus(company)}
                      title="Alterar Status"
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 shadow-xs transition-colors"
                    >
                      <span>Status</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <span className="text-xs text-slate-600">
          Mostrando <strong className="font-semibold">{companies.length}</strong> de{' '}
          <strong className="font-semibold">{pagination.total}</strong> empresas
        </span>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-600 mr-2">
            Página {pagination.page} de {Math.max(1, pagination.totalPages)}
          </span>
          <button
            id="btn-pagination-prev"
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevPage || isLoading}
            className="p-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="btn-pagination-next"
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage || isLoading}
            className="p-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
