import React from 'react';
import { X, User, Building2, MapPin, Phone, Mail, DollarSign, FileText, Tag, ShieldCheck, Globe } from 'lucide-react';
import type { Customer } from '../../types/index.js';

interface CustomerDetailsModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !customer) return null;

  const isLegal = customer.personType === 'legal';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        id="customer-details-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              {isLegal ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">{customer.name}</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    customer.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : customer.status === 'blocked'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {customer.status === 'active'
                    ? 'Ativo'
                    : customer.status === 'blocked'
                    ? 'Bloqueado'
                    : 'Inativo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {isLegal ? 'Pessoa Jurídica' : 'Pessoa Física'} {customer.document ? `• ${customer.document}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Card: Dados Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {isLegal ? 'Razão Social' : 'Nome'}
              </span>
              <span className="text-xs font-medium text-slate-900">{customer.name}</span>
            </div>

            {isLegal && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Nome Fantasia
                </span>
                <span className="text-xs font-medium text-slate-900">{customer.tradeName || '—'}</span>
              </div>
            )}

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {isLegal ? 'CNPJ' : 'CPF'}
              </span>
              <span className="text-xs font-medium text-slate-900 font-mono">{customer.document || '—'}</span>
            </div>

            {isLegal && (
              <>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Inscrição Estadual
                  </span>
                  <span className="text-xs font-medium text-slate-900 font-mono">{customer.stateRegistration || '—'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Inscrição Municipal
                  </span>
                  <span className="text-xs font-medium text-slate-900 font-mono">{customer.municipalRegistration || '—'}</span>
                </div>
              </>
            )}

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Grupo de Clientes
              </span>
              <span className="text-xs font-medium text-indigo-700 font-semibold">
                {customer.customerGroupName || 'Geral (Sem grupo)'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Limite de Crédito
              </span>
              <span className="text-xs font-medium text-emerald-700 font-mono">
                {customer.creditLimit > 0
                  ? customer.creditLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : 'Ilimitado / Livre'}
              </span>
            </div>
          </div>

          {/* Card: Contato & Comunicação */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>Contatos & Comunicação</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>E-mail: <strong className="font-mono text-slate-900">{customer.email || 'Não informado'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Telefone: <strong className="font-mono text-slate-900">{customer.phone || 'Não informado'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Celular/WhatsApp: <strong className="font-mono text-slate-900">{customer.mobile || 'Não informado'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Contato: <strong className="text-slate-900">{customer.contactName || 'Não informado'}</strong></span>
              </div>
              {customer.website && (
                <div className="flex items-center space-x-2 text-slate-700 sm:col-span-2">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Site: <a href={customer.website} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-mono">{customer.website}</a></span>
                </div>
              )}
            </div>
          </div>

          {/* Card: Endereço */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Endereço de Faturamento e Entrega</span>
            </h3>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
              <p><strong>Logradouro:</strong> {customer.address || 'Não cadastrado'}</p>
              <p><strong>Bairro:</strong> {customer.neighborhood || '—'} &bull; <strong>Cidade/UF:</strong> {customer.city || '—'} / {customer.state || '—'}</p>
              <p><strong>CEP:</strong> {customer.postalCode || '—'} &bull; <strong>País:</strong> {customer.country || 'Brasil'}</p>
            </div>
          </div>

          {/* Card: Observações */}
          {customer.notes && (
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Observações e Histórico</span>
              </h3>
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-slate-700 whitespace-pre-wrap">
                {customer.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Cadastrado em {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
          </span>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Editar Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
