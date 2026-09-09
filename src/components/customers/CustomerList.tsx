import React, { useState } from 'react';
import {
  Users,
  User,
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
  CheckCircle2,
  XCircle,
  Tag,
  DollarSign,
  FolderPlus,
} from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers.js';
import { useCustomerGroups } from '../../hooks/useCustomerGroups.js';
import { CustomerFormModal } from './CustomerFormModal.js';
import { CustomerGroupFormModal } from './CustomerGroupFormModal.js';
import type { Customer, CustomerGroup } from '../../types/contact.types.js';

interface CustomerListProps {
  companyId?: string;
  onShowNotification?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  companyId,
  onShowNotification,
}) => {
  const {
    customers,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers({ companyId });

  const {
    groups,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  } = useCustomerGroups({ companyId });

  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<CustomerGroup | null>(null);

  const notify = (type: 'success' | 'error' | 'info', message: string) => {
    if (onShowNotification) {
      onShowNotification(type, message);
    }
  };

  const handleOpenCreateCustomer = () => {
    setCustomerToEdit(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (payload: any) => {
    if (customerToEdit) {
      await updateCustomer(customerToEdit.id, payload);
      notify('success', 'Cliente atualizado com sucesso!');
    } else {
      await createCustomer(payload);
      notify('success', 'Cliente cadastrado com sucesso!');
    }
    fetchCustomers();
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeletingCustomer(true);
    try {
      await deleteCustomer(customerToDelete.id);
      notify('success', 'Cliente removido com sucesso!');
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err: any) {
      notify('error', err.message || 'Erro ao remover cliente.');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const handleOpenCreateGroup = () => {
    setGroupToEdit(null);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (payload: any) => {
    if (groupToEdit) {
      await updateGroup(groupToEdit.id, payload);
      notify('success', 'Grupo de clientes atualizado com sucesso!');
    } else {
      await createGroup(payload);
      notify('success', 'Grupo de clientes criado com sucesso!');
    }
    fetchGroups();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="customers-module-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clientes</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {pagination.totalItems} cadastrados
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Controle da base de clientes, grupos promocionais e limites de crédito
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              fetchCustomers();
              fetchGroups();
            }}
            disabled={loading}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
            title="Atualizar lista"
            id="refresh-customers-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateGroup}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
            id="create-customer-group-btn"
          >
            <FolderPlus className="w-4 h-4 text-slate-500" />
            Novo Grupo
          </button>

          <button
            type="button"
            onClick={handleOpenCreateCustomer}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs shadow-indigo-600/20 flex items-center gap-2 transition-colors cursor-pointer"
            id="create-customer-btn"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
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
              placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              id="search-customers-input"
            />
          </div>

          {/* Group Filter */}
          <div>
            <select
              value={filters.groupId}
              onChange={(e) => setFilters((prev) => ({ ...prev, groupId: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700"
              id="filter-customer-group"
            >
              <option value="">Todos os grupos</option>
              {groups.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700"
              id="filter-customer-status"
            >
              <option value="">Todos os status</option>
              <option value="active">Apenas Ativos</option>
              <option value="inactive">Apenas Inativos</option>
              <option value="blocked">Apenas Bloqueados</option>
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
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Contatos</th>
                <th className="py-3.5 px-4">Grupo</th>
                <th className="py-3.5 px-4">Limite de Crédito</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Carregando clientes...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700">Nenhum cliente cadastrado</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Cadastre novos clientes clicando no botão "Novo Cliente" acima.
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                    id={`customer-row-${customer.id}`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{customer.name}</div>
                      {customer.tradeName && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Fantasia: {customer.tradeName}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      {customer.document || '—'}
                      <div className="text-[10px] text-slate-400 font-sans uppercase">
                        {customer.personType === 'legal' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {(customer.mobile || customer.phone) && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{customer.mobile || customer.phone}</span>
                        </div>
                      )}
                      {!customer.email && !customer.mobile && !customer.phone && '—'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {customer.customerGroupName ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200/50">
                          <Tag className="w-3 h-3 text-indigo-500" />
                          {customer.customerGroupName}
                        </span>
                      ) : (
                        <span className="text-slate-400">Padrão</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium text-xs">
                      {customer.creditLimit ? (
                        <span className="text-emerald-700 font-semibold">
                          R$ {customer.creditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-400">Sem limite</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {customer.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : customer.status === 'inactive' ? (
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
                          onClick={() => handleOpenEditCustomer(customer)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Editar cliente"
                          id={`edit-customer-btn-${customer.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerToDelete(customer)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Excluir cliente"
                          id={`delete-customer-btn-${customer.id}`}
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
              onClick={() => fetchCustomers(pagination.page - 1)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => fetchCustomers(pagination.page + 1)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              Próximo
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
        groups={groups}
      />

      {/* Customer Group Form Modal */}
      <CustomerGroupFormModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleSaveGroup}
        groupToEdit={groupToEdit}
      />

      {/* Delete Confirmation Dialog */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Cliente</h3>
                <p className="text-xs text-slate-500">Esta ação não poderá ser revertida</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja remover o cliente{' '}
              <span className="font-semibold text-slate-900">{customerToDelete.name}</span>?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeletingCustomer}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={isDeletingCustomer}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
                id="confirm-delete-customer-btn"
              >
                {isDeletingCustomer ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
