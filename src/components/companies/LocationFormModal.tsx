import React, { useState, useEffect } from 'react';
import { X, MapPin, Save, AlertCircle } from 'lucide-react';
import type { CommercialLocation, CreateLocationPayload, UpdateLocationPayload } from '../../types/index.js';

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateLocationPayload | UpdateLocationPayload) => Promise<void>;
  locationToEdit?: CommercialLocation | null;
  isSaving: boolean;
}

export const LocationFormModal: React.FC<LocationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  locationToEdit,
  isSaving,
}) => {
  const isEditing = Boolean(locationToEdit);

  const [formData, setFormData] = useState<CreateLocationPayload>({
    name: '',
    code: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    isMain: false,
    status: 'active',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (locationToEdit) {
      setFormData({
        name: locationToEdit.name || '',
        code: locationToEdit.code || '',
        document: locationToEdit.document || '',
        email: locationToEdit.email || '',
        phone: locationToEdit.phone || '',
        address: locationToEdit.address || '',
        city: locationToEdit.city || '',
        state: locationToEdit.state || '',
        postalCode: locationToEdit.postalCode || '',
        isMain: Boolean(locationToEdit.isMain),
        status: locationToEdit.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        document: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        isMain: false,
        status: 'active',
      });
    }
    setValidationError(null);
  }, [locationToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setValidationError('O Nome do Local Comercial é obrigatório.');
      return;
    }
    setValidationError(null);
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="location-form-modal"
        className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? `Editar Local: ${locationToEdit?.name}` : 'Cadastrar Local Comercial'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Atualize as informações do ponto comercial ou filial'
                  : 'Adicione um novo local de atendimento, matriz, filial ou ponto de venda'}
              </p>
            </div>
          </div>
          <button
            id="close-location-form-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5">
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center space-x-2 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Basic Identification */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="loc-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Local / Identificação <span className="text-rose-500">*</span>
                </label>
                <input
                  id="loc-name-input"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Filial Shopping, Matriz Centro"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="loc-code-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Código Interno
                </label>
                <input
                  id="loc-code-input"
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: LOC-01, MATRIZ"
                  className="w-full px-3 py-2 text-sm uppercase font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Document and Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="loc-document-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  CNPJ Específico (se houver)
                </label>
                <input
                  id="loc-document-input"
                  type="text"
                  value={formData.document || ''}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  placeholder="00.000.000/0002-00"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="loc-phone-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone de Contato
                </label>
                <input
                  id="loc-phone-input"
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 3333-4444"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="loc-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail do Local
                </label>
                <input
                  id="loc-email-input"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="filial@empresa.com"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
                Endereço do Local
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="loc-address-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Logradouro / Bairro
                  </label>
                  <input
                    id="loc-address-input"
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua das Flores, 123"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="loc-postal-code-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    CEP
                  </label>
                  <input
                    id="loc-postal-code-input"
                    type="text"
                    value={formData.postalCode || ''}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="01001-000"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="loc-city-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    id="loc-city-input"
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="loc-state-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    id="loc-state-input"
                    type="text"
                    maxLength={2}
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full px-3 py-2 text-sm uppercase bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="loc-status-select" className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Operacional
                  </label>
                  <select
                    id="loc-status-select"
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Is Main Location Toggle */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center space-x-3">
              <input
                id="loc-is-main-checkbox"
                type="checkbox"
                checked={formData.isMain}
                onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="loc-is-main-checkbox" className="text-xs text-slate-700 font-medium cursor-pointer">
                <span className="font-semibold text-slate-900 block">Definir como Local Matriz / Ponto Principal</span>
                <span className="text-slate-500">Este ponto de atendimento será a referência principal da empresa.</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
            <button
              id="btn-cancel-location-form"
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-location-form"
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  <span>{isEditing ? 'Salvar Local' : 'Criar Local Comercial'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
