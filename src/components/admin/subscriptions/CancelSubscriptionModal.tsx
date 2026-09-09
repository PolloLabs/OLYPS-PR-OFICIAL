import React, { useState } from 'react';
import { X, XCircle, AlertOctagon } from 'lucide-react';
import type { SubscriptionRecord } from '../../../types/index.js';

interface CancelSubscriptionModalProps {
  subscription: SubscriptionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (subscriptionId: string, reason: string, notes?: string) => Promise<void>;
  isCancelling: boolean;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  subscription,
  isOpen,
  onClose,
  onConfirm,
  isCancelling,
}) => {
  const [reason, setReason] = useState<string>('Cancelamento solicitado pelo cliente');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen || !subscription) return null;

  const handleConfirm = async () => {
    await onConfirm(subscription.id, reason, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center space-x-2 text-rose-800">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold">Cancelar Assinatura</h3>
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

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start space-x-2">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              O cancelamento encerra o contrato da assinatura. O histórico e registros de auditoria serão preservados.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo do Cancelamento *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Cancelamento solicitado pelo cliente">Cancelamento solicitado pelo cliente</option>
              <option value="Encerramento de atividades da empresa">Encerramento de atividades da empresa</option>
              <option value="Migração para plano customizado">Migração para plano customizado</option>
              <option value="Inadimplência definitiva">Inadimplência definitiva</option>
              <option value="Outro motivo">Outro motivo</option>
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
              placeholder="Detalhes adicionais..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isCancelling}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isCancelling}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>{isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
