import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  Columns,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { DataTable } from '../ui/DataTable.js';
import { ActionButton } from '../ui/ActionButton.js';
import type { DataTableColumn } from '../../types/navigation.types.js';
import type {
  Warranty,
  WarrantyDurationUnit,
  CreateWarrantyPayload,
  UpdateWarrantyPayload,
} from '../../types/index.js';

interface WarrantiesViewProps {
  companyId: string;
  onShowNotification?: (type: 'success' | 'error', message: string) => void;
}

interface WarrantyRowItem extends Record<string, unknown> {
  id: string;
  nome: string;
  descricao: string;
  duracao: string;
  duracao_valor: number;
  duracao_unidade: WarrantyDurationUnit;
  raw: Warranty;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('olyps_auth_token') || '' : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const WarrantiesView: React.FC<WarrantiesViewProps> = ({
  companyId,
  onShowNotification,
}) => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Column visibility
  const [showColNome, setShowColNome] = useState<boolean>(true);
  const [showColDescricao, setShowColDescricao] = useState<boolean>(true);
  const [showColDuracao, setShowColDuracao] = useState<boolean>(true);
  const [isColVisOpen, setIsColVisOpen] = useState<boolean>(false);
  const colVisRef = useRef<HTMLDivElement>(null);

  // Add / Edit Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [formNome, setFormNome] = useState<string>('');
  const [formDescricao, setFormDescricao] = useState<string>('');
  const [formDuracaoValor, setFormDuracaoValor] = useState<number | ''>(30);
  const [formDuracaoUnidade, setFormDuracaoUnidade] = useState<WarrantyDurationUnit>('Dias');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingWarranty, setDeletingWarranty] = useState<Warranty | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Click outside for column visibility dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colVisRef.current && !colVisRef.current.contains(e.target as Node)) {
        setIsColVisOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch warranties with optional silent background sync
  const fetchWarranties = useCallback(
    async (silent = false) => {
      if (!companyId) return;
      if (!silent) {
        setIsLoading(true);
        setLoadError(null);
      }
      try {
        const res = await fetch(`/api/companies/${companyId}/warranties`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Falha ao carregar garantias.');
        }
        const data = await res.json();
        if (Array.isArray(data.data)) {
          setWarranties(data.data);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar lista de garantias.';
        if (!silent) {
          setLoadError(msg);
        }
        if (onShowNotification) {
          onShowNotification('error', msg);
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [companyId, onShowNotification]
  );

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingWarranty(null);
    setFormNome('');
    setFormDescricao('');
    setFormDuracaoValor(30);
    setFormDuracaoUnidade('Dias');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: WarrantyRowItem) => {
    const raw = item.raw;
    setEditingWarranty(raw);
    setFormNome(raw.nome || raw.name || '');
    setFormDescricao(raw.descricao || raw.description || '');
    setFormDuracaoValor(raw.duracao_valor ?? raw.durationValue ?? 30);
    const unit = (raw.duracao_unidade || raw.durationUnit || 'Dias') as WarrantyDurationUnit;
    setFormDuracaoUnidade(unit === 'Meses' ? 'Meses' : unit === 'Anos' ? 'Anos' : 'Dias');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (item: WarrantyRowItem) => {
    setDeletingWarranty(item.raw);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Submit Save (Create / Edit) with Try/Catch/Finally & Immediate Local Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNome = formNome.trim();
    if (!cleanNome) {
      const errMsg = 'O nome da garantia é obrigatório.';
      setFormError(errMsg);
      if (onShowNotification) {
        onShowNotification('error', errMsg);
      }
      return;
    }

    const val = Number(formDuracaoValor);
    if (isNaN(val) || val <= 0 || !Number.isInteger(val)) {
      const errMsg = 'A duração deve ser um valor numérico inteiro positivo.';
      setFormError(errMsg);
      if (onShowNotification) {
        onShowNotification('error', errMsg);
      }
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload: CreateWarrantyPayload | UpdateWarrantyPayload = {
      nome: cleanNome,
      name: cleanNome,
      descricao: formDescricao.trim() || null,
      description: formDescricao.trim() || null,
      duracao_valor: val,
      durationValue: val,
      duracao_unidade: formDuracaoUnidade,
      durationUnit: formDuracaoUnidade,
    };

    try {
      const url = editingWarranty
        ? `/api/companies/${companyId}/warranties/${editingWarranty.id}`
        : `/api/companies/${companyId}/warranties`;
      const method = editingWarranty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Falha ao salvar garantia.');
      }

      const resJson = await res.json().catch(() => null);
      const savedItem = (resJson?.data || null) as Warranty | null;

      // 1. Atualização IMEDIATA do estado local (sem precisar de F5)
      if (savedItem && savedItem.id) {
        setWarranties((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          if (editingWarranty) {
            return safePrev.map((w) => (w.id === savedItem.id ? savedItem : w));
          } else {
            return [savedItem, ...safePrev.filter((w) => w.id !== savedItem.id)];
          }
        });
      }

      // 2. Fechar modal e limpar campos somente após o sucesso garantido
      setIsFormModalOpen(false);
      setEditingWarranty(null);
      setFormNome('');
      setFormDescricao('');
      setFormDuracaoValor(30);
      setFormDuracaoUnidade('Dias');

      // 3. Notificação de sucesso
      if (onShowNotification) {
        onShowNotification(
          'success',
          editingWarranty
            ? `Garantia "${cleanNome}" atualizada com sucesso!`
            : `Garantia "${cleanNome}" cadastrada com sucesso!`
        );
      }

      // 4. Sincronização em background sem bloquear ou recarregar a tela
      fetchWarranties(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar requisição.';
      setFormError(msg);
      if (onShowNotification) {
        onShowNotification('error', msg);
      }
      // O modal PERMANECE ABERTO em caso de erro para não perder dados
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Delete with Try/Catch/Finally & Immediate Local Update
  const handleConfirmDelete = async () => {
    if (!deletingWarranty) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/companies/${companyId}/warranties/${deletingWarranty.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Falha ao excluir garantia.');
      }

      const deletedId = deletingWarranty.id;
      const deletedNome = deletingWarranty.nome || deletingWarranty.name;

      // 1. Atualização IMEDIATA do estado local
      setWarranties((prev) =>
        Array.isArray(prev) ? prev.filter((w) => w.id !== deletedId) : []
      );

      // 2. Fechar modal
      setIsDeleteModalOpen(false);
      setDeletingWarranty(null);

      // 3. Notificação de sucesso
      if (onShowNotification) {
        onShowNotification(
          'success',
          `Garantia "${deletedNome}" excluída com sucesso!`
        );
      }

      // 4. Sincronização em background
      fetchWarranties(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir garantia.';
      setDeleteError(msg);
      if (onShowNotification) {
        onShowNotification('error', msg);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Format data for DataTable defensively against null/undefined
  const tableData: WarrantyRowItem[] = useMemo(() => {
    if (!Array.isArray(warranties)) return [];
    return warranties
      .filter((w): w is Warranty => Boolean(w && typeof w === 'object' && w.id))
      .map((w) => {
        const nome = String(w.nome || w.name || '');
        const descricao = String(w.descricao || w.description || '');
        const duracaoValor = Number(w.duracao_valor ?? w.durationValue ?? 0);
        const duracaoUnidade = (w.duracao_unidade || w.durationUnit || 'Dias') as WarrantyDurationUnit;
        return {
          id: String(w.id),
          nome,
          descricao,
          duracao: `${duracaoValor} ${duracaoUnidade}`,
          duracao_valor: duracaoValor,
          duracao_unidade: duracaoUnidade,
          raw: w,
        };
      });
  }, [warranties]);

  // Define Columns
  const allColumns: DataTableColumn<WarrantyRowItem>[] = useMemo(() => {
    const cols: DataTableColumn<WarrantyRowItem>[] = [];

    if (showColNome) {
      cols.push({
        key: 'nome',
        header: 'Nome',
        sortable: true,
        accessor: (row) => (
          <span className="font-semibold text-slate-800">{row.nome}</span>
        ),
      });
    }

    if (showColDescricao) {
      cols.push({
        key: 'descricao',
        header: 'Descrição',
        sortable: true,
        accessor: (row) => (
          <span className="text-slate-600 truncate max-w-sm block">
            {row.descricao || <span className="text-slate-400 italic">Sem descrição</span>}
          </span>
        ),
      });
    }

    if (showColDuracao) {
      cols.push({
        key: 'duracao',
        header: 'Duração',
        sortable: true,
        accessor: (row) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            {row.duracao}
          </span>
        ),
      });
    }

    return cols;
  }, [showColNome, showColDescricao, showColDuracao]);

  return (
    <div className="space-y-5">
      {/* 1. Page Header (OLYPS PRO Standard) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-600 inline-block" />
            Garantias
          </h1>
          <span className="text-sm text-slate-500 font-normal">
            Prazos e termos de garantia por tipo de produto
          </span>
        </div>
        {/* Blue horizontal divider line */}
        <div className="h-1 w-full bg-blue-600 rounded-full mt-3" />
      </div>

      {/* 2. Main Card Container with DataTable */}
      <DataTable<WarrantyRowItem>
        id="warranties-data-table"
        title="Todas as garantias"
        columns={allColumns}
        data={tableData}
        loading={isLoading}
        error={loadError}
        onRetry={fetchWarranties}
        onCreate={handleOpenCreate}
        createButtonLabel="+ Adicionar"
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        emptyMessage="Não há garantias cadastradas."
        emptyCreateLabel="+ Adicionar primeira garantia"
        filtersSlot={
          <div className="relative" ref={colVisRef}>
            <button
              type="button"
              onClick={() => setIsColVisOpen((prev) => !prev)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              title="Visibilidade da coluna"
              aria-expanded={isColVisOpen}
            >
              <Columns className="w-3.5 h-3.5 text-slate-500" />
              <span>Visibilidade da coluna</span>
            </button>

            {isColVisOpen && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1.5 animate-fadeIn">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Exibir Colunas
                </div>
                <button
                  type="button"
                  onClick={() => setShowColNome((prev) => !prev)}
                  className="w-full px-3 py-1.5 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Nome</span>
                  {showColNome && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowColDescricao((prev) => !prev)}
                  className="w-full px-3 py-1.5 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Descrição</span>
                  {showColDescricao && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowColDuracao((prev) => !prev)}
                  className="w-full px-3 py-1.5 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Duração</span>
                  {showColDuracao && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* 3. Modal: Add / Edit Warranty */}
      {isFormModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                {editingWarranty ? 'Editar garantia' : 'Adicionar garantia'}
              </h3>
              <button
                type="button"
                onClick={() => !isSaving && setIsFormModalOpen(false)}
                disabled={isSaving}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex.: Pelicula, Bateria, Tela, Padrão"
                  disabled={isSaving}
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Duração: Valor + Unidade */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duração <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formDuracaoValor}
                      onChange={(e) =>
                        setFormDuracaoValor(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="30"
                      disabled={isSaving}
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <select
                      value={formDuracaoUnidade}
                      onChange={(e) =>
                        setFormDuracaoUnidade(e.target.value as WarrantyDurationUnit)
                      }
                      disabled={isSaving}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="Dias">Dias</option>
                      <option value="Meses">Meses</option>
                      <option value="Anos">Anos</option>
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Será exibido como "{formDuracaoValor || 0} {formDuracaoUnidade}" nos produtos.
                </p>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Termos e condições da garantia (ex.: cobre defeitos de fábrica, não cobre queda ou água)"
                  rows={3}
                  disabled={isSaving}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <ActionButton
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </ActionButton>
                <ActionButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : editingWarranty ? 'Salvar Alterações' : 'Cadastrar'}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Confirm Delete */}
      {isDeleteModalOpen && deletingWarranty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2.5 text-rose-700">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Excluir Garantia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {deleteError ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Não é possível excluir:</p>
                    <p className="mt-0.5">{deleteError}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tem certeza que deseja excluir a garantia{' '}
                  <strong className="text-slate-900">
                    "{deletingWarranty.nome || deletingWarranty.name}"
                  </strong>
                  ? Esta ação é irreversível.
                </p>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-2">
              <ActionButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                {deleteError ? 'Fechar' : 'Cancelar'}
              </ActionButton>
              {!deleteError && (
                <ActionButton
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmDelete}
                  isLoading={isDeleting}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
