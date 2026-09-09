import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, User, Phone, ShieldCheck, AlertTriangle, Check, Shield } from 'lucide-react';
import type { InviteCompanyUserPayload, CompanyUsersQuota, CompanyRole } from '../../../types/index.js';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: InviteCompanyUserPayload) => Promise<void>;
  isSaving: boolean;
  quota?: CompanyUsersQuota;
}

const ROLE_OPTIONS: Array<{
  role: CompanyRole;
  label: string;
  badge: string;
  description: string;
}> = [
  {
    role: 'company_admin',
    label: 'Administrador da Empresa',
    badge: 'Acesso Total',
    description: 'Gestão completa da empresa, configurações, filiais, usuários e relatórios.',
  },
  {
    role: 'manager',
    label: 'Gerente Operacional',
    badge: 'Gestão',
    description: 'Supervisão de equipes, autorização de descontos, compras e acompanhamento de metas.',
  },
  {
    role: 'seller',
    label: 'Vendedor Comercial',
    badge: 'Comercial',
    description: 'Emissão de vendas, propostas, pedidos e consulta ao catálogo de produtos.',
  },
  {
    role: 'cashier',
    label: 'Operador de Caixa',
    badge: 'Financeiro PDV',
    description: 'Frente de caixa (PDV), recebimentos, abertura/fechamento de turno e emissão fiscal.',
  },
  {
    role: 'technician',
    label: 'Técnico Especialista',
    badge: 'Serviços',
    description: 'Abertura, laudos, execução e encerramento de ordens de serviço e manutenções.',
  },
  {
    role: 'stock_manager',
    label: 'Estoquista / Almoxarife',
    badge: 'Logística',
    description: 'Entrada de notas fiscais, conferência física, transferências e inventários.',
  },
];

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
  quota,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<CompanyRole>('seller');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPhone('');
      setRole('seller');
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('O e-mail do colaborador é obrigatório.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Informe um formato de e-mail válido (ex: colaborador@empresa.com.br).');
      return;
    }

    if (quota && quota.isLimitReached) {
      setErrorMessage(
        `O limite de ${quota.maxLimit} usuários do plano ${quota.planName} foi atingido. Faça upgrade para adicionar mais colaboradores.`
      );
      return;
    }

    try {
      await onSave({
        email: trimmedEmail,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        role,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao cadastrar usuário.');
    }
  };

  return (
    <div
      id="add-user-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="add-user-modal-content"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Convidar / Adicionar Usuário
              </h2>
              <p className="text-xs text-slate-500">
                Vincule um novo colaborador à empresa e defina suas permissões no RBAC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota Banner */}
        {quota && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
              quota.isLimitReached
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : quota.remainingSlots <= 2
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-indigo-50/60 border-indigo-100 text-indigo-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 shrink-0 text-indigo-600" />
              <span>
                <strong>Plano {quota.planName}:</strong> {quota.activeCount} de {quota.maxLimit} usuários ativos ocupados ({quota.remainingSlots} {quota.remainingSlots === 1 ? 'vaga restante' : 'vagas restantes'})
              </span>
            </div>
            {quota.isLimitReached && (
              <span className="font-semibold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[11px]">
                Limite Atingido
              </span>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* E-mail */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Corporativo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo: colaborador@empresa.com.br"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                O usuário receberá o acesso vinculado a este e-mail no contexto desta empresa.
              </p>
            </div>

            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Colaborador
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="exemplo: Carlos Eduardo Silva"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Telefone / WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>Papel e Nível de Acesso (RBAC) <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-slate-400 font-normal">Selecione a atribuição do usuário</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {ROLE_OPTIONS.map((item) => {
                const isSelected = role === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setRole(item.role)}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <ShieldCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || (quota?.isLimitReached ?? false)}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            {isSaving ? (
              <span>Salvando...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Adicionar Colaborador</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
