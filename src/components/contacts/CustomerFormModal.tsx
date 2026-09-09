import React, { useState, useEffect } from 'react';
import { X, User, Building2, MapPin, Phone, Mail, DollarSign, FileText, Check } from 'lucide-react';
import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CustomerGroup,
  PersonType,
  ContactStatus,
} from '../../types/index.js';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateCustomerPayload | UpdateCustomerPayload) => Promise<void>;
  customerToEdit: Customer | null;
  groups: CustomerGroup[];
  isSaving: boolean;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerToEdit,
  groups,
  isSaving,
}) => {
  const isEditing = Boolean(customerToEdit);

  const [personType, setPersonType] = useState<PersonType>('legal');
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [municipalRegistration, setMunicipalRegistration] = useState('');
  const [customerGroupId, setCustomerGroupId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [creditLimit, setCreditLimit] = useState('0');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ContactStatus>('active');

  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'address' | 'financial'>('general');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (customerToEdit) {
      setPersonType(customerToEdit.personType || 'legal');
      setName(customerToEdit.name || '');
      setTradeName(customerToEdit.tradeName || '');
      setDocument(customerToEdit.document || '');
      setStateRegistration(customerToEdit.stateRegistration || '');
      setMunicipalRegistration(customerToEdit.municipalRegistration || '');
      setCustomerGroupId(customerToEdit.customerGroupId || '');
      setEmail(customerToEdit.email || '');
      setPhone(customerToEdit.phone || '');
      setMobile(customerToEdit.mobile || '');
      setWebsite(customerToEdit.website || '');
      setContactName(customerToEdit.contactName || '');
      setAddress(customerToEdit.address || '');
      setNeighborhood(customerToEdit.neighborhood || '');
      setCity(customerToEdit.city || '');
      setState(customerToEdit.state || '');
      setPostalCode(customerToEdit.postalCode || '');
      setCountry(customerToEdit.country || 'Brasil');
      setCreditLimit(String(customerToEdit.creditLimit || 0));
      setNotes(customerToEdit.notes || '');
      setStatus(customerToEdit.status || 'active');
    } else {
      setPersonType('legal');
      setName('');
      setTradeName('');
      setDocument('');
      setStateRegistration('');
      setMunicipalRegistration('');
      setCustomerGroupId('');
      setEmail('');
      setPhone('');
      setMobile('');
      setWebsite('');
      setContactName('');
      setAddress('');
      setNeighborhood('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry('Brasil');
      setCreditLimit('0');
      setNotes('');
      setStatus('active');
    }
    setActiveTab('general');
    setErrorMessage(null);
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('O Nome / Razão Social do cliente é obrigatório.');
      setActiveTab('general');
      return;
    }

    const payload: CreateCustomerPayload = {
      personType,
      name: name.trim(),
      tradeName: tradeName.trim() || null,
      document: document.trim() || null,
      stateRegistration: stateRegistration.trim() || null,
      municipalRegistration: municipalRegistration.trim() || null,
      customerGroupId: customerGroupId || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      mobile: mobile.trim() || null,
      website: website.trim() || null,
      contactName: contactName.trim() || null,
      address: address.trim() || null,
      neighborhood: neighborhood.trim() || null,
      city: city.trim() || null,
      state: state.trim().toUpperCase() || null,
      postalCode: postalCode.trim() || null,
      country: country.trim() || 'Brasil',
      creditLimit: parseFloat(creditLimit) || 0,
      notes: notes.trim() || null,
      status,
    };

    try {
      await onSave(payload);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar cliente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        id="customer-form-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Atualize os dados cadastrais, fiscais e de contato do cliente'
                : 'Cadastre um novo cliente pessoa física ou jurídica'}
            </p>
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

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Dados Gerais</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'contact'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contato</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'address'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Endereço</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'financial'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Financeiro & Notas</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <span className="font-semibold">Erro:</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                {/* Person Type Toggle */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Tipo de Pessoa
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <button
                      type="button"
                      onClick={() => setPersonType('legal')}
                      className={`flex items-center justify-center space-x-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        personType === 'legal'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Pessoa Jurídica (PJ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersonType('individual')}
                      className={`flex items-center justify-center space-x-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        personType === 'individual'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Pessoa Física (PF)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {personType === 'legal' ? 'Razão Social *' : 'Nome Completo *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={personType === 'legal' ? 'Ex: Indústria e Comércio Silva Ltda' : 'Ex: João da Silva'}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {personType === 'legal' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nome Fantasia
                      </label>
                      <input
                        type="text"
                        value={tradeName}
                        onChange={(e) => setTradeName(e.target.value)}
                        placeholder="Ex: Comercial Silva"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {personType === 'legal' ? 'CNPJ' : 'CPF'}
                    </label>
                    <input
                      type="text"
                      value={document}
                      onChange={(e) => setDocument(e.target.value)}
                      placeholder={personType === 'legal' ? '00.000.000/0000-00' : '000.000.000-00'}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {personType === 'legal' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Inscrição Estadual (IE)
                        </label>
                        <input
                          type="text"
                          value={stateRegistration}
                          onChange={(e) => setStateRegistration(e.target.value)}
                          placeholder="Ex: 123.456.789.000 ou ISENTO"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Inscrição Municipal (IM)
                        </label>
                        <input
                          type="text"
                          value={municipalRegistration}
                          onChange={(e) => setMunicipalRegistration(e.target.value)}
                          placeholder="Ex: 98765432"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Grupo de Clientes
                    </label>
                    <select
                      value={customerGroupId}
                      onChange={(e) => setCustomerGroupId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">Nenhum grupo vinculado</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} {g.discountPercentage > 0 ? `(${g.discountPercentage}% desc.)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Status Cadastral
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ContactStatus)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium"
                    >
                      <option value="active">Ativo (Permite Vendas/Operações)</option>
                      <option value="inactive">Inativo (Desativado)</option>
                      <option value="blocked">Bloqueado (Inadimplência/Restrição)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CONTACT */}
            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    E-mail Principal
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@empresa.com.br"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome do Contato / Responsável
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Carlos Oliveira (Comprador)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Telefone Fixo
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 3333-0000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.cliente.com.br"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB: ADDRESS */}
            {activeTab === 'address' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="00000-000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Logradouro e Número
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Paulista, 1000, Conjunto 50"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bela Vista"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    UF / Estado
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="SP"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono uppercase"
                  />
                </div>
              </div>
            )}

            {/* TAB: FINANCIAL & NOTES */}
            {activeTab === 'financial' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Limite de Crédito Disponível (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-500">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      0.00 = sem limite estipulado ou sob liberação manual.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Observações e Notas Internas
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informações adicionais, histórico comercial ou restrições de entrega..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              * Campos obrigatórios para validação
            </div>
            <div className="flex items-center space-x-3">
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
                    <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
