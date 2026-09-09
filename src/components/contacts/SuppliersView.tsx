import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Building2,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Landmark,
} from 'lucide-react';
import type {
  Supplier,
  ContactStatus,
  PersonType,
  CreateSupplierPayload,
  UpdateSupplierPayload,
  PaginationMeta,
} from '../../types/index.js';
import { api } from '../../lib/api.js';
import { SupplierFormModal } from './SupplierFormModal.js';
import { SupplierDetailsModal } from './SupplierDetailsModal.js';

interface SuppliersViewProps {
  companyId: string;
  activeCompanyName: string;
  userRole?: string;
  isPlatformAdmin?: boolean;
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  companyId,
  activeCompanyName,
  onShowNotification,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | ''>('');
  const [personTypeFilter, setPersonTypeFilter] = useState<PersonType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [detailsSupplier, setDetailsSupplier] = useState<Supplier | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Record<string, any> = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (search.trim()) queryParams.search = search.trim();
      if (statusFilter) queryParams.status = statusFilter;
      if (personTypeFilter) queryParams.personType = personTypeFilter;
      if (categoryFilter.trim()) queryParams.category = categoryFilter.trim();

      const json = await api.get<Supplier[]>(`/api/companies/${companyId}/suppliers`, {
        companyId,
        params: queryParams,
      });

      if (json.success && json.data) {
        setSuppliers(json.data);
        if (json.meta) {
          setPagination({
            page: json.meta.page,
            pageSize: json.meta.pageSize,
            totalItems: json.meta.totalItems,
            totalPages: json.meta.totalPages,
            hasNextPage: json.meta.hasNextPage,
            hasPreviousPage: json.meta.hasPreviousPage,
          });
        }
      } else {
        onShowNotification('error', json.error?.message || 'Erro ao carregar fornecedores.');
      }
    } catch {
      onShowNotification('error', 'Falha de comunicação ao listar fornecedores.');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, pagination.page, pagination.pageSize, search, statusFilter, personTypeFilter, categoryFilter, onShowNotification]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Handlers
  const handleOpenCreate = () => {
    setSupplierToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (supplier: Supplier) => {
    setDetailsSupplier(supplier);
    setIsDetailsOpen(true);
  };

  const handleSaveSupplier = async (payload: CreateSupplierPayload | UpdateSupplierPayload) => {
    setIsSaving(true);
    try {
      const isEditing = Boolean(supplierToEdit);
      const url = isEditing
        ? `/api/companies/${companyId}/suppliers/${supplierToEdit!.id}`
        : `/api/companies/${companyId}/suppliers`;

      const json = isEditing
        ? await api.put<Supplier>(url, payload, { companyId })
        : await api.post<Supplier>(url, payload, { companyId });

      if (json.success) {
        onShowNotification(
          'success',
          isEditing ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!'
        );
        setIsFormOpen(false);
        setSupplierToEdit(null);
        fetchSuppliers();
      } else {
        throw new Error(json.error?.message || 'Erro ao salvar fornecedor.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      const json = await api.delete(`/api/companies/${companyId}/suppliers/${supplierToDelete.id}`, {
        companyId,
      });

      if (json.success) {
        onShowNotification('success', 'Fornecedor excluído com sucesso.');
        setSupplierToDelete(null);
        fetchSuppliers();
      } else {
        onShowNotification('error', json.error?.message || 'Falha ao excluir fornecedor.');
      }
    } catch {
      onShowNotification('error', 'Erro interno ao tentar excluir fornecedor.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6" id="suppliers-management-view">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">Base de Fornecedores</h1>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {pagination.totalItems} {pagination.totalItems === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de parceiros, distribuidores e prestadores de serviço de <strong className="text-slate-700">{activeCompanyName}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchSuppliers()}
            disabled={isLoading}
            className="p-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Buscar por fornecedor, CNPJ, e-mail..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filter: Tipo de Pessoa */}
          <div>
            <select
              value={personTypeFilter}
              onChange={(e) => {
                setPersonTypeFilter(e.target.value as PersonType | '');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">Todos os Tipos (PJ / PF)</option>
              <option value="legal">Pessoa Jurídica (PJ)</option>
              <option value="individual">Pessoa Física (PF)</option>
            </select>
          </div>

          {/* Filter: Categoria */}
          <div>
            <input
              type="text"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Filtrar por categoria..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filter: Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ContactStatus | '');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs">Carregando fornecedores cadastrados...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Truck className="w-10 h-10 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Nenhum fornecedor encontrado</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {search || statusFilter || personTypeFilter || categoryFilter
                  ? 'Ajuste os filtros de pesquisa para visualizar outros registros.'
                  : 'Cadastre o primeiro fornecedor da sua empresa clicando no botão acima.'}
              </p>
            </div>
            {!search && !statusFilter && !personTypeFilter && !categoryFilter && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Primeiro Fornecedor</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Fornecedor / Razão Social</th>
                  <th className="py-3 px-4">CNPJ / CPF</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Contato / E-mail</th>
                  <th className="py-3 px-4">Condições Pgto</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {suppliers.map((supplier) => {
                  const isLegal = supplier.personType === 'legal';
                  return (
                    <tr
                      key={supplier.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetails(supplier)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{supplier.name}</div>
                            {supplier.tradeName && (
                              <div className="text-[11px] text-slate-500">{supplier.tradeName}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {supplier.document || '—'}
                      </td>

                      <td className="py-3 px-4">
                        {supplier.category ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {supplier.category}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Geral</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div>{supplier.email || '—'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {supplier.mobile || supplier.phone || ''}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {supplier.paymentTerms || '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            supplier.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : supplier.status === 'blocked'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {supplier.status === 'active'
                            ? 'Ativo'
                            : supplier.status === 'blocked'
                            ? 'Bloqueado'
                            : 'Inativo'}
                        </span>
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(supplier)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(supplier)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSupplierToDelete(supplier)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Mostrando página <strong>{pagination.page}</strong> de{' '}
              <strong>{pagination.totalPages}</strong> ({pagination.totalItems} registros)
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="p-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="p-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SupplierFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSupplierToEdit(null);
        }}
        onSave={handleSaveSupplier}
        supplierToEdit={supplierToEdit}
        isSaving={isSaving}
      />

      <SupplierDetailsModal
        isOpen={isDetailsOpen}
        supplier={detailsSupplier}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsSupplier(null);
        }}
        onEdit={(sup) => {
          handleOpenEdit(sup);
        }}
      />

      {/* Confirmation Modal for Delete */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-50 rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Excluir Fornecedor</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Tem certeza que deseja excluir o fornecedor{' '}
              <strong className="text-slate-900 font-semibold">{supplierToDelete.name}</strong>?
              Esta ação removerá o cadastro permanentemente.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteSupplier}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
