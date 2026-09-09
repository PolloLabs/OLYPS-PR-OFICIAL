import React, { useState, useEffect } from 'react';
import { X, Users, AlertCircle, Loader2, Percent } from 'lucide-react';
import type {
  CustomerGroup,
  CreateCustomerGroupPayload,
  UpdateCustomerGroupPayload,
  CustomerGroupStatus,
} from '../../types/contact.types.js';

interface CustomerGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateCustomerGroupPayload | UpdateCustomerGroupPayload) => Promise<any>;
  groupToEdit?: CustomerGroup | null;
}

export const CustomerGroupFormModal: React.FC<CustomerGroupFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  groupToEdit,
}) => {
  const isEditing = Boolean(groupToEdit);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [priceTable, setPriceTable] = useState('');
  const [status, setStatus] = useState<CustomerGroupStatus>('active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name || '');
      setDescription(groupToEdit.description || '');
      setDiscountPercentage(groupToEdit.discountPercentage || 0);
      setPriceTable(groupToEdit.priceTable || '');
      setStatus(groupToEdit.status || 'active');
    } else {
      setName('');
      setDescription('');
      setDiscountPercentage(0);
      setPriceTable('');
      setStatus('active');
    }
    setErrorMessage(null);
  }, [groupToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('O nome do grupo de clientes é obrigatório.');
      return;
    }

    const payload: CreateCustomerGroupPayload = {
      name: name.trim(),
      description: description.trim() || null,
      discountPercentage: Number(discountPercentage) || 0,
      priceTable: priceTable.trim() || null,
      status,
    };

    setIsSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar grupo de clientes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        id="customer-group-form-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Editar Grupo de Clientes' : 'Novo Grupo de Clientes'}
              </h2>
              <p className="text-xs text-slate-500">
                Defina tabelas de preço, descontos automáticos e classificação
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erro no formulário</p>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nome do Grupo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Clientes VIP, Revendedores, Atacado"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              id="group-input-name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Desconto Automático (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  id="group-input-discount"
                />
                <Percent className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tabela de Preço
              </label>
              <input
                type="text"
                value={priceTable}
                onChange={(e) => setPriceTable(e.target.value)}
                placeholder="Ex: Tabela Atacado"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Descrição do Grupo
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aplicável a parceiros cadastrados com compras mensais superiores a R$ 5.000..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CustomerGroupStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-xs shadow-indigo-600/20"
              id="submit-group-form-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                'Salvar Alterações'
              ) : (
                'Criar Grupo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerGroupFormModal;
