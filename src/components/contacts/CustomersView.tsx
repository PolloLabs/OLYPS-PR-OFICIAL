import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Building2,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import type {
  Customer,
  CustomerGroup,
  ContactStatus,
  PersonType,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  PaginationMeta,
} from '../../types/index.js';
import { api } from '../../lib/api.js';
import { CustomerFormModal } from './CustomerFormModal.js';
import { CustomerDetailsModal } from './CustomerDetailsModal.js';

interface CustomersViewProps {
  companyId: string;
  activeCompanyName: string;
  userRole?: string;
  isPlatformAdmin?: boolean;
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  companyId,
  activeCompanyName,
  onShowNotification,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | ''>('');
  const [personTypeFilter, setPersonTypeFilter] = useState<PersonType | ''>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
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
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [detailsCustomer, setDetailsCustomer] = useState<Customer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get<CustomerGroup[]>(`/api/companies/${companyId}/customer-groups`, {
        companyId,
      });
      if (res.success && res.data) {
        setGroups(res.data);
      }
    } catch {
      // Non-critical
    }
  }, [companyId]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Record<string, any> = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (search.trim()) queryParams.search = search.trim();
      if (statusFilter) queryParams.status = statusFilter;
      if (personTypeFilter) queryParams.personType = personTypeFilter;
      if (groupFilter) queryParams.customerGroupId = groupFilter;

      const json = await api.get<Customer[]>(`/api/companies/${companyId}/customers`, {
        companyId,
        params: queryParams,
      });

      if (json.success && json.data) {
        setCustomers(json.data);
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
        onShowNotification('error', json.error?.message || 'Erro ao carregar clientes.');
      }
    } catch {
      onShowNotification('error', 'Falha de comunicação ao listar clientes.');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, pagination.page, pagination.pageSize, search, statusFilter, personTypeFilter, groupFilter, onShowNotification]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handlers
  const handleOpenCreate = () => {
    setCustomerToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (customer: Customer) => {
    setDetailsCustomer(customer);
    setIsDetailsOpen(true);
  };

  const handleSaveCustomer = async (payload: CreateCustomerPayload | UpdateCustomerPayload) => {
    setIsSaving(true);
    try {
      const isEditing = Boolean(customerToEdit);
      const url = isEditing
        ? `/api/companies/${companyId}/customers/${customerToEdit!.id}`
        : `/api/companies/${companyId}/customers`;

      const json = isEditing
        ? await api.put<Customer>(url, payload, { companyId })
        : await api.post<Customer>(url, payload, { companyId });

      if (json.success) {
        onShowNotification(
          'success',
          isEditing ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!'
        );
        setIsFormOpen(false);
        setCustomerToEdit(null);
        fetchCustomers();
      } else {
        throw new Error(json.error?.message || 'Erro ao salvar cliente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      const json = await api.delete(`/api/companies/${companyId}/customers/${customerToDelete.id}`, {
        companyId,
      });

      if (json.success) {
        onShowNotification('success', 'Cliente excluído com sucesso.');
        setCustomerToDelete(null);
        fetchCustomers();
      } else {
        onShowNotification('error', json.error?.message || 'Falha ao excluir cliente.');
      }
    } catch {
      onShowNotification('error', 'Erro interno ao tentar excluir cliente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6" id="customers-management-view">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">Base de Clientes</h1>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {pagination.totalItems} {pagination.totalItems === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de clientes físicos e jurídicos de <strong className="text-slate-700">{activeCompanyName}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchCustomers()}
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
            <span>Novo Cliente</span>
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
              placeholder="Buscar por nome, CNPJ/CPF, e-mail..."
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
              <option value="">Todos os Tipos (PF / PJ)</option>
              <option value="legal">Pessoa Jurídica (PJ)</option>
              <option value="individual">Pessoa Física (PF)</option>
            </select>
          </div>

          {/* Filter: Grupo */}
          <div>
            <select
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">Todos os Grupos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
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
            <p className="text-xs">Carregando clientes cadastrados...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <User className="w-10 h-10 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Nenhum cliente encontrado</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {search || statusFilter || personTypeFilter || groupFilter
                  ? 'Ajuste os filtros de pesquisa para visualizar outros registros.'
                  : 'Cadastre o primeiro cliente da sua empresa clicando no botão acima.'}
              </p>
            </div>
            {!search && !statusFilter && !personTypeFilter && !groupFilter && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Primeiro Cliente</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Cliente / Razão Social</th>
                  <th className="py-3 px-4">CPF / CNPJ</th>
                  <th className="py-3 px-4">Grupo</th>
                  <th className="py-3 px-4">Contato / E-mail</th>
                  <th className="py-3 px-4">Cidade / UF</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customers.map((customer) => {
                  const isLegal = customer.personType === 'legal';
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetails(customer)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                              isLegal ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'
                            }`}
                          >
                            {isLegal ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{customer.name}</div>
                            {customer.tradeName && (
                              <div className="text-[11px] text-slate-500">{customer.tradeName}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {customer.document || '—'}
                      </td>

                      <td className="py-3 px-4">
                        {customer.customerGroupName ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {customer.customerGroupName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Geral</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div>{customer.email || '—'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {customer.mobile || customer.phone || ''}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {customer.city ? `${customer.city} / ${customer.state || ''}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            customer.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : customer.status === 'blocked'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {customer.status === 'active'
                            ? 'Ativo'
                            : customer.status === 'blocked'
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
                            onClick={() => handleOpenDetails(customer)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(customer)}
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
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setCustomerToEdit(null);
        }}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
        groups={groups}
        isSaving={isSaving}
      />

      <CustomerDetailsModal
        isOpen={isDetailsOpen}
        customer={detailsCustomer}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsCustomer(null);
        }}
        onEdit={(cust) => {
          handleOpenEdit(cust);
        }}
      />

      {/* Confirmation Modal for Delete */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-50 rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Excluir Cliente</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Tem certeza que deseja excluir o cliente{' '}
              <strong className="text-slate-900 font-semibold">{customerToDelete.name}</strong>?
              Esta ação removerá o cadastro permanentemente.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCustomer}
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
