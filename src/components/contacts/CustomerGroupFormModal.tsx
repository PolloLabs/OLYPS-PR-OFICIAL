import React, { useState, useEffect } from 'react';
import { X, Layers, Check, DollarSign, FileText } from 'lucide-react';
import type {
  CustomerGroup,
  CreateCustomerGroupPayload,
  UpdateCustomerGroupPayload,
} from '../../types/index.js';

interface CustomerGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateCustomerGroupPayload | UpdateCustomerGroupPayload) => Promise<void>;
  groupToEdit: CustomerGroup | null;
  isSaving: boolean;
}

export const CustomerGroupFormModal: React.FC<CustomerGroupFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  groupToEdit,
  isSaving,
}) => {
  const isEditing = Boolean(groupToEdit);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [priceTable, setPriceTable] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name || '');
      setDescription(groupToEdit.description || '');
      setDiscountPercentage(String(groupToEdit.discountPercentage || 0));
      setPriceTable(groupToEdit.priceTable || '');
    } else {
      setName('');
      setDescription('');
      setDiscountPercentage('0');
      setPriceTable('');
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

    const discount = parseFloat(discountPercentage) || 0;
    if (discount < 0 || discount > 100) {
      setErrorMessage('O percentual de desconto deve estar entre 0% e 100%.');
      return;
    }

    const payload: CreateCustomerGroupPayload = {
      name: name.trim(),
      description: description.trim() || null,
      discountPercentage: discount,
      priceTable: priceTable.trim() || null,
    };

    try {
      await onSave(payload);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar grupo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        id="customer-group-form-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isEditing ? 'Editar Grupo de Clientes' : 'Novo Grupo de Clientes'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <span className="font-semibold">Erro:</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nome do Grupo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Atacado Especial, Varejo VIP, Revendedores..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Desconto Padrão Aplicado (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="0.0"
                  className="w-full pr-8 pl-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Desconto automático sugerido em orçamentos e pedidos para clientes deste grupo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tabela de Preços Associada
              </label>
              <input
                type="text"
                value={priceTable}
                onChange={(e) => setPriceTable(e.target.value)}
                placeholder="Ex: Tabela A - Distribuição, Tabela Balcão..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Descrição do Grupo
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Critérios de enquadramento comercial ou notas..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <span>Gravando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Grupo'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
