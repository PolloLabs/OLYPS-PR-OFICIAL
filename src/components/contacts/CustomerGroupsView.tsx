import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Percent,
  Tag,
  ShieldAlert,
  Users,
} from 'lucide-react';
import type {
  CustomerGroup,
  CreateCustomerGroupPayload,
  UpdateCustomerGroupPayload,
} from '../../types/index.js';
import { api } from '../../lib/api.js';
import { CustomerGroupFormModal } from './CustomerGroupFormModal.js';

interface CustomerGroupsViewProps {
  companyId: string;
  activeCompanyName: string;
  userRole?: string;
  isPlatformAdmin?: boolean;
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

export const CustomerGroupsView: React.FC<CustomerGroupsViewProps> = ({
  companyId,
  activeCompanyName,
  onShowNotification,
}) => {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<CustomerGroup | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [groupToDelete, setGroupToDelete] = useState<CustomerGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const json = await api.get<CustomerGroup[]>(`/api/companies/${companyId}/customer-groups`, {
        companyId,
      });

      if (json.success && json.data) {
        setGroups(json.data);
      } else {
        onShowNotification('error', json.error?.message || 'Erro ao carregar grupos.');
      }
    } catch {
      onShowNotification('error', 'Falha de comunicação ao listar grupos.');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, onShowNotification]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleOpenCreate = () => {
    setGroupToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (group: CustomerGroup) => {
    setGroupToEdit(group);
    setIsFormOpen(true);
  };

  const handleSaveGroup = async (payload: CreateCustomerGroupPayload | UpdateCustomerGroupPayload) => {
    setIsSaving(true);
    try {
      const isEditing = Boolean(groupToEdit);
      const url = isEditing
        ? `/api/companies/${companyId}/customer-groups/${groupToEdit!.id}`
        : `/api/companies/${companyId}/customer-groups`;

      const json = isEditing
        ? await api.put<CustomerGroup>(url, payload, { companyId })
        : await api.post<CustomerGroup>(url, payload, { companyId });

      if (json.success) {
        onShowNotification(
          'success',
          isEditing ? 'Grupo atualizado com sucesso!' : 'Grupo cadastrado com sucesso!'
        );
        setIsFormOpen(false);
        setGroupToEdit(null);
        fetchGroups();
      } else {
        throw new Error(json.error?.message || 'Erro ao salvar grupo.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    setIsDeleting(true);
    try {
      const json = await api.delete(`/api/companies/${companyId}/customer-groups/${groupToDelete.id}`, {
        companyId,
      });

      if (json.success) {
        onShowNotification('success', 'Grupo de clientes excluído.');
        setGroupToDelete(null);
        fetchGroups();
      } else {
        onShowNotification('error', json.error?.message || 'Falha ao excluir grupo.');
      }
    } catch {
      onShowNotification('error', 'Erro interno ao tentar excluir grupo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(term) ||
      (g.description && g.description.toLowerCase().includes(term)) ||
      (g.priceTable && g.priceTable.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6" id="customer-groups-view">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">Grupos de Clientes</h1>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Segmentação comercial, tabelas de preço e políticas de desconto para <strong className="text-slate-700">{activeCompanyName}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchGroups()}
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
            <span>Novo Grupo</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do grupo ou tabela..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid or Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs">Carregando grupos de clientes...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Layers className="w-10 h-10 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Nenhum grupo encontrado</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {search
                  ? 'Ajuste os termos de busca para encontrar outros grupos.'
                  : 'Crie categorias para segmentar clientes com condições comerciais personalizadas.'}
              </p>
            </div>
            {!search && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Primeiro Grupo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Nome do Grupo</th>
                  <th className="py-3 px-4">Desconto Padrão</th>
                  <th className="py-3 px-4">Tabela de Preço</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4 text-center">Clientes</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-900">{group.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {group.discountPercentage > 0 ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Percent className="w-3 h-3" />
                          <span>{group.discountPercentage}% off</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Sem desconto</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {group.priceTable || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {group.description || '—'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <Users className="w-3 h-3" />
                        <span>{group.customerCount || 0}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(group)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupToDelete(group)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CustomerGroupFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setGroupToEdit(null);
        }}
        onSave={handleSaveGroup}
        groupToEdit={groupToEdit}
        isSaving={isSaving}
      />

      {/* Confirmation Modal for Delete */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-50 rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Excluir Grupo de Clientes</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Tem certeza que deseja excluir o grupo{' '}
              <strong className="text-slate-900 font-semibold">{groupToDelete.name}</strong>?
              Os clientes associados passarão a ficar sem grupo vinculado.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setGroupToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteGroup}
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
