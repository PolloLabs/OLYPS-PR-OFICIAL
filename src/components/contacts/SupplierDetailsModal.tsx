import React from 'react';
import { X, Truck, Building2, User, MapPin, Phone, Mail, FileText, Globe, Landmark, CreditCard } from 'lucide-react';
import type { Supplier } from '../../types/index.js';

interface SupplierDetailsModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (supplier: Supplier) => void;
}

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({
  supplier,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !supplier) return null;

  const isLegal = supplier.personType === 'legal';
  const bank = supplier.bankInfo || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        id="supplier-details-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">{supplier.name}</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    supplier.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : supplier.status === 'blocked'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {supplier.status === 'active'
                    ? 'Ativo'
                    : supplier.status === 'blocked'
                    ? 'Bloqueado'
                    : 'Inativo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {isLegal ? 'Pessoa Jurídica' : 'Pessoa Física'} {supplier.document ? `• ${supplier.document}` : ''}
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
              <span className="text-xs font-medium text-slate-900">{supplier.name}</span>
            </div>

            {isLegal && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Nome Fantasia
                </span>
                <span className="text-xs font-medium text-slate-900">{supplier.tradeName || '—'}</span>
              </div>
            )}

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {isLegal ? 'CNPJ' : 'CPF'}
              </span>
              <span className="text-xs font-medium text-slate-900 font-mono">{supplier.document || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Categoria
              </span>
              <span className="text-xs font-medium text-indigo-700">
                {supplier.category || 'Geral'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Inscrição Estadual
              </span>
              <span className="text-xs font-medium text-slate-900 font-mono">{supplier.stateRegistration || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Condições de Pagamento
              </span>
              <span className="text-xs font-medium text-slate-900">{supplier.paymentTerms || 'Padrão / A Combinar'}</span>
            </div>
          </div>

          {/* Card: Contatos */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>Contatos Comerciais</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>E-mail: <strong className="font-mono text-slate-900">{supplier.email || 'Não informado'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Telefone: <strong className="font-mono text-slate-900">{supplier.phone || 'Não informado'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Celular: <strong className="font-mono text-slate-900">{supplier.mobile || 'Não informado'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Contato: <strong className="text-slate-900">{supplier.contactName || 'Não informado'}</strong></span>
              </div>
              {supplier.website && (
                <div className="flex items-center space-x-2 text-slate-700 sm:col-span-2">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Site: <a href={supplier.website} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-mono">{supplier.website}</a></span>
                </div>
              )}
            </div>
          </div>

          {/* Card: Dados Bancários & PIX */}
          {(bank.bankName || bank.agency || bank.accountNumber || bank.pixKey) && (
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <Landmark className="w-4 h-4 text-indigo-600" />
                <span>Dados Bancários & PIX para Faturamento</span>
              </h3>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 grid grid-cols-2 gap-3">
                {bank.bankName && <div><strong>Banco:</strong> {bank.bankName}</div>}
                {bank.agency && <div><strong>Agência:</strong> {bank.agency}</div>}
                {bank.accountNumber && <div><strong>Conta Corrente:</strong> {bank.accountNumber}</div>}
                {bank.pixKey && <div className="col-span-2"><strong>Chave PIX:</strong> <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900">{bank.pixKey}</span></div>}
              </div>
            </div>
          )}

          {/* Card: Endereço */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Localização e Expedição</span>
            </h3>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
              <p><strong>Logradouro:</strong> {supplier.address || 'Não cadastrado'}</p>
              <p><strong>Bairro:</strong> {supplier.neighborhood || '—'} &bull; <strong>Cidade/UF:</strong> {supplier.city || '—'} / {supplier.state || '—'}</p>
              <p><strong>CEP:</strong> {supplier.postalCode || '—'} &bull; <strong>País:</strong> {supplier.country || 'Brasil'}</p>
            </div>
          </div>

          {/* Card: Observações */}
          {supplier.notes && (
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Observações e Acordos Comerciais</span>
              </h3>
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-slate-700 whitespace-pre-wrap">
                {supplier.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Cadastrado em {new Date(supplier.createdAt).toLocaleDateString('pt-BR')}
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
                onEdit(supplier);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Editar Fornecedor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
