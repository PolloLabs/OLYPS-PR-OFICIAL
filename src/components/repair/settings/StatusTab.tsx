import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, Star, ArrowUpDown } from 'lucide-react';
import type { RepairStatus, RepairSettings } from '../../../types/repair.types.js';
import { StatusFormModal } from './StatusFormModal.js';

interface StatusTabProps {
  statuses: RepairStatus[];
  generalSettings?: RepairSettings;
  onCreateStatus: (data: Omit<RepairStatus, 'id'>) => Promise<RepairStatus>;
  onUpdateStatus: (id: string, data: Partial<RepairStatus>) => Promise<RepairStatus>;
  onDeleteStatus: (id: string) => Promise<void>;
  onSetDefaultStatus?: (statusId: string) => Promise<void>;
}

export const StatusTab: React.FC<StatusTabProps> = ({
  statuses,
  generalSettings,
  onCreateStatus,
  onUpdateStatus,
  onDeleteStatus,
  onSetDefaultStatus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<RepairStatus | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingStatus(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (status: RepairStatus) => {
    setEditingStatus(status);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (data: Omit<RepairStatus, 'id'> | Partial<RepairStatus>) => {
    if (editingStatus) {
      await onUpdateStatus(editingStatus.id, data);
    } else {
      await onCreateStatus(data as Omit<RepairStatus, 'id'>);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (generalSettings?.defaultStatusId === id) {
      alert('Este status é o padrão do sistema e não pode ser excluído antes de selecionar outro status padrão.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja remover o status "${name}"?`)) {
      setDeletingId(id);
      try {
        await onDeleteStatus(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Status de Ordens de Serviço</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure o fluxo de trabalho e as etapas de atendimento técnico da assistência.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Status</span>
        </button>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-16 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ordem</span>
                  </span>
                </th>
                <th className="py-3 px-4">Status & Identificador</th>
                <th className="py-3 px-4">Cor do Badge</th>
                <th className="py-3 px-4 text-center">Status Padrão</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statuses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhum status configurado. Clique em &quot;Novo Status&quot; para adicionar.
                  </td>
                </tr>
              ) : (
                statuses.map((status) => {
                  const isDefault = generalSettings?.defaultStatusId === status.id;
                  return (
                    <tr key={status.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Sort Order */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                        {status.sortOrder}
                      </td>

                      {/* Status Name + Emoji */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{status.emoji || '🔧'}</span>
                          <span className="font-semibold text-slate-900">{status.name}</span>
                          {isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>Padrão Inicial</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Color Preview */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="font-mono text-slate-600 text-[11px] uppercase">
                            {status.color}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-2xs ml-2"
                            style={{ backgroundColor: status.color }}
                          >
                            Exemplo
                          </span>
                        </div>
                      </td>

                      {/* Default Toggle Button */}
                      <td className="py-3 px-4 text-center">
                        {isDefault ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSetDefaultStatus && onSetDefaultStatus(status.id)}
                            className="text-xs text-slate-500 hover:text-indigo-600 underline font-medium"
                          >
                            Tornar Padrão
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(status)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar Status"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === status.id}
                            onClick={() => handleDelete(status.id, status.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Excluir Status"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <StatusFormModal
        isOpen={isModalOpen}
        status={editingStatus}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
      />
    </div>
  );
};
