import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useSuppliers } from '../../hooks/useSuppliers.js';
import { SupplierFormModal } from './SupplierFormModal.js';
import type { Supplier } from '../../types/contact.types.js';

interface SupplierListProps {
  companyId?: string;
  onShowNotification?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({
  companyId,
  onShowNotification,
}) => {
  const {
    suppliers,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  } = useSuppliers({ companyId });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const notify = (type: 'success' | 'error' | 'info', message: string) => {
    if (onShowNotification) {
      onShowNotification(type, message);
    }
  };

  const handleOpenCreate = () => {
    setSupplierToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: any) => {
    if (supplierToEdit) {
      await updateSupplier(supplierToEdit.id, payload);
      notify('success', 'Fornecedor atualizado com sucesso!');
    } else {
      await createSupplier(payload);
      notify('success', 'Fornecedor cadastrado com sucesso!');
    }
    fetchSuppliers();
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSupplier(supplierToDelete.id);
      notify('success', 'Fornecedor removido com sucesso!');
      setSupplierToDelete(null);
      fetchSuppliers();
    } catch (err: any) {
      notify('error', err.message || 'Erro ao remover fornecedor.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="suppliers-module-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fornecedores</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {pagination.totalItems} cadastrados
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestão completa de fornecedores, distribuidores e parceiros comerciais
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchSuppliers()}
            disabled={loading}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
            title="Atualizar lista"
            id="refresh-suppliers-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs shadow-indigo-600/20 flex items-center gap-2 transition-colors cursor-pointer"
            id="create-supplier-btn"
          >
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Buscar por nome, razão social, CNPJ/CPF ou e-mail..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              id="search-suppliers-input"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700"
              id="filter-supplier-status"
            >
              <option value="">Todos os status</option>
              <option value="active">Apenas Ativos</option>
              <option value="inactive">Apenas Inativos</option>
              <option value="blocked">Apenas Bloqueados</option>
            </select>
          </div>

          {/* Person Type Filter */}
          <div>
            <select
              value={filters.personType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, personType: e.target.value as any }))
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700"
              id="filter-supplier-persontype"
            >
              <option value="">Todos os tipos</option>
              <option value="legal">Pessoa Jurídica (PJ)</option>
              <option value="individual">Pessoa Física (PF)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">Fornecedor / Razão Social</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Contatos</th>
                <th className="py-3.5 px-4">Localização</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading && suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Carregando fornecedores...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700">Nenhum fornecedor encontrado</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Clique em "Novo Fornecedor" para cadastrar sua primeira empresa parceira.
                    </p>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                    id={`supplier-row-${supplier.id}`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{supplier.name}</div>
                      {supplier.tradeName && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Fantasia: {supplier.tradeName}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      {supplier.document || '—'}
                      <div className="text-[10px] text-slate-400 font-sans uppercase">
                        {supplier.personType === 'legal' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs space-y-1">
                      {supplier.email && (
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {(supplier.phone || supplier.mobile) && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{supplier.mobile || supplier.phone}</span>
                        </div>
                      )}
                      {!supplier.email && !supplier.phone && !supplier.mobile && '—'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {supplier.city ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {supplier.city}
                            {supplier.state ? ` - ${supplier.state}` : ''}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {supplier.category ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {supplier.category}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {supplier.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : supplier.status === 'inactive' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          Inativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          Bloqueado
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(supplier)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Editar fornecedor"
                          id={`edit-supplier-btn-${supplier.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSupplierToDelete(supplier)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Excluir fornecedor"
                          id={`delete-supplier-btn-${supplier.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Mostrando página <span className="font-semibold text-slate-700">{pagination.page}</span>{' '}
            de <span className="font-semibold text-slate-700">{pagination.totalPages || 1}</span> (
            {pagination.totalItems} itens)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => fetchSuppliers(pagination.page - 1)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => fetchSuppliers(pagination.page + 1)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              Próximo
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        supplierToEdit={supplierToEdit}
      />

      {/* Delete Confirmation Dialog */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Fornecedor</h3>
                <p className="text-xs text-slate-500">Esta ação não poderá ser revertida</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja remover o fornecedor{' '}
              <span className="font-semibold text-slate-900">{supplierToDelete.name}</span>?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
                id="confirm-delete-supplier-btn"
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

export default SupplierList;
