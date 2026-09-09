import React, { useState } from 'react';
import { X, PauseCircle, AlertTriangle } from 'lucide-react';
import type { SubscriptionRecord } from '../../../types/index.js';

interface SuspendSubscriptionModalProps {
  subscription: SubscriptionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (subscriptionId: string, reason: string, notes?: string) => Promise<void>;
  isSuspending: boolean;
}

export const SuspendSubscriptionModal: React.FC<SuspendSubscriptionModalProps> = ({
  subscription,
  isOpen,
  onClose,
  onConfirm,
  isSuspending,
}) => {
  const [reason, setReason] = useState<string>('Inadimplência temporária');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen || !subscription) return null;

  const handleConfirm = async () => {
    await onConfirm(subscription.id, reason, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center space-x-2 text-amber-800">
            <PauseCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold">Suspender Assinatura</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <p className="text-slate-700">
              Empresa: <strong className="text-slate-900">{subscription.companyName || subscription.companyId}</strong>
            </p>
            <p className="text-slate-700">
              Plano: <strong className="text-slate-900">{subscription.plan?.name}</strong>
            </p>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              A suspensão bloqueia o acesso dos usuários da empresa aos recursos pagos até que a assinatura seja reativada pelo Super Admin.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo da Suspensão *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Inadimplência temporária">Inadimplência temporária</option>
              <option value="Solicitação do cliente">Solicitação do cliente</option>
              <option value="Auditoria de segurança / uso indevido">Auditoria de segurança / uso indevido</option>
              <option value="Outro motivo administrativo">Outro motivo administrativo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Administrativas (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais para o registro de auditoria..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSuspending}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSuspending}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
          >
            <PauseCircle className="w-4 h-4" />
            <span>{isSuspending ? 'Suspendendo...' : 'Confirmar Suspensão'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
