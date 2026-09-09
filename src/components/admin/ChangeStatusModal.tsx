import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import type { CompanyRecord, CompanyStatus } from '../../types/index.js';

interface ChangeStatusModalProps {
  company: CompanyRecord | null;
  isOpen: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onConfirm: (companyId: string, newStatus: CompanyStatus) => Promise<void>;
}

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  company,
  isOpen,
  isUpdating,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !company) return null;

  const [selectedStatus, setSelectedStatus] = useState<CompanyStatus>(company.status);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusOptions: Array<{ value: CompanyStatus; label: string; description: string }> = [
    {
      value: 'active',
      label: 'Ativa',
      description: 'Empresa operacional. Acesso liberado aos membros ativos.',
    },
    {
      value: 'suspended',
      label: 'Suspensa',
      description: 'Acesso bloqueado temporariamente para todos os usuários desta empresa.',
    },
    {
      value: 'pending',
      label: 'Pendente',
      description: 'Empresa em análise de cadastro ou validação de documentação.',
    },
    {
      value: 'inactive',
      label: 'Inativa',
      description: 'Empresa desativada permanentemente ou bloqueada administrativamente.',
    },
  ];

  const handleConfirm = async () => {
    try {
      setErrorMessage(null);
      await onConfirm(company.id, selectedStatus);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao alterar status da empresa.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="change-status-modal-container"
        className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Alterar Status da Empresa
            </h3>
          </div>
          <button
            id="close-status-modal-btn"
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <span className="text-xs text-slate-500 block">Empresa Selecionada</span>
            <strong className="text-sm font-semibold text-slate-900 block">{company.name}</strong>
            <span className="text-xs font-mono text-slate-500">{company.slug}</span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Selecione o Novo Status:
            </label>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedStatus === option.value
                      ? 'border-slate-900 bg-slate-50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="company_status_radio"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={() => setSelectedStatus(option.value)}
                    className="mt-0.5 text-slate-900 focus:ring-slate-900 border-slate-300"
                  />
                  <div className="ml-3">
                    <span className="text-xs font-bold text-slate-900 block">{option.label}</span>
                    <span className="text-[11px] text-slate-500 leading-snug block">
                      {option.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
          <button
            id="btn-cancel-change-status"
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-change-status"
            type="button"
            onClick={handleConfirm}
            disabled={isUpdating || selectedStatus === company.status}
            className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                <span>Atualizando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                <span>Confirmar Alteração</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
