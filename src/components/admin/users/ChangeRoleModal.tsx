import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, AlertTriangle, Shield } from 'lucide-react';
import type { CompanyUserMember, CompanyRole } from '../../../types/index.js';

interface ChangeRoleModalProps {
  user: CompanyUserMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, newRole: CompanyRole) => Promise<void>;
  isSaving: boolean;
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

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  isSaving,
}) => {
  const [selectedRole, setSelectedRole] = useState<CompanyRole>('seller');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setSelectedRole(user.role);
      setErrorMessage(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedRole === user.role) {
      onClose();
      return;
    }

    try {
      await onSave(user.id, selectedRole);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao atualizar papel do usuário.');
    }
  };

  return (
    <div
      id="change-role-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="change-role-modal-content"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Alterar Papel / Permissões
              </h2>
              <p className="text-xs text-slate-500">
                Redefina o nível de autorização de <strong>{user.name}</strong> ({user.email})
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

        {/* Current User Card */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Papel Atual:</span>
            <span className="font-semibold text-slate-900">{user.roleName || user.role}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {user.status === 'active' ? 'Ativo' : 'Suspenso'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            {ROLE_OPTIONS.map((item) => {
              const isSelected = selectedRole === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setSelectedRole(item.role)}
                  className={`w-full p-3 rounded-lg border text-left transition-all flex items-start justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-slate-900">{item.label}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-1 shrink-0">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </button>
              );
            })}
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
            disabled={isSaving || selectedRole === user.role}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            {isSaving ? (
              <span>Salvando...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar Novo Papel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
