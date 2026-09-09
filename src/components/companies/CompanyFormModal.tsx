import React, { useState, useEffect } from 'react';
import { X, Building2, Save, AlertCircle } from 'lucide-react';
import type { CompanyRecord, CreateCompanyPayload, UpdateCompanyPayload } from '../../types/index.js';

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateCompanyPayload | UpdateCompanyPayload) => Promise<void>;
  companyToEdit?: CompanyRecord | null;
  isSaving: boolean;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  companyToEdit,
  isSaving,
}) => {
  const isEditing = Boolean(companyToEdit);

  const [formData, setFormData] = useState<CreateCompanyPayload>({
    name: '',
    legalName: '',
    document: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Brasil',
    postalCode: '',
    stateRegistration: '',
    taxRegime: 'simples_nacional',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    status: 'active',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (companyToEdit) {
      setFormData({
        name: companyToEdit.name || '',
        legalName: companyToEdit.legalName || '',
        document: companyToEdit.document || '',
        slug: companyToEdit.slug || '',
        email: companyToEdit.email || '',
        phone: companyToEdit.phone || '',
        address: companyToEdit.address || '',
        city: companyToEdit.city || '',
        state: companyToEdit.state || '',
        country: companyToEdit.country || 'Brasil',
        postalCode: companyToEdit.postalCode || '',
        stateRegistration: companyToEdit.stateRegistration || '',
        taxRegime: companyToEdit.taxRegime || 'simples_nacional',
        currency: companyToEdit.currency || 'BRL',
        timezone: companyToEdit.timezone || 'America/Sao_Paulo',
        status: companyToEdit.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        legalName: '',
        document: '',
        slug: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'Brasil',
        postalCode: '',
        stateRegistration: '',
        taxRegime: 'simples_nacional',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        status: 'active',
      });
    }
    setValidationError(null);
  }, [companyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setFormData((prev) => {
      const autoSlug = !isEditing && (!prev.slug || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]/g, '-'))
        ? name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
        : prev.slug;
      return { ...prev, name, slug: autoSlug };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setValidationError('O Nome Fantasia é obrigatório.');
      return;
    }
    setValidationError(null);
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="company-form-modal"
        className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? `Editar Empresa: ${companyToEdit?.name}` : 'Cadastrar Nova Empresa'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Atualize os dados cadastrais, contatos e regime fiscal da empresa'
                  : 'Preencha as informações para registrar uma nova instância / tenant'}
              </p>
            </div>
          </div>
          <button
            id="close-company-form-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-6">
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center space-x-2 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
                Identificação da Empresa
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Fantasia <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="company-name-input"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Farmácia Central"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="company-legal-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Razão Social
                  </label>
                  <input
                    id="company-legal-name-input"
                    type="text"
                    value={formData.legalName || ''}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="Ex: Farmácia Central Ltda"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="company-document-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    CNPJ / CPF
                  </label>
                  <input
                    id="company-document-input"
                    type="text"
                    value={formData.document || ''}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="company-slug-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Slug / Identificador de Domínio <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="company-slug-input"
                    type="text"
                    required
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="farmacia-central"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
                Contatos & Comunicação
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Principal
                  </label>
                  <input
                    id="company-email-input"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com.br"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="company-phone-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    id="company-phone-input"
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
                Endereço & Localização
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="company-address-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Logradouro e Número
                  </label>
                  <input
                    id="company-address-input"
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Av. Paulista, 1000, Sala 101"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="company-postal-code-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    CEP
                  </label>
                  <input
                    id="company-postal-code-input"
                    type="text"
                    value={formData.postalCode || ''}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="01310-100"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="company-city-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    id="company-city-input"
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="company-state-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    id="company-state-input"
                    type="text"
                    maxLength={2}
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full px-3 py-2 text-sm uppercase bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="company-country-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    País
                  </label>
                  <input
                    id="company-country-input"
                    type="text"
                    value={formData.country || 'Brasil'}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Brasil"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Fiscal & Status */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
                Regime Fiscal & Configurações
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="company-state-reg-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Inscrição Estadual
                  </label>
                  <input
                    id="company-state-reg-input"
                    type="text"
                    value={formData.stateRegistration || ''}
                    onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
                    placeholder="Ex: 123.456.789.000 ou ISENTO"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="company-tax-regime-select" className="block text-xs font-semibold text-slate-700 mb-1">
                    Regime Tributário
                  </label>
                  <select
                    id="company-tax-regime-select"
                    value={formData.taxRegime || 'simples_nacional'}
                    onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="simples_nacional">Simples Nacional</option>
                    <option value="lucro_presumido">Lucro Presumido</option>
                    <option value="lucro_real">Lucro Real</option>
                    <option value="mei">MEI (Microempreendedor Individual)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="company-status-select" className="block text-xs font-semibold text-slate-700 mb-1">
                    Status da Empresa
                  </label>
                  <select
                    id="company-status-select"
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' | 'pending' })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Ativa</option>
                    <option value="pending">Pendente</option>
                    <option value="suspended">Suspensa</option>
                    <option value="inactive">Inativa</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
            <button
              id="btn-cancel-company-form"
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-company-form"
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
                  <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Empresa'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
