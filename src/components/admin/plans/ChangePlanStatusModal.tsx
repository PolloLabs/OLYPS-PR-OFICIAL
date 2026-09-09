import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import type { SubscriptionPlan, PlanStatus } from '../../../types/index.js';

interface ChangePlanStatusModalProps {
  plan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (planId: string, newStatus: PlanStatus) => Promise<void>;
  isUpdating: boolean;
}

export const ChangePlanStatusModal: React.FC<ChangePlanStatusModalProps> = ({
  plan,
  isOpen,
  onClose,
  onConfirm,
  isUpdating,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PlanStatus>('active');

  React.useEffect(() => {
    if (plan) {
      setSelectedStatus(plan.status);
    }
  }, [plan]);

  if (!isOpen || !plan) return null;

  const handleConfirm = async () => {
    await onConfirm(plan.id, selectedStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2 text-slate-800">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold">Alterar Status do Plano</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <p>
              Plano selecionado: <strong className="text-slate-900">{plan.name}</strong> ({plan.code})
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Status atual: <span className="font-semibold uppercase">{plan.status}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Novo Status Operacional
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStatus === 'active'
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="planStatus"
                  value="active"
                  checked={selectedStatus === 'active'}
                  onChange={() => setSelectedStatus('active')}
                  className="w-4 h-4 text-emerald-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Ativo</span>
                  <span className="text-[11px] text-slate-500">
                    Disponível para contratação e exibido na vitrine se público.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStatus === 'inactive'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="planStatus"
                  value="inactive"
                  checked={selectedStatus === 'inactive'}
                  onChange={() => setSelectedStatus('inactive')}
                  className="w-4 h-4 text-amber-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Inativo</span>
                  <span className="text-[11px] text-slate-500">
                    Oculto da vitrine e bloqueado para novas assinaturas temporariamente.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStatus === 'archived'
                    ? 'border-rose-500 bg-rose-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="planStatus"
                  value="archived"
                  checked={selectedStatus === 'archived'}
                  onChange={() => setSelectedStatus('archived')}
                  className="w-4 h-4 text-rose-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Arquivado</span>
                  <span className="text-[11px] text-slate-500">
                    Plano legado descontinuado. Mantém vigência para empresas existentes.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isUpdating}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {isUpdating ? 'Atualizando...' : 'Confirmar Alteração'}
          </button>
        </div>
      </div>
    </div>
  );
};
